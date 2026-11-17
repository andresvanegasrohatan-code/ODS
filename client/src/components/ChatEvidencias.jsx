import { useCallback, useEffect, useRef, useState } from 'react';
import Alert from './Alert';
import {
  cifrarEvidencia,
  cifrarMensajeCaso,
  descifrarEvidencia,
  descifrarMetadatosEvidencia,
  descifrarMensajeCaso,
} from '../cripto';
import {
  cancelarCargaEvidencia,
  completarCargaEvidencia,
  crearCargaEvidencia,
  crearMensajeCaso,
  obtenerEvidenciasCaso,
  obtenerMensajesCaso,
  obtenerUrlDescargaEvidencia,
  subirEvidenciaSupabase,
} from '../services/casosService';
import { mensajeDeError } from '../services/api';

function nombreSeguro(nombre) {
  return nombre.replace(/[\\/:*?"<>|\u0000-\u001f]/g, '_').slice(0, 255) || 'evidencia';
}

export default function ChatEvidencias({ codigo, llaveCaso, token }) {
  const [mensajes, setMensajes] = useState([]);
  const [evidencias, setEvidencias] = useState([]);
  const [texto, setTexto] = useState('');
  const [cargando, setCargando] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState('');
  const enCurso = useRef(false);

  const actualizar = useCallback(async () => {
    if (enCurso.current) return;
    enCurso.current = true;
    try {
      const [mensajesCifrados, evidenciasCifradas] = await Promise.all([
        obtenerMensajesCaso(codigo, token),
        obtenerEvidenciasCaso(codigo, token),
      ]);
      const [mensajesAbiertos, evidenciasAbiertas] = await Promise.all([
        Promise.all(mensajesCifrados.map(async (mensaje) => ({
          ...mensaje,
          texto: await descifrarMensajeCaso(llaveCaso, mensaje),
        }))),
        Promise.all(evidenciasCifradas.map(async (evidencia) => ({
          ...evidencia,
          ...await descifrarMetadatosEvidencia(llaveCaso, evidencia),
        }))),
      ]);
      setMensajes(mensajesAbiertos);
      setEvidencias(evidenciasAbiertas);
      setError('');
    } catch (err) {
      setError(mensajeDeError(err, 'No se pudieron actualizar los mensajes y evidencias.'));
    } finally {
      enCurso.current = false;
    }
  }, [codigo, llaveCaso, token]);

  useEffect(() => {
    let vigente = true;
    async function cargar() {
      if (vigente) await actualizar();
    }
    cargar();
    const intervalo = window.setInterval(cargar, 10_000);
    return () => {
      vigente = false;
      window.clearInterval(intervalo);
    };
  }, [actualizar]);

  async function enviarMensaje(evento) {
    evento.preventDefault();
    setError('');
    setCargando(true);
    try {
      const paquete = await cifrarMensajeCaso(llaveCaso, texto);
      await crearMensajeCaso(codigo, paquete, token);
      setTexto('');
      await actualizar();
    } catch (err) {
      setError(mensajeDeError(err, 'No se pudo enviar el mensaje cifrado.'));
    } finally {
      setCargando(false);
    }
  }

  async function subirArchivo(evento) {
    const archivo = evento.target.files?.[0];
    evento.target.value = '';
    if (!archivo) return;
    setError('');
    setOcupado(true);
    let carga;
    try {
      const paquete = await cifrarEvidencia(llaveCaso, archivo);
      carga = await crearCargaEvidencia(codigo, {
        contenidoIv: paquete.contenidoIv,
        metadatosCifrados: paquete.metadatosCifrados,
        metadatosIv: paquete.metadatosIv,
        tamanoCifrado: paquete.contenidoCifrado.byteLength,
      }, token);
      await subirEvidenciaSupabase(
        carga.ruta,
        carga.token,
        new Blob([paquete.contenidoCifrado], { type: 'application/octet-stream' })
      );
      await completarCargaEvidencia(codigo, carga.id, token);
      await actualizar();
    } catch (err) {
      let mensaje = mensajeDeError(err, 'No se pudo cifrar o cargar la evidencia.');
      if (carga?.id) {
        try {
          await cancelarCargaEvidencia(codigo, carga.id, token);
        } catch {
          mensaje += ' La carga incompleta no pudo limpiarse; solicita apoyo a la administradora.';
        }
      }
      setError(mensaje);
    } finally {
      setOcupado(false);
    }
  }

  async function descargar(evidencia) {
    setError('');
    try {
      const url = await obtenerUrlDescargaEvidencia(codigo, evidencia.id, token);
      const response = await fetch(url);
      if (!response.ok) throw new Error('No se pudo descargar el archivo cifrado');
      const bytesCifrados = new Uint8Array(await response.arrayBuffer());
      const claro = await descifrarEvidencia(llaveCaso, evidencia, bytesCifrados);
      const archivo = new Blob([claro], { type: evidencia.tipo });
      const urlTemporal = URL.createObjectURL(archivo);
      const enlace = document.createElement('a');
      enlace.href = urlTemporal;
      enlace.download = nombreSeguro(evidencia.nombre);
      enlace.click();
      window.setTimeout(() => URL.revokeObjectURL(urlTemporal), 1000);
    } catch (err) {
      setError(mensajeDeError(err, 'No se pudo descargar o descifrar la evidencia.'));
    }
  }

  return (
    <section className="mt-6 rounded-[28px] border border-line bg-white p-5 shadow-soft sm:p-7">
      <h2 className="text-2xl font-semibold">Mensajes y evidencias cifrados</h2>
      <p className="mt-2 text-sm leading-6 text-ink-soft">
        Los mensajes se consultan cada 10 segundos. Los archivos se cifran aquí antes de subirlos al almacenamiento privado.
      </p>
      {error && <div className="mt-4"><Alert>{error}</Alert></div>}

      <div className="mt-5 max-h-96 space-y-3 overflow-y-auto rounded-2xl bg-[#f8f3ee] p-4" aria-live="polite">
        {mensajes.length === 0 && <p className="text-sm text-ink-soft">Aún no hay mensajes.</p>}
        {mensajes.map((mensaje) => (
          <article key={mensaje.id} className="rounded-xl bg-white p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-dark">
              {mensaje.autor === 'denunciante' ? 'Denunciante' : 'Administradora'}
              {' · '}
              {new Date(mensaje.creadoEn).toLocaleString()}
            </p>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-6">{mensaje.texto}</p>
          </article>
        ))}
      </div>

      <form onSubmit={enviarMensaje} className="mt-4 space-y-3">
        <label className="label" htmlFor={`mensaje-${codigo}`}>Escribe un mensaje</label>
        <textarea
          id={`mensaje-${codigo}`}
          className="input resize-y"
          rows={3}
          maxLength={50_000}
          value={texto}
          onChange={(evento) => setTexto(evento.target.value)}
          required
        />
        <button type="submit" className="btn btn-primary" disabled={cargando || !texto.trim()}>
          {cargando ? 'Cifrando…' : 'Enviar mensaje'}
        </button>
      </form>

      <div className="mt-6 border-t border-line pt-5">
        <h3 className="text-lg font-semibold">Evidencias</h3>
        <p className="mt-1 text-sm text-ink-soft">Imágenes o PDF, máximo 10 MB por archivo.</p>
        <label className="btn btn-secondary mt-3 inline-flex cursor-pointer">
          {ocupado ? 'Cifrando y subiendo…' : 'Agregar evidencia'}
          <input
            className="sr-only"
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif,application/pdf"
            disabled={ocupado}
            onChange={subirArchivo}
          />
        </label>
        {evidencias.length > 0 && (
          <ul className="mt-4 divide-y divide-line">
            {evidencias.map((evidencia) => (
              <li key={evidencia.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <span className="break-all text-sm">{evidencia.nombre}</span>
                <button type="button" className="btn btn-outline btn-sm" onClick={() => descargar(evidencia)}>
                  Descargar y descifrar
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
