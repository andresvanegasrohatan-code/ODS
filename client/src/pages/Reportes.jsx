import { useCallback, useEffect, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { obtenerResumen } from '../services/reportesService';
import { mensajeDeError } from '../services/api';
import { ESTADOS, TIPOS_SITUACION } from '../data/contenido';
import StatCard from '../components/StatCard';
import Alert from '../components/Alert';

const COLORES_ESTADO = { Pendiente: '#B8862B', Activo: '#3F8F6B', Resuelto: '#5B4A8A' };
const FILTROS_INICIALES = { desde: '', hasta: '', tipo: '', estado: '' };

function escaparCsv(valor) {
  const texto = String(valor ?? '');
  return `"${texto.replace(/"/g, '""')}"`;
}

export default function Reportes() {
  const [filtros, setFiltros] = useState(FILTROS_INICIALES);
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const generar = useCallback(async (f) => {
    setCargando(true);
    try {
      setDatos(await obtenerResumen(f));
      setError('');
    } catch (err) {
      setError(mensajeDeError(err, 'No se pudo generar el reporte'));
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    generar(FILTROS_INICIALES);
  }, [generar]);

  function cambiar(e) {
    setFiltros((previo) => ({ ...previo, [e.target.name]: e.target.value }));
  }

  function limpiar() {
    setFiltros(FILTROS_INICIALES);
    generar(FILTROS_INICIALES);
  }

  function exportarCsv() {
    if (!datos || datos.registros.length === 0) return;
    const encabezado = ['Autor', 'Correo', 'Tipo', 'Fecha', 'Lugar', 'Prioridad', 'Estado', 'Seguimiento'];
    const filas = datos.registros.map((s) =>
      [s.autor?.nombre, s.autor?.correo, s.tipo, s.fecha, s.lugar, s.prioridad, s.estado, s.seguimiento]
        .map(escaparCsv)
        .join(',')
    );
    const csv = `﻿${[encabezado.map(escaparCsv).join(','), ...filas].join('\n')}`;
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    const enlace = document.createElement('a');
    enlace.href = url;
    enlace.download = `equigenero_reporte_${new Date().toISOString().slice(0, 10)}.csv`;
    enlace.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <h1 className="text-2xl">Reporte de situaciones</h1>
      <p className="mb-5 text-ink-soft">Estadísticas generadas a partir de la información almacenada.</p>

      <form
        className="card mb-5 flex flex-wrap items-end gap-4 !p-4"
        onSubmit={(e) => {
          e.preventDefault();
          generar(filtros);
        }}
      >
        <div>
          <label className="label" htmlFor="desde">Desde</label>
          <input id="desde" name="desde" type="date" className="input" value={filtros.desde} onChange={cambiar} />
        </div>
        <div>
          <label className="label" htmlFor="hasta">Hasta</label>
          <input id="hasta" name="hasta" type="date" className="input" value={filtros.hasta} onChange={cambiar} />
        </div>
        <div>
          <label className="label" htmlFor="tipo">Tipo</label>
          <select id="tipo" name="tipo" className="input" value={filtros.tipo} onChange={cambiar}>
            <option value="">Todos</option>
            {TIPOS_SITUACION.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="estado">Estado</label>
          <select id="estado" name="estado" className="input" value={filtros.estado} onChange={cambiar}>
            <option value="">Todos</option>
            {ESTADOS.map((e) => (
              <option key={e} value={e}>{e}</option>
            ))}
          </select>
        </div>
        <div className="flex gap-2">
          <button type="submit" className="btn btn-primary btn-sm">Generar reporte</button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={limpiar}>Limpiar</button>
        </div>
      </form>

      <Alert>{error}</Alert>

      {cargando && !datos ? (
        <p className="py-10 text-center text-sm text-ink-soft">Generando reporte…</p>
      ) : datos ? (
        <>
          <div className="mb-5 grid gap-4 sm:grid-cols-3">
            <StatCard valor={datos.total} etiqueta="Registros" color="brand" />
            <StatCard valor={datos.atendidos} etiqueta="Atendidos (resueltos)" color="ok" />
            <StatCard valor={datos.pendientes} etiqueta="Pendientes / en curso" color="gold" />
          </div>

          {datos.total === 0 ? (
            <div className="card py-10 text-center text-sm text-ink-soft">
              📭 No hay datos para los filtros seleccionados.
            </div>
          ) : (
            <>
              <div className="mb-5 grid gap-5 lg:grid-cols-2">
                <div className="card">
                  <h3 className="mb-3 text-base">Situaciones por tipo</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={datos.porTipo} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ECDDD5" vertical={false} />
                        <XAxis dataKey="nombre" tick={{ fontSize: 11 }} interval={0} tickFormatter={(v) => (v.length > 12 ? `${v.slice(0, 12)}…` : v)} />
                        <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                        <Tooltip />
                        <Bar dataKey="total" name="Casos" fill="#8E1B4D" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="card">
                  <h3 className="mb-3 text-base">Distribución por estado</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={datos.porEstado} dataKey="total" nameKey="nombre" innerRadius={50} outerRadius={85} paddingAngle={3}>
                          {datos.porEstado.map((e) => (
                            <Cell key={e.nombre} fill={COLORES_ESTADO[e.nombre] || '#7A6670'} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              <div className="card mb-5">
                <h3 className="mb-3 text-base">Evolución mensual</h3>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={datos.porMes} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ECDDD5" vertical={false} />
                      <XAxis dataKey="nombre" tick={{ fontSize: 11 }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Bar dataKey="total" name="Casos" fill="#5B4A8A" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </>
          )}

          <button type="button" className="btn btn-outline btn-sm" onClick={exportarCsv} disabled={datos.registros.length === 0}>
            ⬇ Exportar CSV
          </button>
        </>
      ) : null}
    </div>
  );
}
