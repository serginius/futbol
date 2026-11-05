import "./globals.css";
import Link from "next/link";
import { Barlow, Barlow_Condensed } from "next/font/google";
import Crest from "@/components/Crest";
import Tabs from "@/components/Tabs";
import Avatar from "@/components/Avatar";
import { createClient, getViewer } from "@/lib/supabase/server";

const barlow = Barlow({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-barlow" });
const barlowC = Barlow_Condensed({ subsets: ["latin"], weight: ["500", "600", "700", "800"], variable: "--font-barlow-condensed" });

export const metadata = {
  title: "Fútbol LSC",
  description: "Copa La Cabral: partidos, resultados, goleadores y jugadores.",
};
export const viewport = { themeColor: "#74acdf", viewportFit: "cover", width: "device-width", initialScale: 1 };

export default async function RootLayout({ children }) {
  const supabase = await createClient();
  const { user, isAdmin, player } = await getViewer(supabase);
  return (
    <html lang="es" className={`${barlow.variable} ${barlowC.variable}`}>
      <body>
        <header className="top">
          <div className="flag-art" aria-hidden="true">
            <svg className="sun" viewBox="-50 -50 100 100">
              {Array.from({ length: 32 }, (_, i) => (
                <path key={i} d={i % 2 ? "M-2 -26 Q0 -40 2 -26 Z" : "M-2.5 -26 L0 -46 L2.5 -26 Z"} transform={`rotate(${i * 11.25})`} />
              ))}
              <circle r="24" />
            </svg>
            <span className="ten">10</span>
          </div>
          <div className="wrap">
            <Crest />
            <Link href="/" className="brand"><h1>Fútbol LSC</h1><p>Copa La Cabral</p></Link>
            <div className="me">
              {user ? (
                <Link href="/perfil" className="who" style={{ background: "none", padding: 0 }} aria-label="Mi perfil">
                  <Avatar player={player || { name: user.user_metadata?.full_name || user.email }} />
                </Link>
              ) : (
                <Link href="/login">Entrar</Link>
              )}
            </div>
          </div>
        </header>
        <Tabs isAdmin={isAdmin} />
        <main><div className="wrap">{children}</div></main>
      </body>
    </html>
  );
}
