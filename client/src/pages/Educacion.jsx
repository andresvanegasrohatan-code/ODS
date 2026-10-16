import ContentCard from '../components/ContentCard';
import { CONTENIDOS } from '../data/contenido';

export default function Educacion() {
  return (
    <div>
      <h1 className="text-2xl">Módulo educativo</h1>
      <p className="mb-6 text-ink-soft">
        Consulta contenidos sobre derechos, inclusión y prevención de la discriminación.
      </p>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {CONTENIDOS.map((c) => (
          <ContentCard key={c.titulo} item={c} />
        ))}
      </div>
    </div>
  );
}
