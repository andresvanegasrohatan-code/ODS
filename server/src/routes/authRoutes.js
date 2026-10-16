const { Router } = require('express');
const rateLimit = require('express-rate-limit');
const { registrar, iniciarSesion, perfil } = require('../controllers/authController');
const { verificarToken } = require('../middleware/auth');

const router = Router();

const limitadorAuth = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  message: { mensaje: 'Demasiados intentos, inténtalo de nuevo en unos minutos' },
});

router.post('/register', limitadorAuth, registrar);
router.post('/login', limitadorAuth, iniciarSesion);
router.get('/me', verificarToken, perfil);

module.exports = router;
