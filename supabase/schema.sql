-- Minar Insights: database for the facilitator dashboard (Supabase / Postgres).
-- Run once in the Supabase SQL editor (Project > SQL editor > New query > paste > Run). Safe to re-run.
--
-- Privacy design (see docs/PRIVACY.md):
--   * Facilitators sign in (Supabase Auth, email + password). Students never sign in and are never stored as people.
--   * A progress row holds only the game summary: random student code, class code, 4-digit roll number, game results.
--     No names: the roll number -> name list (the class list) lives only on the teacher's own device.
--   * Row-level security: a facilitator can only read or delete progress in classes they own.
--   * Students cannot read anything. They can only call submit_progress(), which validates and rate-limits.
--   * Old progress is purged after 400 days (purge_old_progress, scheduled below if pg_cron is enabled).

create table if not exists public.classes (
  code        text primary key check (code ~ '^[A-Z0-9-]{4,14}$'),
  name        text not null check (char_length(name) between 1 and 40),
  owner       uuid not null default auth.uid() references auth.users(id) on delete cascade,
  created_at  timestamptz not null default now()
);

create table if not exists public.progress (
  id           bigint generated always as identity primary key,
  class_code   text not null references public.classes(code) on delete cascade,
  student_id   text not null check (student_id ~ '^[a-z0-9]{3,12}$'),
  summary      jsonb not null check (pg_column_size(summary) < 4096),
  received_at  timestamptz not null default now()
);
create index if not exists progress_class_time on public.progress (class_code, received_at);
create index if not exists classes_owner on public.classes (owner);

alter table public.classes  enable row level security;
alter table public.progress enable row level security;

-- classes: a facilitator sees and manages only their own
drop policy if exists "own classes" on public.classes;
create policy "own classes" on public.classes for all to authenticated
  using (owner = (select auth.uid())) with check (owner = (select auth.uid()));

-- progress: read and delete only within your own classes. No insert or update policy: inserts go through submit_progress().
drop policy if exists "read own progress" on public.progress;
create policy "read own progress" on public.progress for select to authenticated
  using (exists (select 1 from public.classes c where c.code = class_code and c.owner = (select auth.uid())));
drop policy if exists "delete own progress" on public.progress;
create policy "delete own progress" on public.progress for delete to authenticated
  using (exists (select 1 from public.classes c where c.code = class_code and c.owner = (select auth.uid())));

-- the only way a student's phone can write. Returns ok | unknown_class | invalid | too_soon | class_full.
create or replace function public.submit_progress(p_code text, p_summary jsonb)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code text := upper(regexp_replace(coalesce(p_code, ''), '[^A-Za-z0-9-]', '', 'g'));
  v_id   text := p_summary->>'id';
begin
  -- 'hydk7q2m' and 'HYD K7Q2M' both mean HYD-K7Q2M
  if v_code ~ '^HYD[A-Z0-9]{4,5}$' then v_code := 'HYD-' || substr(v_code, 4); end if;
  if jsonb_typeof(p_summary) <> 'object' then return 'invalid'; end if;
  if not exists (select 1 from classes where code = v_code) then return 'unknown_class'; end if;
  if v_id is null or v_id !~ '^[a-z0-9]{3,12}$' or coalesce(p_summary->>'v', '') <> '1' then return 'invalid'; end if;
  if pg_column_size(p_summary) >= 4096 then return 'invalid'; end if;
  -- the roll number is exactly 4 digits or absent; never free text, so a name cannot be smuggled in through it
  if p_summary ? 'roll' and jsonb_typeof(p_summary->'roll') <> 'null'
     and coalesce(p_summary->>'roll', '') !~ '^[0-9]{4}$' then
    return 'invalid';
  end if;
  -- only the known anonymous fields; anything else (a name, free text) is refused
  if exists (select 1 from jsonb_object_keys(p_summary) k
             where k not in ('v','id','cohort','roll','at','lang','persona','lite','places','skills','happy','breaks','habits','p4')) then
    return 'invalid';
  end if;
  if exists (select 1 from progress where class_code = v_code and student_id = v_id and received_at > now() - interval '2 minutes') then
    return 'too_soon';
  end if;
  if (select count(*) from progress where class_code = v_code and received_at > now() - interval '1 day') >= 3000 then
    return 'class_full';
  end if;
  insert into progress (class_code, student_id, summary)
  values (v_code, v_id, jsonb_set(p_summary, '{cohort}', to_jsonb(v_code)));
  return 'ok';
end;
$$;

revoke all on function public.submit_progress(text, jsonb) from public;
grant execute on function public.submit_progress(text, jsonb) to anon, authenticated;

-- lets a student check the class code they typed: returns the class name (what the teacher called it) or null. Nothing else.
create or replace function public.class_name(p_code text)
returns text
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_code text := upper(regexp_replace(coalesce(p_code, ''), '[^A-Za-z0-9-]', '', 'g'));
begin
  if v_code ~ '^HYD[A-Z0-9]{4,5}$' then v_code := 'HYD-' || substr(v_code, 4); end if;
  return (select name from classes where code = v_code);
end;
$$;
revoke all on function public.class_name(text) from public;
grant execute on function public.class_name(text) to anon, authenticated;

-- live dashboard: new progress rows are pushed to signed-in facilitators (row-level security still decides who sees which row)
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'progress') then
    alter publication supabase_realtime add table public.progress;
  end if;
end $$;

-- retention: progress older than 400 days is deleted
create or replace function public.purge_old_progress()
returns void language sql security definer set search_path = public as $$
  delete from progress where received_at < now() - interval '400 days';
$$;
revoke all on function public.purge_old_progress() from public, anon, authenticated;

-- schedule the purge nightly if pg_cron is available (Database > Extensions > pg_cron). Skipped quietly otherwise.
do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.schedule('minar-purge-old-progress', '30 2 * * *', 'select public.purge_old_progress()');
  end if;
end $$;
