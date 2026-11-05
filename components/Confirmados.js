"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Avatar from "@/components/Avatar";
import InjuryBadge from "@/components/Injury";
import { createClient } from "@/lib/supabase/client";
import { displayName } from "@/lib/format";

// Lista de CONFIRMADOS de un partido, con el botón "Me anoto" / "Me bajo".
export default function Confirmados({ matchId, players, meId, loggedIn }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const inList = !!meId && players.some((p) => p.id === meId);

  async function toggle() {
    setBusy(true); setMsg("");
    const sb = createClient().from("signups");
    const { error } = inList
      ? await sb.delete().eq("match_id", matchId).eq("player_id", meId)
      : await sb.insert({ match_id: matchId, player_id: meId });
    setBusy(false);
    if (error) { setMsg("No se pudo. " + error.message); return; }
    router.refresh();
  }

  return (
    <div className="card stack confirmados">
      <div className="sec-head">
        <h2 className="sm">✋ Confirmados · {players.length}</h2>
        {meId ? (
          <button type="button" className={`btn ${inList ? "" : "accent"}`} disabled={busy} onClick={toggle}>
            {inList ? "Me bajo 💅" : "Me anoto ✋"}
          </button>
        ) : !loggedIn ? (
          <Link className="btn small" href="/login">Entrá para anotarte</Link>
        ) : null}
      </div>
      {players.length ? (
        <ul className="conf-list">
          {players.map((p, i) => (
            <li key={p.id}>
              <span className="n">{i + 1}</span>
              <Link className="who" href={`/jugadores/${p.id}`}><Avatar player={p} /><span>{displayName(p)}</span></Link>
              <InjuryBadge player={p} short />
            </li>
          ))}
        </ul>
      ) : <span className="muted">Todavía no se anotó nadie. ¡Sé el primero!</span>}
      {msg && <span className="error">{msg}</span>}
    </div>
  );
}
