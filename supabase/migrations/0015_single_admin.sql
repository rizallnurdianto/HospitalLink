------------------------------------------------------------------------------
-- Hanya satu admin.
--
-- Registrasi terbuka untuk siapa saja (LandingPage → /register atau "Daftar
-- dengan Google"). Setiap pendaftaran mandiri menjadi 'patient':
--   * handle_new_user() selalu menyisipkan role 'patient' (default kolom),
--   * policy RLS profiles_update_self melarang pengguna mengubah role-nya sendiri.
-- Satu-satunya cara mendapat baris 'admin' adalah lewat service_role key (script
-- / Supabase dashboard). Unique index parsial ini menjadikan "hanya satu admin"
-- jaminan keras yang ditegakkan database — promosi kedua akan gagal.
--
-- Jika migrasi ini error dengan "could not create unique index", berarti
-- proyek masih punya lebih dari satu baris admin; turunkan role yang berlebih dulu:
--   update public.profiles set role = 'patient'
--    where role = 'admin' and id <> '<the-id-to-keep>';
------------------------------------------------------------------------------

create unique index if not exists profiles_one_admin
  on public.profiles (role)
  where role = 'admin';
