import Link from "next/link";
import MatchCard from "@/components/MatchCard";
import { createClient, getViewer } from "@/lib/supabase/server";
import { getLeague, playedMatches, upcomingMatches, pendingResults } from "@/lib/data";

export const dynamic = "force-dynamic";
export const metadata = { title: "Partidos · Fútbol LSC" };

export default async function Partidos() {
  const supabase = await createClient();
  const [{ byId, matches }, { isAdmin }] = await Promise.all([getLeague(supabase), getViewer(supabase)]);
  const up = upcomingMatches(matches), pl = playedMatches(matches), pend = pendingResults(matches);
  return (
    <>
      <div className="sec-head"><h2>⚽ Próximos</h2>{isAdmin && <Link className="btn small accent" href="/admin/partidos/nuevo">+ Partido</Link>}</div>
      {up.length ? up.map((m) => <MatchCard key={m.id} m={m} byId={byId} />) : <div className="card muted">No hay partidos programados.</div>}
      {isAdmin && pend.length > 0 && (<><h2>Falta cargar resultado</h2>{pend.map((m) => <MatchCard key={m.id} m={m} byId={byId} />)}</>)}
      <h2>Resultados</h2>
      {pl.length ? pl.map((m) => <MatchCard key={m.id} m={m} byId={byId} />) : <div className="card muted">Sin resultados todavía.</div>}
    </>
  );
}
