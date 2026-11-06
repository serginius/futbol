-- Fútbol LSC · Actualización: link de relator (sin login) y "volver a cero".
-- Pegá TODO este archivo en Supabase > SQL Editor > New query y tocá "Run".
-- Se puede correr más de una vez sin problema.

-- Los links secretos van en una tabla aparte que solo ve el admin
-- (la tabla de partidos la puede leer cualquiera).
create table if not exists public.keeper_links (
  match_id uuid primary key references public.matches(id) on delete cascade,
  token text not null unique,
  created_at timestamptz not null default now()
);
alter table public.keeper_links enable row level security;
drop policy if exists "admin ve links" on public.keeper_links;
create policy "admin ve links" on public.keeper_links for all
  using (public.is_admin()) with check (public.is_admin());

-- ¿Puede relatar este partido? El admin, o quien tenga el link, mientras no esté terminado.
create or replace function public.relator_ok(mid uuid, tok text) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.matches m where m.id = mid and m.status <> 'jugado')
     and (public.is_admin() or exists (
       select 1 from public.keeper_links k where k.match_id = mid and tok is not null and k.token = tok))
$$;

-- Desde el link: ¿de qué partido es? (nada si lo cortaron o ya se jugó)
create or replace function public.relator_match(tok text) returns uuid
language sql stable security definer set search_path = public as $$
  select k.match_id from public.keeper_links k join public.matches m on m.id = k.match_id
  where tok is not null and k.token = tok and m.status <> 'jugado'
$$;

create or replace function public.relator_start(mid uuid, tok text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.relator_ok(mid, tok) then raise exception 'Link vencido o cortado'; end if;
  update public.matches set started_at = coalesce(started_at, now()) where id = mid;
end $$;

create or replace function public.relator_goal(mid uuid, tok text, t text, pid uuid, own boolean, ast uuid, mins int) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.relator_ok(mid, tok) then raise exception 'Link vencido o cortado'; end if;
  insert into public.goals (match_id, team, player_id, own_goal, assist_id, minute)
  values (mid, t, pid, coalesce(own, false), ast, mins);
end $$;

create or replace function public.relator_event(mid uuid, tok text, t text, pid uuid, k text, mins int) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.relator_ok(mid, tok) then raise exception 'Link vencido o cortado'; end if;
  insert into public.events (match_id, team, player_id, kind, minute) values (mid, t, pid, k, mins);
end $$;

create or replace function public.relator_undo(mid uuid, tok text, is_goal boolean, rid uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.relator_ok(mid, tok) then raise exception 'Link vencido o cortado'; end if;
  if is_goal then delete from public.goals where id = rid and match_id = mid;
  else delete from public.events where id = rid and match_id = mid; end if;
end $$;

create or replace function public.relator_finish(mid uuid, tok text, mvp uuid default null) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.relator_ok(mid, tok) then raise exception 'Link vencido o cortado'; end if;
  update public.matches set status = 'jugado', mvp_id = coalesce(mvp, mvp_id) where id = mid;
  delete from public.keeper_links where match_id = mid;
end $$;

-- Solo admin: crear (o renovar) el link de un partido.
create or replace function public.make_relator_link(mid uuid) returns text
language plpgsql security definer set search_path = public as $$
declare tok text := replace(gen_random_uuid()::text, '-', '');
begin
  if not public.is_admin() then raise exception 'Solo el admin'; end if;
  insert into public.keeper_links (match_id, token) values (mid, tok)
  on conflict (match_id) do update set token = excluded.token, created_at = now();
  return tok;
end $$;

-- Solo admin: borrar todo lo cargado y dejar el partido como si no se hubiera jugado.
create or replace function public.reset_match(mid uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Solo el admin'; end if;
  delete from public.goals where match_id = mid;
  delete from public.events where match_id = mid;
  update public.matches set status = 'programado', started_at = null, mvp_id = null where id = mid;
end $$;

grant execute on function public.relator_match(text) to anon, authenticated;
grant execute on function public.relator_start(uuid, text) to anon, authenticated;
grant execute on function public.relator_goal(uuid, text, text, uuid, boolean, uuid, int) to anon, authenticated;
grant execute on function public.relator_event(uuid, text, text, uuid, text, int) to anon, authenticated;
grant execute on function public.relator_undo(uuid, text, boolean, uuid) to anon, authenticated;
grant execute on function public.relator_finish(uuid, text, uuid) to anon, authenticated;
