------------------------------------------------------------------------------
-- Menyimpan pratinjau pesan terbaru di tiap conversation agar daftar kotak
-- masuk Admin bisa menampilkan "chat terakhir" di bawah nama pengguna,
-- bukan kategori (yang selalu "Bantuan" saja).
------------------------------------------------------------------------------
alter table public.conversations
  add column if not exists last_message text not null default '';

-- Diperbarui pada setiap pesan baru (sekaligus menjaga last_message_at tetap terkini
-- dan membuka kembali thread resolved/closed saat pengguna menulis lagi).
create or replace function public.handle_new_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.conversations
     set last_message_at = new.created_at,
         last_message = case
                          when length(trim(new.body)) > 0 then new.body
                          when new.hospital_id is not null then 'Kartu rumah sakit'
                          else last_message
                        end,
         status = case
                    when new.sender_role = 'patient' and status in ('resolved', 'closed')
                      then 'open'
                    else status
                  end
   where id = new.conversation_id;
  return new;
end;
$$;

-- Mengisi ulang (backfill) conversation yang sudah ada dari pesan terbarunya.
update public.conversations c
   set last_message = coalesce(
     (
       select case
                when length(trim(m.body)) > 0 then m.body
                else 'Kartu rumah sakit'
              end
       from public.messages m
       where m.conversation_id = c.id
       order by m.created_at desc
       limit 1
     ),
     ''
   );
