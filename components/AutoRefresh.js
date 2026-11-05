"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Mientras el partido está en vivo, recarga los datos cada tantos segundos.
export default function AutoRefresh({ seconds = 15 }) {
  const router = useRouter();
  useEffect(() => {
    const t = setInterval(() => { if (!document.hidden) router.refresh(); }, seconds * 1000);
    return () => clearInterval(t);
  }, [router, seconds]);
  return null;
}
