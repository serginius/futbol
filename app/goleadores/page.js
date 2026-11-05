import ScorersTable from "@/components/ScorersTable";
import { createClient } from "@/lib/supabase/server";
import { getLeague } from "@/lib/data";

export const dynamic = "force-dynamic";
export const metadata = { title: "Goleadores · Fútbol LSC" };

export default async function Goleadores() {
  const supabase = await createClient();
  const { players, byId, matches } = await getLeague(supabase);
  return (
    <>
      <h2>Goleadores</h2>
      <ScorersTable players={players} matches={matches} byId={byId} />
    </>
  );
}
