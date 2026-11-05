"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Avatar from "@/components/Avatar";
import InjuryBadge from "@/components/Injury";
import { createClient } from "@/lib/supabase/client";
import { displayName } from "@/lib/format";

export default function MatchForm({ match, players }) {
  const router = useRouter();
  const byId = Object.fromEntries(players.map((p) => [p.id, p]));
  const [f, setF] = useState({ date: match.date, time: match.time || "", place: match.place || "", a: match.team_a_name, b: match.team_b_name, notes: match.notes || "",
    videos: (match.videos || []).join("\n"), keeper: match.keeper_email || "" });
  const [played, setPlayed] = useState(match.status === "jugado");
  const [side, setSide] = useState(() => {
    const s = {}; match.teamA.forEach((i) => (s[i] = "A")); match.teamB.forEach((i) => (s[i] = "B")); return s;
  });
  const [goals, setGoals] = useState({
    A: match.goalsA.map((g) => ({ p: g.player_id, og: g.own_goal, as: g.assist_id || "", min: g.minute ?? null, at: g.created_at })),
    B: match.goalsB.map((g) => ({ p: g.player_id, og: g.own_goal, as: g.assist_id || "", min: g.minute ?? null, at: g.created_at })),
  });
  const [pick, setPick] = useState({ A: "", B: "" });
  const [mvp, setMvp] = useState(match.mvp_id || "");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [confirmDel, setConfirmDel] = useState(false);

  const A = Object.keys(side).filter((k) => side[k] === "A");
  const B = Object.keys(side).filter((k) => side[k] === "B");
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const sorted = [...players].sort((x, y) => displayName(x).localeCompare(displayName(y)));

  function setSideOf(id, s) { const n = { ...side }; if (s) n[id] = s; else delete n[id]; setSide(n); }
  function addGoal(team) {
    const v = pick[team]; if (!v) return;
    const og = v.startsWith("og:");
    setGoals({ ...goals, [team]: [...goals[team], { p: og ? v.slice(3) : v, og, as: "", min: null }] });
  }
  function setAssist(team, ix, as) { setGoals({ ...goals, [team]: goals[team].map((g, i) => (i === ix ? { ...g, as } : g)) }); }
  function rmGoal(team, ix) { setGoals({ ...goals, [team]: goals[team].filter((_, i) => i !== ix) }); }

  async function save(e) {
    e.preventDefault();
    setBusy(true); setMsg("");
    const supabase = createClient();
    try {
      const row = { date: f.date, time: f.time || null, place: f.place.trim() || null, status: played ? "jugado" : "programado",
        team_a_name: f.a.trim() || "Equipo 1", team_b_name: f.b.trim() || "Equipo 2",
        mvp_id: played && mvp ? mvp : null, notes: played ? f.notes.trim() || null : null,
        video_urls: f.videos.split(/\s+/).map((u) => u.trim()).filter((u) => /^https?:\/\//.test(u)),
        keeper_email: f.keeper.trim().toLowerCase() || null };
      let id = match.id;
      if (id) {
        const { error } = await supabase.from("matches").update(row).eq("id", id); if (error) throw error;
      } else {
        const { data, error } = await supabase.from("matches").insert(row).select("id").single(); if (error) throw error;
        id = data.id;
      }
      // Reemplaza planteles y goles.
      let r = await supabase.from("match_players").delete().eq("match_id", id); if (r.error) throw r.error;
      const lineup = [...A.map((p) => ({ match_id: id, player_id: p, team: "A" })), ...B.map((p) => ({ match_id: id, player_id: p, team: "B" }))];
      if (lineup.length) { r = await supabase.from("match_players").insert(lineup); if (r.error) throw r.error; }
      // Los goles solo se tocan si se está cargando el resultado (así no se pierde lo anotado en vivo).
      if (played) {
        r = await supabase.from("goals").delete().eq("match_id", id); if (r.error) throw r.error;
        const base = Date.now();
        const gs = [...goals.A.map((g) => ({ ...g, team: "A" })), ...goals.B.map((g) => ({ ...g, team: "B" }))]
          .map((g, i) => ({ match_id: id, team: g.team, player_id: g.p, own_goal: !!g.og, assist_id: !g.og && g.as ? g.as : null,
            minute: g.min, created_at: g.at || new Date(base + i).toISOString() }));
        if (gs.length) { r = await supabase.from("goals").insert(gs); if (r.error) throw r.error; }
      }
      router.push(`/partidos/${id}`);
      router.refresh();
    } catch (err) {
      setMsg("No se pudo guardar. " + (err?.message || ""));
      setBusy(false);
    }
  }
  async function remove() {
    const { error } = await createClient().from("matches").delete().eq("id", match.id);
    if (error) { setMsg("No se pudo borrar."); return; }
    router.push("/partidos"); router.refresh();
  }

  const goalCol = (team, mine, other, title) => (
    <div className="stack" style={{ gap: 6 }}>
      <h2 className="sm">Goles {title} · {goals[team].length}</h2>
      {goals[team].map((g, ix) => (
        <div className="goal-row" key={ix}>⚽<span>{g.min != null ? `${g.min}' ` : ""}{displayName(byId[g.p])}{g.og ? " (e/c)" : ""}</span>
          {!g.og && (
            <select aria-label="Asistencia" style={{ width: "auto", maxWidth: 130, fontSize: 13, padding: "4px 6px" }} value={g.as || ""} onChange={(e) => setAssist(team, ix, e.target.value)}>
              <option value="">Sin asist.</option>
              {mine.filter((i) => i !== g.p).map((i) => <option key={i} value={i}>Asist. {displayName(byId[i])}</option>)}
            </select>
          )}
          <button type="button" className="btn small" aria-label="Quitar gol" onClick={() => rmGoal(team, ix)}>✕</button></div>
      ))}
      <div className="goal-row">
        <select value={pick[team]} onChange={(e) => setPick({ ...pick, [team]: e.target.value })}>
          <option value="">Quién…</option>
          {mine.map((i) => <option key={i} value={i}>{displayName(byId[i])}</option>)}
          {other.map((i) => <option key={"og" + i} value={"og:" + i}>{displayName(byId[i])} (en contra)</option>)}
        </select>
        <button type="button" className="btn small" onClick={() => addGoal(team)}>+ Gol</button>
      </div>
    </div>
  );

  return (
    <form className="stack" onSubmit={save}>
      <h2>{match.id ? "Editar partido" : "Nuevo partido"}</h2>
      <div className="card stack">
        <div className="row">
          <label className="f">Fecha<input type="date" required value={f.date} onChange={set("date")} /></label>
          <label className="f">Hora<input type="time" value={f.time} onChange={set("time")} /></label>
          <label className="f">Cancha<input value={f.place} onChange={set("place")} placeholder="Ej: Complejo X, cancha 3" /></label>
        </div>
        <div className="row">
          <label className="f">Equipo 1<input value={f.a} onChange={set("a")} /></label>
          <label className="f">Equipo 2<input value={f.b} onChange={set("b")} /></label>
        </div>
        <label className="f">Planillero del panel EN VIVO (Gmail de quien anota, no hace falta que juegue)
          <input type="email" value={f.keeper} onChange={set("keeper")} placeholder="Ej: amigo@gmail.com" />
        </label>
      </div>
      <div className="card stack">
        <h2 className="sm">¿Quién juega y en qué equipo? · {A.length} vs {B.length}</h2>
        <div className="picker">
          {sorted.map((p) => (
            <div className="pick" key={p.id}>
              <span className="who"><Avatar player={p} /><span>{displayName(p)}</span><InjuryBadge player={p} short /></span>
              <span className="seg">
                <button type="button" className={!side[p.id] ? "on" : ""} onClick={() => setSideOf(p.id, null)}>—</button>
                <button type="button" className={side[p.id] === "A" ? "on" : ""} onClick={() => setSideOf(p.id, "A")}>{f.a || "1"}</button>
                <button type="button" className={side[p.id] === "B" ? "on" : ""} onClick={() => setSideOf(p.id, "B")}>{f.b || "2"}</button>
              </span>
            </div>
          ))}
          {!sorted.length && <span className="muted">Primero cargá jugadores en Admin.</span>}
        </div>
      </div>
      <label className="f check"><input type="checkbox" checked={played} onChange={(e) => setPlayed(e.target.checked)} /> Ya se jugó: cargar resultado</label>
      {played && (
        <div className="card stack">
          <div className="cols2">{goalCol("A", A, B, f.a)}{goalCol("B", B, A, f.b)}</div>
          <label className="f">Figura del partido
            <select value={mvp} onChange={(e) => setMvp(e.target.value)}>
              <option value="">—</option>
              {[...A, ...B].map((i) => <option key={i} value={i}>{displayName(byId[i])}</option>)}
            </select>
          </label>
          <label className="f">Comentario<input value={f.notes} onChange={set("notes")} placeholder="Ej: se definió en la última" /></label>
        </div>
      )}
      <div className="card stack">
        <label className="f">🎥 Links de YouTube del partido (uno por renglón)
          <textarea rows={3} value={f.videos} onChange={set("videos")} placeholder={"https://youtu.be/...\nhttps://www.youtube.com/watch?v=..."} />
        </label>
      </div>
      <div className="actions">
        <button className="btn primary" disabled={busy}>{busy ? "Guardando…" : "Guardar partido"}</button>
        {match.id && (confirmDel
          ? <button type="button" className="btn danger" onClick={remove}>Sí, borrar el partido</button>
          : <button type="button" className="btn danger" onClick={() => setConfirmDel(true)}>Borrar partido</button>)}
        {msg && <span className="error">{msg}</span>}
      </div>
    </form>
  );
}
