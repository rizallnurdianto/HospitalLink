------------------------------------------------------------------------------
-- Kelas rumah sakit ("kelas rumah sakit") — Permenkes A / B / C / D, ditentukan
-- oleh fasilitas, kapasitas tempat tidur, cakupan spesialis, dan kemampuan layanan.
-- Teks bebas yang divalidasi aplikasi (src/lib/hospitalClasses.ts); "" = belum diisi.
------------------------------------------------------------------------------
alter table public.hospitals
  add column if not exists hospital_class text not null default '';

create index if not exists hospitals_class_idx on public.hospitals (hospital_class);
