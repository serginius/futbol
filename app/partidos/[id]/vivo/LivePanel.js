"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Avatar from "@/components/Avatar";
import { createClient } from "@/lib/supabase/client";
import { displayName } from "@/lib/format";
import { matchLog, logText } from "@/components/Timeline";

const ACTIONS = [
  ["gol", "⚽", "Gol"],
  ["falta", "🟦", "Falta"],
  ["amarilla", "🟨", "Amarilla"],
  ["roja", "🟥", "Roja"],
];

function minuteNow(startedAt) {
  if (!startedAt) return null;
  return Math.max(1, Math.floor((Date.now() - new Date(startedAt).getTime()) / 60000) + 1);
}

export default function LivePanel({ match: m, teamA, teamB, byId }) {
  const router = useRouter();
  const [action, setAction] = useState("gol");
  const [ownGoal, setOwnGoal] = useState(false);
  const [scorer, setScorer] = useState(null); // { player, team } esperando asistencia
  const [finishing, setFinishing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState("");
  const [, tick] = useState(0);

  // Reloj y datos al día (por si anota otro desde otro celu).
  useEffect(() => {
    const t = setInterval(() => tick((x) => x + 1), 15000);
    const r = setInterval(() => { if (!document.hidden) router.refresh(); }, 20000);
    return () => { clearInterval(t); clearInterval(r); };
  }, [router]);
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(""), 2500); return () => clearTimeout(t); }, [toast]);

  const supabase = createClient();
  const minute = minuteNow(m.started_at);
  const a = m.goalsA.length, b = m.goalsB.length;
  const log = matchLog(m).reverse();
  const teamOf = (p) => (teamA.some((x) => x.id === p.id) ? "A" : "B");
  const tname = (t) => (t === "A" ? m.team_a_name : m.team_b_name);

  async function run(fn, ok) {
    setBusy(true);
    const { error } = await fn();
    setBusy(false);
    if (error) { setToast("No se pudo guardar: " + error.message); return false; }
    if (ok) setToast(ok);
    router.refresh();
    return true;
  }

  async function start() {
    await run(() => supabase.rpc("live_start", { mid: m.id }), "¡Arrancó el partido!");
  }

  async function saveGoal(player, assist) {
    const team = teamOf(player);
    const scoringTeam = ownGoal ? (team === "A" ? "B" : "A") : team;
    const ok = await run(() => supabase.from("goals").insert({
      match_id: m.id, team: scoringTeam, player_id: player.id, own_goal: ownGoal, assist_id: assist?.id || null, minute,
    }), `⚽ Gol de ${displayName(player)}${ownGoal ? " (en contra)" : ""}`);
    if (ok) { setScorer(null); setOwnGoal(false); }
  }

  function tapPlayer(player) {
    if (busy) return;
    if (action === "gol") {
      if (ownGoal) return saveGoal(player, null);
      const mates = (teamOf(player) === "A" ? teamA : teamB).filter((x) => x.id !== player.id);
      if (!mates.length) return saveGoal(player, null);
      setScorer(player);
      return;
    }
    const label = { falta: "🟦 Falta de", amarilla: "🟨 Amarilla a", roja: "🟥 Roja a" }[action];
    run(() => supabase.from("events").insert({ match_id: m.id, team: teamOf(player), player_id: player.id, kind: action, minute }), `${label} ${displayName(player)}`);
  }

  async function undo(x) {
    if (!confirm(`¿Borrar "${logText(x, byId)}"?`)) return;
    await run(() => supabase.from(x.type === "gol" ? "goals" : "events").delete().eq("id", x.id), "Borrado");
  }

  async function finish(mvp) {
    const ok = await run(() => supabase.rpc("live_finish", { mid: m.id, mvp: mvp?.id || null }));
    if (ok) router.push(`/partidos/${m.id}`);
  }

  const faces = (players, onTap) => (
    <div className="faces">
      {players.map((p) => (
        <button key={p.id} type="button" className="face" disabled={busy} onClick={() => onTap(p)}>
          <Avatar player={p} /><span>{displayName(p)}</span>
        </button>
      ))}
    </div>
  );

  if (!teamA.length && !teamB.length) {
    return (
      <div className="live-panel">
        <Link href={`/partidos/${m.id}`} className="muted">← Partido</Link>
        <div className="card">Todavía no están armados los equipos. El admin tiene que cargar quién juega en cada equipo (Admin → partido → "¿Quién juega?").</div>
      </div>
    );
  }

  let body;
  if (finishing) {
    body = (
      <div className="card stack">
        <h2>⭐ ¿Quién fue la figura?</h2>
        <div className="faces-cols">
          <div className="stack" style={{ gap: 6 }}><h2 className="sm">{m.team_a_name}</h2>{faces(teamA, finish)}</div>
          <div className="stack" style={{ gap: 6 }}><h2 className="sm">{m.team_b_name}</h2>{faces(teamB, finish)}</div>
        </div>
        <div className="actions">
          <button type="button" className="btn primary" disabled={busy} onClick={() => finish(null)}>Terminar sin figura</button>
          <button type="button" className="btn" onClick={() => setFinishing(false)}>Volver, sigue el partido</button>
        </div>
      </div>
    );
  } else if (scorer) {
    const mates = (teamOf(scorer) === "A" ? teamA : teamB).filter((x) => x.id !== scorer.id);
    body = (
      <div className="card stack">
        <div className="faces-head">
          <h2>⚽ Gol de {displayName(scorer)}. ¿Quién la dio?</h2>
          <button type="button" className="btn small" onClick={() => setScorer(null)}>Cancelar</button>
        </div>
        <div className="faces">
          <button type="button" className="face none" disabled={busy} onClick={() => saveGoal(scorer, null)}>Sin asistencia</button>
          {mates.map((p) => (
            <button key={p.id} type="button" className="face" disabled={busy} onClick={() => saveGoal(scorer, p)}>
              <Avatar player={p} /><span>{displayName(p)}</span>
            </button>
          ))}
        </div>
      </div>
    );
  } else {
    const title = action === "gol" ? (ownGoal ? "¿Quién la metió en contra?" : "¿Quién hizo el gol?") : `¿A quién le cobraron ${action === "falta" ? "la falta" : "la " + action}?`;
    body = (
      <div className="card stack">
        <div className="faces-head">
          <h2>{title}</h2>
          {action === "gol" && (
            <label className="f check" style={{ fontSize: 13 }}><input type="checkbox" checked={ownGoal} onChange={(e) => setOwnGoal(e.target.checked)} /> Fue en contra</label>
          )}
        </div>
        <div className="faces-cols">
          <div className="stack" style={{ gap: 6 }}><h2 className="sm">{m.team_a_name}</h2>{faces(teamA, tapPlayer)}</div>
          <div className="stack" style={{ gap: 6 }}><h2 className="sm">{m.team_b_name}</h2>{faces(teamB, tapPlayer)}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="live-panel">
      <Link href={`/partidos/${m.id}`} className="muted">← Ver el partido</Link>
      <div className="live-board">
        <div className="team">{m.team_a_name}</div>
        <div className="nums"><span>{a}</span><span className="sep">–</span><span>{b}</span></div>
        <div className="team">{m.team_b_name}</div>
        <div className="clock">{minute ? `🔴 EN VIVO · ${minute}'` : "Sin arrancar"}</div>
      </div>
      {!m.started_at ? (
        <>
        <img className="aguanta" src="/aguanta.png" alt="AGUANTAAAAA" />
        <button type="button" className="btn accent" style={{ justifyContent: "center", fontSize: 20, padding: 16 }} disabled={busy} onClick={start}>▶ Arrancar partido</button>
        </>
      ) : (
        <>
          {!finishing && !scorer && (
            <div className="actions-big">
              {ACTIONS.map(([k, e, l]) => (
                <button key={k} type="button" className={action === k ? "on" : ""} onClick={() => { setAction(k); setOwnGoal(false); }}><b>{e}</b>{l}</button>
              ))}
            </div>
          )}
          {body}
          {log.length > 0 && (
            <div className="card">
              <h2 className="sm">Lo que pasó</h2>
              <ul className="log">
                {log.map((x) => (
                  <li key={x.type + x.id}>
                    <span className="min" style={{ fontFamily: "var(--font-display)", fontWeight: 700, color: "var(--muted)", minWidth: 30 }}>{x.minute != null ? `${x.minute}'` : ""}</span>
                    <span className="t">{logText(x, byId)} <span className="muted">· {tname(x.team)}</span></span>
                    <button type="button" className="btn small" aria-label="Borrar" disabled={busy} onClick={() => undo(x)}>✕</button>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {!finishing && <button type="button" className="btn danger" style={{ justifyContent: "center" }} onClick={() => setFinishing(true)}>🏁 Terminar partido</button>}
        </>
      )}
      {toast && <div className="toast" role="status">{toast}</div>}
    </div>
  );
}
