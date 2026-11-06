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
];

function minuteNow(startedAt) {
  if (!startedAt) return null;
  return Math.max(1, Math.floor((Date.now() - new Date(startedAt).getTime()) / 60000) + 1);
}

// tok: el código del link de relator (o null si es el admin).
// practice: modo práctica, no guarda nada y nadie lo ve.
export default function LivePanel({ match: real, teamA, teamB, byId, tok = null, practice = false, back }) {
  const router = useRouter();
  const [action, setAction] = useState("gol");
  const [ownGoal, setOwnGoal] = useState(false);
  const [scorer, setScorer] = useState(null); // { player, team } esperando asistencia
  const [fouler, setFouler] = useState(null); // jugador que hizo la falta, esperando si hubo tarjeta
  const [finishing, setFinishing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState("");
  const [, tick] = useState(0);
  const [local, setLocal] = useState({ started_at: null, goals: [], events: [] });

  // Reloj y datos al día (por si anota otro desde otro celu).
  useEffect(() => {
    const t = setInterval(() => tick((x) => x + 1), 15000);
    const r = setInterval(() => { if (!document.hidden && !practice) router.refresh(); }, 20000);
    return () => { clearInterval(t); clearInterval(r); };
  }, [router, practice]);
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(""), 2500); return () => clearTimeout(t); }, [toast]);

  const supabase = createClient();
  const m = practice ? {
    ...real, started_at: local.started_at, events: local.events,
    goalsA: local.goals.filter((g) => g.team === "A"), goalsB: local.goals.filter((g) => g.team === "B"),
  } : real;
  const backHref = back || `/partidos/${m.id}`;
  const minute = minuteNow(m.started_at);
  const a = m.goalsA.length, b = m.goalsB.length;
  const log = matchLog(m).reverse();
  const teamOf = (p) => (teamA.some((x) => x.id === p.id) ? "A" : "B");
  const tname = (t) => (t === "A" ? m.team_a_name : m.team_b_name);

  async function run(fn, ok) {
    if (practice) { fn(); if (ok) setToast(ok); return true; }
    setBusy(true);
    const { error } = await fn();
    setBusy(false);
    if (error) { setToast("No se pudo guardar: " + error.message); return false; }
    if (ok) setToast(ok);
    router.refresh();
    return true;
  }

  async function start() {
    await run(() => practice
      ? setLocal((x) => ({ ...x, started_at: new Date().toISOString() }))
      : supabase.rpc("relator_start", { mid: m.id, tok }), "🎙️ ¡Arrancó la transmisión!");
  }

  async function saveGoal(player, assist) {
    const team = teamOf(player);
    const scoringTeam = ownGoal ? (team === "A" ? "B" : "A") : team;
    const g = { team: scoringTeam, player_id: player.id, own_goal: ownGoal, assist_id: assist?.id || null, minute };
    const ok = await run(() => practice
      ? setLocal((x) => ({ ...x, goals: [...x.goals, { ...g, id: "p" + Date.now(), created_at: new Date().toISOString() }] }))
      : supabase.rpc("relator_goal", { mid: m.id, tok, t: g.team, pid: g.player_id, own: g.own_goal, ast: g.assist_id, mins: minute }), `⚽ Gol de ${displayName(player)}${ownGoal ? " (en contra)" : ""}`);
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
    setFouler(player);
  }

  // Falta: sin tarjeta, amarilla o roja (una tarjeta cuenta también como falta).
  async function saveFoul(player, kind) {
    const label = { falta: "🟦 Falta de", amarilla: "🟨 Amarilla a", roja: "🟥 Roja a" }[kind];
    const ev = { team: teamOf(player), player_id: player.id, kind, minute };
    const ok = await run(() => practice
      ? setLocal((x) => ({ ...x, events: [...x.events, { ...ev, id: "p" + Date.now(), created_at: new Date().toISOString() }] }))
      : supabase.rpc("relator_event", { mid: m.id, tok, t: ev.team, pid: ev.player_id, k: ev.kind, mins: minute }), `${label} ${displayName(player)}`);
    if (ok) setFouler(null);
  }

  async function undo(x) {
    if (!confirm(`¿Borrar "${logText(x, byId)}"?`)) return;
    const key = x.type === "gol" ? "goals" : "events";
    await run(() => practice
      ? setLocal((l) => ({ ...l, [key]: l[key].filter((y) => y.id !== x.id) }))
      : supabase.rpc("relator_undo", { mid: m.id, tok, is_goal: x.type === "gol", rid: x.id }), "Borrado");
  }

  async function finish(mvp) {
    if (practice) {
      setLocal({ started_at: null, goals: [], events: [] }); setFinishing(false);
      setToast("🧪 Fin de la práctica. No se guardó nada."); return;
    }
    const ok = await run(() => supabase.rpc("relator_finish", { mid: m.id, tok, mvp: mvp?.id || null }));
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
        <Link href={backHref} className="muted">← Volver</Link>
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
  } else if (fouler) {
    body = (
      <div className="card stack">
        <div className="faces-head">
          <h2>🟦 Falta de {displayName(fouler)}. ¿Hubo tarjeta?</h2>
          <button type="button" className="btn small" onClick={() => setFouler(null)}>Cancelar</button>
        </div>
        <div className="cards-pick">
          <button type="button" disabled={busy} onClick={() => saveFoul(fouler, "falta")}><b>🙅</b>Sin tarjeta</button>
          <button type="button" className="am" disabled={busy} onClick={() => saveFoul(fouler, "amarilla")}><b>🟨</b>Amarilla</button>
          <button type="button" className="ro" disabled={busy} onClick={() => saveFoul(fouler, "roja")}><b>🟥</b>Roja</button>
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
    const title = action === "gol" ? (ownGoal ? "¿Quién la metió en contra?" : "¿Quién hizo el gol?") : "¿Falta a quién?";
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
      <Link href={backHref} className="muted">← Volver</Link>
      {practice && <div className="practice-note">🧪 <b>Modo práctica.</b> Tocá lo que quieras: no se guarda nada y nadie lo ve.</div>}
      <div className="live-board">
        <div className="team">{m.team_a_name}</div>
        <div className="nums"><span>{a}</span><span className="sep">–</span><span>{b}</span></div>
        <div className="team">{m.team_b_name}</div>
        <div className="clock">{minute ? `🔴 EN VIVO · ${minute}'` : "📻 Modo relator: ON"}</div>
      </div>
      {!m.started_at ? (
        <>
        <button type="button" className="btn accent" style={{ justifyContent: "center", fontSize: 20, padding: 16 }} disabled={busy} onClick={start}>🎤 Agarrá el micrófono, que esto es fútbol</button>
        </>
      ) : (
        <>
          {!finishing && !scorer && !fouler && (
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
