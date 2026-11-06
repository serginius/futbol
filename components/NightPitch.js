// Cancha en perspectiva, de noche y con luces (dibujo, sin fotos).
export default function NightPitch() {
  // Trapecio: arriba angosto (lejos), abajo ancho (cerca).
  const T = 18, B = 200, TL = 120, TR = 480, BL = -40, BR = 640;
  const x = (y, side) => { const t = (y - T) / (B - T); return side === "l" ? TL + (BL - TL) * t : TR + (BR - TR) * t; };
  // Profundidad con perspectiva: más apretado lejos.
  const yAt = (f) => T + (B - T) * (f * f * 0.35 + f * 0.65);
  const stripes = Array.from({ length: 10 }, (_, i) => {
    const y1 = yAt(i / 10), y2 = yAt((i + 1) / 10);
    return <polygon key={i} points={`${x(y1, "l")},${y1} ${x(y1, "r")},${y1} ${x(y2, "r")},${y2} ${x(y2, "l")},${y2}`} fill={i % 2 ? "#2f9d48" : "#38ad52"} />;
  });
  const mid = yAt(0.5);
  const box = (f1, f2, w) => {
    const y1 = yAt(f1), y2 = yAt(f2);
    const c1 = (x(y1, "l") + x(y1, "r")) / 2, h1 = (x(y1, "r") - x(y1, "l")) * w / 2;
    const c2 = (x(y2, "l") + x(y2, "r")) / 2, h2 = (x(y2, "r") - x(y2, "l")) * w / 2;
    return `${c1 - h1},${y1} ${c1 + h1},${y1} ${c2 + h2},${y2} ${c2 - h2},${y2}`;
  };
  const midW = x(mid, "r") - x(mid, "l");
  return (
    <svg className="night-pitch" viewBox="0 0 600 200" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
      <defs>
        <radialGradient id="np-light" cx="50%" cy="0%" r="90%">
          <stop offset="0" stopColor="#fff" stopOpacity=".28" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="np-fade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#000" stopOpacity=".35" />
          <stop offset=".5" stopColor="#000" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={`${TL - 30},${T - 8} ${TR + 30},${T - 8} ${BR + 60},${B} ${BL - 60},${B}`} fill="#1d5e2c" />
      {stripes}
      <g fill="none" stroke="#fff" strokeOpacity=".85" strokeWidth="1.6">
        <polygon points={`${TL},${T} ${TR},${T} ${BR},${B} ${BL},${B}`} />
        <line x1={x(mid, "l")} y1={mid} x2={x(mid, "r")} y2={mid} />
        <ellipse cx="300" cy={mid} rx={midW * 0.11} ry={midW * 0.035} />
        <polygon points={box(0, 0.16, 0.44)} />
        <polygon points={box(0, 0.06, 0.2)} />
      </g>
      <circle cx="300" cy={mid} r="2.2" fill="#fff" />
      <rect x="0" y="0" width="600" height="200" fill="url(#np-light)" />
      <rect x="0" y="0" width="600" height="200" fill="url(#np-fade)" />
    </svg>
  );
}
