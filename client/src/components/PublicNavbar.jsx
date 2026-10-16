import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function PublicNavbar() {
  const { usuario } = useAuth();

  return (
    <header className="border-b border-line bg-[#f7f2ee]/90 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-y-3 px-5 py-4 sm:px-8">
        <Link to="/" className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-brand to-brand-dark text-lg font-bold text-white shadow-soft">
            E
          </span>
          <div>
            <div className="font-display text-2xl leading-none text-brand-dark">EquiGénero</div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-ink-soft">ODS 5</div>
          </div>
        </Link>

        <nav aria-label="Navegación principal" className="order-3 flex w-full items-center justify-center gap-5 text-xs font-medium sm:gap-7 sm:text-sm md:order-none md:w-auto">
          <a href="#que-es" className="text-ink-soft transition hover:text-brand-dark">
            Conócenos
          </a>
          <a href="#servicios" className="text-ink-soft transition hover:text-brand-dark">
            Servicios
          </a>
          <a href="#educacion" className="text-ink-soft transition hover:text-brand-dark">
            Educación
          </a>
          <a href="#oportunidades" className="text-ink-soft transition hover:text-brand-dark">
            Oportunidades
          </a>
        </nav>

        {usuario ? (
          <Link to="/app" className="btn btn-primary btn-sm">
            Ir a mi panel
          </Link>
        ) : (
          <Link to="/acceso" className="btn btn-primary btn-sm">
            Entrar
          </Link>
        )}
      </div>
    </header>
  );
}
