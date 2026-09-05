-- HospitalLink — skema awal
-- Portal Admin + Portal Pasien berbagi satu database Supabase Postgres.
-- Jalankan dengan: pnpm db:push   (scripts/db-push.mjs)

------------------------------------------------------------------------------
-- Ekstensi
------------------------------------------------------------------------------
create extension if not exists "pgcrypto";      -- dipakai oleh gen_random_uuid()

------------------------------------------------------------------------------
-- Enum (disimpan sebagai text + check constraint agar mudah diubah dari aplikasi)
------------------------------------------------------------------------------

------------------------------------------------------------------------------
-- profiles  — cerminan auth.users, menyimpan role + status aktif
------------------------------------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  full_name   text        not null default '',
  role        text        not null default 'patient' check (role in ('patient', 'admin')),
  phone       text        not null default '',
  location    text        not null default '',
  is_active   boolean     not null default true,
  created_at  timestamptz not null default now()
);

comment on table public.profiles is 'One row per auth user. role drives portal access; is_active gates login.';

-- Otomatis membuat baris profile setiap kali user auth baru dibuat.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, phone, location)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(new.raw_user_meta_data ->> 'phone', ''),
    coalesce(new.raw_user_meta_data ->> 'location', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Cek admin — SECURITY DEFINER agar melewati RLS dan tidak rekursif.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin' and is_active
  );
$$;

------------------------------------------------------------------------------
-- Fungsi bantu updated_at
------------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

------------------------------------------------------------------------------
-- hospitals  — data master yang dipakai Portal Pasien
------------------------------------------------------------------------------
create table if not exists public.hospitals (
  id                 uuid primary key default gen_random_uuid(),
  slug               text        not null unique,
  name               text        not null,
  short_name         text        not null default '',
  location           text        not null default '',
  address            text        not null default '',
  phone              text        not null default '',
  type               text        not null default 'Rumah Sakit Swasta'
                        check (type in ('Rumah Sakit Swasta', 'Rumah Sakit Pemerintah')),
  description        text        not null default '',
  image_url          text        not null default '',
  is_open_24h        boolean     not null default false,
  closing_time       text,
  beds               integer     not null default 0,
  established        integer,
  distance_km        numeric(6, 2),            -- statis / hanya informatif
  services           text[]      not null default '{}',
  facilities         text[]      not null default '{}',
  specialists        jsonb       not null default '[]'::jsonb,   -- [{name,specialty,schedule,image_id}]
  operational_hours  jsonb       not null default '[]'::jsonb,   -- [{day,hours}]
  is_active          boolean     not null default true,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

comment on column public.hospitals.distance_km is 'Static estimate only — real distance is relative to the visitor and is not tracked.';
comment on column public.hospitals.specialists is 'Informational, admin-edited. Not a real-time doctor schedule.';
comment on column public.hospitals.operational_hours is 'Informational, admin-edited. Not real-time availability.';

create index if not exists hospitals_is_active_idx on public.hospitals (is_active);
create index if not exists hospitals_updated_at_idx on public.hospitals (updated_at desc);

drop trigger if exists hospitals_set_updated_at on public.hospitals;
create trigger hospitals_set_updated_at
  before update on public.hospitals
  for each row execute function public.set_updated_at();

------------------------------------------------------------------------------
-- bookmarks  — favorit pengguna (tersimpan permanen)
------------------------------------------------------------------------------
create table if not exists public.bookmarks (
  user_id     uuid        not null references auth.users (id) on delete cascade,
  hospital_id uuid        not null references public.hospitals (id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (user_id, hospital_id)
);

------------------------------------------------------------------------------
-- conversations + messages  — kotak masuk Bantuan
------------------------------------------------------------------------------
create table if not exists public.conversations (
  id              uuid primary key default gen_random_uuid(),
  patient_id      uuid        not null references auth.users (id) on delete cascade,
  category        text        not null default 'lainnya',
  subject         text        not null default '',
  status          text        not null default 'open'
                    check (status in ('open', 'pending', 'resolved', 'closed')),
  last_message_at timestamptz not null default now(),
  created_at      timestamptz not null default now()
);

create index if not exists conversations_patient_idx on public.conversations (patient_id);
create index if not exists conversations_status_idx on public.conversations (status);
create index if not exists conversations_last_message_idx on public.conversations (last_message_at desc);

create table if not exists public.messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid        not null references public.conversations (id) on delete cascade,
  sender_id       uuid        not null references auth.users (id) on delete cascade,
  sender_role     text        not null check (sender_role in ('patient', 'admin')),
  body            text        not null check (length(trim(body)) > 0),
  created_at      timestamptz not null default now()
);

create index if not exists messages_conversation_idx on public.messages (conversation_id, created_at);

-- Menjaga conversation.last_message_at tetap terkini; pesan baru dari pengguna membuka kembali thread yang sudah ditutup.
create or replace function public.handle_new_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.conversations
     set last_message_at = new.created_at,
         status = case
                    when new.sender_role = 'patient' and status in ('resolved', 'closed')
                      then 'open'
                    else status
                  end
   where id = new.conversation_id;
  return new;
end;
$$;

drop trigger if exists on_message_created on public.messages;
create trigger on_message_created
  after insert on public.messages
  for each row execute function public.handle_new_message();

------------------------------------------------------------------------------
-- settings  — key/value yang dikelola di halaman Pengaturan
------------------------------------------------------------------------------
create table if not exists public.settings (
  key        text primary key,
  value      jsonb       not null,
  updated_at timestamptz not null default now(),
  updated_by uuid        references auth.users (id) on delete set null
);

insert into public.settings (key, value) values
  ('support_service_hours', '{"start": 8, "end": 21}'::jsonb),
  ('support_email',          '"bantuan@hospitalink.test"'::jsonb),
  ('announcement',           '{"enabled": false, "text": ""}'::jsonb)
on conflict (key) do nothing;

------------------------------------------------------------------------------
-- activity_log  — sumber data "status data" Dashboard + jejak audit
------------------------------------------------------------------------------
create table if not exists public.activity_log (
  id         uuid primary key default gen_random_uuid(),
  actor_id   uuid references auth.users (id) on delete set null,
  action     text not null,                 -- created | updated | activated | deactivated | status_changed ...
  entity     text not null,                 -- hospital | conversation | user | settings
  entity_id  uuid,
  summary    text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists activity_log_created_idx on public.activity_log (created_at desc);

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
  after insert or update on public.hospitals
  for each row execute function public.log_hospital_change();

------------------------------------------------------------------------------
-- Keamanan level baris (RLS)
------------------------------------------------------------------------------
alter table public.profiles       enable row level security;
alter table public.hospitals      enable row level security;
alter table public.bookmarks      enable row level security;
alter table public.conversations  enable row level security;
alter table public.messages       enable row level security;
alter table public.settings       enable row level security;
alter table public.activity_log   enable row level security;

-- profiles -----------------------------------------------------------------
drop policy if exists profiles_select_self_or_admin on public.profiles;
create policy profiles_select_self_or_admin on public.profiles
  for select to authenticated
  using (id = auth.uid() or public.is_admin());

drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self on public.profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid() and role = (select role from public.profiles where id = auth.uid()));

drop policy if exists profiles_update_admin on public.profiles;
create policy profiles_update_admin on public.profiles
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- hospitals --------------------------------------------------------------
drop policy if exists hospitals_select_public on public.hospitals;
create policy hospitals_select_public on public.hospitals
  for select to anon, authenticated
  using (is_active or public.is_admin());

drop policy if exists hospitals_insert_admin on public.hospitals;
create policy hospitals_insert_admin on public.hospitals
  for insert to authenticated
  with check (public.is_admin());

drop policy if exists hospitals_update_admin on public.hospitals;
create policy hospitals_update_admin on public.hospitals
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists hospitals_delete_admin on public.hospitals;
create policy hospitals_delete_admin on public.hospitals
  for delete to authenticated
  using (public.is_admin());

-- bookmarks ------------------------------------------------------------
drop policy if exists bookmarks_all_own on public.bookmarks;
create policy bookmarks_all_own on public.bookmarks
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- conversations ------------------------------------------------------
drop policy if exists conversations_select on public.conversations;
create policy conversations_select on public.conversations
  for select to authenticated
  using (patient_id = auth.uid() or public.is_admin());

drop policy if exists conversations_insert_patient on public.conversations;
create policy conversations_insert_patient on public.conversations
  for insert to authenticated
  with check (patient_id = auth.uid());

drop policy if exists conversations_update on public.conversations;
create policy conversations_update on public.conversations
  for update to authenticated
  using (patient_id = auth.uid() or public.is_admin())
  with check (patient_id = auth.uid() or public.is_admin());

-- messages ----------------------------------------------------------
drop policy if exists messages_select on public.messages;
create policy messages_select on public.messages
  for select to authenticated
  using (
    public.is_admin()
    or exists (
      select 1 from public.conversations c
      where c.id = messages.conversation_id and c.patient_id = auth.uid()
    )
  );

drop policy if exists messages_insert on public.messages;
create policy messages_insert on public.messages
  for insert to authenticated
  with check (
    sender_id = auth.uid()
    and (
      (sender_role = 'admin' and public.is_admin())
      or (
        sender_role = 'patient'
        and exists (
          select 1 from public.conversations c
          where c.id = conversation_id and c.patient_id = auth.uid()
        )
      )
    )
  );

-- settings ---------------------------------------------------------
drop policy if exists settings_select_all on public.settings;
create policy settings_select_all on public.settings
  for select to anon, authenticated
  using (true);

drop policy if exists settings_write_admin on public.settings;
create policy settings_write_admin on public.settings
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- activity_log ---------------------------------------------------
drop policy if exists activity_log_select_admin on public.activity_log;
create policy activity_log_select_admin on public.activity_log
  for select to authenticated
  using (public.is_admin());

drop policy if exists activity_log_insert_admin on public.activity_log;
create policy activity_log_insert_admin on public.activity_log
  for insert to authenticated
  with check (public.is_admin() and actor_id = auth.uid());

------------------------------------------------------------------------------
-- Realtime — pembaruan langsung untuk Portal Pasien + Kotak Masuk Admin
------------------------------------------------------------------------------
do $$
declare
  tbl text;
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    create publication supabase_realtime;
  end if;

  foreach tbl in array array['hospitals', 'conversations', 'messages'] loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = tbl
    ) then
      execute format('alter publication supabase_realtime add table public.%I', tbl);
    end if;
  end loop;
end $$;
