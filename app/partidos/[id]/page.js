import Link from "next/link";
import { notFound } from "next/navigation";
import MatchCard from "@/components/MatchCard";
import Videos from "@/components/Videos";
import Photos from "@/components/Photos";
import Confirmados from "@/components/Confirmados";
import Timeline from "@/components/Timeline";
import { TeamsAndGoals, GoalByGoal } from "@/components/MatchGoals";
import AutoRefresh from "@/components/AutoRefresh";
import { createClient, getViewer } from "@/lib/supabase/server";
import { getLeague } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function Partido({ params }) {
  const { id } = await params;
  const supabase = await createClient();
  const [{ byId, matches }, viewer] = await Promise.all([getLeague(supabase), getViewer(supabase)]);
  const { isAdmin } = viewer;
  const m = matches.find((x) => x.id === id);
  if (!m) notFound();
  return (
    <>
      {m.live && <AutoRefresh seconds={15} />}
      <Link href="/partidos" className="muted">← Partidos</Link>
      <MatchCard m={m} byId={byId} link={false} />
      {m.status !== "jugado" && !m.live && (
        <Confirmados matchId={m.id} players={m.signups.map((i) => byId[i]).filter(Boolean)} meId={viewer.player?.id || null} loggedIn={!!viewer.user} />
      )}
      <Photos urls={m.photos} />
      <Videos urls={m.videos} />
      <TeamsAndGoals m={m} byId={byId} />
      <GoalByGoal m={m} byId={byId} />
      <Timeline m={m} byId={byId} />
      {m.notes && <p className="muted" style={{ margin: 0 }}>{m.notes}</p>}
      {isAdmin && <div className="actions"><Link className="btn primary" href={`/admin/partidos/${m.id}`}>{m.status === "jugado" ? "Editar resultado / fotos / videos" : "Editar partido"}</Link></div>}
    </>
  );
}
