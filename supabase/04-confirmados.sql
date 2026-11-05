-- Fútbol LSC · Actualización: CONFIRMADOS ("Me anoto").
-- Pegá TODO este archivo en Supabase > SQL Editor > New query y tocá "Run".

create table if not exists public.signups (
  match_id uuid not null references public.matches(id) on delete cascade,
  player_id uuid not null references public.players(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (match_id, player_id)
);

alter table public.signups enable row level security;

-- ¿Este jugador es el que está logueado y el partido todavía no se jugó?
create or replace function public.can_signup(mid uuid, pid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.players p where p.id = pid and lower(p.email) = public.current_email() and public.current_email() <> '')
     and exists (select 1 from public.matches m where m.id = mid and m.status <> 'jugado')
$$;

drop policy if exists "leer confirmados" on public.signups;
create policy "leer confirmados" on public.signups for select using (true);
drop policy if exists "admin escribe confirmados" on public.signups;
create policy "admin escribe confirmados" on public.signups for all
  using (public.is_admin()) with check (public.is_admin());
drop policy if exists "me anoto" on public.signups;
create policy "me anoto" on public.signups for insert
  with check (public.can_signup(match_id, player_id));
drop policy if exists "me bajo" on public.signups;
create policy "me bajo" on public.signups for delete
  using (public.can_signup(match_id, player_id));
