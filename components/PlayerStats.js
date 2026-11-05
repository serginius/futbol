// Números del jugador: goles, asistencias, partidos, G-E-P, figura y faltas.
export default function PlayerStats({ s }) {
  return (
    <div className="stats six">
      <div className="stat"><b>{s.g}</b><span>Goles</span></div>
      <div className="stat"><b>{s.a}</b><span>Asist.</span></div>
      <div className="stat"><b>{s.pj}</b><span>Partidos</span></div>
      <div className="stat"><b>{s.pg}-{s.pe}-{s.pp}</b><span>G-E-P</span></div>
      <div className="stat"><b>{s.mvp}</b><span>Figura</span></div>
      <div className="stat"><b>{s.f}</b><span>Faltas{s.am || s.ro ? ` · ${s.am}🟨 ${s.ro}🟥` : ""}</span></div>
    </div>
  );
}
