import api from './api';

export function obtenerLlaveOrganizacionAdministradora() {
  return api.get('/llaves-organizacion/administradora').then((response) => response.data);
}

export function guardarLlavesOrganizacion(paquete) {
  return api.post('/llaves-organizacion', paquete).then((response) => response.data);
}
