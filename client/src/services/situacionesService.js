import api from './api';

export async function listarSituaciones(filtros = {}) {
  const params = {};
  if (filtros.q) params.q = filtros.q;
  if (filtros.estado) params.estado = filtros.estado;
  if (filtros.tipo) params.tipo = filtros.tipo;
  const { data } = await api.get('/situaciones', { params });
  return data.situaciones;
}

export async function obtenerEstadisticas() {
  const { data } = await api.get('/situaciones/stats');
  return data;
}

export async function crearSituacion(payload) {
  const { data } = await api.post('/situaciones', payload);
  return data.situacion;
}

export async function actualizarSituacion(id, cambios) {
  const { data } = await api.patch(`/situaciones/${id}/estado`, cambios);
  return data.situacion;
}

export async function eliminarSituacion(id) {
  const { data } = await api.delete(`/situaciones/${id}`);
  return data;
}
