import Crest from "@/components/Crest";
import GoogleButton from "./GoogleButton";

export const metadata = { title: "Entrar · Fútbol Miércoles" };

const ERRORS = {
  "no-habilitado": ["No pudimos reconocerte con esa cuenta. Avisale al que organiza la liga y te suma en un minuto.", "Ese mail de Google no está habilitado. Fijate de entrar con el mismo Gmail que le diste al organizador."],
  "fallo": ["No se pudo completar el ingreso. Probá de nuevo.", ""],
};

export default async function Login({ searchParams }) {
  const { error } = await searchParams;
  const err = ERRORS[error];
  return (
    <div className="card login-card">
      <Crest />
      <h2>Tu espacio en Fútbol Miércoles</h2>
      <p className="muted" style={{ margin: 0 }}>Entrá con tu Google y abrí tu espacio: cómo te fue en el último partido, tus goles y tu carta de jugador.</p>
      {err && (
        <div>
          <p className="error" style={{ margin: 0 }}>{err[0]}</p>
          {err[1] && <p className="muted" style={{ margin: "4px 0 0", fontSize: 13 }}>{err[1]}</p>}
        </div>
      )}
      <GoogleButton />
      <p className="muted" style={{ margin: 0, fontSize: 13 }}>Los resultados y la tabla se pueden ver sin entrar.</p>
    </div>
  );
}
