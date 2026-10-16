import ContentCard from '../components/ContentCard';
import useOportunidades from '../hooks/useOportunidades';

export default function Oportunidades() {
  const { oportunidades, cargando, error } = useOportunidades();

  return (
    <div>
      <h1 className="text-2xl">Oportunidades</h1>
      <p className="mb-6 text-ink-soft">
        Campañas, recursos de orientación y oportunidades verificables sobre igualdad de género. Consulta con
        Bienestar Universitario para conocer actividades y convocatorias propias de tu institución.
      </p>
      {error ? (
        <p className="text-sm text-red-700" role="alert">{error}</p>
      ) : cargando ? (
        <p className="text-sm text-ink-soft">Cargando oportunidades…</p>
      ) : oportunidades.length === 0 ? (
        <p className="text-sm text-ink-soft">No hay oportunidades publicadas por el momento.</p>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {oportunidades.map((o) => (
            <ContentCard key={o.id} item={o} />
          ))}
        </div>
      )}
    </div>
  );
}
