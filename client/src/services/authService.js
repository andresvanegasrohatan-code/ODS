import api from './api';

export async function registrarUsuario({ nombre, correo, contrasena }) {
  const { data } = await api.post('/auth/register', { nombre, correo, contrasena });
  return data;
}

export async function iniciarSesion({ correo, contrasena }) {
  const { data } = await api.post('/auth/login', { correo, contrasena });
  return data;
}

export async function obtenerPerfil() {
  const { data } = await api.get('/auth/me');
  return data.usuario;
}
