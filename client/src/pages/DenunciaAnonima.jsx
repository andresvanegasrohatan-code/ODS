import { useState } from 'react';
import { Link } from 'react-router-dom';
import Alert from '../components/Alert';
import ChatEvidencias from '../components/ChatEvidencias';
import PublicNavbar from '../components/PublicNavbar';
import {
  derivarVerificador,
  descifrarCasoDenuncianteCompleto,
  prepararCasoAnonimo,
} from '../cripto';
import {
  accederCaso,
  crearCasoAnonimo,
  obtenerLlavePublicaOrganizacion,
  obtenerSalesCaso,
} from '../services/casosService';

const FORM_INICIAL = {
  titulo: '',
  tipo: 'Discriminación laboral',
  descripcion: '',
  fraseSecreta: '',
};

const CONSULTA_INICIAL = { codigo: '', fraseSecreta: '' };

const TIPOS_SITUACION = [
  'Discriminación laboral',
  'Violencia de género',
  'Hostigamiento',
  'Desigualdad educativa',
  'Acoso digital',
  'Otro',
];

export default function DenunciaAnonima() {
  const [form, setForm] = useState(FORM_INICIAL);
  const [codigo, setCodigo] = useState('');
  const [consulta, setConsulta] = useState(CONSULTA_INICIAL);
  const [contenidoCaso, setContenidoCaso] = useState(null);
  const [sesionCaso, setSesionCaso] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');

  function cambiar(e) {
    setForm((previo) => ({ ...previo, [e.target.name]: e.target.value }));
  }

  function cambiarConsulta(e) {
    setConsulta((previo) => ({ ...previo, [e.target.name]: e.target.value }));
  }

  function limpiarAntesDeSalir() {
    setForm(FORM_INICIAL);
    setCodigo('');
    setConsulta(CONSULTA_INICIAL);
    setContenidoCaso(null);
    setSesionCaso(null);
    setError('');
    setExito('');
  }

  async function enviar(e) {
    e.preventDefault();
    setError('');
    setExito('');
    setCodigo('');
    setContenidoCaso(null);
    setSesionCaso(null);

    if (!form.titulo.trim() || !form.descripcion.trim() || form.fraseSecreta.trim().length < 12) {
      setError('Completa el reporte y define una frase secreta de al menos 12 caracteres.');
      return;
    }

    setCargando(true);
    try {
      const { publicaSpki } = await obtenerLlavePublicaOrganizacion();
      const paqueteCifrado = await prepararCasoAnonimo({ ...form, publicaSpki });
      const respuesta = await crearCasoAnonimo(paqueteCifrado);
      setCodigo(respuesta.codigo);
      setExito('La denuncia fue cifrada y registrada. Conserva el código y tu frase secreta por separado.');
      setForm(FORM_INICIAL);
    } catch (err) {
      setError(err?.response?.data?.mensaje || 'No se pudo registrar la denuncia. Inténtalo nuevamente.');
    } finally {
      setCargando(false);
    }
  }

  async function consultar(e) {
    e.preventDefault();
    setError('');
    setExito('');
    setContenidoCaso(null);
    setSesionCaso(null);

    const codigoConsulta = consulta.codigo.trim().toUpperCase();
    if (!codigoConsulta || consulta.fraseSecreta.trim().length < 12) {
      setError('Ingresa el código y una frase secreta de al menos 12 caracteres.');
      return;
    }

    setCargando(true);
    try {
      const sales = await obtenerSalesCaso(codigoConsulta);
      const verificadorDerivado = await derivarVerificador(consulta.fraseSecreta, sales.salVerificador);
      const caso = await accederCaso(codigoConsulta, verificadorDerivado);
      const { contenido, llaveCaso } = await descifrarCasoDenuncianteCompleto(consulta.fraseSecreta, caso);
      setContenidoCaso({ ...contenido, estado: caso.estado });
      setSesionCaso({ codigo: caso.codigo, llaveCaso, token: caso.sessionToken });
      setExito('Acceso correcto. El contenido se descifró en este navegador.');
    } catch (err) {
      setError(err?.response?.data?.mensaje || 'No se pudo autenticar el caso. Revisa el código y la frase secreta.');
    } finally {
      setConsulta((previo) => ({ ...previo, fraseSecreta: '' }));
      setCargando(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f7f2ee] text-ink">
      <PublicNavbar onSalidaRapida={limpiarAntesDeSalir} />

      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="rounded-[32px] border border-line bg-gradient-to-br from-[#2a1630] via-[#3f2137] to-[#5f3058] p-6 text-white shadow-soft sm:p-8">
          <div className="pill-tag border border-white/20 bg-white/10 text-white">Denuncia anónima</div>
          <h1 className="mt-4 text-4xl sm:text-5xl">Reporta sin crear cuenta</h1>
          <p className="mt-4 max-w-3xl leading-7 text-white/80">
            El título, el tipo y la descripción se cifran en este navegador. El servidor recibe el texto cifrado, las
            llaves del caso envueltas y un verificador derivado. Nunca recibe tu frase secreta.
          </p>
        </section>

        <form onSubmit={enviar} className="mt-6 rounded-[30px] border border-line bg-white p-5 shadow-soft sm:p-8">
          <Alert>{error}</Alert>
          {exito && <Alert tipo="ok">{exito}</Alert>}

          <div className="space-y-5">
            <div>
              <label className="label" htmlFor="titulo">Título del reporte</label>
              <input
                id="titulo"
                name="titulo"
                className="input"
                value={form.titulo}
                onChange={cambiar}
                maxLength={200}
                required
              />
            </div>

            <div>
              <label className="label" htmlFor="tipo">Tipo de situación</label>
              <select id="tipo" name="tipo" className="input" value={form.tipo} onChange={cambiar}>
                {TIPOS_SITUACION.map((tipo) => <option key={tipo} value={tipo}>{tipo}</option>)}
              </select>
            </div>

            <div>
              <label className="label" htmlFor="descripcion">Descripción</label>
              <textarea
                id="descripcion"
                name="descripcion"
                rows={7}
                className="input resize-y"
                value={form.descripcion}
                onChange={cambiar}
                maxLength={100_000}
                required
              />
            </div>

            <div>
              <label className="label" htmlFor="fraseSecreta">Frase secreta</label>
              <input
                id="fraseSecreta"
                name="fraseSecreta"
                className="input"
                type="password"
                autoComplete="new-password"
                value={form.fraseSecreta}
                onChange={cambiar}
                minLength={12}
                required
              />
              <p className="mt-2 text-sm leading-6 text-ink-soft">
                La frase no se envía al servidor ni se guarda en el navegador. Si la olvidas, no podrás abrir tu copia
                de la llave del caso.
              </p>
            </div>
          </div>

          <button type="submit" className="btn btn-primary mt-7" disabled={cargando}>
            {cargando ? 'Cifrando y registrando…' : 'Enviar denuncia anónima'}
          </button>
        </form>

        {codigo && (
          <section className="mt-6 rounded-[28px] border border-brand/20 bg-brand-tint p-5 shadow-soft sm:p-7">
            <h2 className="text-2xl font-semibold text-brand-dark">Guarda tu código de seguimiento</h2>
            <div className="mt-4 inline-flex rounded-xl border border-brand/20 bg-white px-4 py-3 font-mono text-2xl font-bold tracking-[0.3em] text-brand-dark">
              {codigo}
            </div>
            <p className="mt-4 text-sm leading-6 text-ink-soft">
              La frase secreta que elegiste no se muestra ni se guarda. Anótala por separado para consultar tu caso.
            </p>
          </section>
        )}

        <form onSubmit={consultar} className="mt-6 rounded-[30px] border border-line bg-white p-5 shadow-soft sm:p-8">
          <h2 className="text-2xl font-semibold">Consultar un caso</h2>
          <p className="mt-2 text-sm leading-6 text-ink-soft">
            Se consulta primero el verificador con sales anónimas; la frase se usa solo en este navegador para calcular
            la llave y abrir el contenido.
          </p>
          <div className="mt-5 grid gap-5 md:grid-cols-2">
            <div>
              <label className="label" htmlFor="codigoConsulta">Código de seguimiento</label>
              <input
                id="codigoConsulta"
                name="codigo"
                className="input uppercase"
                value={consulta.codigo}
                onChange={cambiarConsulta}
                maxLength={12}
                autoComplete="off"
                required
              />
            </div>
            <div>
              <label className="label" htmlFor="fraseConsulta">Frase secreta</label>
              <input
                id="fraseConsulta"
                name="fraseSecreta"
                className="input"
                type="password"
                autoComplete="new-password"
                value={consulta.fraseSecreta}
                onChange={cambiarConsulta}
                minLength={12}
                required
              />
            </div>
          </div>
          <button type="submit" className="btn btn-secondary mt-6" disabled={cargando}>
            {cargando ? 'Verificando…' : 'Consultar caso'}
          </button>
        </form>

        {contenidoCaso && (
          <section className="mt-6 rounded-[28px] border border-line bg-white p-5 shadow-soft sm:p-7">
            <h2 className="text-2xl font-semibold">Caso descifrado en el navegador</h2>
            <p className="mt-4 text-sm uppercase tracking-[0.16em] text-ink-soft">Estado</p>
            <p className="mt-1 font-semibold text-brand-dark">{contenidoCaso.estado}</p>
            <p className="mt-4 text-sm uppercase tracking-[0.16em] text-ink-soft">Título</p>
            <h3 className="mt-1 text-xl font-semibold">{contenidoCaso.titulo}</h3>
            <p className="mt-4 text-sm uppercase tracking-[0.16em] text-ink-soft">Tipo</p>
            <p className="mt-1">{contenidoCaso.tipo}</p>
            <p className="mt-4 text-sm uppercase tracking-[0.16em] text-ink-soft">Descripción</p>
            <p className="mt-1 whitespace-pre-wrap leading-7 text-ink-soft">{contenidoCaso.descripcion}</p>
          </section>
        )}

        {sesionCaso && (
          <ChatEvidencias
            codigo={sesionCaso.codigo}
            llaveCaso={sesionCaso.llaveCaso}
            token={sesionCaso.token}
          />
        )}

        <div className="mt-8 text-center text-sm text-ink-soft">
          <Link to="/" className="font-semibold text-brand-dark underline">Volver al inicio</Link>
        </div>
      </main>
    </div>
  );
}
