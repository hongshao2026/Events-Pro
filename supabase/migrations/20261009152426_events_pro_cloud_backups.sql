-- One manually confirmed snapshot per account. No public access or automatic uploads.
create table public.events_pro_backups (
 user_id uuid primary key references auth.users(id) on delete cascade,
 revision integer not null check (revision >= 1),
 updated_at timestamptz not null default now(),
 payload jsonb not null,
 constraint events_pro_backup_shape check (
  coalesce(jsonb_typeof(payload) = 'object'
  and payload->'version' = '1'::jsonb
  and payload->'selections'->>'app' = 'wpt-planner'
  and payload->'selections'->'schemaVersion' = '2'::jsonb
  and jsonb_typeof(payload->'selections'->'state') = 'object'
  and payload->'settings'->>'app' = 'events-pro-settings'
  and payload->'settings'->'schemaVersion' = '1'::jsonb
  and jsonb_typeof(payload->'settings'->'settings') = 'object', false)
 ),
 constraint events_pro_backup_size check (octet_length(payload::text) <= 1000000)
);
alter table public.events_pro_backups enable row level security;
revoke all on public.events_pro_backups from public, anon, authenticated;
grant select, insert, update, delete on public.events_pro_backups to authenticated;
create policy backup_select_own on public.events_pro_backups for select to authenticated
 using ((select auth.uid()) = user_id);
create policy backup_insert_own on public.events_pro_backups for insert to authenticated
 with check ((select auth.uid()) = user_id);
create policy backup_update_own on public.events_pro_backups for update to authenticated
 using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy backup_delete_own on public.events_pro_backups for delete to authenticated
 using ((select auth.uid()) = user_id);

-- Security invoker deliberately keeps RLS active. Identity comes from the JWT.
create function public.save_events_pro_backup(expected_revision integer, backup_payload jsonb)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare saved public.events_pro_backups;
begin
 if auth.uid() is null then raise exception 'authentication_required' using errcode = '42501'; end if;
 if expected_revision is null or expected_revision < 0 then raise exception 'invalid_revision' using errcode = '22023'; end if;
 if expected_revision = 0 then
  insert into public.events_pro_backups (user_id,revision,payload)
  values (auth.uid(),1,backup_payload) on conflict (user_id) do nothing returning * into saved;
 else
  update public.events_pro_backups set revision = revision + 1, payload = backup_payload, updated_at = now()
  where user_id = auth.uid() and revision = expected_revision returning * into saved;
 end if;
 if saved.user_id is null then raise exception 'cloud_conflict' using errcode = '40001'; end if;
 return to_jsonb(saved);
end;
$$;
revoke all on function public.save_events_pro_backup(integer,jsonb) from public, anon;
grant execute on function public.save_events_pro_backup(integer,jsonb) to authenticated;
