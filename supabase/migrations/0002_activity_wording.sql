-- Merapikan teks activity-log rumah sakit (menghindari "RS RS ...") dan membersihkan noise dari seed.

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
    v_summary := new.name || ' ditambahkan';
  elsif (tg_op = 'UPDATE') then
    if (old.is_active is distinct from new.is_active) then
      v_action := case when new.is_active then 'activated' else 'deactivated' end;
      v_summary := new.name || (case when new.is_active then ' diaktifkan' else ' dinonaktifkan' end);
    else
      v_action := 'updated';
      v_summary := 'Data ' || new.name || ' diperbarui';
    end if;
  else
    return old;
  end if;

  insert into public.activity_log (actor_id, action, entity, entity_id, summary)
  values (auth.uid(), v_action, 'hospital', new.id, v_summary);
  return new;
end;
$$;

-- Menghapus baris yang dihasilkan saat seeding agar feed dashboard mulai bersih.
delete from public.activity_log
where actor_id is null and entity = 'hospital' and action = 'created';
