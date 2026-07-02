-- Simply BTP — Étape B : schéma analyse IA devis/DPGF (additif, idempotent)

-- =============================================================================
-- budget_postes — colonnes métier / type de ligne / cohérence
-- =============================================================================
alter table public.budget_postes
  add column if not exists metier text,
  add column if not exists type_ligne text not null default 'poste',
  add column if not exists coherence_ok boolean not null default true,
  add column if not exists remarque text;

comment on column public.budget_postes.type_ligne is 'poste | titre_lot | sous_total';

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'budget_postes_type_ligne_check'
  ) then
    alter table public.budget_postes
      add constraint budget_postes_type_ligne_check
      check (type_ligne in ('poste', 'titre_lot', 'sous_total'));
  end if;
end $$;

-- =============================================================================
-- devis_imports — métadonnées analyse document
-- =============================================================================
alter table public.devis_imports
  add column if not exists metiers_detectes text[],
  add column if not exists total_ht numeric,
  add column if not exists total_ttc numeric,
  add column if not exists taux_tva numeric,
  add column if not exists resume jsonb;
