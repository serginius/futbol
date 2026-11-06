import Link from "next/link";
import { fmtDate, daysUntil, displayName } from "@/lib/format";
import { score } from "@/lib/data";
import Countdown from "./Countdown";
import NightPitch from "./NightPitch";

function scorersText(goals, byId) {
  const c = new Map();
  goals.forEach((g) => { const k = (g.player_id || "") + (g.own_goal ? "|og" : ""); c.set(k, (c.get(k) || 0) + 1); });
  return [...c.entries()].map(([k, n]) => {
    const [id, og] = k.split("|");
    return displayName(byId[id]) + (n > 1 ? ` ×${n}` : "") + (og ? " (e/c)" : "");
  }).join(", ");
}

function HeroInner({ m, byId, live, a, b }) {
  const n = Math.max(m.signups?.length || 0, m.teamA.length + m.teamB.length);
  return (
    <>
      <div className="hero-lights" aria-hidden="true"><i /><i /><i /><i /></div>
      <div className="hero-top">
        {live ? <span className="pill live">En vivo</span> : <span className="pill next">Próximo partido</span>}
        <span className="hero-when">{fmtDate(m.date)}{m.time ? ` · ${m.time}` : ""}{m.place ? ` · ${m.place}` : ""}</span>
      </div>
      <div className="hero-teams">
        <span className="ht">{m.team_a_name}</span>
        {live ? <span className="hs">{a}<i>–</i>{b}</span> : <span className="hv">VS</span>}
        <span className="ht">{m.team_b_name}</span>
      </div>
      {live && (a > 0 || b > 0) && (
        <div className="scorers"><div>{scorersText(m.goalsA, byId)}</div><div>{scorersText(m.goalsB, byId)}</div></div>
      )}
      <div className="hero-field">
        <NightPitch />
        {!live && <Countdown date={m.date} time={m.time} />}
      </div>
      <div className="hero-foot">{n} confirmado{n === 1 ? "" : "s"}</div>
    </>
  );
}

export default function MatchCard({ m, byId, hero = false, link = true }) {
  const played = m.status === "jugado";
  const live = !!m.live;
  const showScore = played || live;
  const [a, b] = score(m);
  const d = daysUntil(m.date);
  const countdown = d <= 0 ? "Hoy" : d === 1 ? "Mañana" : `Faltan ${d} días`;
  const inner = (
    <>
      {hero && !played && !live && <div className="when">{fmtDate(m.date)}{m.time ? ` · ${m.time}` : ""}</div>}
      <div className="match-meta">
        {live ? <span className="pill live">En vivo</span> : !(hero && !played) && <span className={`pill ${played ? "done" : "next"}`}>{played ? "Final" : "Próximo"}</span>}
        <span>{fmtDate(m.date)}{m.time ? ` · ${m.time}` : ""}</span>
        {m.place && <span>· {m.place}</span>}
        {m.videos?.length > 0 && <span>· 🎥 Video</span>}
      </div>
      <div className="score">
        <div className="team a">{m.team_a_name}</div>
        {showScore ? (
          <div className="nums"><span>{a}</span><span className="sep">–</span><span>{b}</span></div>
        ) : (
          <div className="nums vs">vs</div>
        )}
        <div className="team b">{m.team_b_name}</div>
      </div>
      {showScore && (a > 0 || b > 0) && (
        <div className="scorers"><div>{scorersText(m.goalsA, byId)}</div><div>{scorersText(m.goalsB, byId)}</div></div>
      )}
      {!played && !live && (hero || !link) && d >= 0 && <Countdown date={m.date} time={m.time} />}
      {!played && !live && <div className="muted" style={{ fontSize: 13 }}>{(() => { const n = Math.max(m.signups?.length || 0, m.teamA.length + m.teamB.length); return `${n} confirmado${n === 1 ? "" : "s"}`; })()}</div>}
    </>
  );
  const cls = `card match ${hero ? "hero-next" : ""}`;
  if (hero && !played) {
    const h = <HeroInner m={m} byId={byId} live={live} a={a} b={b} />;
    return link ? <Link href={`/partidos/${m.id}`} className={cls}>{h}</Link> : <div className={cls}>{h}</div>;
  }
  return link ? <Link href={`/partidos/${m.id}`} className={cls}>{inner}</Link> : <div className={cls}>{inner}</div>;
}
