import { youtubeId, youtubeStart } from "@/lib/youtube";

export default function Videos({ urls }) {
  const vids = (urls || []).map((u) => ({ u, id: youtubeId(u), t: youtubeStart(u) }));
  if (!vids.length) return null;
  return (
    <section className="sec">
      <h2>🎥 Videos</h2>
      <div className="videos">
        {vids.map((v, i) => v.id ? (
          <div className="video" key={i}>
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${v.id}${v.t ? `?start=${v.t}` : ""}`}
              title={`Video ${i + 1} del partido`}
              loading="lazy"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            />
          </div>
        ) : (
          <a key={i} className="btn" href={v.u} target="_blank" rel="noopener noreferrer">Ver video {i + 1}</a>
        ))}
      </div>
    </section>
  );
}
