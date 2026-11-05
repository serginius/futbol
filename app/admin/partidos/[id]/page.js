import { redirect, notFound } from "next/navigation";
import MatchForm from "./MatchForm";
import { createClient, getViewer } from "@/lib/supabase/server";
import { getLeague } from "@/lib/data";
import { nextWednesday } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function EditMatch({ params }) {
  const { id } = await params;
  const supabase = await createClient();
  const { isAdmin } = await getViewer(supabase);
  if (!isAdmin) redirect("/");
  const { players, matches } = await getLeague(supabase);
  let m;
  if (id === "nuevo") {
    const last = [...matches].sort((a, b) => b.date.localeCompare(a.date))[0];
    m = { id: null, date: nextWednesday(), time: last?.time || "20:00", place: last?.place || "", status: "programado",
      team_a_name: "Local", team_b_name: "Visitante", teamA: [], teamB: [], goalsA: [], goalsB: [], events: [], signups: [], videos: [], keeper_email: "", mvp_id: null, notes: "" };
  } else {
    m = matches.find((x) => x.id === id);
    if (!m) notFound();
  }
  return <MatchForm match={m} players={players} />;
}
