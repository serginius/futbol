"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { uploadPhoto } from "@/lib/photo";
import { initials } from "@/lib/format";

// Formulario de perfil. Lo usa el jugador (sin campo email) y el admin (con email).
export default function PlayerForm({ player, adminMode = false, onDone }) {
  const router = useRouter();
  const p = player || {};
  const [f, setF] = useState({ name: p.name || "", nick: p.nick || "", position: p.position || "", number: p.number || "", foot: p.foot || "", email: p.email || "" });
  const [photo, setPhoto] = useState(p.photo_url || "");
  const [file, setFile] = useState(null);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  async function save(e) {
    e.preventDefault();
    if (!f.name.trim()) return;
    setBusy(true); setMsg("");
    const supabase = createClient();
    try {
      const data = { name: f.name.trim(), nick: f.nick.trim() || null, position: f.position || null, number: f.number.trim() || null, foot: f.foot || null };
      if (adminMode) data.email = f.email.trim().toLowerCase() || null;
      let id = p.id;
      if (id) {
        const { error } = await supabase.from("players").update(data).eq("id", id);
        if (error) throw error;
      } else {
        const { data: row, error } = await supabase.from("players").insert(data).select("id").single();
        if (error) throw error;
        id = row.id;
      }
      if (file) {
        const url = await uploadPhoto(supabase, id, file);
        const { error } = await supabase.from("players").update({ photo_url: url }).eq("id", id);
        if (error) throw error;
      }
      setMsg("Guardado");
      router.refresh();
      onDone && onDone();
    } catch (err) {
      setMsg(err?.code === "23505" ? "Ese mail ya lo tiene otro jugador." : "No se pudo guardar. " + (err?.message || ""));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="stack" onSubmit={save}>
      <div className="profile-top">
        {photo ? <img className="big" src={photo} alt="" /> : <div className="big">{initials(f.name || "?")}</div>}
        <label className="f">Foto
          <input type="file" accept="image/*" onChange={(e) => { const x = e.target.files?.[0]; if (x) { setFile(x); setPhoto(URL.createObjectURL(x)); } }} />
        </label>
      </div>
      <div className="row">
        <label className="f">Nombre y apellido<input required value={f.name} onChange={set("name")} /></label>
        <label className="f">Apodo<input value={f.nick} onChange={set("nick")} /></label>
      </div>
      <div className="row">
        <label className="f">Puesto<select value={f.position} onChange={set("position")}>{["", "Arquero", "Defensor", "Mediocampista", "Delantero"].map((o) => <option key={o} value={o}>{o || "—"}</option>)}</select></label>
        <label className="f">Número<input inputMode="numeric" maxLength={2} value={f.number} onChange={set("number")} /></label>
        <label className="f">Pie hábil<select value={f.foot} onChange={set("foot")}>{["", "derecho", "izquierdo", "ambos"].map((o) => <option key={o} value={o}>{o || "—"}</option>)}</select></label>
      </div>
      {adminMode && (
        <label className="f">Gmail para entrar (lo habilita a loguearse y editar su perfil)
          <input type="email" value={f.email} onChange={set("email")} placeholder="jugador@gmail.com" />
        </label>
      )}
      <div className="actions">
        <button className="btn primary" disabled={busy}>{busy ? "Guardando…" : "Guardar"}</button>
        {msg && <span className={msg === "Guardado" ? "muted" : "error"}>{msg}</span>}
      </div>
    </form>
  );
}
