------------------------------------------------------------------------------
-- Fitur "rumah sakit terdekat" di /darurat sudah dihapus. Hapus kolom-kolomnya.
------------------------------------------------------------------------------
alter table public.hospitals
  drop column if exists latitude,
  drop column if exists longitude;
