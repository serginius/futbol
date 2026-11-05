import Link from "next/link";
import { fmtDate, daysUntil, displayName } from "@/lib/format";
import { score } from "@/lib/data";

function scorersText(goals, byId) {
  const c = new Map();
  goals.forEach((g) => { const k = (g.player_id || "") + (g.own_goal ? "|og" : ""); c.set(k, (c.get(k) || 0) + 1); });
  return [...c.entries()].map(([k, n]) => {
    const [id, og] = k.split("|");
    return displayName(byId[id]) + (n > 1 ? ` ×${n}` : "") + (og ? " (e/c)" : "");
  }).join(", ");
}

export default function MatchCard({ m, byId, hero = false, link = true }) {
  const played = m.status === "jugado";
  const [a, b] = score(m);
  const d = daysUntil(m.date);
  const countdown = d <= 0 ? "Hoy" : d === 1 ? "Mañana" : `Faltan ${d} días`;
  const inner = (
    <>
      {hero && !played && <div className="when">{fmtDate(m.date)}{m.time ? ` · ${m.time}` : ""}</div>}
      <div className="match-meta">
        {!(hero && !played) && <span className={`pill ${played ? "done" : "next"}`}>{played ? "Final" : "Próximo"}</span>}
        <span>{fmtDate(m.date)}{m.time ? ` · ${m.time}` : ""}</span>
        {m.place && <span>· {m.place}</span>}
        {hero && !played && <span style={{ fontWeight: 600 }}>· {countdown}</span>}
      </div>
      <div className="score">
        <div className="team a">{m.team_a_name}</div>
        {played ? (
          <div className="nums"><span>{a}</span><span className="sep">–</span><span>{b}</span></div>
        ) : (
          <div className="nums vs">vs</div>
        )}
        <div className="team b">{m.team_b_name}</div>
      </div>
      {played && (a > 0 || b > 0) && (
        <div className="scorers"><div>{scorersText(m.goalsA, byId)}</div><div>{scorersText(m.goalsB, byId)}</div></div>
      )}
      {!played && <div className="muted" style={{ fontSize: 13 }}>{m.teamA.length + m.teamB.length} confirmados</div>}
    </>
  );
  const cls = `card match ${hero ? "hero-next" : ""}`;
  return link ? <Link href={`/partidos/${m.id}`} className={cls}>{inner}</Link> : <div className={cls}>{inner}</div>;
}
