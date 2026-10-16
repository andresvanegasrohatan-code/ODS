import { useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { mensajeDeError } from '../services/api';
import Alert from '../components/Alert';

export default function Auth() {
  const [params] = useSearchParams();
  const [modo, setModo] = useState(params.get('modo') === 'registro' ? 'registro' : 'login');
  const [form, setForm] = useState({ nombre: '', correo: '', contrasena: '', confirmar: '' });
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);
  const { usuario, login, registrar } = useAuth();
  const navigate = useNavigate();

  if (usuario) {
    return <Navigate to="/app" replace />;
  }

  function cambiar(e) {
    setForm((previo) => ({ ...previo, [e.target.name]: e.target.value }));
  }

  function cambiarModo(nuevo) {
    setModo(nuevo);
    setError('');
  }

  async function enviar(e) {
    e.preventDefault();
    setError('');

    if (!form.correo || !form.contrasena) {
      setError('Ingresa tu correo y contraseña.');
      return;
    }
    if (modo === 'registro') {
      if (!form.nombre.trim()) {
        setError('Ingresa tu nombre completo.');
        return;
      }
      if (form.contrasena.length < 8) {
        setError('La contraseña debe tener al menos 8 caracteres.');
        return;
      }
      if (form.contrasena !== form.confirmar) {
        setError('Las contraseñas no coinciden.');
        return;
      }
    }

    setEnviando(true);
    try {
      const u =
        modo === 'login'
          ? await login({ correo: form.correo, contrasena: form.contrasena })
          : await registrar({ nombre: form.nombre, correo: form.correo, contrasena: form.contrasena });
      navigate(u.rol === 'administrador' ? '/app/admin' : '/app', { replace: true });
    } catch (err) {
      setError(mensajeDeError(err, 'No se pudo completar la operación'));
    } finally {
      setEnviando(false);
    }
  }

  const tab = (activo) =>
    `flex-1 rounded-full py-2 text-sm font-semibold transition ${
      activo ? 'bg-brand text-white shadow-soft' : 'text-ink-soft hover:text-ink'
    }`;

  return (
    <div className="min-h-screen bg-[#f8f2ee]">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 sm:px-10">
        <Link to="/" className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-brand to-brand-dark text-lg font-bold text-white shadow-soft">
            E
          </span>
          <span className="font-display text-2xl font-bold text-brand-dark">EquiGénero</span>
        </Link>
        <Link to="/" className="text-sm font-medium text-ink-soft transition hover:text-brand-dark">
          ← Volver al inicio
        </Link>
      </header>

      <div className="mx-auto grid max-w-6xl gap-8 px-4 pb-20 pt-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:px-10">
        <div className="relative overflow-hidden rounded-[30px] bg-[linear-gradient(135deg,rgba(24,34,47,0.85),rgba(48,65,73,0.68)),url('https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1200&q=80')] bg-cover bg-center p-8 text-white shadow-soft sm:p-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.15),transparent_38%)]" />
          <div className="relative z-10 max-w-lg">
            <span className="inline-flex rounded-full border border-white/25 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-white/90">
              ODS 5 · Igualdad de género
            </span>
            <h1 className="mt-6 font-display text-5xl leading-none sm:text-6xl">Construyamos espacios más justos.</h1>
            <p className="mt-5 text-base leading-7 text-white/80 sm:text-lg">
              Registrá situaciones, accedé a recursos y acompañá acciones de prevención, apoyo y transformación social.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {[
                ['180+', 'casos atendidos'],
                ['24/7', 'recursos'],
                ['8', 'regiones'],
              ].map(([valor, texto]) => (
                <div key={texto} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-sm">
                  <div className="font-display text-3xl leading-none text-white">{valor}</div>
                  <div className="mt-2 text-[11px] uppercase tracking-[0.18em] text-white/70">{texto}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="w-full rounded-[28px] border border-line bg-white p-6 shadow-soft sm:p-8 lg:p-10">
          <div className="mb-6 flex gap-1.5 rounded-full bg-cream p-1">
            <button type="button" className={tab(modo === 'login')} onClick={() => cambiarModo('login')}>
              Iniciar sesión
            </button>
            <button type="button" className={tab(modo === 'registro')} onClick={() => cambiarModo('registro')}>
              Crear cuenta
            </button>
          </div>

          <form onSubmit={enviar} noValidate>
            <Alert>{error}</Alert>

            {modo === 'registro' && (
              <div className="mb-4">
                <label className="label" htmlFor="nombre">Nombre completo</label>
                <input id="nombre" name="nombre" className="input" placeholder="Ana Martínez" value={form.nombre} onChange={cambiar} />
              </div>
            )}

            <div className="mb-4">
              <label className="label" htmlFor="correo">Correo electrónico</label>
              <input id="correo" name="correo" type="email" className="input" placeholder="usuario@correo.com" value={form.correo} onChange={cambiar} />
            </div>

            <div className="mb-4">
              <label className="label" htmlFor="contrasena">Contraseña</label>
              <input id="contrasena" name="contrasena" type="password" className="input" placeholder="••••••••" value={form.contrasena} onChange={cambiar} />
            </div>

            {modo === 'registro' && (
              <div className="mb-4">
                <label className="label" htmlFor="confirmar">Confirmar contraseña</label>
                <input id="confirmar" name="confirmar" type="password" className="input" placeholder="••••••••" value={form.confirmar} onChange={cambiar} />
              </div>
            )}

            <button type="submit" disabled={enviando} className="btn btn-primary mt-2 w-full">
              {enviando ? 'Procesando…' : modo === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-ink-soft">
            {modo === 'login' ? '¿No tienes una cuenta? ' : '¿Ya tienes cuenta? '}
            <button
              type="button"
              className="font-semibold text-brand underline"
              onClick={() => cambiarModo(modo === 'login' ? 'registro' : 'login')}
            >
              {modo === 'login' ? 'Crear cuenta' : 'Iniciar sesión'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
