import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import AppLayout from './components/AppLayout';
import Home from './pages/Home';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import Educacion from './pages/Educacion';
import Oportunidades from './pages/Oportunidades';
import RegistrarSituacion from './pages/RegistrarSituacion';
import Seguimiento from './pages/Seguimiento';
import AdminSituaciones from './pages/AdminSituaciones';
import Reportes from './pages/Reportes';
import DenunciaAnonima from './pages/DenunciaAnonima';
import AdminLlaves from './pages/AdminLlaves';
import AdminCasos from './pages/AdminCasos';
import PaginaNeutra from './pages/PaginaNeutra';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/acceso" element={<Auth />} />
      <Route path="/denuncia-anonima" element={<DenunciaAnonima />} />
      <Route path="/salida-rapida" element={<PaginaNeutra />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/app" element={<AppLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="educacion" element={<Educacion />} />
          <Route path="oportunidades" element={<Oportunidades />} />
          <Route path="registrar" element={<RegistrarSituacion />} />
          <Route path="seguimiento" element={<Seguimiento />} />

          <Route element={<ProtectedRoute soloAdmin />}>
            <Route path="admin" element={<AdminSituaciones />} />
            <Route path="reportes" element={<Reportes />} />
            <Route path="llaves" element={<AdminLlaves />} />
            <Route path="casos-anonimos" element={<AdminCasos />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
