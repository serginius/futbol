import Link from "next/link";
import { redirect } from "next/navigation";
import PlayerForm from "@/components/PlayerForm";
import PlayerStats from "@/components/PlayerStats";
import Copitas from "@/components/Copitas";
import { createClient, getViewer } from "@/lib/supabase/server";
import { getLeague, computeStats, upcomingMatches } from "@/lib/data";
import { initials } from "@/lib/format";
import { canKeep } from "@/lib/keeper";

export const dynamic = "force-dynamic";
export const metadata = { title: "Mi perfil · Fútbol LSC" };

export default async function Perfil() {
  const supabase = await createClient();
  const viewer = await getViewer(supabase);
  const { user, player, isAdmin } = viewer;
  if (!user) redirect("/login");
  const { players, matches } = await getLeague(supabase);
  const keep = upcomingMatches(matches).find((m) => canKeep(m, viewer) && (!isAdmin || m.keeper_email));
  const s = player ? computeStats(players, matches)[player.id] : null;
  return (
    <>
      <div className="sec-head">
        <h2>Mi perfil</h2>
        <form action="/auth/signout" method="post"><button className="btn small">Salir</button></form>
      </div>
      {keep && (
        <Link className="btn accent" style={{ justifyContent: "center", fontSize: 17, padding: "12px 16px" }} href={`/partidos/${keep.id}/vivo`}>
          🔴 Sos el planillero del próximo partido: abrir panel EN VIVO
        </Link>
      )}
      {player ? (
        <>
          <div className="card stack">
            <div className="profile-top">
              {player.photo_url ? <img className="big" src={player.photo_url} alt="" /> : <div className="big">{initials(player.name)}</div>}
              <div className="stack" style={{ gap: 6, minWidth: 0 }}>
                <span className="pname">{player.nick || player.name}</span>
                <span className="muted">{[player.nick ? player.name : "", player.position, player.number ? `#${player.number}` : "", player.foot ? `Pie ${player.foot}` : ""].filter(Boolean).join(" · ")}</span>
                <div className="form" aria-label="Últimos 5 partidos">{s.form.slice(-5).map((r, i) => <i key={i} className={r}>{r}</i>)}</div>
              </div>
            </div>
            <PlayerStats s={s} />
          </div>
          <Copitas id={player.id} players={players} matches={matches} mine />
          <details className="card edit">
            <summary>✏️ Editar mis datos y foto</summary>
            <PlayerForm player={player} />
          </details>
          <p className="muted" style={{ margin: 0, fontSize: 13 }}>Entraste como {user.email}. <Link href={`/jugadores/${player.id}`}>Ver mi carta como la ven los demás</Link></p>
        </>
      ) : (
        <div className="card muted">
          <p style={{ marginTop: 0 }}>Entraste como {user.email}.</p>
          {isAdmin ? "Sos admin pero no tenés ficha de jugador. Creala en Admin con tu mismo Gmail." : keep ? "Estás habilitado como planillero." : "Tu mail no está vinculado a ningún jugador. Pedile al organizador que te agregue."}
        </div>
      )}
    </>
  );
}
