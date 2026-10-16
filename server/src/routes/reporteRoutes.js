const { Router } = require('express');
const { resumen } = require('../controllers/reporteController');
const { verificarToken, requiereRol } = require('../middleware/auth');

const router = Router();

router.get('/resumen', verificarToken, requiereRol('administrador'), resumen);

module.exports = router;
