-- Fútbol Miércoles: esquema de base de datos para Supabase.
-- Pegá TODO este archivo en Supabase > SQL Editor > New query y tocá "Run".
-- Al final, cambiá el mail del admin por tu Gmail.

-- ============ Tablas ============

-- Admins: mails que pueden cargar partidos, jugadores y habilitar gente.
create table if not exists public.admins (
  email text primary key
);

-- Jugadores. Si tiene email, esa persona queda habilitada para entrar con Google
-- y editar su propio perfil.
create table if not exists public.players (
  id uuid primary key default gen_random_uuid(),
  email text unique,
  name text not null,
  nick text,
  position text,
  number text,
  foot text,
  photo_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.matches (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  time text,
  place text,
  status text not null default 'programado' check (status in ('programado', 'jugado')),
  team_a_name text not null default 'Local',
  team_b_name text not null default 'Visitante',
  mvp_id uuid references public.players(id) on delete set null,
  notes text,
  created_at timestamptz not null default now()
);

-- Quién jugó en cada partido y en qué equipo.
create table if not exists public.match_players (
  match_id uuid not null references public.matches(id) on delete cascade,
  player_id uuid not null references public.players(id) on delete cascade,
  team text not null check (team in ('A', 'B')),
  primary key (match_id, player_id)
);

-- Goles. "team" es el equipo al que se le suma el gol.
-- own_goal = true: gol en contra, hecho por player_id del otro equipo.
create table if not exists public.goals (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches(id) on delete cascade,
  team text not null check (team in ('A', 'B')),
  player_id uuid references public.players(id) on delete set null,
  own_goal boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists goals_match_idx on public.goals(match_id);
create index if not exists match_players_match_idx on public.match_players(match_id);

-- ============ Funciones de permisos ============

create or replace function public.current_email() returns text
language sql stable as $$
  select lower(coalesce(auth.jwt() ->> 'email', ''))
$$;

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admins where lower(email) = public.current_email())
$$;

-- ¿El mail con el que entró está habilitado? (es admin o es un jugador cargado)
create or replace function public.is_allowed() returns boolean
language sql stable security definer set search_path = public as $$
  select public.is_admin()
      or exists (select 1 from public.players where lower(email) = public.current_email())
$$;

-- Un jugador no puede cambiarse el email (eso lo maneja el admin).
create or replace function public.protect_player_email() returns trigger
language plpgsql as $$
begin
  if new.email is distinct from old.email and not public.is_admin() then
    raise exception 'Solo el admin puede cambiar el mail de un jugador';
  end if;
  return new;
end $$;

drop trigger if exists players_protect_email on public.players;
create trigger players_protect_email before update on public.players
  for each row execute function public.protect_player_email();

-- ============ Seguridad por filas (RLS) ============

alter table public.admins enable row level security;
alter table public.players enable row level security;
alter table public.matches enable row level security;
alter table public.match_players enable row level security;
alter table public.goals enable row level security;

-- Lectura: los resultados son públicos (cualquiera con el link los ve).
drop policy if exists "leer jugadores" on public.players;
create policy "leer jugadores" on public.players for select using (true);
drop policy if exists "leer partidos" on public.matches;
create policy "leer partidos" on public.matches for select using (true);
drop policy if exists "leer planteles" on public.match_players;
create policy "leer planteles" on public.match_players for select using (true);
drop policy if exists "leer goles" on public.goals;
create policy "leer goles" on public.goals for select using (true);
drop policy if exists "admins ven admins" on public.admins;
create policy "admins ven admins" on public.admins for select using (public.is_admin());

-- Escritura: el admin todo; cada jugador solo su propio perfil.
drop policy if exists "admin escribe jugadores" on public.players;
create policy "admin escribe jugadores" on public.players for all
  using (public.is_admin()) with check (public.is_admin());
drop policy if exists "jugador edita su perfil" on public.players;
create policy "jugador edita su perfil" on public.players for update
  using (lower(email) = public.current_email())
  with check (lower(email) = public.current_email());

drop policy if exists "admin escribe partidos" on public.matches;
create policy "admin escribe partidos" on public.matches for all
  using (public.is_admin()) with check (public.is_admin());
drop policy if exists "admin escribe planteles" on public.match_players;
create policy "admin escribe planteles" on public.match_players for all
  using (public.is_admin()) with check (public.is_admin());
drop policy if exists "admin escribe goles" on public.goals;
create policy "admin escribe goles" on public.goals for all
  using (public.is_admin()) with check (public.is_admin());
drop policy if exists "admin escribe admins" on public.admins;
create policy "admin escribe admins" on public.admins for all
  using (public.is_admin()) with check (public.is_admin());

-- ============ Fotos (Storage) ============

insert into storage.buckets (id, name, public)
values ('fotos', 'fotos', true)
on conflict (id) do nothing;

-- Cada jugador sube su foto en la carpeta con el id de su jugador; el admin, en cualquiera.
drop policy if exists "subir fotos" on storage.objects;
create policy "subir fotos" on storage.objects for insert to authenticated
  with check (
    bucket_id = 'fotos' and (
      public.is_admin() or exists (
        select 1 from public.players p
        where p.id::text = (storage.foldername(objects.name))[1]
          and lower(p.email) = public.current_email()
      )
    )
  );
drop policy if exists "cambiar fotos" on storage.objects;
create policy "cambiar fotos" on storage.objects for update to authenticated
  using (
    bucket_id = 'fotos' and (
      public.is_admin() or exists (
        select 1 from public.players p
        where p.id::text = (storage.foldername(objects.name))[1]
          and lower(p.email) = public.current_email()
      )
    )
  );
drop policy if exists "borrar fotos" on storage.objects;
create policy "borrar fotos" on storage.objects for delete to authenticated
  using (bucket_id = 'fotos' and public.is_admin());

-- ============ Primer admin ============
-- CAMBIÁ ESTE MAIL POR TU GMAIL (en minúsculas) antes de correrlo.
insert into public.admins (email) values ('tu-mail@gmail.com')
on conflict do nothing;
