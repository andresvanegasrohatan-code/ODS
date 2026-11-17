const { Router } = require('express');
const {
  acceder,
  crear,
  obtenerSales,
} = require('../controllers/casoController');
const conversacion = require('../controllers/casoConversacionController');
const { verificarToken, requiereRol } = require('../middleware/auth');
const { verificarAccesoCaso } = require('../middleware/casoAccess');

const router = Router();

router.post('/', crear);
router.get('/administracion', verificarToken, requiereRol('administrador'), conversacion.listarCasos);
router.patch(
  '/administracion/:id/estado',
  verificarToken,
  requiereRol('administrador'),
  conversacion.cambiarEstado
);
router.get('/:codigo/sales', obtenerSales);
router.post('/:codigo/acceso', acceder);
router.get('/:codigo/mensajes', verificarAccesoCaso, conversacion.listarMensajes);
router.post('/:codigo/mensajes', verificarAccesoCaso, conversacion.crearMensaje);
router.get('/:codigo/evidencias', verificarAccesoCaso, conversacion.listarEvidencias);
router.post('/:codigo/evidencias/:id/descarga', verificarAccesoCaso, conversacion.firmarDescargaEvidencia);
router.post('/:codigo/evidencias/cargas', verificarAccesoCaso, conversacion.crearCargaEvidencia);
router.post(
  '/:codigo/evidencias/cargas/:id/completar',
  verificarAccesoCaso,
  conversacion.completarCargaEvidencia
);
router.delete(
  '/:codigo/evidencias/cargas/:id',
  verificarAccesoCaso,
  conversacion.cancelarCargaEvidencia
);

module.exports = router;
