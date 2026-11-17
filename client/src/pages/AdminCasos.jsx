import { useState } from 'react';
import Alert from '../components/Alert';
import ChatEvidencias from '../components/ChatEvidencias';
import { abrirLlavePrivadaOrganizacion, descifrarCasoOrganizacion } from '../cripto';
import { mensajeDeError } from '../services/api';
import {
  actualizarEstadoCaso,
  obtenerCasosAdministracion,
} from '../services/casosService';
import { obtenerLlaveOrganizacionAdministradora } from '../services/llavesOrganizacionService';

export default function AdminCasos() {
  const [fraseMaestra, setFraseMaestra] = useState('');
  const [llavePrivada, setLlavePrivada] = useState(null);
  const [casos, setCasos] = useState([]);
  const [seleccionado, setSeleccionado] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [cambiandoEstado, setCambiandoEstado] = useState(false);

  async function desbloquear(evento) {
    evento.preventDefault();
    setError('');
    setCargando(true);
    try {
      const paquete = await obtenerLlaveOrganizacionAdministradora();
      const privada = await abrirLlavePrivadaOrganizacion({ ...paquete, fraseMaestra });
      const lista = await obtenerCasosAdministracion();
      setLlavePrivada(privada);
      setCasos(lista);
      setSeleccionado(null);
    } catch (err) {
      setError(mensajeDeError(err, 'No se pudo desbloquear la llave privada o cargar los casos.'));
    } finally {
      setFraseMaestra('');
      setCargando(false);
    }
  }

  async function abrirCaso(caso) {
    if (!llavePrivada) return;
    setError('');
    setCargando(true);
    try {
      const { contenido, llaveCaso } = await descifrarCasoOrganizacion(caso, llavePrivada);
      setSeleccionado({ ...caso, ...contenido, llaveCaso });
    } catch {
      setError('No se pudo descifrar este caso con la llave de organización desbloqueada.');
    } finally {
      setCargando(false);
    }
  }

  async function cambiarEstado(estado) {
    if (!seleccionado) return;
    setError('');
    setCambiandoEstado(true);
    try {
      const respuesta = await actualizarEstadoCaso(seleccionado.id, estado);
      setSeleccionado((actual) => ({ ...actual, estado: respuesta.estado }));
      setCasos((actuales) => actuales.map((caso) => (
        caso.id === seleccionado.id ? { ...caso, estado: respuesta.estado } : caso
      )));
    } catch (err) {
      setError(mensajeDeError(err, 'No se pudo actualizar el estado del caso.'));
    } finally {
      setCambiandoEstado(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-line bg-white p-6 shadow-soft sm:p-8">
        <div className="pill-tag">Acceso administrativo</div>
        <h1 className="mt-4 text-4xl">Denuncias anónimas</h1>
        <p className="mt-3 max-w-3xl leading-7 text-ink-soft">
          La llave privada se descifra y permanece en memoria de este navegador. El servidor entrega datos cifrados;
          los casos y mensajes se descifran localmente.
        </p>
      </section>

      {error && <Alert>{error}</Alert>}

      {!llavePrivada ? (
        <form onSubmit={desbloquear} className="rounded-[28px] border border-line bg-white p-6 shadow-soft sm:p-8">
          <label className="label" htmlFor="frase-maestra-casos">Frase maestra de la administradora</label>
          <input
            id="frase-maestra-casos"
            className="input mt-2 max-w-xl"
            type="password"
            autoComplete="current-password"
            value={fraseMaestra}
            onChange={(evento) => setFraseMaestra(evento.target.value)}
            minLength={12}
            required
          />
          <p className="mt-3 text-sm text-ink-soft">La frase no se envía al servidor ni se conserva después del intento.</p>
          <button type="submit" className="btn btn-primary mt-5" disabled={cargando}>
            {cargando ? 'Desbloqueando…' : 'Desbloquear y cargar casos'}
          </button>
        </form>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(240px,0.8fr)_minmax(0,1.5fr)]">
          <section className="rounded-[28px] border border-line bg-white p-5 shadow-soft">
            <h2 className="text-xl font-semibold">Casos ({casos.length})</h2>
            <ul className="mt-4 space-y-2">
              {casos.map((caso) => (
                <li key={caso.id}>
                  <button
                    type="button"
                    className={`w-full rounded-xl border p-3 text-left transition ${
                      seleccionado?.id === caso.id ? 'border-brand bg-brand-tint' : 'border-line hover:bg-[#f8f3ee]'
                    }`}
                    onClick={() => abrirCaso(caso)}
                    disabled={cargando}
                  >
                    <span className="block font-mono font-semibold tracking-wider">{caso.codigo}</span>
                    <span className="mt-1 block text-sm text-ink-soft">
                      {caso.estado} · {new Date(caso.creadoEn).toLocaleDateString()}
                    </span>
                  </button>
                </li>
              ))}
              {casos.length === 0 && <li className="text-sm text-ink-soft">No hay casos registrados.</li>}
            </ul>
            <button
              type="button"
              className="btn btn-outline btn-sm mt-5"
              onClick={() => {
                setLlavePrivada(null);
                setSeleccionado(null);
                setCasos([]);
              }}
            >
              Bloquear llave
            </button>
          </section>

          {seleccionado ? (
            <div>
              <section className="rounded-[28px] border border-line bg-white p-5 shadow-soft sm:p-7">
                <h2 className="text-2xl font-semibold">{seleccionado.titulo}</h2>
                <p className="mt-2 text-sm text-ink-soft">{seleccionado.codigo} · {seleccionado.tipo}</p>
                <p className="mt-5 whitespace-pre-wrap leading-7">{seleccionado.descripcion}</p>
                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <label htmlFor="estado-caso" className="text-sm font-semibold">Estado</label>
                  <select
                    id="estado-caso"
                    className="input w-auto"
                    value={seleccionado.estado}
                    onChange={(evento) => cambiarEstado(evento.target.value)}
                    disabled={cambiandoEstado}
                  >
                    <option value="Pendiente">Pendiente</option>
                    <option value="Activo">Activo</option>
                    <option value="Resuelto">Resuelto</option>
                  </select>
                </div>
              </section>
              <ChatEvidencias codigo={seleccionado.codigo} llaveCaso={seleccionado.llaveCaso} />
            </div>
          ) : (
            <div className="rounded-[28px] border border-line bg-white p-7 text-ink-soft shadow-soft">
              Selecciona un caso para descifrarlo en este navegador.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
