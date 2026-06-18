-- Simply — Tables de base (fonctionne sur TOUT projet Supabase)
-- Projet cible : lixlqcarbucmczjbgbhp (même Supabase qu'Operis)
-- NE PAS exécuter 001_initial_schema.sql (conflit avec Operis)

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- TABLE chantiers
-- ao_id = référence vers l'AO Operis (sans FK, car tenders peut être absent)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.chantiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ao_id UUID UNIQUE,
  nom TEXT NOT NULL,
  client TEXT,
  montant NUMERIC(14, 2),
  statut TEXT NOT NULL DEFAULT 'en_cours'
    CHECK (statut IN ('planifie', 'en_cours', 'suspendu', 'termine')),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  organization_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chantiers_owner ON public.chantiers(owner_id);
CREATE INDEX IF NOT EXISTS idx_chantiers_ao ON public.chantiers(ao_id);

-- ============================================================
-- Tables Simply (modules étape 1+)
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
-- RLS
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

DROP POLICY IF EXISTS chantiers_delete_own ON public.chantiers;
CREATE POLICY chantiers_delete_own ON public.chantiers
  FOR DELETE USING (owner_id = auth.uid());

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

-- Chantier de démo (optionnel — décommentez et remplacez l'UUID par le vôtre)
-- SELECT id FROM auth.users WHERE email = 'b.uros@nikodex.fr';
-- INSERT INTO public.chantiers (nom, client, statut, owner_id)
-- VALUES ('Chantier démo', 'Client test', 'en_cours', 'VOTRE-USER-UUID')
-- ON CONFLICT DO NOTHING;
