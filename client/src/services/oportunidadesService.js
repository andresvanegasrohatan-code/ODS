import api from './api';

export async function listarOportunidades() {
  const { data } = await api.get('/oportunidades');
  if (!Array.isArray(data?.oportunidades)) {
    throw new Error('La API no devolvió una lista de oportunidades válida');
  }
  return data.oportunidades;
}
