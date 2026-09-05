------------------------------------------------------------------------------
-- Membuat penghapusan rumah sakit menjadi aman.
--
-- 1. Pesan dukungan bisa berupa hanya "kartu" rumah sakit (body kosong) yang
--    merujuk ke rumah sakit lewat messages.hospital_id (ON DELETE SET NULL).
--    Begitu FK ini meng-NULL-kan kolomnya, baris tersebut melanggar messages_body_check
--    (migrasi 0003) sehingga seluruh DELETE dibatalkan. Tulis ulang body pesan
--    kartu-saja semacam itu SEBELUM delete di-cascade.
--
-- 2. Trigger audit sebelumnya hanya mencatat INSERT / UPDATE — catat juga penghapusan.
------------------------------------------------------------------------------

-- 1. Melepas pesan kartu-saja sebelum FK men-set hospital_id menjadi NULL.
create or replace function public.detach_hospital_from_messages()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.messages
     set body = 'Kartu rumah sakit tidak lagi tersedia.'
   where hospital_id = old.id
     and length(trim(body)) = 0;
  return old;
end;
$$;

drop trigger if exists hospitals_detach_messages on public.hospitals;
create trigger hospitals_detach_messages
  before delete on public.hospitals
  for each row execute function public.detach_hospital_from_messages();

-- 2. Memperluas trigger audit agar juga mencatat penghapusan.
create or replace function public.log_hospital_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_action text;
  v_summary text;
begin
  if (tg_op = 'INSERT') then
    v_action := 'created';
    v_summary := 'RS ' || new.name || ' ditambahkan';
  elsif (tg_op = 'UPDATE') then
    if (old.is_active is distinct from new.is_active) then
      v_action := case when new.is_active then 'activated' else 'deactivated' end;
      v_summary := 'RS ' || new.name || (case when new.is_active then ' diaktifkan' else ' dinonaktifkan' end);
    else
      v_action := 'updated';
      v_summary := 'Data RS ' || new.name || ' diperbarui';
    end if;
  elsif (tg_op = 'DELETE') then
    insert into public.activity_log (actor_id, action, entity, entity_id, summary)
    values (auth.uid(), 'deleted', 'hospital', old.id, 'RS ' || old.name || ' dihapus');
    return old;
  else
    return old;
  end if;

  insert into public.activity_log (actor_id, action, entity, entity_id, summary)
  values (auth.uid(), v_action, 'hospital', new.id, v_summary);
  return new;
end;
$$;

drop trigger if exists on_hospital_change on public.hospitals;
create trigger on_hospital_change
  after insert or update or delete on public.hospitals
  for each row execute function public.log_hospital_change();
