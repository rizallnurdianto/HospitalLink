-- Membuat pesan dukungan bisa membawa "kartu" rumah sakit yang tertaut ke halaman detail.
-- Dipakai Admin di kotak masuk dukungan; ditampilkan sebagai kartu di chat Bantuan pengguna.

alter table public.messages
  add column if not exists hospital_id uuid references public.hospitals (id) on delete set null;

-- Pesan kini boleh hanya berupa kartu (body kosong) selama merujuk ke sebuah rumah sakit.
alter table public.messages drop constraint if exists messages_body_check;
alter table public.messages
  add constraint messages_body_check
  check (length(trim(body)) > 0 or hospital_id is not null);
