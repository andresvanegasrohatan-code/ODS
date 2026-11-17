import { useEffect, useState } from 'react';
import Alert from '../components/Alert';
import { generarLlavesOrganizacion } from '../cripto';
import {
  obtenerLlaveOrganizacionAdministradora,
  guardarLlavesOrganizacion,
} from '../services/llavesOrganizacionService';
import { mensajeDeError } from '../services/api';

export default function AdminLlaves() {
  const [estado, setEstado] = useState('cargando');
  const [fechaCreacion, setFechaCreacion] = useState('');
  const [respaldoCifrado, setRespaldoCifrado] = useState(null);
  const [fraseMaestra, setFraseMaestra] = useState('');
  const [confirmacion, setConfirmacion] = useState('');
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    let vigente = true;
    obtenerLlaveOrganizacionAdministradora()
      .then((llave) => {
        if (!vigente) return;
        setFechaCreacion(llave.creadaEn);
        setRespaldoCifrado(llave);
        setEstado('configurada');
      })
      .catch((err) => {
        if (!vigente) return;
        if (err.response?.status === 404) {
          setEstado('sin-configurar');
          return;
        }
        setError(mensajeDeError(err, 'No se pudo consultar la configuración de llaves.'));
        setEstado('error');
      });

    return () => {
      vigente = false;
    };
  }, []);

  async function guardar(e) {
    e.preventDefault();
    setError('');
    setExito('');

    if (fraseMaestra.trim().length < 12) {
      setError('La frase maestra debe tener al menos 12 caracteres.');
      return;
    }
    if (fraseMaestra !== confirmacion) {
      setError('Las frases maestras no coinciden.');
      return;
    }

    setGuardando(true);
    try {
      const paquete = await generarLlavesOrganizacion(fraseMaestra);
      const respuesta = await guardarLlavesOrganizacion(paquete);
      setFechaCreacion(respuesta.creadaEn);
      setRespaldoCifrado(paquete);
      setEstado('configurada');
      setExito('Las llaves quedaron configuradas. La llave privada fue cifrada en este navegador antes de enviarse.');
      setFraseMaestra('');
      setConfirmacion('');
    } catch (err) {
      setError(mensajeDeError(err, 'No se pudieron guardar las llaves.'));
    } finally {
      setGuardando(false);
    }
  }

  function descargarRespaldo() {
    if (!respaldoCifrado) return;
    const archivo = new Blob([JSON.stringify(respaldoCifrado, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(archivo);
    const enlace = document.createElement('a');
    enlace.href = url;
    enlace.download = 'equigenero-respaldo-llaves-cifrado.json';
    enlace.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-line bg-white p-6 shadow-soft sm:p-8">
        <div className="pill-tag">Seguridad de denuncias</div>
        <h1 className="mt-4 text-4xl">Llaves de la organización</h1>
        <p className="mt-3 max-w-3xl leading-7 text-ink-soft">
          La llave pública permitirá cifrar las llaves de los casos para la organización. La llave privada se cifra
          localmente con tu frase maestra; el servidor recibe y almacena solo esa versión cifrada.
        </p>
      </section>

      <section className="rounded-[28px] border border-line bg-white p-5 shadow-soft sm:p-8">
        {error && <Alert>{error}</Alert>}
        {exito && <Alert tipo="ok">{exito}</Alert>}

        {estado === 'cargando' && <p className="text-ink-soft">Consultando la configuración…</p>}
        {estado === 'error' && !error && (
          <Alert>No se pudo verificar si ya hay una llave activa. Vuelve a cargar esta página.</Alert>
        )}

        {estado === 'configurada' && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
            <h2 className="text-xl font-semibold text-emerald-800">Llave de organización configurada</h2>
            <p className="mt-2 text-sm text-emerald-900">
              Fecha de creación: {fechaCreacion ? new Date(fechaCreacion).toLocaleString() : 'No disponible'}.
            </p>
            <p className="mt-3 text-sm leading-6 text-emerald-900">
              Por seguridad, esta pantalla no reemplaza una llave existente. Guarda la frase maestra fuera de línea y
              no la compartas. Si se pierde, no será posible abrir la copia cifrada de la llave privada.
            </p>
            <p className="mt-3 text-sm leading-6 text-emerald-900">
              El respaldo descargable contiene la llave privada cifrada, no la frase maestra ni la llave privada en claro.
              Guárdalo fuera de línea y conserva la frase maestra por separado.
            </p>
            <button type="button" className="btn btn-secondary mt-4" onClick={descargarRespaldo}>
              Descargar respaldo cifrado
            </button>
          </div>
        )}

        {estado === 'sin-configurar' && (
          <>
            <h2 className="text-2xl font-semibold">Generar el par RSA-OAEP</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-ink-soft">
              Se generará una llave RSA de 3072 bits con SHA-256. La llave privada se protegerá con AES-GCM y una llave
              derivada de tu frase maestra mediante PBKDF2 (600.000 iteraciones, SHA-256).
            </p>

            <form onSubmit={guardar} className="mt-6 max-w-xl space-y-4">
              <div>
                <label className="label" htmlFor="frase-maestra">Frase maestra</label>
                <input
                  id="frase-maestra"
                  className="input"
                  type="password"
                  autoComplete="new-password"
                  value={fraseMaestra}
                  onChange={(e) => setFraseMaestra(e.target.value)}
                  minLength={12}
                  required
                />
              </div>
              <div>
                <label className="label" htmlFor="confirmar-frase-maestra">Confirma la frase maestra</label>
                <input
                  id="confirmar-frase-maestra"
                  className="input"
                  type="password"
                  autoComplete="new-password"
                  value={confirmacion}
                  onChange={(e) => setConfirmacion(e.target.value)}
                  minLength={12}
                  required
                />
              </div>
              <p className="text-sm leading-6 text-amber-800">
                La llave privada no se envía en claro. La frase no se guarda en el navegador ni en el servidor.
                Si olvidas la frase, no podrás desbloquear la llave privada.
              </p>
              <button type="submit" className="btn btn-primary" disabled={guardando}>
                {guardando ? 'Generando y cifrando…' : 'Generar y guardar llaves'}
              </button>
            </form>
          </>
        )}
      </section>
    </div>
  );
}
