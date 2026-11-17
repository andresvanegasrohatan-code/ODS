import axios from 'axios';
import api from './api';

const apiCaso = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
});

function clienteCaso(token) {
  if (!token) return api;
  return {
    get: (url) => apiCaso.get(url, { headers: { Authorization: `Bearer ${token}` } }),
    post: (url, body) => apiCaso.post(url, body, { headers: { Authorization: `Bearer ${token}` } }),
    delete: (url) => apiCaso.delete(url, { headers: { Authorization: `Bearer ${token}` } }),
  };
}

export function obtenerLlavePublicaOrganizacion() {
  return api.get('/llaves-organizacion/publica').then((response) => response.data);
}

export function crearCasoAnonimo(paqueteCifrado) {
  return api.post('/casos', paqueteCifrado).then((response) => response.data);
}

export function obtenerSalesCaso(codigo) {
  return api.get(`/casos/${encodeURIComponent(codigo)}/sales`).then((response) => response.data);
}

export function accederCaso(codigo, verificadorDerivado) {
  return api
    .post(`/casos/${encodeURIComponent(codigo)}/acceso`, { verificadorDerivado })
    .then((response) => response.data);
}

export function obtenerCasosAdministracion() {
  return api.get('/casos/administracion').then((response) => response.data);
}

export function actualizarEstadoCaso(id, estado) {
  return api.patch(`/casos/administracion/${encodeURIComponent(id)}/estado`, { estado })
    .then((response) => response.data);
}

export function obtenerMensajesCaso(codigo, token) {
  return clienteCaso(token).get(`/casos/${encodeURIComponent(codigo)}/mensajes`)
    .then((response) => response.data);
}

export function crearMensajeCaso(codigo, paquete, token) {
  return clienteCaso(token).post(`/casos/${encodeURIComponent(codigo)}/mensajes`, paquete)
    .then((response) => response.data);
}

export function obtenerEvidenciasCaso(codigo, token) {
  return clienteCaso(token).get(`/casos/${encodeURIComponent(codigo)}/evidencias`)
    .then((response) => response.data);
}

export function crearCargaEvidencia(codigo, paquete, token) {
  return clienteCaso(token).post(`/casos/${encodeURIComponent(codigo)}/evidencias/cargas`, paquete)
    .then((response) => response.data);
}

export function completarCargaEvidencia(codigo, id, token) {
  return clienteCaso(token).post(
    `/casos/${encodeURIComponent(codigo)}/evidencias/cargas/${encodeURIComponent(id)}/completar`,
    {}
  ).then((response) => response.data);
}

export function cancelarCargaEvidencia(codigo, id, token) {
  return clienteCaso(token).delete(
    `/casos/${encodeURIComponent(codigo)}/evidencias/cargas/${encodeURIComponent(id)}`
  );
}

export function obtenerUrlDescargaEvidencia(codigo, id, token) {
  return clienteCaso(token).post(
    `/casos/${encodeURIComponent(codigo)}/evidencias/${encodeURIComponent(id)}/descarga`,
    {}
  ).then((response) => response.data.urlFirmada);
}

export async function subirEvidenciaSupabase(ruta, token, blob) {
  const { VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_SUPABASE_EVIDENCIAS_BUCKET } = import.meta.env;
  if (!VITE_SUPABASE_URL || !VITE_SUPABASE_ANON_KEY) {
    throw new Error('Falta configurar la URL y la clave pública de Supabase en el cliente');
  }
  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { error } = await supabase.storage
    .from(VITE_SUPABASE_EVIDENCIAS_BUCKET || 'equigenero-evidencias')
    .uploadToSignedUrl(ruta, token, blob, { contentType: 'application/octet-stream', upsert: false });
  if (error) throw new Error('Supabase no aceptó la carga de la evidencia cifrada');
}
