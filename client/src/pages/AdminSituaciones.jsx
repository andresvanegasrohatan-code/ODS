import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  actualizarSituacion,
  eliminarSituacion,
  listarSituaciones,
} from '../services/situacionesService';
import { mensajeDeError } from '../services/api';
import { ESTADOS } from '../data/contenido';
import Badge from '../components/Badge';
import Alert from '../components/Alert';

export default function AdminSituaciones() {
  const [situaciones, setSituaciones] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [editando, setEditando] = useState(null);
  const [textoSeguimiento, setTextoSeguimiento] = useState('');
  const [guardando, setGuardando] = useState(false);

  const cargar = useCallback(async () => {
    try {
      const datos = await listarSituaciones({ q: busqueda, estado: filtroEstado });
      setSituaciones(datos);
      setError('');
    } catch (err) {
      setError(mensajeDeError(err, 'No se pudieron cargar las situaciones'));
    } finally {
      setCargando(false);
    }
  }, [busqueda, filtroEstado]);

  // La búsqueda espera 300 ms tras la última tecla para no saturar la API
  useEffect(() => {
    const temporizador = setTimeout(cargar, 300);
    return () => clearTimeout(temporizador);
  }, [cargar]);

  async function cambiarEstado(id, estado) {
    try {
      const actualizada = await actualizarSituacion(id, { estado });
      setSituaciones((lista) => lista.map((s) => (s.id === id ? actualizada : s)));
    } catch (err) {
      setError(mensajeDeError(err, 'No se pudo cambiar el estado'));
    }
  }

  async function borrar(situacion) {
    if (!window.confirm(`¿Eliminar la situación "${situacion.tipo}" de ${situacion.autor?.nombre}? Esta acción no se puede deshacer.`)) {
      return;
    }
    try {
      await eliminarSituacion(situacion.id);
      setSituaciones((lista) => lista.filter((s) => s.id !== situacion.id));
    } catch (err) {
      setError(mensajeDeError(err, 'No se pudo eliminar la situación'));
    }
  }

  function abrirSeguimiento(situacion) {
    setEditando(situacion);
    setTextoSeguimiento(situacion.seguimiento || '');
  }

  async function guardarSeguimiento() {
    setGuardando(true);
    try {
      const actualizada = await actualizarSituacion(editando.id, { seguimiento: textoSeguimiento });
      setSituaciones((lista) => lista.map((s) => (s.id === actualizada.id ? actualizada : s)));
      setEditando(null);
    } catch (err) {
      setError(mensajeDeError(err, 'No se pudo guardar el seguimiento'));
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div>
      <h1 className="text-2xl">Gestión del sistema</h1>
      <p className="mb-5 text-ink-soft">Vista administrativa de las situaciones registradas.</p>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <input
          type="search"
          className="input max-w-xs"
          placeholder="🔍 Buscar por tipo, lugar, autor…"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
        <select className="input max-w-[11rem]" value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}>
          <option value="">Todos los estados</option>
          {ESTADOS.map((e) => (
            <option key={e} value={e}>{e}</option>
          ))}
        </select>
        <Link to="/app/registrar" className="btn btn-primary btn-sm ml-auto">+ Nuevo registro</Link>
      </div>

      <Alert>{error}</Alert>

      <div className="card overflow-x-auto !p-2">
        {cargando ? (
          <p className="py-10 text-center text-sm text-ink-soft">Cargando…</p>
        ) : situaciones.length === 0 ? (
          <p className="py-10 text-center text-sm text-ink-soft">📭 No hay situaciones que coincidan.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b-2 border-line text-xs text-ink-soft">
                <th className="px-4 py-3">Autor</th>
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Prioridad</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {situaciones.map((s) => (
                <tr key={s.id} className="border-b border-line last:border-0">
                  <td className="whitespace-nowrap px-4 py-3">{s.autor?.nombre}</td>
                  <td className="px-4 py-3">
                    {s.tipo}
                    <div className="max-w-xs truncate text-xs text-ink-soft" title={s.descripcion}>{s.descripcion}</div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">{s.fecha}</td>
                  <td className="px-4 py-3">{s.prioridad}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Badge estado={s.estado} />
                      <select
                        aria-label="Cambiar estado"
                        className="rounded-md border border-line bg-white px-1.5 py-1 text-xs"
                        value={s.estado}
                        onChange={(e) => cambiarEstado(s.id, e.target.value)}
                      >
                        {ESTADOS.map((e) => (
                          <option key={e} value={e}>{e}</option>
                        ))}
                      </select>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <button type="button" title="Seguimiento" className="px-1.5 opacity-75 hover:opacity-100" onClick={() => abrirSeguimiento(s)}>
                      ✏️
                    </button>
                    <button type="button" title="Eliminar" className="px-1.5 opacity-75 hover:opacity-100" onClick={() => borrar(s)}>
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {editando && (
        <div className="fixed inset-0 z-20 grid place-items-center bg-black/40 p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-soft">
            <h3 className="text-lg">Seguimiento del caso</h3>
            <p className="mb-3 text-sm text-ink-soft">
              {editando.tipo} · {editando.autor?.nombre} · {editando.fecha}
            </p>
            <p className="mb-4 rounded-lg bg-cream p-3 text-sm">{editando.descripcion}</p>
            <label className="label" htmlFor="seguimiento">Notas de seguimiento</label>
            <textarea
              id="seguimiento"
              rows={4}
              className="input"
              value={textoSeguimiento}
              onChange={(e) => setTextoSeguimiento(e.target.value)}
              placeholder="Acciones realizadas, próximos pasos…"
            />
            <div className="mt-5 flex justify-end gap-3">
              <button type="button" className="btn btn-ghost" onClick={() => setEditando(null)}>Cancelar</button>
              <button type="button" className="btn btn-primary" disabled={guardando} onClick={guardarSeguimiento}>
                {guardando ? 'Guardando…' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
