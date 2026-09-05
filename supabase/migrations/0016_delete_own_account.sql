------------------------------------------------------------------------------
-- Penghapusan akun mandiri untuk Pengguna.
--
-- Klien browser (anon key) tidak bisa menyentuh auth.users, jadi RPC SECURITY
-- DEFINER ini menghapus akun milik pemanggilnya sendiri. Menghapus baris
-- auth.users akan cascade ke public.profiles, bookmarks, conversations, dan
-- messages (semua FK memakai ON DELETE CASCADE sejak migrasi 0001), jadi tidak
-- ada data yang tersisa.
--
-- Akun admin dikecualikan: admin tunggal disediakan / diganti lewat
-- `pnpm admin:create`, dan migrasi 0015 sudah menjaga aturan "satu admin".
------------------------------------------------------------------------------

create or replace function public.delete_own_account()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Tidak terautentikasi';
  end if;

  if exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  ) then
    raise exception 'Akun admin tidak dapat dihapus sendiri';
  end if;

  delete from auth.users where id = auth.uid();
end;
$$;

revoke all on function public.delete_own_account() from anon, public;
grant execute on function public.delete_own_account() to authenticated;
