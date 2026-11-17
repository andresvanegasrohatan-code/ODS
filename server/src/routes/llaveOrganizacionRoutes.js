const { Router } = require('express');
const {
  crear,
  obtenerCifrada,
  obtenerPublica,
} = require('../controllers/llaveOrganizacionController');
const { requiereRol, verificarToken } = require('../middleware/auth');

const router = Router();

router.get('/publica', obtenerPublica);
router.get('/administradora', verificarToken, requiereRol('administrador'), obtenerCifrada);
router.post('/', verificarToken, requiereRol('administrador'), crear);

module.exports = router;
