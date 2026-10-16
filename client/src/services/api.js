import axios from 'axios';

export const TOKEN_KEY = 'equigenero_token';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
});

// Adjunta el token JWT a cada petición hacia rutas protegidas
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Si el token expira o es inválido, se limpia la sesión y se vuelve al login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config?.url || '';
    const esRutaAuth = url.includes('/auth/login') || url.includes('/auth/register');
    if (error.response?.status === 401 && !esRutaAuth) {
      localStorage.removeItem(TOKEN_KEY);
      if (window.location.pathname !== '/acceso') {
        window.location.href = '/acceso';
      }
    }
    return Promise.reject(error);
  }
);

export function mensajeDeError(error, porDefecto = 'Ocurrió un error inesperado') {
  return error?.response?.data?.mensaje || porDefecto;
}

export default api;
