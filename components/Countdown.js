"use client";
import { useEffect, useState } from "react";

// Cuenta regresiva al partido (hora de Argentina, UTC-3).
export default function Countdown({ date, time }) {
  const target = Date.parse(`${date}T${(time || "20:00").slice(0, 5)}:00-03:00`);
  const [now, setNow] = useState(null);
  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  if (now === null || Number.isNaN(target)) return <div className="countdown" aria-hidden="true">&nbsp;</div>;
  let s = Math.floor((target - now) / 1000);
  if (s <= 0) return <div className="countdown go">⚽ ¡Ya arranca! 🎙️</div>;
  const d = Math.floor(s / 86400); s -= d * 86400;
  const h = Math.floor(s / 3600); s -= h * 3600;
  const m = Math.floor(s / 60); s -= m * 60;
  const pad = (x) => String(x).padStart(2, "0");
  const box = (v, l) => <span className="cd"><b>{v}</b><i>{l}</i></span>;
  return (
    <div className="countdown" role="timer" aria-label="Cuenta regresiva al partido">
      <span className="cd-label">Faltan</span>
      {d > 0 && box(d, d === 1 ? "día" : "días")}
      {box(pad(h), "hs")}
      {box(pad(m), "min")}
      {box(pad(s), "seg")}
    </div>
  );
}
