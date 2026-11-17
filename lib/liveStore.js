// Guarda en el celu lo que está a medio cargar en el panel EN VIVO
// (por ejemplo: tocaste el goleador y falta elegir quién la dio), para que
// si se bloquea el celu o se recarga la página, siga donde estaba.
const MAX_AGE = 3 * 60 * 60 * 1000; // 3 horas

export function readLocal(key) {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const v = JSON.parse(raw);
    if (!v || Date.now() - (v.savedAt || 0) > MAX_AGE) { window.localStorage.removeItem(key); return null; }
    return v.data;
  } catch { return null; }
}

export function writeLocal(key, data) {
  try { window.localStorage.setItem(key, JSON.stringify({ savedAt: Date.now(), data })); } catch {}
}

export function clearLocal(key) {
  try { window.localStorage.removeItem(key); } catch {}
}

// Mantiene la pantalla prendida mientras se relata (si el celu lo permite).
export function keepScreenOn() {
  let lock = null;
  let alive = true;
  async function grab() {
    try {
      if (!alive || document.hidden || !("wakeLock" in navigator)) return;
      if (lock && !lock.released) return;
      lock = await navigator.wakeLock.request("screen");
    } catch {}
  }
  const onVis = () => { if (!document.hidden) grab(); };
  grab();
  document.addEventListener("visibilitychange", onVis);
  return () => {
    alive = false;
    document.removeEventListener("visibilitychange", onVis);
    try { lock?.release(); } catch {}
  };
}
