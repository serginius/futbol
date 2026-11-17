-- Fútbol LSC · Actualización: fotos de la juntada en cada partido.
-- Pegá TODO este archivo en Supabase > SQL Editor > New query y tocá "Run".
-- Se puede correr más de una vez sin problema.

alter table public.matches add column if not exists photo_urls text[] not null default '{}';
