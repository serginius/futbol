import { todayStr, fmtDate } from "@/lib/format";

export function isInjured(p) {
  return !!p?.injured_until && p.injured_until >= todayStr();
}

// Cartelito de lesionado. Se va solo cuando pasa la fecha.
export default function InjuryBadge({ player, short = false }) {
  if (!isInjured(player)) return null;
  return <span className="injured">💅 Lesionado{short ? "" : ` · vuelve el ${fmtDate(player.injured_until)}`}</span>;
}
