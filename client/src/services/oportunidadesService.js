import api from './api';

export async function listarOportunidades() {
  const { data } = await api.get('/oportunidades');
  if (!Array.isArray(data?.oportunidades)) {
    throw new Error('La API devolvió una respuesta inválida al cargar oportunidades.');
  }
  return data.oportunidades;
}
