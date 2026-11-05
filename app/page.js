import Link from "next/link";
import MatchCard from "@/components/MatchCard";
import ScorersTable from "@/components/ScorersTable";
import { createClient, getViewer } from "@/lib/supabase/server";
import { getLeague, playedMatches, upcomingMatches, computeStats, score } from "@/lib/data";
import { fmtDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function Home() {
  const supabase = await createClient();
  const [{ players, byId, matches }, viewer] = await Promise.all([getLeague(supabase), getViewer(supabase)]);
  const next = upcomingMatches(matches)[0];
  const played = playedMatches(matches);
  const last = played[0];

  let mine = null;
  if (viewer.player) {
    const id = viewer.player.id;
    const s = computeStats(players, matches)[id];
    const lastMine = played.find((m) => m.teamA.includes(id) || m.teamB.includes(id));
    let txt = "Todavía no jugaste ningún partido cargado.";
    if (lastMine) {
      const inA = lastMine.teamA.includes(id);
      const [a, b] = score(lastMine);
      const my = inA ? a : b, their = inA ? b : a;
      const g = [...lastMine.goalsA, ...lastMine.goalsB].filter((x) => x.player_id === id && !x.own_goal).length;
      txt = `${fmtDate(lastMine.date)}: ${my > their ? "ganaste" : my < their ? "perdiste" : "empataste"} ${my}–${their}${g ? ` y metiste ${g} gol${g > 1 ? "es" : ""}` : ""}${lastMine.mvp_id === id ? ". Fuiste la figura" : ""}.`;
    }
    mine = { s, txt };
  }

  return (
    <>
      {viewer.user && !viewer.player && !viewer.isAdmin && (
        <div className="banner">Tu mail no está vinculado a ningún jugador. Pedile al organizador que te agregue.</div>
      )}
      {mine && (
        <section className="sec">
          <div className="sec-head"><h2>Tu espacio</h2><Link className="btn small" href="/perfil">Editar perfil</Link></div>
          <div className="card stack">
            <p style={{ margin: 0 }}>{mine.txt}</p>
            <div className="stats">
              <div className="stat"><b>{mine.s.g}</b><span>Goles</span></div>
              <div className="stat"><b>{mine.s.pj}</b><span>Partidos</span></div>
              <div className="stat"><b>{mine.s.pg}-{mine.s.pe}-{mine.s.pp}</b><span>G-E-P</span></div>
              <div className="stat"><b>{mine.s.mvp}</b><span>MVP</span></div>
            </div>
          </div>
        </section>
      )}
      <section className="sec">
        <div className="sec-head"><h2>Próximo partido</h2>{viewer.isAdmin && <Link className="btn small accent" href="/admin/partidos/nuevo">+ Partido</Link>}</div>
        {next ? <MatchCard m={next} byId={byId} hero /> : <div className="card muted">No hay partido programado.</div>}
      </section>
      <section className="sec">
        <h2>Último resultado</h2>
        {last ? <MatchCard m={last} byId={byId} /> : <div className="card muted">Todavía no se jugó ningún partido.</div>}
      </section>
      <section className="sec">
        <div className="sec-head"><h2>Tabla de goleadores</h2><Link className="btn small" href="/goleadores">Ver completa</Link></div>
        <ScorersTable players={players} matches={matches} byId={byId} limit={5} />
      </section>
    </>
  );
}
