import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import LivePanel from "./LivePanel";
import { createClient, getViewer } from "@/lib/supabase/server";
import { getLeague } from "@/lib/data";
import { canKeep } from "@/lib/keeper";

export const dynamic = "force-dynamic";
export const metadata = { title: "En vivo · Fútbol LSC" };

// Panel EN VIVO para el admin. Lo que se anota queda guardado en la base.
export default async function Vivo({ params }) {
  const { id } = await params;
  const supabase = await createClient();
  const [{ byId, matches }, viewer] = await Promise.all([getLeague(supabase), getViewer(supabase)]);
  if (!viewer.user) redirect("/login");
  const m = matches.find((x) => x.id === id);
  if (!m) notFound();
  if (m.status === "jugado") redirect(`/partidos/${id}`);
  if (!canKeep(m, viewer)) {
    return (
      <>
        <Link href={`/partidos/${id}`} className="muted">← Partido</Link>
        <div className="card muted">Este panel es solo para el admin. Si te toca relatar, pedile el link al admin.</div>
      </>
    );
  }
  const teamPlayers = (ids) => ids.map((pid) => byId[pid]).filter(Boolean);
  return <LivePanel match={m} teamA={teamPlayers(m.teamA)} teamB={teamPlayers(m.teamB)} byId={byId} back="/admin" />;
}
