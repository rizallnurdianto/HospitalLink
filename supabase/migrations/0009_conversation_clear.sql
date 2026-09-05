------------------------------------------------------------------------------
-- "Membersihkan" thread dukungan hanya menyembunyikan riwayat lama dari SATU sisi;
-- conversation + semua pesan tetap utuh sehingga sisi lain tetap punya catatannya.
--   * cleared_at        — batas waktu di halaman Bantuan milik pengguna
--   * admin_cleared_at  — batas waktu di kotak masuk admin (thread disembunyikan
--                         dari daftar sampai pengguna mengirim pesan baru)
-- Keduanya ditulis lewat policy conversations_update yang sudah ada
-- (pengguna boleh mengubah barisnya sendiri, admin boleh mengubah baris manapun).
------------------------------------------------------------------------------
alter table public.conversations
  add column if not exists cleared_at       timestamptz,
  add column if not exists admin_cleared_at timestamptz;

-- Kedua sisi tidak lagi bisa menghapus permanen (hard-delete) conversation.
drop policy if exists conversations_delete on public.conversations;
drop policy if exists conversations_delete_admin on public.conversations;
