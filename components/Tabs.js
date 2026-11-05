"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Tabs({ isAdmin }) {
  const path = usePathname();
  const tabs = [
    ["/", "Inicio"],
    ["/partidos", "Partidos"],
    ["/goleadores", "Goleadores"],
    ["/jugadores", "Jugadores"],
    ...(isAdmin ? [["/admin", "Admin"]] : []),
  ];
  const active = (href) => (href === "/" ? path === "/" : path.startsWith(href));
  return (
    <nav className="tabs" aria-label="Secciones">
      <div className="wrap">
        {tabs.map(([href, label]) => (
          <Link key={href} href={href} aria-current={active(href) ? "page" : undefined}>{label}</Link>
        ))}
      </div>
    </nav>
  );
}
