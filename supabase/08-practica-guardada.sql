-- Fútbol LSC · Actualización: que la práctica del relator no se pierda al recargar.
-- Pegá TODO este archivo en Supabase > SQL Editor > New query y tocá "Run".
-- Se puede correr más de una vez sin problema.

-- Lo que anotás en "🧪 Probar la planilla" se guarda acá (solo lo ve el admin,
-- no cuenta para ninguna estadística). Así podés recargar o seguir desde otro celu.
create table if not exists public.practice_runs (
  match_id uuid primary key references public.matches(id) on delete cascade,
  state jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.practice_runs enable row level security;
drop policy if exists "admin practica" on public.practice_runs;
create policy "admin practica" on public.practice_runs for all
  using (public.is_admin()) with check (public.is_admin());
