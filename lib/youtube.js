// Saca el id de un video de YouTube de cualquier link (watch, youtu.be, shorts, live, embed).
export function youtubeId(url) {
  if (!url) return null;
  try {
    const u = new URL(url.trim());
    const host = u.hostname.replace(/^www\.|^m\./, "");
    let id = null;
    if (host === "youtu.be") id = u.pathname.slice(1).split("/")[0];
    else if (host.endsWith("youtube.com") || host.endsWith("youtube-nocookie.com")) {
      id = u.searchParams.get("v");
      const m = u.pathname.match(/^\/(shorts|live|embed)\/([^/?]+)/);
      if (!id && m) id = m[2];
    }
    return id && /^[\w-]{6,20}$/.test(id) ? id : null;
  } catch {
    return null;
  }
}

// Segundo de inicio si el link trae ?t=90 o ?t=1m30s.
export function youtubeStart(url) {
  try {
    const t = new URL(url.trim()).searchParams.get("t") || "";
    const m = t.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s?)?$/);
    if (!m) return 0;
    return (+m[1] || 0) * 3600 + (+m[2] || 0) * 60 + (+m[3] || 0);
  } catch {
    return 0;
  }
}
