const { Op } = require('sequelize');
const { Situacion, Usuario } = require('../models');
const { ESTADOS } = require('../config/constants');

function contar(lista, campo) {
  const conteo = {};
  lista.forEach((item) => {
    const clave = item[campo];
    conteo[clave] = (conteo[clave] || 0) + 1;
  });
  return Object.entries(conteo).map(([nombre, total]) => ({ nombre, total }));
}

async function resumen(req, res, next) {
  try {
    const { desde, hasta, tipo, estado } = req.query;
    const where = {};

    if (desde || hasta) {
      where.fecha = {};
      if (desde) where.fecha[Op.gte] = desde;
      if (hasta) where.fecha[Op.lte] = hasta;
    }
    if (tipo) where.tipo = tipo;
    if (estado && ESTADOS.includes(estado)) where.estado = estado;

    const situaciones = await Situacion.findAll({
      where,
      include: [{ model: Usuario, as: 'autor', attributes: ['id', 'nombre', 'correo'] }],
      order: [['fecha', 'DESC']],
    });

    const plano = situaciones.map((s) => s.get({ plain: true }));

    const porMes = {};
    plano.forEach((s) => {
      const mes = String(s.fecha).slice(0, 7);
      porMes[mes] = (porMes[mes] || 0) + 1;
    });

    return res.json({
      total: plano.length,
      atendidos: plano.filter((s) => s.estado === 'Resuelto').length,
      pendientes: plano.filter((s) => s.estado !== 'Resuelto').length,
      porTipo: contar(plano, 'tipo'),
      porEstado: contar(plano, 'estado'),
      porPrioridad: contar(plano, 'prioridad'),
      porMes: Object.entries(porMes)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([nombre, total]) => ({ nombre, total })),
      registros: plano,
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = { resumen };
