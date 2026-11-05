import Link from "next/link";
import { notFound } from "next/navigation";
import MatchCard from "@/components/MatchCard";
import { createClient, getViewer } from "@/lib/supabase/server";
import { getLeague, computeStats, playedMatches } from "@/lib/data";
import { initials } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function Jugador({ params }) {
  const { id } = await params;
  const supabase = await createClient();
  const [{ players, byId, matches }, viewer] = await Promise.all([getLeague(supabase), getViewer(supabase)]);
  const p = byId[id];
  if (!p) notFound();
  const s = computeStats(players, matches)[id];
  const mine = playedMatches(matches).filter((m) => m.teamA.includes(id) || m.teamB.includes(id));
  const isMe = viewer.player?.id === id;
  return (
    <>
      <Link href="/jugadores" className="muted">← Jugadores</Link>
      <div className="card stack">
        <div className="profile-top">
          {p.photo_url ? <img className="big" src={p.photo_url} alt="" /> : <div className="big">{initials(p.name)}</div>}
          <div className="stack" style={{ gap: 6, minWidth: 0 }}>
            <span className="pname">{p.nick || p.name}</span>
            <span className="muted">{[p.nick ? p.name : "", p.position, p.number ? `#${p.number}` : "", p.foot ? `Pie ${p.foot}` : ""].filter(Boolean).join(" · ")}</span>
            <div className="form" aria-label="Últimos 5 partidos">{s.form.slice(-5).map((r, i) => <i key={i} className={r}>{r}</i>)}</div>
          </div>
        </div>
        <div className="stats">
          <div className="stat"><b>{s.g}</b><span>Goles</span></div>
          <div className="stat"><b>{s.pj}</b><span>Partidos</span></div>
          <div className="stat"><b>{s.pg}-{s.pe}-{s.pp}</b><span>G-E-P</span></div>
          <div className="stat"><b>{s.mvp}</b><span>Figura</span></div>
        </div>
        {(isMe || viewer.isAdmin) && <div className="actions"><Link className="btn primary" href={isMe ? "/perfil" : `/admin?editar=${p.id}`}>Editar perfil</Link></div>}
      </div>
      <h2>Partidos jugados</h2>
      {mine.length ? mine.map((m) => <MatchCard key={m.id} m={m} byId={byId} />) : <div className="card muted">Todavía no jugó partidos cargados.</div>}
    </>
  );
}
