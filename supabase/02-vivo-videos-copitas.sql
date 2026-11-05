-- Fútbol LSC · Actualización: videos, panel EN VIVO, asistencias, faltas y tarjetas.
-- Pegá TODO este archivo en Supabase > SQL Editor > New query y tocá "Run".
-- Se puede correr más de una vez sin problema.

-- ============ Columnas nuevas ============

-- Partidos: links de YouTube, mail del planillero y hora en que arrancó.
alter table public.matches add column if not exists video_urls text[] not null default '{}';
alter table public.matches add column if not exists keeper_email text;
alter table public.matches add column if not exists started_at timestamptz;

-- Goles: quién dio la asistencia y en qué minuto.
alter table public.goals add column if not exists assist_id uuid references public.players(id) on delete set null;
alter table public.goals add column if not exists minute int;

-- Faltas y tarjetas.
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches(id) on delete cascade,
  team text not null check (team in ('A', 'B')),
  player_id uuid references public.players(id) on delete set null,
  kind text not null check (kind in ('falta', 'amarilla', 'roja')),
  minute int,
  created_at timestamptz not null default now()
);
create index if not exists events_match_idx on public.events(match_id);

-- ============ Permisos del planillero ============

-- ¿Puede anotar en este partido? El admin siempre; el planillero mientras no esté terminado.
create or replace function public.can_keep(mid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select public.is_admin() or exists (
    select 1 from public.matches m
    where m.id = mid and m.status <> 'jugado'
      and public.current_email() <> ''
      and lower(m.keeper_email) = public.current_email()
  )
$$;

-- El planillero también puede entrar con Google aunque no sea jugador.
create or replace function public.is_allowed() returns boolean
language sql stable security definer set search_path = public as $$
  select public.is_admin()
      or exists (select 1 from public.players where lower(email) = public.current_email())
      or exists (select 1 from public.matches where status <> 'jugado' and lower(keeper_email) = public.current_email())
$$;

-- Arrancar el reloj del partido.
create or replace function public.live_start(mid uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.can_keep(mid) then raise exception 'No sos el planillero de este partido'; end if;
  update public.matches set started_at = coalesce(started_at, now()) where id = mid;
end $$;

-- Terminar el partido (queda como jugado, con la figura si la eligieron).
create or replace function public.live_finish(mid uuid, mvp uuid default null) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.can_keep(mid) then raise exception 'No sos el planillero de este partido'; end if;
  update public.matches set status = 'jugado', mvp_id = coalesce(mvp, mvp_id) where id = mid;
end $$;

-- ============ Seguridad por filas ============

alter table public.events enable row level security;

drop policy if exists "leer eventos" on public.events;
create policy "leer eventos" on public.events for select using (true);
drop policy if exists "admin escribe eventos" on public.events;
create policy "admin escribe eventos" on public.events for all
  using (public.is_admin()) with check (public.is_admin());
drop policy if exists "planillero anota eventos" on public.events;
create policy "planillero anota eventos" on public.events for insert
  with check (public.can_keep(match_id));
drop policy if exists "planillero borra eventos" on public.events;
create policy "planillero borra eventos" on public.events for delete
  using (public.can_keep(match_id));

drop policy if exists "planillero anota goles" on public.goals;
create policy "planillero anota goles" on public.goals for insert
  with check (public.can_keep(match_id));
drop policy if exists "planillero borra goles" on public.goals;
create policy "planillero borra goles" on public.goals for delete
  using (public.can_keep(match_id));
