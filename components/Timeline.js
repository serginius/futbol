import { displayName } from "@/lib/format";

const ICON = { falta: "🟦", amarilla: "🟨", roja: "🟥" };
const LABEL = { falta: "falta", amarilla: "amarilla", roja: "roja" };

// Todo lo que pasó en el partido, en orden: goles (con asistencia), faltas y tarjetas.
export function matchLog(m) {
  return [
    ...[...m.goalsA, ...m.goalsB].map((g) => ({ ...g, type: "gol" })),
    ...m.events.map((e) => ({ ...e, type: e.kind })),
  ].sort((a, b) => (a.minute != null && b.minute != null && a.minute !== b.minute ? a.minute - b.minute : a.created_at.localeCompare(b.created_at)));
}

export function logText(x, byId) {
  if (x.type === "gol") {
    return `⚽ ${displayName(byId[x.player_id])}${x.own_goal ? " (en contra)" : ""}${x.assist_id ? ` · asist. ${displayName(byId[x.assist_id])}` : ""}`;
  }
  return `${ICON[x.type]} ${LABEL[x.type] === "falta" ? "Falta de" : LABEL[x.type] === "amarilla" ? "Amarilla a" : "Roja a"} ${displayName(byId[x.player_id])}`;
}

export default function Timeline({ m, byId }) {
  const log = matchLog(m);
  const hasDetail = log.some((x) => x.minute != null || x.assist_id || x.type !== "gol");
  if (!log.length || !hasDetail) return null;
  return (
    <section className="sec">
      <h2>Minuto a minuto</h2>
      <div className="card">
        <ul className="timeline">
          {log.map((x) => (
            <li key={x.type + x.id} className={x.team === "B" ? "b" : ""}>
              <span className="min">{x.minute != null ? `${x.minute}'` : ""}</span>
              <span>{logText(x, byId)}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
