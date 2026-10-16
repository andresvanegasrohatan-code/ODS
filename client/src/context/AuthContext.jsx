import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { TOKEN_KEY } from '../services/api';
import { iniciarSesion, obtenerPerfil, registrarUsuario } from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      setCargando(false);
      return;
    }
    obtenerPerfil()
      .then(setUsuario)
      .catch(() => localStorage.removeItem(TOKEN_KEY))
      .finally(() => setCargando(false));
  }, []);

  const login = useCallback(async (credenciales) => {
    const { usuario: u, token } = await iniciarSesion(credenciales);
    localStorage.setItem(TOKEN_KEY, token);
    setUsuario(u);
    return u;
  }, []);

  const registrar = useCallback(async (datos) => {
    const { usuario: u, token } = await registrarUsuario(datos);
    localStorage.setItem(TOKEN_KEY, token);
    setUsuario(u);
    return u;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setUsuario(null);
  }, []);

  const valor = useMemo(
    () => ({
      usuario,
      cargando,
      esAdmin: usuario?.rol === 'administrador',
      login,
      registrar,
      logout,
    }),
    [usuario, cargando, login, registrar, logout]
  );

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const contexto = useContext(AuthContext);
  if (!contexto) {
    throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  }
  return contexto;
}
