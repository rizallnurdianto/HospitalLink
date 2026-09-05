------------------------------------------------------------------------------
-- Bucket storage untuk foto sampul rumah sakit yang diunggah dari Portal Admin.
-- Portal Pasien membacanya lewat URL publik yang disimpan di hospitals.image_url.
------------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'hospital-images',
  'hospital-images',
  true,
  5242880, -- 5 MB
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
on conflict (id) do update
  set public             = excluded.public,
      file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Siapa saja boleh membaca (bucket bersifat publik); hanya admin yang boleh unggah / ganti / hapus.
drop policy if exists hospital_images_read on storage.objects;
create policy hospital_images_read on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'hospital-images');

drop policy if exists hospital_images_insert_admin on storage.objects;
create policy hospital_images_insert_admin on storage.objects
  for insert to authenticated
  with check (bucket_id = 'hospital-images' and public.is_admin());

drop policy if exists hospital_images_update_admin on storage.objects;
create policy hospital_images_update_admin on storage.objects
  for update to authenticated
  using (bucket_id = 'hospital-images' and public.is_admin())
  with check (bucket_id = 'hospital-images' and public.is_admin());

drop policy if exists hospital_images_delete_admin on storage.objects;
create policy hospital_images_delete_admin on storage.objects
  for delete to authenticated
  using (bucket_id = 'hospital-images' and public.is_admin());
