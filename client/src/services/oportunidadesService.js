import api from './api';

export async function listarOportunidades() {
  const { data } = await api.get('/oportunidades');
  return data.oportunidades;
}
