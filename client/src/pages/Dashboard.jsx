import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { listarSituaciones, obtenerEstadisticas } from '../services/situacionesService';
import { CONTENIDOS } from '../data/contenido';
import useOportunidades from '../hooks/useOportunidades';
import StatCard from '../components/StatCard';
import Badge from '../components/Badge';

function saludo() {
  const hora = new Date().getHours();
  if (hora < 12) return 'Buenos días';
  if (hora < 19) return 'Buenas tardes';
  return 'Buenas noches';
}

export default function Dashboard() {
  const { usuario, esAdmin } = useAuth();
  const { oportunidades, cargando: cargandoOportunidades, error: errorOportunidades } = useOportunidades();
  const [stats, setStats] = useState(null);
  const [recientes, setRecientes] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    Promise.all([obtenerEstadisticas(), listarSituaciones()])
      .then(([estadisticas, situaciones]) => {
        setStats(estadisticas);
        setRecientes(situaciones.slice(0, 5));
      })
      .finally(() => setCargando(false));
  }, []);

  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-line bg-[linear-gradient(135deg,#fffaf8,#f4eef9)] p-6 shadow-soft sm:p-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="pill-tag">Resumen general</div>
            <h1 className="mt-3 text-3xl sm:text-5xl">
              {saludo()}, {usuario.nombre.split(' ')[0]}
            </h1>
          </div>
          <p className="max-w-md text-sm leading-6 text-ink-soft">
            Bienvenido(a) al panel de EquiGénero. Aquí puedes visualizar avances, registrar situaciones y acceder a recursos relevantes.
          </p>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard valor={cargando ? '…' : stats?.total ?? 0} etiqueta={esAdmin ? 'Casos registrados' : 'Mis casos'} color="brand" />
        <StatCard valor={cargando ? '…' : stats?.porEstado.Pendiente ?? 0} etiqueta="Pendientes" color="gold" />
        <StatCard valor={cargando ? '…' : stats?.porEstado.Resuelto ?? 0} etiqueta="Resueltos" color="ok" />
        <StatCard
          valor={errorOportunidades ? '—' : cargandoOportunidades ? '…' : CONTENIDOS.length + oportunidades.length}
          etiqueta="Recursos y oportunidades"
          color="violet"
        />
      </div>

      <div className="rounded-[26px] border border-line bg-white p-5 shadow-soft sm:p-6">
        <h3 className="text-2xl">Accesos rápidos</h3>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link to="/app/registrar" className="btn btn-primary btn-sm">Registrar situación</Link>
          <Link to="/app/educacion" className="btn btn-outline btn-sm">Ver recursos</Link>
          <Link to="/app/oportunidades" className="btn btn-outline btn-sm">Oportunidades</Link>
          {esAdmin && <Link to="/app/reportes" className="btn btn-outline btn-sm">Reportes</Link>}
        </div>
      </div>

      <div className="rounded-[26px] border border-line bg-white p-5 shadow-soft sm:p-6">
        <h3 className="mb-4 text-2xl">Últimas actividades</h3>
        {cargando ? (
          <p className="py-6 text-center text-sm text-ink-soft">Cargando…</p>
        ) : recientes.length === 0 ? (
          <p className="py-6 text-center text-sm text-ink-soft">📭 Aún no hay actividad registrada.</p>
        ) : (
          <ul className="space-y-3">
            {recientes.map((s) => (
              <li key={s.id} className="flex flex-col gap-2 rounded-2xl border border-line bg-[#faf7f5] p-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="font-medium text-ink">{s.tipo}</div>
                  {esAdmin && <div className="text-xs text-ink-soft">{s.autor?.nombre}</div>}
                </div>
                <div className="flex items-center gap-3">
                  <Badge estado={s.estado} />
                  <span className="text-xs text-ink-soft">{s.fecha}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
