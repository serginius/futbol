"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { todayStr } from "@/lib/format";
import { isInjured } from "./Injury";

// Marcar o sacar "lesionado". Lo usa el jugador en su perfil y el admin en cualquier carta.
export default function InjuryForm({ player, mine = false }) {
  const router = useRouter();
  const injured = isInjured(player);
  const [open, setOpen] = useState(false);
  const [until, setUntil] = useState(player.injured_until || "");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  async function save(value) {
    setBusy(true); setMsg("");
    const { error } = await createClient().from("players").update({ injured_until: value }).eq("id", player.id);
    setBusy(false);
    if (error) { setMsg("No se pudo guardar. " + error.message); return; }
    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <div className="actions">
        {injured ? (
          <>
            <button type="button" className="btn small" disabled={busy} onClick={() => save(null)}>{mine ? "💪 Ya estoy bien" : "💪 Ya está bien"}</button>
            <button type="button" className="btn small" onClick={() => setOpen(true)}>Cambiar fecha</button>
          </>
        ) : (
          <button type="button" className="btn small" onClick={() => setOpen(true)}>💅 {mine ? "Estoy lesionado" : "Marcar lesionado"}</button>
        )}
        {msg && <span className="error">{msg}</span>}
      </div>
    );
  }
  return (
    <div className="actions">
      <label className="f" style={{ flex: "0 1 200px" }}>{mine ? "No vengo hasta el" : "No viene hasta el"}
        <input type="date" min={todayStr()} value={until} onChange={(e) => setUntil(e.target.value)} />
      </label>
      <button type="button" className="btn small primary" disabled={busy || !until} onClick={() => save(until)}>Guardar</button>
      <button type="button" className="btn small" onClick={() => setOpen(false)}>Cancelar</button>
      {msg && <span className="error">{msg}</span>}
    </div>
  );
}
