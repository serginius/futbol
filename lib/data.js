import { todayStr, parseDate } from "./format";

// Trae toda la liga (es chica: decenas de jugadores y partidos).
export async function getLeague(supabase) {
  const [{ data: players }, { data: matches }] = await Promise.all([
    supabase.from("players").select("id,name,nick,position,number,foot,photo_url,injured_until").order("name"),
    supabase.from("matches").select("*, match_players(player_id,team), goals(id,team,player_id,own_goal,created_at,assist_id,minute), events(id,team,player_id,kind,minute,created_at)"),
  ]);
  const byId = Object.fromEntries((players || []).map((p) => [p.id, p]));
  const ms = (matches || []).map((m) => ({
    ...m,
    teamA: (m.match_players || []).filter((x) => x.team === "A").map((x) => x.player_id),
    teamB: (m.match_players || []).filter((x) => x.team === "B").map((x) => x.player_id),
    goalsA: (m.goals || []).filter((g) => g.team === "A").sort((a, b) => a.created_at.localeCompare(b.created_at)),
    goalsB: (m.goals || []).filter((g) => g.team === "B").sort((a, b) => a.created_at.localeCompare(b.created_at)),
    events: (m.events || []).slice().sort((a, b) => a.created_at.localeCompare(b.created_at)),
    videos: m.video_urls || [],
    live: m.status !== "jugado" && !!m.started_at,
  }));
  return { players: players || [], byId, matches: ms };
}

export function score(m) {
  return [m.goalsA.length, m.goalsB.length];
}
export function playedMatches(matches) {
  return matches.filter((m) => m.status === "jugado").sort((a, b) => parseDate(b.date, b.time) - parseDate(a.date, a.time));
}
export function upcomingMatches(matches) {
  const t = todayStr();
  return matches.filter((m) => m.status !== "jugado" && (m.date >= t || m.live)).sort((a, b) => parseDate(a.date, a.time) - parseDate(b.date, b.time));
}
export function pendingResults(matches) {
  const t = todayStr();
  return matches.filter((m) => m.status !== "jugado" && !m.live && m.date < t);
}

// Estadísticas por jugador: PJ, goles, asistencias, faltas, tarjetas, G/E/P, MVP, racha.
export function computeStats(players, matches) {
  const st = {};
  const get = (id) => (st[id] ||= { id, pj: 0, g: 0, a: 0, f: 0, am: 0, ro: 0, ec: 0, pg: 0, pe: 0, pp: 0, mvp: 0, form: [] });
  players.forEach((p) => get(p.id));
  playedMatches(matches).slice().reverse().forEach((m) => {
    const [a, b] = score(m);
    const res = (mine, their) => (mine > their ? "G" : mine < their ? "P" : "E");
    m.teamA.forEach((id) => { const s = get(id); const r = res(a, b); s.pj++; s["p" + r.toLowerCase()]++; s.form.push(r); });
    m.teamB.forEach((id) => { const s = get(id); const r = res(b, a); s.pj++; s["p" + r.toLowerCase()]++; s.form.push(r); });
    [...m.goalsA, ...m.goalsB].forEach((g) => {
      if (g.player_id) { if (g.own_goal) get(g.player_id).ec++; else get(g.player_id).g++; }
      if (g.assist_id && !g.own_goal) get(g.assist_id).a++;
    });
    m.events.forEach((e) => {
      if (!e.player_id) return;
      const s = get(e.player_id); s.f++;
      if (e.kind === "amarilla") s.am++;
      if (e.kind === "roja") s.ro++;
    });
    if (m.mvp_id) get(m.mvp_id).mvp++;
  });
  return st;
}

export function scorerRanking(players, matches) {
  const st = computeStats(players, matches);
  const name = (id) => { const p = players.find((x) => x.id === id); return p ? p.nick || p.name : ""; };
  return Object.values(st)
    .filter((s) => players.some((p) => p.id === s.id))
    .sort((x, y) => y.g - x.g || x.pj - y.pj || name(x.id).localeCompare(name(y.id)));
}
