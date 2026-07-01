-- Simply BTP — Étape A : modèle de données import devis/DPGF
-- Compatible schéma existant (chantiers + taches déjà créés via 001/002).
-- Idempotent : safe à ré-exécuter après échec partiel.

-- =============================================================================
-- devis_imports
-- =============================================================================
create table if not exists public.devis_imports (
  id uuid primary key default gen_random_uuid(),
  chantier_id uuid not null references public.chantiers (id) on delete cascade,
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  nom_fichier text,
  type_fichier text,
  storage_path text,
  statut text not null default 'importe',
  created_at timestamptz not null default now()
);

create index if not exists idx_devis_imports_chantier_id on public.devis_imports (chantier_id);
create index if not exists idx_devis_imports_owner_id on public.devis_imports (owner_id);

alter table public.devis_imports enable row level security;

drop policy if exists "devis_imports_select_own" on public.devis_imports;
create policy "devis_imports_select_own"
  on public.devis_imports for select
  to authenticated
  using (owner_id = auth.uid());

drop policy if exists "devis_imports_insert_own" on public.devis_imports;
create policy "devis_imports_insert_own"
  on public.devis_imports for insert
  to authenticated
  with check (owner_id = auth.uid());

drop policy if exists "devis_imports_update_own" on public.devis_imports;
create policy "devis_imports_update_own"
  on public.devis_imports for update
  to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

drop policy if exists "devis_imports_delete_own" on public.devis_imports;
create policy "devis_imports_delete_own"
  on public.devis_imports for delete
  to authenticated
  using (owner_id = auth.uid());

-- =============================================================================
-- budget_postes
-- =============================================================================
create table if not exists public.budget_postes (
  id uuid primary key default gen_random_uuid(),
  chantier_id uuid not null references public.chantiers (id) on delete cascade,
  devis_import_id uuid references public.devis_imports (id) on delete set null,
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  numero_position text,
  lot text,
  designation text not null,
  unite text,
  quantite numeric,
  prix_unitaire numeric,
  prix_total numeric,
  ordre int,
  created_at timestamptz not null default now()
);

create index if not exists idx_budget_postes_chantier_id on public.budget_postes (chantier_id);
create index if not exists idx_budget_postes_devis_import_id on public.budget_postes (devis_import_id);
create index if not exists idx_budget_postes_owner_id on public.budget_postes (owner_id);

alter table public.budget_postes enable row level security;

drop policy if exists "budget_postes_select_own" on public.budget_postes;
create policy "budget_postes_select_own"
  on public.budget_postes for select
  to authenticated
  using (owner_id = auth.uid());

drop policy if exists "budget_postes_insert_own" on public.budget_postes;
create policy "budget_postes_insert_own"
  on public.budget_postes for insert
  to authenticated
  with check (owner_id = auth.uid());

drop policy if exists "budget_postes_update_own" on public.budget_postes;
create policy "budget_postes_update_own"
  on public.budget_postes for update
  to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

drop policy if exists "budget_postes_delete_own" on public.budget_postes;
create policy "budget_postes_delete_own"
  on public.budget_postes for delete
  to authenticated
  using (owner_id = auth.uid());

-- =============================================================================
-- taches — extension (table déjà existante)
-- =============================================================================
alter table public.taches
  add column if not exists budget_poste_id uuid,
  add column if not exists owner_id uuid references auth.users (id) on delete cascade,
  add column if not exists unite text,
  add column if not exists quantite numeric,
  add column if not exists quantite_faite numeric not null default 0,
  add column if not exists ordre int,
  add column if not exists updated_at timestamptz not null default now();

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'taches_budget_poste_id_fkey'
      and conrelid = 'public.taches'::regclass
  ) then
    alter table public.taches
      add constraint taches_budget_poste_id_fkey
      foreign key (budget_poste_id) references public.budget_postes (id) on delete set null;
  end if;
end $$;

update public.taches t
set owner_id = c.owner_id
from public.chantiers c
where t.chantier_id = c.id
  and t.owner_id is null;

alter table public.taches alter column owner_id set default auth.uid();

do $$
begin
  if not exists (
    select 1 from public.taches where owner_id is null
  ) then
    alter table public.taches alter column owner_id set not null;
  end if;
end $$;

alter table public.taches drop constraint if exists taches_statut_check;
alter table public.taches
  add constraint taches_statut_check
  check (statut in ('a_faire', 'en_cours', 'termine', 'bloque'));

alter table public.taches drop constraint if exists taches_priorite_check;
alter table public.taches
  add constraint taches_priorite_check
  check (priorite in ('basse', 'normale', 'haute', 'urgente'));

create index if not exists idx_taches_chantier_id on public.taches (chantier_id);
create index if not exists idx_taches_budget_poste_id on public.taches (budget_poste_id);
create index if not exists idx_taches_owner_id on public.taches (owner_id);

alter table public.taches enable row level security;

drop policy if exists "taches_select_own" on public.taches;
create policy "taches_select_own"
  on public.taches for select
  to authenticated
  using (owner_id = auth.uid());

drop policy if exists "taches_insert_own" on public.taches;
create policy "taches_insert_own"
  on public.taches for insert
  to authenticated
  with check (owner_id = auth.uid());

drop policy if exists "taches_update_own" on public.taches;
create policy "taches_update_own"
  on public.taches for update
  to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

drop policy if exists "taches_delete_own" on public.taches;
create policy "taches_delete_own"
  on public.taches for delete
  to authenticated
  using (owner_id = auth.uid());

create or replace function public.set_taches_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_taches_updated_at on public.taches;
create trigger trg_taches_updated_at
  before update on public.taches
  for each row
  execute function public.set_taches_updated_at();

-- =============================================================================
-- Storage bucket "devis" (privé) — chemin : chantier/<chantier_id>/<fichier>
-- =============================================================================
insert into storage.buckets (id, name, public)
values ('devis', 'devis', false)
on conflict (id) do update set public = false;

drop policy if exists "devis_storage_select_own_chantier" on storage.objects;
create policy "devis_storage_select_own_chantier"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'devis'
    and (storage.foldername(name))[1] = 'chantier'
    and exists (
      select 1 from public.chantiers c
      where c.id = ((storage.foldername(name))[2])::uuid
        and c.owner_id = auth.uid()
    )
  );

drop policy if exists "devis_storage_insert_own_chantier" on storage.objects;
create policy "devis_storage_insert_own_chantier"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'devis'
    and (storage.foldername(name))[1] = 'chantier'
    and exists (
      select 1 from public.chantiers c
      where c.id = ((storage.foldername(name))[2])::uuid
        and c.owner_id = auth.uid()
    )
  );

drop policy if exists "devis_storage_update_own_chantier" on storage.objects;
create policy "devis_storage_update_own_chantier"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'devis'
    and (storage.foldername(name))[1] = 'chantier'
    and exists (
      select 1 from public.chantiers c
      where c.id = ((storage.foldername(name))[2])::uuid
        and c.owner_id = auth.uid()
    )
  )
  with check (
    bucket_id = 'devis'
    and (storage.foldername(name))[1] = 'chantier'
    and exists (
      select 1 from public.chantiers c
      where c.id = ((storage.foldername(name))[2])::uuid
        and c.owner_id = auth.uid()
    )
  );

drop policy if exists "devis_storage_delete_own_chantier" on storage.objects;
create policy "devis_storage_delete_own_chantier"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'devis'
    and (storage.foldername(name))[1] = 'chantier'
    and exists (
      select 1 from public.chantiers c
      where c.id = ((storage.foldername(name))[2])::uuid
        and c.owner_id = auth.uid()
    )
  );
