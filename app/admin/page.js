import Link from "next/link";
import { redirect } from "next/navigation";
import AdminPlayers from "./AdminPlayers";
import AdminAdmins from "./AdminAdmins";
import { createClient, getViewer } from "@/lib/supabase/server";
import { getLeague, upcomingMatches, pendingResults } from "@/lib/data";
import { fmtDate } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin · Fútbol Miércoles" };

export default async function Admin({ searchParams }) {
  const supabase = await createClient();
  const { isAdmin } = await getViewer(supabase);
  if (!isAdmin) redirect("/");
  const { editar } = await searchParams;
  const [{ data: players }, { data: admins }, { matches }] = await Promise.all([
    supabase.from("players").select("*").order("name"),
    supabase.from("admins").select("email").order("email"),
    getLeague(supabase),
  ]);
  const todo = [...pendingResults(matches), ...upcomingMatches(matches)];
  return (
    <>
      <section className="sec">
        <div className="sec-head"><h2>Partidos</h2><Link className="btn small accent" href="/admin/partidos/nuevo">+ Nuevo partido</Link></div>
        <div className="card list">
          {todo.length ? todo.map((m) => (
            <div key={m.id}>
              <span>{fmtDate(m.date)}{m.time ? ` · ${m.time}` : ""} · {m.team_a_name} vs {m.team_b_name}</span>
              <Link className="btn small primary" href={`/admin/partidos/${m.id}`}>Cargar resultado</Link>
            </div>
          )) : <span className="muted">No hay partidos pendientes. Para editar uno jugado, abrilo desde Partidos.</span>}
        </div>
      </section>
      <AdminPlayers players={players || []} editId={editar || null} />
      <AdminAdmins admins={(admins || []).map((a) => a.email)} />
    </>
  );
}
