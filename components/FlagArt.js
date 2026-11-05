// Arte de la cabecera: sol de mayo re fumado con porro, hoja y el 10.
export default function FlagArt() {
  const leaflets = [
    [0, 46], [-28, 40], [28, 40], [-58, 32], [58, 32], [-95, 20], [95, 20],
  ];
  return (
    <div className="flag-art" aria-hidden="true">
      <svg className="leaf" viewBox="-50 -52 100 70">
        {leaflets.map(([a, len]) => (
          <path key={a} transform={`rotate(${a})`}
            d={`M0 0 C -5 ${-len * 0.35} -4 ${-len * 0.75} 0 ${-len} C 4 ${-len * 0.75} 5 ${-len * 0.35} 0 0 Z`} />
        ))}
        <path className="stem" d="M0 0 L0 16" />
      </svg>
      <span className="ten">10</span>
      <svg className="sun" viewBox="-60 -60 120 120">
        <g className="rays">
          {Array.from({ length: 32 }, (_, i) => (
            <path key={i} d={i % 2 ? "M-2 -27 Q0 -42 2 -27 Z" : "M-2.6 -27 L0 -50 L2.6 -27 Z"} transform={`rotate(${i * 11.25})`} />
          ))}
        </g>
        <circle className="face" r="26" />
        {/* ojos rojos re fumados, con párpados caídos */}
        {[-10, 10].map((x) => (
          <g key={x} transform={`translate(${x} -5)`}>
            <ellipse rx="7" ry="5.5" fill="#ffd6d6" stroke="#c98a00" strokeWidth=".6" />
            <ellipse rx="7" ry="5.5" fill="#e53935" opacity=".55" />
            <path d="M-6 1 L-2 0 M6 2 L2 0.5 M-5 -2 L-2 -1" stroke="#c62828" strokeWidth=".7" />
            <circle cy="1.5" r="2.4" fill="#3b1d0a" />
            <path d="M-7 0.6 A7 5.5 0 0 1 7 0.6 Z" fill="#e0a100" />
            <path d="M-7.6 0.6 Q0 -1.6 7.6 0.6" stroke="#8a5a00" strokeWidth="1.2" fill="none" />
          </g>
        ))}
        {/* sonrisa tranqui */}
        <path d="M-9 10 Q-1 15 6 10" stroke="#8a5a00" strokeWidth="1.8" fill="none" strokeLinecap="round" />
        {/* porro */}
        <g transform="translate(5 12) rotate(-18)">
          <path d="M0 -2 L26 -3.2 L26 3.2 L0 2 Z" fill="#f7f3ea" stroke="#cfc6b0" strokeWidth=".6" />
          <rect x="24.5" y="-3.4" width="3.2" height="6.8" rx="1.2" fill="#ff7a1a" />
          <circle cx="27.2" cy="0" r="1.6" fill="#ffd54a" />
        </g>
        {/* humo */}
        <g className="smoke" fill="none" strokeLinecap="round">
          <path d="M31 2 C 35 -6 28 -12 33 -20 C 38 -28 31 -34 36 -42" />
          <path d="M34 -4 C 40 -10 36 -18 42 -24" opacity=".7" />
        </g>
      </svg>
    </div>
  );
}
