-- Fútbol LSC · Actualización: lesionados.
-- Pegá TODO este archivo en Supabase > SQL Editor > New query y tocá "Run".

-- Hasta qué día no viene el jugador (vacío = está sano).
alter table public.players add column if not exists injured_until date;
