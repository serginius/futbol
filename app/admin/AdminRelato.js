"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import LiveLink from "@/components/LiveLink";
import { createClient } from "@/lib/supabase/client";
import { fmtDate } from "@/lib/format";

// Relato en vivo: el admin genera un link para que otro cargue el partido sin loguearse,
// prueba la planilla sin guardar nada, o borra lo cargado.
export default function AdminRelato({ matches, links }) {
  const router = useRouter();
  const [origin, setOrigin] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState({});
  useEffect(() => setOrigin(window.location.origin), []);
  const say = (id, t) => setMsg((x) => ({ ...x, [id]: t }));

  async function rpc(id, name, ok) {
    setBusy(true);
    const { error } = await createClient().rpc(name, { mid: id });
    setBusy(false);
    say(id, error ? "No se pudo: " + error.message : ok);
    router.refresh();
  }
  async function cut(id) {
    if (!confirm("¿Cortar el link? El que lo tenga ya no va a poder cargar nada.")) return;
    setBusy(true);
    const { error } = await createClient().from("keeper_links").delete().eq("match_id", id);
    setBusy(false);
    say(id, error ? "No se pudo cortar." : "✂️ Link cortado.");
    router.refresh();
  }
  async function reset(m) {
    if (!confirm(`¿Borrar todo lo cargado en ${m.team_a_name} vs ${m.team_b_name}? Goles, faltas, tarjetas y figura vuelven a cero.`)) return;
    rpc(m.id, "reset_match", "🧹 Listo, quedó en cero.");
  }
  async function copy(id, url) {
    try { await navigator.clipboard.writeText(url); say(id, "📋 Copiado. Pegalo en WhatsApp."); }
    catch { say(id, "Mantené apretado el link para copiarlo."); }
  }

  if (!matches.length) return null;
  return (
    <section className="sec">
      <h2>🎙️ Relato en vivo</h2>
      {matches.map((m) => {
        const tok = links[m.id];
        const url = tok ? `${origin}/relator/${tok}` : "";
        const loaded = m.live || m.goalsA.length || m.goalsB.length || m.events.length;
        const wa = `https://wa.me/?text=${encodeURIComponent(`🎙️ Te toca relatar ${m.team_a_name} vs ${m.team_b_name}. Entrá acá y cargá goles, asistencias y faltas: ${url}`)}`;
        return (
          <div key={m.id} className="card stack relato">
            <div className="relato-head">
              <b>{fmtDate(m.date)}{m.time ? ` · ${m.time}` : ""}</b>
              <span className="muted">{m.team_a_name} vs {m.team_b_name}</span>
              {m.live && <span className="pill live">En vivo</span>}
            </div>
            {tok ? (
              <div className="stack" style={{ gap: 8 }}>
                <span className="muted" style={{ fontSize: 13 }}>Mandale este link al que va a relatar. No necesita Gmail ni cuenta.</span>
                <input readOnly value={url} onFocus={(e) => e.target.select()} className="relato-url" />
                <div className="actions">
                  <button type="button" className="btn small primary" onClick={() => copy(m.id, url)}>📋 Copiar</button>
                  <a className="btn small wa" href={wa} target="_blank" rel="noreferrer">💬 Mandar por WhatsApp</a>
                  <button type="button" className="btn small danger" disabled={busy} onClick={() => cut(m.id)}>✂️ Cortar link</button>
                </div>
              </div>
            ) : (
              <button type="button" className="btn accent" style={{ justifyContent: "center" }} disabled={busy} onClick={() => rpc(m.id, "make_relator_link", "🔗 Link listo.")}>
                🔗 Generar link de relator
              </button>
            )}
            <div className="actions">
              <LiveLink className="btn small" href={`/partidos/${m.id}/vivo`}>🎤 Relatar yo</LiveLink>
              <Link className="btn small" href={`/partidos/${m.id}/vivo?prueba=1`}>🧪 Probar la planilla</Link>
              {loaded ? <button type="button" className="btn small danger" disabled={busy} onClick={() => reset(m)}>🧹 Volver a cero</button> : null}
            </div>
            {msg[m.id] && <span className="muted" style={{ fontSize: 13 }}>{msg[m.id]}</span>}
          </div>
        );
      })}
    </section>
  );
}
