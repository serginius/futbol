import Link from "next/link";
import { redirect } from "next/navigation";
import PlayerForm from "@/components/PlayerForm";
import { createClient, getViewer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const metadata = { title: "Mi perfil · Fútbol LSC" };

export default async function Perfil() {
  const supabase = await createClient();
  const { user, player, isAdmin } = await getViewer(supabase);
  if (!user) redirect("/login");
  return (
    <>
      <div className="sec-head">
        <h2>Mi perfil</h2>
        <form action="/auth/signout" method="post"><button className="btn small">Salir</button></form>
      </div>
      <p className="muted" style={{ margin: 0 }}>Entraste como {user.email}.</p>
      {player ? (
        <>
          <div className="card"><PlayerForm player={player} /></div>
          <Link className="btn" href={`/jugadores/${player.id}`}>Ver mi carta de jugador</Link>
        </>
      ) : (
        <div className="card muted">
          {isAdmin ? "Sos admin pero no tenés ficha de jugador. Creala en Admin con tu mismo Gmail." : "Tu mail no está vinculado a ningún jugador. Pedile al organizador que te agregue."}
        </div>
      )}
    </>
  );
}
