-- Simply ↔ Operis — Pont chantiers
-- À exécuter sur le projet Supabase Operis (lixlqcarbucmczjbgbhp)
-- Ne pas exécuter 001_initial_schema.sql (conflit avec profiles Operis)

-- ============================================================
-- TABLE chantiers (pont Operis → Simply)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.chantiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ao_id UUID UNIQUE REFERENCES public.tenders(id) ON DELETE SET NULL,
  nom TEXT NOT NULL,
  client TEXT,
  montant NUMERIC(14, 2),
  statut TEXT NOT NULL DEFAULT 'en_cours'
    CHECK (statut IN ('planifie', 'en_cours', 'suspendu', 'termine')),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chantiers_owner ON public.chantiers(owner_id);
CREATE INDEX IF NOT EXISTS idx_chantiers_ao ON public.chantiers(ao_id);

-- ============================================================
-- Tables Simply (modules)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.taches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chantier_id UUID NOT NULL REFERENCES public.chantiers(id) ON DELETE CASCADE,
  titre TEXT NOT NULL,
  description TEXT,
  assigne_a UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  statut TEXT NOT NULL DEFAULT 'a_faire'
    CHECK (statut IN ('a_faire', 'en_cours', 'termine')),
  priorite TEXT NOT NULL DEFAULT 'normale'
    CHECK (priorite IN ('basse', 'normale', 'haute', 'urgente')),
  echeance DATE,
  retard BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chantier_id UUID NOT NULL REFERENCES public.chantiers(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  tags TEXT[],
  lie_a TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.budget_lignes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chantier_id UUID NOT NULL REFERENCES public.chantiers(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('devis', 'facture', 'depense')),
  libelle TEXT NOT NULL,
  montant NUMERIC(14, 2) NOT NULL DEFAULT 0,
  date DATE NOT NULL DEFAULT CURRENT_DATE
);

-- ============================================================
-- RLS chantiers + tables Simply
-- ============================================================
ALTER TABLE public.chantiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.taches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_lignes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS chantiers_select_own ON public.chantiers;
CREATE POLICY chantiers_select_own ON public.chantiers
  FOR SELECT USING (owner_id = auth.uid());

DROP POLICY IF EXISTS chantiers_insert_own ON public.chantiers;
CREATE POLICY chantiers_insert_own ON public.chantiers
  FOR INSERT WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS chantiers_update_own ON public.chantiers;
CREATE POLICY chantiers_update_own ON public.chantiers
  FOR UPDATE USING (owner_id = auth.uid());

CREATE OR REPLACE FUNCTION public.user_owns_chantier(p_chantier_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.chantiers c
    WHERE c.id = p_chantier_id AND c.owner_id = auth.uid()
  )
$$;

DROP POLICY IF EXISTS taches_all ON public.taches;
CREATE POLICY taches_all ON public.taches FOR ALL
  USING (public.user_owns_chantier(chantier_id))
  WITH CHECK (public.user_owns_chantier(chantier_id));

DROP POLICY IF EXISTS photos_all ON public.photos;
CREATE POLICY photos_all ON public.photos FOR ALL
  USING (public.user_owns_chantier(chantier_id))
  WITH CHECK (public.user_owns_chantier(chantier_id));

DROP POLICY IF EXISTS budget_all ON public.budget_lignes;
CREATE POLICY budget_all ON public.budget_lignes FOR ALL
  USING (public.user_owns_chantier(chantier_id))
  WITH CHECK (public.user_owns_chantier(chantier_id));

-- ============================================================
-- Sync auto : AO gagné dans Operis → chantier Simply
-- ============================================================
CREATE OR REPLACE FUNCTION public.sync_tender_to_chantier()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  org_id UUID;
  chantier_uuid UUID;
BEGIN
  IF NEW.status = 'gagne' AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'gagne') THEN
    SELECT om.organization_id INTO org_id
    FROM public.organization_members om
    WHERE om.user_id = NEW.user_id
    LIMIT 1;

    INSERT INTO public.chantiers (ao_id, nom, client, montant, statut, owner_id, organization_id)
    VALUES (NEW.id, NEW.title, NEW.client, NEW.budget_ht, 'en_cours', NEW.user_id, org_id)
    ON CONFLICT (ao_id) DO UPDATE SET
      nom = EXCLUDED.nom,
      client = EXCLUDED.client,
      montant = EXCLUDED.montant,
      statut = 'en_cours'
    RETURNING id INTO chantier_uuid;

    UPDATE public.tenders
    SET simply_chantier_id = chantier_uuid
    WHERE id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_tender_chantier ON public.tenders;
CREATE TRIGGER trg_sync_tender_chantier
  AFTER INSERT OR UPDATE OF status ON public.tenders
  FOR EACH ROW EXECUTE FUNCTION public.sync_tender_to_chantier();

-- Backfill des AO déjà gagnés
INSERT INTO public.chantiers (ao_id, nom, client, montant, statut, owner_id, organization_id)
SELECT
  t.id,
  t.title,
  t.client,
  t.budget_ht,
  'en_cours',
  t.user_id,
  (SELECT om.organization_id FROM public.organization_members om WHERE om.user_id = t.user_id LIMIT 1)
FROM public.tenders t
WHERE t.status = 'gagne'
ON CONFLICT (ao_id) DO NOTHING;

UPDATE public.tenders t
SET simply_chantier_id = c.id
FROM public.chantiers c
WHERE c.ao_id = t.id AND t.simply_chantier_id IS NULL;
