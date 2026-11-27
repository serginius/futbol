import Link from "next/link";
import Avatar from "./Avatar";
import { matchLog } from "./Timeline";
import { displayName } from "@/lib/format";

const balls = (n) => (n > 0 ? <><span className="gl-balls" aria-hidden="true">{"⚽".repeat(Math.min(n, 5))}</span><b className="gl-n">{n}</b></> : null);

// Un equipo: cada jugador en su renglón con sus goles; los goles en contra que sumó, aparte.
function TeamGoals({ m, byId, team }) {
  const name = team === "A" ? m.team_a_name : m.team_b_name;
  const goals = team === "A" ? m.goalsA : m.goalsB;
  const roster = team === "A" ? m.teamA : m.teamB;
  const own = new Map();
  const ogs = new Map();
  goals.forEach((g) => {
    if (!g.player_id) return;
    const map = g.own_goal ? ogs : own;
    map.set(g.player_id, (map.get(g.player_id) || 0) + 1);
  });
  // Los que hicieron goles y no estaban anotados también aparecen.
  const ids = [...roster, ...[...own.keys()].filter((id) => !roster.includes(id))];
  const sorted = ids.map((id, i) => ({ id, i, g: own.get(id) || 0 })).sort((a, b) => b.g - a.g || a.i - b.i);
  return (
    <div className="stack">
      <h2 className="sm">{name}{m.status === "jugado" || m.live ? ` · ${goals.length}` : ""}</h2>
      <ul className="gl">
        {!sorted.length && <li className="muted">Sin jugadores cargados</li>}
        {sorted.map(({ id, g }) => (
          <li key={id}>
            <Link className="who" href={`/jugadores/${id}`}><Avatar player={byId[id]} /><span>{displayName(byId[id])}</span>{m.mvp_id === id && <span className="pill">Figura</span>}</Link>
            {balls(g)}
          </li>
        ))}
        {[...ogs.entries()].map(([id, n]) => (
          <li key={"og" + id} className="og">
            <span className="who"><span className="av" aria-hidden="true">🙈</span><span>Gol{n > 1 ? "es" : ""} en contra<br /><small className="muted">de {displayName(byId[id])}, del {team === "A" ? m.team_b_name : m.team_a_name}</small></span></span>
            {balls(n)}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function TeamsAndGoals({ m, byId }) {
  return (
    <section className="sec">
      <h2>{m.goalsA.length + m.goalsB.length > 0 ? "Equipos y goles" : "Equipos"}</h2>
      <div className="card lineup">
        <TeamGoals m={m} byId={byId} team="A" />
        <TeamGoals m={m} byId={byId} team="B" />
      </div>
    </section>
  );
}

// Cómo fue el marcador, gol por gol: Local a la izquierda, Visitante a la derecha.
export function GoalByGoal({ m, byId }) {
  const goals = matchLog(m).filter((x) => x.type === "gol");
  if (!goals.length) return null;
  let a = 0, b = 0;
  const who = (g) => (
    <>
      {displayName(byId[g.player_id])}
      {g.own_goal && <em className="ec">en contra</em>}
      {g.assist_id && !g.own_goal && <small className="muted"> · asist. {displayName(byId[g.assist_id])}</small>}
      {g.minute != null && <small className="muted"> · {g.minute}&apos;</small>}
    </>
  );
  return (
    <section className="sec">
      <h2>Gol a gol</h2>
      <div className="card">
        <div className="gag-head"><span>{m.team_a_name}</span><span /><span>{m.team_b_name}</span></div>
        <ul className="gag">
          {goals.map((g) => {
            if (g.team === "A") a++; else b++;
            return (
              <li key={g.id}>
                <span className="ga">{g.team === "A" && <>⚽ {who(g)}</>}</span>
                <span className="gs">{a}<i>–</i>{b}</span>
                <span className="gb">{g.team === "B" && <>{who(g)} ⚽</>}</span>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
