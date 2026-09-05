------------------------------------------------------------------------------
-- Mencatat siapa pengirim pesan terakhir di tiap conversation agar dashboard
-- Admin bisa menampilkan angka yang benar-benar perlu ditindaklanjuti: thread
-- yang pesan terakhirnya dari pengguna dan belum ditutup ("menunggu balasan").
------------------------------------------------------------------------------
alter table public.conversations
  add column if not exists last_message_role text
    check (last_message_role in ('patient', 'admin'));

create or replace function public.handle_new_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.conversations
     set last_message_at = new.created_at,
         last_message_role = new.sender_role,
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

-- Mengisi ulang (backfill) dari pesan terbaru tiap conversation.
update public.conversations c
   set last_message_role = m.sender_role
  from (
    select distinct on (conversation_id) conversation_id, sender_role
      from public.messages
     order by conversation_id, created_at desc
  ) m
 where m.conversation_id = c.id
   and c.last_message_role is null;
