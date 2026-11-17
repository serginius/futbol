// Fotos de la juntada del partido. Tocando una se abre grande.
export default function Photos({ urls }) {
  if (!urls?.length) return null;
  return (
    <section className="sec">
      <h2>📸 La juntada</h2>
      <div className="photos">
        {urls.map((u, i) => (
          <a className="photo" key={i} href={u} target="_blank" rel="noreferrer">
            <img src={u} alt={`Foto ${i + 1} de la juntada`} loading="lazy" />
          </a>
        ))}
      </div>
    </section>
  );
}
