import Link from "next/link";
import Avatar from "./Avatar";
import { displayName } from "@/lib/format";
import { scorerRanking } from "@/lib/data";

export default function ScorersTable({ players, matches, byId, limit = 0 }) {
  let rows = scorerRanking(players, matches);
  rows = limit ? rows.filter((r) => r.g > 0).slice(0, limit) : rows.filter((r) => r.pj > 0 || r.g > 0);
  if (!rows.length) return <div className="card muted">Todavía no hay goles cargados.</div>;
  let pos = 0, prev = null;
  return (
    <div className="card tbl-wrap">
      <table>
        <thead>
          <tr><th></th><th>Jugador</th><th className="n">Goles</th><th className="n">PJ</th>{!limit && <><th className="n">Prom.</th><th className="n">MVP</th></>}</tr>
        </thead>
        <tbody>
          {rows.map((s, i) => {
            if (s.g !== prev) { pos = i + 1; prev = s.g; }
            return (
              <tr key={s.id} className={pos === 1 && s.g > 0 ? "lead" : ""}>
                <td className="pos">{pos}</td>
                <td><Link className="who" href={`/jugadores/${s.id}`}><Avatar player={byId[s.id]} /><span>{displayName(byId[s.id])}</span></Link></td>
                <td className="n goals">{s.g}</td>
                <td className="n">{s.pj}</td>
                {!limit && <><td className="n">{s.pj ? (s.g / s.pj).toFixed(2) : "–"}</td><td className="n">{s.mvp || "–"}</td></>}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
