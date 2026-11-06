-- Fútbol LSC · Actualización: marcar si la falta fue penal.
-- Pegá TODO este archivo en Supabase > SQL Editor > New query y tocá "Run".
-- Se puede correr más de una vez sin problema.

alter table public.events add column if not exists penalty boolean not null default false;

-- El relator anota la falta (con tarjeta o no) y si fue penal.
drop function if exists public.relator_event(uuid, text, text, uuid, text, int);
create or replace function public.relator_event(mid uuid, tok text, t text, pid uuid, k text, mins int, pen boolean default false) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.relator_ok(mid, tok) then raise exception 'Link vencido o cortado'; end if;
  insert into public.events (match_id, team, player_id, kind, minute, penalty) values (mid, t, pid, k, mins, coalesce(pen, false));
end $$;

grant execute on function public.relator_event(uuid, text, text, uuid, text, int, boolean) to anon, authenticated;
