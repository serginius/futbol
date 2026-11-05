import { initials } from "@/lib/format";

export default function Avatar({ player, className = "av" }) {
  if (player?.photo_url) return <img className={className} src={player.photo_url} alt="" />;
  return <span className={className}>{initials(player?.name)}</span>;
}
