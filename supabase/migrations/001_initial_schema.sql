-- Simply — Schéma initial + RLS multi-tenant
-- À appliquer sur le MÊME projet Supabase qu'Operis.
-- La table chantiers peut déjà exister (écrite par Operis) : CREATE IF NOT EXISTS.

-- Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Organisations (si absentes)
CREATE TABLE IF NOT EXISTS public.organisations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Profils utilisateurs (lien auth.users → organisation)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  organisation_id UUID NOT NULL REFERENCES public.organisations(id) ON DELETE RESTRICT,
  full_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Chantiers (partagée Operis / Simply)
CREATE TABLE IF NOT EXISTS public.chantiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ao_id UUID,
  nom TEXT NOT NULL,
  client TEXT,
  montant NUMERIC(14, 2),
  statut TEXT NOT NULL DEFAULT 'planifie'
    CHECK (statut IN ('planifie', 'en_cours', 'suspendu', 'termine')),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  organisation_id UUID NOT NULL REFERENCES public.organisations(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chantiers_organisation ON public.chantiers(organisation_id);
CREATE INDEX IF NOT EXISTS idx_chantiers_owner ON public.chantiers(owner_id);

-- Tables Simply
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

CREATE TABLE IF NOT EXISTS public.plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chantier_id UUID NOT NULL REFERENCES public.chantiers(id) ON DELETE CASCADE,
  nom TEXT NOT NULL,
  pdf_url TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.annotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES public.plans(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  x NUMERIC NOT NULL,
  y NUMERIC NOT NULL,
  contenu TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.reserves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES public.plans(id) ON DELETE CASCADE,
  chantier_id UUID NOT NULL REFERENCES public.chantiers(id) ON DELETE CASCADE,
  x NUMERIC NOT NULL,
  y NUMERIC NOT NULL,
  libelle TEXT NOT NULL,
  statut TEXT NOT NULL DEFAULT 'ouverte',
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

CREATE TABLE IF NOT EXISTS public.comptes_rendus (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chantier_id UUID NOT NULL REFERENCES public.chantiers(id) ON DELETE CASCADE,
  contenu TEXT NOT NULL,
  pdf_url TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE
);

CREATE TABLE IF NOT EXISTS public.pointages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chantier_id UUID NOT NULL REFERENCES public.chantiers(id) ON DELETE CASCADE,
  ouvrier TEXT NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  heures NUMERIC(4, 2) NOT NULL DEFAULT 0,
  pauses NUMERIC(4, 2) NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.reunions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chantier_id UUID NOT NULL REFERENCES public.chantiers(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  participants TEXT[],
  contenu TEXT NOT NULL,
  pdf_url TEXT
);

CREATE TABLE IF NOT EXISTS public.certificats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chantier_id UUID NOT NULL REFERENCES public.chantiers(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  contenu TEXT NOT NULL,
  signature_url TEXT,
  pdf_url TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE
);

CREATE TABLE IF NOT EXISTS public.sous_traitants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id UUID NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  nom TEXT NOT NULL,
  contact TEXT,
  specialite TEXT
);

-- Helper RLS : organisation de l'utilisateur connecté
CREATE OR REPLACE FUNCTION public.current_organisation_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organisation_id FROM public.profiles WHERE id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION public.user_can_access_chantier(p_chantier_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.chantiers c
    WHERE c.id = p_chantier_id
      AND (
        c.organisation_id = public.current_organisation_id()
        OR c.owner_id = auth.uid()
      )
  )
$$;

-- RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organisations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chantiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.taches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.annotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reserves ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_lignes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comptes_rendus ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pointages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reunions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sous_traitants ENABLE ROW LEVEL SECURITY;

-- Profiles
DROP POLICY IF EXISTS profiles_select_own ON public.profiles;
CREATE POLICY profiles_select_own ON public.profiles
  FOR SELECT USING (id = auth.uid());

DROP POLICY IF EXISTS profiles_update_own ON public.profiles;
CREATE POLICY profiles_update_own ON public.profiles
  FOR UPDATE USING (id = auth.uid());

-- Organisations (lecture pour les membres)
DROP POLICY IF EXISTS organisations_select_member ON public.organisations;
CREATE POLICY organisations_select_member ON public.organisations
  FOR SELECT USING (
    id = public.current_organisation_id()
  );

-- Chantiers : Simply lit, Operis écrit (lecture org-scoped)
DROP POLICY IF EXISTS chantiers_select_org ON public.chantiers;
CREATE POLICY chantiers_select_org ON public.chantiers
  FOR SELECT USING (
    organisation_id = public.current_organisation_id()
    OR owner_id = auth.uid()
  );

-- Macro pour tables scopées au chantier
-- taches
DROP POLICY IF EXISTS taches_select ON public.taches;
CREATE POLICY taches_select ON public.taches FOR SELECT
  USING (public.user_can_access_chantier(chantier_id));
DROP POLICY IF EXISTS taches_insert ON public.taches;
CREATE POLICY taches_insert ON public.taches FOR INSERT
  WITH CHECK (public.user_can_access_chantier(chantier_id));
DROP POLICY IF EXISTS taches_update ON public.taches;
CREATE POLICY taches_update ON public.taches FOR UPDATE
  USING (public.user_can_access_chantier(chantier_id));
DROP POLICY IF EXISTS taches_delete ON public.taches;
CREATE POLICY taches_delete ON public.taches FOR DELETE
  USING (public.user_can_access_chantier(chantier_id));

-- photos
DROP POLICY IF EXISTS photos_select ON public.photos;
CREATE POLICY photos_select ON public.photos FOR SELECT
  USING (public.user_can_access_chantier(chantier_id));
DROP POLICY IF EXISTS photos_insert ON public.photos;
CREATE POLICY photos_insert ON public.photos FOR INSERT
  WITH CHECK (public.user_can_access_chantier(chantier_id));

-- budget_lignes
DROP POLICY IF EXISTS budget_select ON public.budget_lignes;
CREATE POLICY budget_select ON public.budget_lignes FOR SELECT
  USING (public.user_can_access_chantier(chantier_id));
DROP POLICY IF EXISTS budget_insert ON public.budget_lignes;
CREATE POLICY budget_insert ON public.budget_lignes FOR INSERT
  WITH CHECK (public.user_can_access_chantier(chantier_id));
DROP POLICY IF EXISTS budget_update ON public.budget_lignes;
CREATE POLICY budget_update ON public.budget_lignes FOR UPDATE
  USING (public.user_can_access_chantier(chantier_id));

-- plans (lecture seule pour l'instant côté Simply step 1)
DROP POLICY IF EXISTS plans_select ON public.plans;
CREATE POLICY plans_select ON public.plans FOR SELECT
  USING (public.user_can_access_chantier(chantier_id));

-- sous_traitants (scope organisation)
DROP POLICY IF EXISTS sous_traitants_select ON public.sous_traitants;
CREATE POLICY sous_traitants_select ON public.sous_traitants FOR SELECT
  USING (organisation_id = public.current_organisation_id());

-- Trigger : créer profil à l'inscription (organisation_id dans raw_user_meta_data)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  org_id UUID;
BEGIN
  org_id := (NEW.raw_user_meta_data->>'organisation_id')::UUID;

  IF org_id IS NULL THEN
    INSERT INTO public.organisations (nom)
    VALUES (COALESCE(NEW.raw_user_meta_data->>'company', 'Mon organisation'))
    RETURNING id INTO org_id;
  END IF;

  INSERT INTO public.profiles (id, organisation_id, full_name)
  VALUES (
    NEW.id,
    org_id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
