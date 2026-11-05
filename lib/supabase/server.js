import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {
            // Llamado desde un Server Component: el middleware refresca la sesión.
          }
        },
      },
    }
  );
}

// Quién está mirando: usuario, si es admin y su ficha de jugador (si tiene).
export async function getViewer(supabase) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { user: null, isAdmin: false, player: null };
  const email = (user.email || "").toLowerCase();
  const [{ data: isAdmin }, { data: player }] = await Promise.all([
    supabase.rpc("is_admin"),
    supabase.from("players").select("*").ilike("email", email).maybeSingle(),
  ]);
  return { user, isAdmin: !!isAdmin, player: player || null };
}
