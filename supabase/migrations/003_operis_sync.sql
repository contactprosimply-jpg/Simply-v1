-- Simply ↔ Operis — Sync AO gagnés → chantiers
-- OPTIONNEL : exécuter UNIQUEMENT si la table public.tenders existe (Operis déployé)
-- Vérifier d'abord dans Supabase → Table Editor que "tenders" est visible

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'tenders'
  ) THEN
    RAISE NOTICE 'Table tenders absente — sync Operis ignorée. Operis n''est peut-être pas migré sur ce projet.';
    RETURN;
  END IF;

  -- Ajouter simply_chantier_id sur tenders si absent
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'tenders' AND column_name = 'simply_chantier_id'
  ) THEN
    ALTER TABLE public.tenders ADD COLUMN simply_chantier_id UUID;
  END IF;

  -- Fonction sync
  CREATE OR REPLACE FUNCTION public.sync_tender_to_chantier()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
  AS $fn$
  DECLARE
    org_id UUID;
    chantier_uuid UUID;
  BEGIN
    IF NEW.status = 'gagne' AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'gagne') THEN
      IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'organization_members') THEN
        SELECT om.organization_id INTO org_id
        FROM public.organization_members om
        WHERE om.user_id = NEW.user_id
        LIMIT 1;
      END IF;

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
  $fn$;

  DROP TRIGGER IF EXISTS trg_sync_tender_chantier ON public.tenders;
  CREATE TRIGGER trg_sync_tender_chantier
    AFTER INSERT OR UPDATE OF status ON public.tenders
    FOR EACH ROW EXECUTE FUNCTION public.sync_tender_to_chantier();

  -- Backfill AO déjà gagnés
  INSERT INTO public.chantiers (ao_id, nom, client, montant, statut, owner_id, organization_id)
  SELECT
    t.id,
    t.title,
    t.client,
    t.budget_ht,
    'en_cours',
    t.user_id,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'organization_members')
      THEN (SELECT om.organization_id FROM public.organization_members om WHERE om.user_id = t.user_id LIMIT 1)
      ELSE NULL
    END
  FROM public.tenders t
  WHERE t.status = 'gagne'
  ON CONFLICT (ao_id) DO NOTHING;

  UPDATE public.tenders t
  SET simply_chantier_id = c.id
  FROM public.chantiers c
  WHERE c.ao_id = t.id AND t.simply_chantier_id IS NULL;

  RAISE NOTICE 'Sync Operis → Simply configurée avec succès.';
END $$;
