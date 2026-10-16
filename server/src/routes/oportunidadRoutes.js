const { Router } = require('express');
const { listar } = require('../controllers/oportunidadController');

const router = Router();

router.get('/', listar);

module.exports = router;
