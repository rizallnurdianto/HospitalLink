------------------------------------------------------------------------------
-- Klasifikasi rumah sakit ("kategori") — jenis rumah sakit, terpisah dari
-- `type` (kepemilikan: Swasta / Pemerintah). Teks bebas yang divalidasi aplikasi
-- terhadap src/lib/hospitalCategories.ts; baris yang sudah ada memakai kategori
-- rumah sakit umum sebagai default.
------------------------------------------------------------------------------
alter table public.hospitals
  add column if not exists category text not null
    default 'Rumah Sakit Umum (RSU)';

create index if not exists hospitals_category_idx on public.hospitals (category);
