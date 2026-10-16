import api from './api';

export async function obtenerResumen(filtros = {}) {
  const params = {};
  Object.entries(filtros).forEach(([clave, valor]) => {
    if (valor) params[clave] = valor;
  });
  const { data } = await api.get('/reportes/resumen', { params });
  return data;
}
