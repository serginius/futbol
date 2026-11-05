"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AdminAdmins({ admins }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  async function add(e) {
    e.preventDefault();
    const v = email.trim().toLowerCase();
    if (!v) return;
    const { error } = await createClient().from("admins").insert({ email: v });
    setMsg(error ? "No se pudo agregar." : "Admin agregado.");
    if (!error) setEmail("");
    router.refresh();
  }
  async function remove(v) {
    if (admins.length <= 1) { setMsg("Tiene que quedar al menos un admin."); return; }
    await createClient().from("admins").delete().eq("email", v);
    router.refresh();
  }
  return (
    <section className="sec">
      <h2>Admins</h2>
      <div className="card list">
        {admins.map((a) => (
          <div key={a}><span>{a}</span><button className="btn small danger" onClick={() => remove(a)}>Quitar</button></div>
        ))}
      </div>
      <form className="actions" onSubmit={add}>
        <input type="email" placeholder="otro-admin@gmail.com" value={email} onChange={(e) => setEmail(e.target.value)} style={{ flex: 1 }} />
        <button className="btn">Agregar admin</button>
        {msg && <span className="muted">{msg}</span>}
      </form>
    </section>
  );
}
