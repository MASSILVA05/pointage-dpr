-- Schéma Supabase : Pointage employés
-- À exécuter dans l'éditeur SQL de Supabase (Database > SQL Editor)

create table if not exists pointages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  time timestamptz not null default now(),
  lat double precision not null,
  lon double precision not null,
  photo_url text not null,
  created_at timestamptz not null default now()
);

comment on table pointages is 'Registre des pointages employés (nom, heure, position, photo)';

-- Index pour accélérer le tri par défaut (liste triée du plus récent au plus ancien)
create index if not exists pointages_time_idx on pointages (time desc);

-- Row Level Security
-- L'application utilise la clé "anon" côté client (employés + manager).
-- Accès ouvert en lecture et en écriture (insertion) uniquement, pas de
-- modification ni de suppression, ce qui convient à un registre d'horodatage
-- où chaque pointage doit rester immuable.
alter table pointages enable row level security;

create policy "Lecture publique des pointages"
  on pointages for select
  using (true);

create policy "Ajout de pointages"
  on pointages for insert
  with check (true);

-- Storage : bucket public pour les photos de pointage
insert into storage.buckets (id, name, public)
values ('pointage-photos', 'pointage-photos', true)
on conflict (id) do nothing;

create policy "Lecture publique des photos de pointage"
  on storage.objects for select
  using (bucket_id = 'pointage-photos');

create policy "Ajout de photos de pointage"
  on storage.objects for insert
  with check (bucket_id = 'pointage-photos');
