------------------------------------------------------------------------------
-- Halaman "Pengguna" Admin — memungkinkan admin melihat data akun.
--
-- Portal Pasien sebenarnya adalah portal untuk siapa saja yang mencari rumah
-- sakit, jadi tidak ada data medis "pasien" yang perlu dijaga — hanya akun itu
-- sendiri: nama, email, telepon, provinsi (profiles.location), tanggal daftar, status.
--
--   * profiles.email — dicerminkan dari auth.users agar tabel admin bisa
--                      menampilkan + mencarinya tanpa query auth yang privileged.
------------------------------------------------------------------------------

alter table public.profiles
  add column if not exists email text not null default '';

------------------------------------------------------------------------------
-- Menjaga profiles.email tetap sinkron dengan auth.users
------------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, phone, location, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(new.raw_user_meta_data ->> 'phone', ''),
    coalesce(new.raw_user_meta_data ->> 'location', ''),
    coalesce(new.email, '')
  )
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;

create or replace function public.handle_user_email_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.email is distinct from old.email then
    update public.profiles set email = coalesce(new.email, '') where id = new.id;
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_email_change on auth.users;
create trigger on_auth_user_email_change
  after update of email on auth.users
  for each row execute function public.handle_user_email_change();

-- Mengisi ulang (backfill) baris yang sudah ada
update public.profiles p
   set email = coalesce(u.email, '')
  from auth.users u
 where u.id = p.id and p.email = '';
