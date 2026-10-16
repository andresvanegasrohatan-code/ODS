import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listarSituaciones } from '../services/situacionesService';
import { mensajeDeError } from '../services/api';
import Badge from '../components/Badge';
import Alert from '../components/Alert';

export default function Seguimiento() {
  const [situaciones, setSituaciones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    listarSituaciones()
      .then(setSituaciones)
      .catch((err) => setError(mensajeDeError(err, 'No se pudieron cargar tus situaciones')))
      .finally(() => setCargando(false));
  }, []);

  return (
    <div>
      <h1 className="text-2xl">Seguimiento de situaciones</h1>
      <p className="mb-6 text-ink-soft">Consulta el estado de las situaciones que has registrado.</p>

      <Alert>{error}</Alert>

      <div className="card overflow-x-auto !p-2">
        {cargando ? (
          <p className="py-10 text-center text-sm text-ink-soft">Cargando…</p>
        ) : situaciones.length === 0 ? (
          <div className="py-10 text-center text-sm text-ink-soft">
            <p className="mb-3">📭 Aún no has registrado situaciones.</p>
            <Link to="/app/registrar" className="btn btn-primary btn-sm">Registrar una situación</Link>
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b-2 border-line text-xs text-ink-soft">
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Lugar</th>
                <th className="px-4 py-3">Prioridad</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Seguimiento</th>
              </tr>
            </thead>
            <tbody>
              {situaciones.map((s) => (
                <tr key={s.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-3">{s.tipo}</td>
                  <td className="whitespace-nowrap px-4 py-3">{s.fecha}</td>
                  <td className="px-4 py-3">{s.lugar || '—'}</td>
                  <td className="px-4 py-3">{s.prioridad}</td>
                  <td className="px-4 py-3"><Badge estado={s.estado} /></td>
                  <td className="min-w-[200px] px-4 py-3 text-ink-soft">{s.seguimiento || 'Sin novedades todavía'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
