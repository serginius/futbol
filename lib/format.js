const DIAS = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];
const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
export const TZ = "America/Argentina/Buenos_Aires";

export function parseDate(d, t) {
  const [y, m, dd] = (d || "").split("-").map(Number);
  const [h, mi] = (t || "00:00").split(":").map(Number);
  return new Date(y, (m || 1) - 1, dd || 1, h || 0, mi || 0);
}
export function fmtDate(d) {
  const x = parseDate(d);
  return `${DIAS[x.getDay()]} ${x.getDate()} ${MESES[x.getMonth()]}`;
}
// Fecha de hoy en Argentina, formato YYYY-MM-DD.
export function todayStr() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}
export function nextWednesday() {
  const [y, m, d] = todayStr().split("-").map(Number);
  const n = new Date(y, m - 1, d);
  n.setDate(n.getDate() + ((3 - n.getDay() + 7) % 7));
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}-${String(n.getDate()).padStart(2, "0")}`;
}
export function daysUntil(d) {
  const [y, m, dd] = todayStr().split("-").map(Number);
  return Math.round((parseDate(d) - new Date(y, m - 1, dd)) / 864e5);
}
export function initials(name) {
  return (name || "?").split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("");
}
export function displayName(p) {
  return p ? p.nick || p.name : "Jugador borrado";
}
