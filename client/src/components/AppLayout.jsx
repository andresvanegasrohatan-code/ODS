import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const MENU_USUARIO = [
  { to: '/app', etiqueta: 'Inicio', icono: '🏠', end: true },
  { to: '/app/educacion', etiqueta: 'Educación', icono: '📘' },
  { to: '/app/registrar', etiqueta: 'Registrar', icono: '📝' },
  { to: '/app/seguimiento', etiqueta: 'Seguimiento', icono: '📋' },
  { to: '/app/oportunidades', etiqueta: 'Oportunidades', icono: '🎓' },
];

const MENU_ADMIN = [
  { to: '/app', etiqueta: 'Dashboard', icono: '🏠', end: true },
  { to: '/app/admin', etiqueta: 'Situaciones', icono: '📋' },
  { to: '/app/educacion', etiqueta: 'Contenidos', icono: '📘' },
  { to: '/app/oportunidades', etiqueta: 'Oportunidades', icono: '🎓' },
  { to: '/app/reportes', etiqueta: 'Reportes', icono: '📊' },
];

export default function AppLayout() {
  const { usuario, esAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const menu = esAdmin ? MENU_ADMIN : MENU_USUARIO;

  function salir() {
    logout();
    navigate('/');
  }

  const claseLink = ({ isActive }) =>
    `flex items-center gap-3 whitespace-nowrap rounded-[12px] px-3 py-2.5 text-sm font-medium transition ${
      isActive ? 'bg-white text-brand-dark shadow-soft' : 'text-sidebar-text hover:bg-white/10 hover:text-white'
    }`;

  return (
    <div className="flex min-h-screen flex-col bg-[#f8f3ee] md:flex-row">
      <aside className="flex shrink-0 gap-2 overflow-x-auto border-b border-white/10 bg-[linear-gradient(180deg,#1d2f2b,#162621)] p-3 md:w-72 md:flex-col md:border-b-0 md:border-r md:p-5">
        <div className="flex items-center gap-3 px-2 py-2 md:mb-6">
          <div className="grid h-11 w-11 place-items-center rounded-full bg-gradient-to-br from-[#f5d6e3] to-[#a14c7a] text-lg font-bold text-white shadow-soft">
            E
          </div>
          <div>
            <div className="font-display text-xl leading-none text-white">EquiGénero</div>
            <div className="mt-1 text-[10px] uppercase tracking-[0.22em] text-[#d8e3db]">Panel</div>
          </div>
        </div>

        {menu.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.end} className={claseLink}>
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-white/8 text-sm">{item.icono}</span>
            {item.etiqueta}
          </NavLink>
        ))}

        <button
          type="button"
          onClick={salir}
          className="mt-2 flex items-center gap-3 whitespace-nowrap rounded-[12px] px-3 py-2.5 text-left text-sm font-medium text-sidebar-text transition hover:bg-white/10 hover:text-white md:mt-auto"
        >
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-white/8 text-sm">🚪</span>
          Salir
        </button>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-10 border-b border-line bg-white/80 px-5 py-4 backdrop-blur-sm md:px-8">
          <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
            <span className="text-xs font-bold uppercase tracking-[0.22em] text-ink-soft">
              {esAdmin ? 'Panel administrativo' : 'Mi panel'}
            </span>

            <div className="flex items-center gap-3 text-sm text-ink-soft">
              <span className="hidden sm:inline">{usuario.nombre}</span>
              <div className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-brand-tint to-[#e7dfff] text-sm font-bold text-brand-dark shadow-soft">
                {usuario.nombre.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-5xl px-5 py-6 md:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
