import { playedMatches, score, scorerRanking } from "./data";

// Copitas: trofeos inventados que se calculan solos con los partidos cargados.
// Las de varios niveles tienen bronce, plata y oro.
const DEFS = [
  { id: "debut", e: "📋", name: "Citado por Scaloni", how: "Jugar tu primer partido", val: (h) => h.pj, goal: [1] },
  { id: "gol1", e: "😭", name: "Gritalo, Nene", how: "Meter tu primer gol", val: (h) => h.g, goal: [1] },
  { id: "goles", e: "🔪", names: ["Picante", "Matador", "Asesino Serial del Área"], how: "goles", val: (h) => h.g, goal: [10, 25, 50] },
  { id: "asist", e: "🍽️", names: ["El Mozo", "El Mozo, Te la Sirve", "El Mozo, Te la Sirve en Bandeja"], how: "asistencias", val: (h) => h.a, goal: [5, 15, 30] },
  { id: "pj", e: "🏠", names: ["Abonado", "Socio Vitalicio", "Le Pagan Expensas a la Cancha"], how: "partidos", val: (h) => h.pj, goal: [10, 25, 50] },
  { id: "doblete", e: "🍟", name: "Doblete con Fritas", how: "Meter 2 goles en un partido", val: (h) => h.maxG, goal: [2] },
  { id: "hattrick", e: "⚽", name: "Se Lleva la Pelota a Casa", how: "Meter 3 goles en un partido", val: (h) => h.maxG, goal: [3] },
  { id: "figura", e: "⭐", names: ["Se Cree Messi", "Se Cree Messi x5", "Se Cree Messi x10"], how: "veces figura", val: (h) => h.mvp, goal: [1, 5, 10] },
  { id: "agrandado", e: "😎", name: "Agrandado", how: "Ganar 3 partidos seguidos", val: (h) => h.winStreak, goal: [3] },
  { id: "mufa0", e: "🧿", name: "Mufa Cero", how: "5 partidos seguidos sin perder", val: (h) => h.unbeaten, goal: [5] },
  { id: "mates", e: "🧉", name: "Hace Todo, Hasta los Mates", how: "Gol y asistencia en el mismo partido", val: (h) => h.golAsist, goal: [1] },
  { id: "rey", e: "👑", name: "Dueño de La Cabral", how: "Ir primero en la tabla de goleadores", val: (h) => h.lider, goal: [1], live: true },
  // Vitrina de la vergüenza
  { id: "hacha", e: "🪓", name: "El Hacha", how: "Hacer 10 faltas", val: (h) => h.f, goal: [10], shame: true },
  { id: "duchas", e: "🚿", name: "A las Duchas", how: "Ver una roja", val: (h) => h.ro, goal: [1], shame: true },
  { id: "arco", e: "🙈", name: "Se Equivocó de Arco", how: "Meter un gol en contra", val: (h) => h.ec, goal: [1], shame: true },
  { id: "pecho", e: "🥶", name: "Pecho Frío", how: "Perder 3 partidos seguidos", val: (h) => h.lossStreak, goal: [3], shame: true },
  { id: "polvora", e: "💦", name: "Pólvora Mojada", how: "10 partidos seguidos sin meter gol", val: (h) => h.dry, goal: [10], shame: true },
];

const TIERS = ["bronce", "plata", "oro"];

// Historial del jugador, partido por partido, en orden.
function history(id, matches, players) {
  const h = { pj: 0, g: 0, a: 0, f: 0, ro: 0, ec: 0, mvp: 0, maxG: 0, golAsist: 0, winStreak: 0, unbeaten: 0, lossStreak: 0, dry: 0, lider: 0 };
  let w = 0, u = 0, l = 0, d = 0;
  playedMatches(matches).slice().reverse().forEach((m) => {
    const inA = m.teamA.includes(id), inB = m.teamB.includes(id);
    const goals = [...m.goalsA, ...m.goalsB];
    const g = goals.filter((x) => x.player_id === id && !x.own_goal).length;
    const a = goals.filter((x) => x.assist_id === id && !x.own_goal).length;
    h.ec += goals.filter((x) => x.player_id === id && x.own_goal).length;
    m.events.forEach((e) => { if (e.player_id === id) { h.f++; if (e.kind === "roja") h.ro++; } });
    if (!inA && !inB) return;
    h.pj++; h.g += g; h.a += a;
    if (m.mvp_id === id) h.mvp++;
    h.maxG = Math.max(h.maxG, g);
    if (g && a) h.golAsist++;
    const [sa, sb] = score(m);
    const mine = inA ? sa : sb, their = inA ? sb : sa;
    w = mine > their ? w + 1 : 0; u = mine >= their ? u + 1 : 0; l = mine < their ? l + 1 : 0; d = g ? 0 : d + 1;
    h.winStreak = Math.max(h.winStreak, w); h.unbeaten = Math.max(h.unbeaten, u);
    h.lossStreak = Math.max(h.lossStreak, l); h.dry = Math.max(h.dry, d);
  });
  const top = scorerRanking(players, matches)[0];
  if (top && top.g > 0) {
    const best = scorerRanking(players, matches).filter((s) => s.g === top.g);
    if (best.some((s) => s.id === id)) h.lider = 1;
  }
  return h;
}

// Lista de copitas del jugador: cuáles ganó, en qué nivel, y qué le falta.
export function copitasFor(id, players, matches) {
  const h = history(id, matches, players);
  return DEFS.map((c) => {
    const v = c.val(h);
    const level = c.goal.filter((x) => v >= x).length; // 0 = no la tiene
    const tiered = c.goal.length > 1;
    const name = c.names ? c.names[Math.max(0, level - 1)] : c.name;
    const next = c.goal[level];
    let how = c.how;
    if (tiered) how = next ? `${level ? "Próximo nivel" : "Llegar a"}: ${next} ${c.how} (vas ${v})` : `Nivel máximo: ${c.goal.at(-1)} ${c.how}`;
    return {
      id: c.id, e: c.e, name, how, shame: !!c.shame, won: level > 0,
      tier: tiered && level ? TIERS[level - 1] : null,
      sub: c.live ? "Mientras dure" : null,
    };
  });
}
