import { useState } from 'react';
import { Link } from 'react-router-dom';
import { crearSituacion } from '../services/situacionesService';
import { mensajeDeError } from '../services/api';
import { TIPOS_SITUACION } from '../data/contenido';
import Alert from '../components/Alert';

const FORM_INICIAL = { tipo: '', fecha: '', lugar: '', descripcion: '', prioridad: 'Medio' };

export default function RegistrarSituacion() {
  const [form, setForm] = useState(FORM_INICIAL);
  const [error, setError] = useState('');
  const [exito, setExito] = useState(false);
  const [enviando, setEnviando] = useState(false);

  function cambiar(e) {
    setForm((previo) => ({ ...previo, [e.target.name]: e.target.value }));
  }

  function cancelar() {
    setForm(FORM_INICIAL);
    setError('');
    setExito(false);
  }

  async function enviar(e) {
    e.preventDefault();
    setError('');
    setExito(false);

    if (!form.tipo || !form.fecha || !form.descripcion.trim()) {
      setError('Completa los campos obligatorios (*).');
      return;
    }

    setEnviando(true);
    try {
      await crearSituacion(form);
      setForm(FORM_INICIAL);
      setExito(true);
    } catch (err) {
      setError(mensajeDeError(err, 'No se pudo registrar la situación'));
    } finally {
      setEnviando(false);
    }
  }

  const prioridadStyles = {
    Bajo: {
      card: 'border-emerald-200 bg-emerald-50 text-emerald-700',
      dot: 'bg-emerald-500',
    },
    Medio: {
      card: 'border-amber-200 bg-amber-50 text-amber-700',
      dot: 'bg-amber-500',
    },
    Alto: {
      card: 'border-rose-200 bg-rose-50 text-rose-700',
      dot: 'bg-rose-500',
    },
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <section className="rounded-[28px] border border-line bg-white p-6 shadow-soft sm:p-8">
        <div className="pill-tag">Registro de casos</div>
        <h1 className="mt-4 text-4xl sm:text-5xl">Registrar una situación</h1>
        <p className="mt-3 max-w-2xl text-base text-ink-soft">
          Completa el formulario para reportar una situación de discriminación o desigualdad y recibir apoyo adecuado.
        </p>
      </section>

      <form onSubmit={enviar} className="rounded-[28px] border border-line bg-white p-5 shadow-soft sm:p-8" noValidate>
        <Alert>{error}</Alert>
        {exito && (
          <Alert tipo="ok">
            Situación registrada correctamente. Puedes ver su estado en{' '}
            <Link to="/app/seguimiento" className="font-semibold underline">Seguimiento</Link>.
          </Alert>
        )}

        <div className="grid gap-5 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="label" htmlFor="tipo">Tipo de situación *</label>
            <select id="tipo" name="tipo" className="input" value={form.tipo} onChange={cambiar}>
              <option value="">Seleccione una opción</option>
              {TIPOS_SITUACION.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label" htmlFor="fecha">Fecha de la situación *</label>
            <input id="fecha" name="fecha" type="date" className="input" value={form.fecha} onChange={cambiar} />
          </div>

          <div>
            <label className="label" htmlFor="lugar">Lugar</label>
            <input
              id="lugar"
              name="lugar"
              className="input"
              placeholder="Ej. Facultad de Ingeniería"
              value={form.lugar}
              onChange={cambiar}
            />
          </div>
        </div>

        <div className="mt-6">
          <label className="label" htmlFor="descripcion">Descripción *</label>
          <textarea
            id="descripcion"
            name="descripcion"
            rows={6}
            className="input resize-none"
            placeholder="Describa la situación, el contexto, las personas involucradas y cualquier detalle relevante..."
            value={form.descripcion}
            onChange={cambiar}
          />
        </div>

        <div className="mt-6">
          <span className="label">Nivel de prioridad</span>
          <div className="grid gap-3 sm:grid-cols-3">
            {['Bajo', 'Medio', 'Alto'].map((nivel) => {
              const selected = form.prioridad === nivel;
              const style = prioridadStyles[nivel];

              return (
                <label
                  key={nivel}
                  className={`flex cursor-pointer items-center justify-between rounded-[18px] border px-4 py-3 text-sm font-medium transition duration-200 ${
                    selected ? `${style.card} shadow-sm` : 'border-line bg-[#faf7f8] text-ink-soft hover:border-brand/30'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <span className={`h-3 w-3 rounded-full ${style.dot}`} />
                    {nivel}
                  </span>
                  <input
                    type="radio"
                    name="prioridad"
                    value={nivel}
                    checked={selected}
                    onChange={cambiar}
                    className="sr-only"
                  />
                </label>
              );
            })}
          </div>
        </div>

        <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button type="button" className="btn btn-ghost" onClick={cancelar}>
            Cancelar
          </button>
          <button type="submit" className="btn btn-primary" disabled={enviando}>
            {enviando ? 'Registrando…' : 'Registrar situación'}
          </button>
        </div>
      </form>
    </div>
  );
}
