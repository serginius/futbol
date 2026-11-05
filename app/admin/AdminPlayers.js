"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import PlayerForm from "@/components/PlayerForm";
import Avatar from "@/components/Avatar";
import { createClient } from "@/lib/supabase/client";

export default function AdminPlayers({ players, editId }) {
  const router = useRouter();
  const [editing, setEditing] = useState(editId); // id, "nuevo" o null
  const [confirm, setConfirm] = useState(null);
  const [bulk, setBulk] = useState("");
  const [msg, setMsg] = useState("");

  async function remove(id) {
    const { error } = await createClient().from("players").delete().eq("id", id);
    setConfirm(null);
    setMsg(error ? "No se pudo borrar." : "Jugador borrado.");
    router.refresh();
  }
  async function addBulk(e) {
    e.preventDefault();
    const existing = new Set(players.map((p) => p.name.toLowerCase()));
    const rows = bulk.split("\n").map((s) => s.trim()).filter(Boolean)
      .map((line) => { const [name, email] = line.split(/[,;\t]/).map((s) => s.trim()); return { name, email: email ? email.toLowerCase() : null }; })
      .filter((r) => r.name && !existing.has(r.name.toLowerCase()));
    if (!rows.length) return;
    const { error } = await createClient().from("players").insert(rows);
    setMsg(error ? "No se pudo cargar: " + error.message : `${rows.length} jugadores agregados.`);
    if (!error) setBulk("");
    router.refresh();
  }

  const editingPlayer = players.find((p) => p.id === editing);
  return (
    <section className="sec">
      <div className="sec-head"><h2>Jugadores habilitados · {players.length}</h2><button className="btn small accent" onClick={() => setEditing("nuevo")}>+ Jugador</button></div>
      {msg && <div className="banner">{msg}</div>}
      {(editing === "nuevo" || editingPlayer) && (
        <div className="card stack">
          <div className="sec-head"><h2 className="sm">{editingPlayer ? `Editar ${editingPlayer.name}` : "Nuevo jugador"}</h2><button className="btn small" onClick={() => setEditing(null)}>Cerrar</button></div>
          <PlayerForm key={editing} player={editingPlayer} adminMode onDone={() => setEditing(null)} />
        </div>
      )}
      <div className="card list">
        {players.map((p) => (
          <div key={p.id}>
            <span className="who"><Avatar player={p} /><span>{p.nick || p.name}<br /><small className="muted">{p.email || "sin mail: no puede entrar"}</small></span></span>
            <span className="actions">
              <button className="btn small" onClick={() => setEditing(p.id)}>Editar</button>
              {confirm === p.id
                ? <button className="btn small danger" onClick={() => remove(p.id)}>Sí, borrar</button>
                : <button className="btn small danger" onClick={() => setConfirm(p.id)}>Borrar</button>}
            </span>
          </div>
        ))}
        {!players.length && <span className="muted">Todavía no cargaste jugadores.</span>}
      </div>
      <form className="card stack" onSubmit={addBulk}>
        <h2 className="sm">Cargar varios de una</h2>
        <label className="f">Uno por línea: nombre, gmail (el mail es opcional)
          <textarea rows={6} value={bulk} onChange={(e) => setBulk(e.target.value)} placeholder={"Juan Pérez, juanperez@gmail.com\nMartín Gómez"} />
        </label>
        <div><button className="btn primary">Agregar</button></div>
      </form>
    </section>
  );
}
