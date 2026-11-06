import LivePanel from "@/app/partidos/[id]/vivo/LivePanel";
import { createClient } from "@/lib/supabase/server";
import { getLeague } from "@/lib/data";

export const dynamic = "force-dynamic";
export const metadata = { title: "Relator · Fútbol LSC", robots: { index: false } };

// Link de relator: el que lo tiene carga el partido sin loguearse.
export default async function Relator({ params }) {
  const { tok } = await params;
  const supabase = await createClient();
  const [{ data: id }, { byId, matches }] = await Promise.all([
    supabase.rpc("relator_match", { tok }),
    getLeague(supabase),
  ]);
  const m = id && matches.find((x) => x.id === id);
  if (!m) {
    return (
      <div className="card stack" style={{ textAlign: "center" }}>
        <h2>📵 Este link ya no funciona</h2>
        <p className="muted" style={{ margin: 0 }}>El partido ya terminó o el admin cortó el link. Pedile uno nuevo.</p>
      </div>
    );
  }
  const teamPlayers = (ids) => ids.map((pid) => byId[pid]).filter(Boolean);
  return (
    <>
      <div className="relator-hi">🎙️ Sos el relator de <b>{m.team_a_name} vs {m.team_b_name}</b>. Tocá la acción y después la foto del jugador.</div>
      <LivePanel match={m} teamA={teamPlayers(m.teamA)} teamB={teamPlayers(m.teamB)} byId={byId} tok={tok} back="/" />
    </>
  );
}
