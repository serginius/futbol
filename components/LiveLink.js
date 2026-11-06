"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

// Botón al panel EN VIVO: muestra "AGUANTAAAAA" un segundito y entra al panel.
export default function LiveLink({ href, children, className = "btn accent", style }) {
  const router = useRouter();
  const [show, setShow] = useState(false);
  function go(e) {
    e.preventDefault();
    if (show) return;
    setShow(true);
    router.prefetch(href);
    setTimeout(() => router.push(href), 1200);
  }
  return (
    <>
      <a href={href} className={className} style={style} onClick={go}>{children}</a>
      {show && (
        <div className="splash" role="status" aria-label="AGUANTAAAAA">
          <img src="/aguanta.png" alt="AGUANTAAAAA" />
        </div>
      )}
    </>
  );
}
