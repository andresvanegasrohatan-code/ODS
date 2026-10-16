const { Oportunidad } = require('../models');

async function listar(req, res, next) {
  try {
    const oportunidades = await Oportunidad.findAll({
      where: { activo: true },
      order: [
        ['orden', 'ASC'],
        ['id', 'ASC'],
      ],
    });
    return res.json({ oportunidades });
  } catch (error) {
    return next(error);
  }
}

module.exports = { listar };
