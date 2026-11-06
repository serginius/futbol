// Equipos para practicar: los del partido, o si todavía no están armados,
// los confirmados (o todos) repartidos en dos.
export function practiceTeams(m, players) {
  if (m.teamA.length || m.teamB.length) return [m.teamA, m.teamB];
  const ids = (m.signups.length >= 2 ? m.signups : players.map((p) => p.id)).slice(0, 14);
  return [ids.filter((_, i) => i % 2 === 0), ids.filter((_, i) => i % 2 === 1)];
}
