------------------------------------------------------------------------------
-- Provinsi terstruktur untuk penyaringan tingkat nasional.
-- `location` tetap berupa label kota/area bebas yang ditampilkan di UI; `province`
-- adalah salah satu dari 38 provinsi Indonesia (daftar tetap di src/lib/provinces.ts).
------------------------------------------------------------------------------
alter table public.hospitals
  add column if not exists province text not null default '';

create index if not exists hospitals_province_idx on public.hospitals (province);
