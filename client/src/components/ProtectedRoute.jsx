import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ soloAdmin = false }) {
  const { usuario, cargando, esAdmin } = useAuth();

  if (cargando) {
    return <div className="grid min-h-screen place-items-center text-ink-soft">Cargando…</div>;
  }
  if (!usuario) {
    return <Navigate to="/acceso" replace />;
  }
  if (soloAdmin && !esAdmin) {
    return <Navigate to="/app" replace />;
  }
  return <Outlet />;
}
