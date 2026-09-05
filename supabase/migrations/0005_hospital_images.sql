------------------------------------------------------------------------------
-- Beberapa foto sampul/galeri per rumah sakit.
-- `image_url` tetap jadi sampul utama (aplikasi menjaganya tetap sinkron dengan images[1]);
-- `images` menyimpan seluruh galeri terurut yang diunggah dari Portal Admin.
-- Baris yang sudah ada dibiarkan galerinya kosong agar sampul placeholder-nya tidak berubah;
-- sampul akan terisi ulang saat admin berikutnya kali mengedit rumah sakit tersebut.
------------------------------------------------------------------------------
alter table public.hospitals
  add column if not exists images text[] not null default '{}';
