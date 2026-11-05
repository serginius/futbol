import Link from "next/link";
import { notFound } from "next/navigation";
import MatchCard from "@/components/MatchCard";
import Avatar from "@/components/Avatar";
import Videos from "@/components/Videos";
import Confirmados from "@/components/Confirmados";
import Timeline from "@/components/Timeline";
import AutoRefresh from "@/components/AutoRefresh";
import { createClient, getViewer } from "@/lib/supabase/server";
import { getLeague } from "@/lib/data";
import { displayName } from "@/lib/format";
import { canKeep } from "@/lib/keeper";

export const dynamic = "force-dynamic";

export default async function Partido({ params }) {
  const { id } = await params;
  const supabase = await createClient();
  const [{ byId, matches }, viewer] = await Promise.all([getLeague(supabase), getViewer(supabase)]);
  const { isAdmin } = viewer;
  const m = matches.find((x) => x.id === id);
  if (!m) notFound();
  const list = (ids) => ids.length ? ids.map((pid) => (
    <li key={pid}><Link className="who" href={`/jugadores/${pid}`}><Avatar player={byId[pid]} /><span>{displayName(byId[pid])}</span>{m.mvp_id === pid && <span className="pill">Figura</span>}</Link></li>
  )) : <li className="muted">Sin jugadores cargados</li>;
  return (
    <>
      {m.live && <AutoRefresh seconds={15} />}
      <Link href="/partidos" className="muted">← Partidos</Link>
      <MatchCard m={m} byId={byId} link={false} />
      {canKeep(m, viewer) && (
        <Link className="btn accent" style={{ justifyContent: "center", fontSize: 17, padding: "12px 16px" }} href={`/partidos/${m.id}/vivo`}>
          {m.live ? "🎙️ Seguí relatando" : "🔴 Arranca la transmisión"}
        </Link>
      )}
      {canKeep(m, viewer) && !m.live && <img className="aguanta" src="/aguanta.png" alt="AGUANTAAAAA" />}
      {m.status !== "jugado" && !m.live && (
        <Confirmados matchId={m.id} players={m.signups.map((i) => byId[i]).filter(Boolean)} meId={viewer.player?.id || null} loggedIn={!!viewer.user} />
      )}
      <Videos urls={m.videos} />
      <Timeline m={m} byId={byId} />
      <div className="card lineup">
        <div className="stack"><h2 className="sm">{m.team_a_name}</h2><ul>{list(m.teamA)}</ul></div>
        <div className="stack"><h2 className="sm">{m.team_b_name}</h2><ul>{list(m.teamB)}</ul></div>
      </div>
      {m.notes && <p className="muted" style={{ margin: 0 }}>{m.notes}</p>}
      {isAdmin && <div className="actions"><Link className="btn primary" href={`/admin/partidos/${m.id}`}>{m.status === "jugado" ? "Editar resultado / videos" : "Editar partido"}</Link></div>}
    </>
  );
}
