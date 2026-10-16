const { Router } = require('express');
const {
  listar,
  estadisticas,
  obtener,
  crear,
  actualizarEstado,
  eliminar,
} = require('../controllers/situacionController');
const { verificarToken, requiereRol } = require('../middleware/auth');

const router = Router();

router.use(verificarToken);

router.get('/', listar);
router.get('/stats', estadisticas);
router.post('/', crear);
router.get('/:id', obtener);
router.patch('/:id/estado', requiereRol('administrador'), actualizarEstado);
router.delete('/:id', requiereRol('administrador'), eliminar);

module.exports = router;
