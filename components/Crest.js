// Escudo: bastones albicelestes, sol de mayo y LSC.
export default function Crest() {
  const rays = Array.from({ length: 16 }, (_, i) => i * 22.5);
  return (
    <svg className="crest" viewBox="0 0 52 60" aria-hidden="true">
      <defs>
        <clipPath id="shield"><path d="M26 2 L48 9 V28 C48 42 38 52 26 57 C14 52 4 42 4 28 V9 Z" /></clipPath>
      </defs>
      <g clipPath="url(#shield)">
        <rect x="0" y="0" width="52" height="60" fill="#ffffff" />
        {[4, 18, 32, 46].map((x) => <rect key={x} x={x} y="0" width="7" height="60" fill="#74acdf" />)}
      </g>
      <path d="M26 2 L48 9 V28 C48 42 38 52 26 57 C14 52 4 42 4 28 V9 Z" fill="none" stroke="#0b2a4a" strokeWidth="2.5" />
      <g transform="translate(26 17)">
        {rays.map((r) => <rect key={r} x="-0.8" y="-8.5" width="1.6" height="4" fill="#f2b705" transform={`rotate(${r})`} />)}
        <circle r="4.6" fill="#f2b705" stroke="#c98a00" strokeWidth=".6" />
      </g>
      <text x="26" y="41" textAnchor="middle" fontFamily="Arial Narrow,Arial,sans-serif" fontWeight="800" fontSize="13" fill="#0b2a4a">LSC</text>
    </svg>
  );
}
