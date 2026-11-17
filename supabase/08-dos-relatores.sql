-- Fútbol LSC · Actualización: dos relatores a la vez sin goles repetidos.
-- Pegá TODO este archivo en Supabase > SQL Editor > New query y tocá "Run".
-- Se puede correr más de una vez sin problema.
--
-- Si vos y el del link anotan lo mismo (mismo jugador, misma acción) con menos
-- de 45 segundos de diferencia, vale el que llegó primero y el otro no se repite.

drop function if exists public.relator_goal(uuid, text, text, uuid, boolean, uuid, int);
create or replace function public.relator_goal(mid uuid, tok text, t text, pid uuid, own boolean, ast uuid, mins int) returns boolean
language plpgsql security definer set search_path = public as $$
begin
  if not public.relator_ok(mid, tok) then raise exception 'Link vencido o cortado'; end if;
  perform pg_advisory_xact_lock(hashtext(mid::text)); -- de a uno por partido
  if exists (select 1 from public.goals g where g.match_id = mid and g.player_id = pid
             and g.own_goal = coalesce(own, false) and g.created_at > now() - interval '45 seconds') then
    return false; -- ya lo había anotado el otro
  end if;
  insert into public.goals (match_id, team, player_id, own_goal, assist_id, minute)
  values (mid, t, pid, coalesce(own, false), ast, mins);
  return true;
end $$;

drop function if exists public.relator_event(uuid, text, text, uuid, text, int, boolean);
create or replace function public.relator_event(mid uuid, tok text, t text, pid uuid, k text, mins int, pen boolean default false) returns boolean
language plpgsql security definer set search_path = public as $$
begin
  if not public.relator_ok(mid, tok) then raise exception 'Link vencido o cortado'; end if;
  perform pg_advisory_xact_lock(hashtext(mid::text));
  if exists (select 1 from public.events e where e.match_id = mid and e.player_id = pid
             and e.kind = k and e.created_at > now() - interval '45 seconds') then
    return false;
  end if;
  insert into public.events (match_id, team, player_id, kind, minute, penalty) values (mid, t, pid, k, mins, coalesce(pen, false));
  return true;
end $$;

grant execute on function public.relator_goal(uuid, text, text, uuid, boolean, uuid, int) to anon, authenticated;
grant execute on function public.relator_event(uuid, text, text, uuid, text, int, boolean) to anon, authenticated;
