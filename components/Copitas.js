import { copitasFor } from "@/lib/copitas";

const TIER_LABEL = { bronce: "Bronce", plata: "Plata", oro: "Oro" };

function Copita({ c }) {
  return (
    <div className={`copita ${c.won ? "won" : "locked"} ${c.tier || ""} ${c.shame ? "shame" : ""}`} title={c.how}>
      <span className="cup" aria-hidden="true">{c.e}</span>
      <span className="cn">{c.name}</span>
      <span className="ch">{c.won ? [c.tier && TIER_LABEL[c.tier], c.sub].filter(Boolean).join(" · ") || "¡Ganada!" : c.how}</span>
      {c.won && c.tier && c.tier !== "oro" && <span className="ch next">{c.how}</span>}
    </div>
  );
}

export default function Copitas({ id, players, matches, mine = false }) {
  const all = copitasFor(id, players, matches);
  const glory = all.filter((c) => !c.shame), shame = all.filter((c) => c.shame);
  const won = all.filter((c) => c.won).length;
  const sort = (xs) => [...xs.filter((c) => c.won), ...xs.filter((c) => !c.won)];
  return (
    <section className="sec">
      <div className="sec-head"><h2>🏆 Vitrina de copitas</h2><span className="pill">{won} de {all.length}</span></div>
      <div className="copitas">{sort(glory).map((c) => <Copita key={c.id} c={c} />)}</div>
      <h2 className="sm">Vitrina de la vergüenza 😅</h2>
      <div className="copitas">{sort(shame).map((c) => <Copita key={c.id} c={c} />)}</div>
      {mine && <p className="muted" style={{ margin: 0, fontSize: 13 }}>Las grises todavía no las ganaste: abajo dice qué te falta.</p>}
    </section>
  );
}
