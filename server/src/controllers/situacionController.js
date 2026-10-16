const { Op } = require('sequelize');
const { Situacion, Usuario, sequelize } = require('../models');
const { PRIORIDADES, ESTADOS, TIPOS_SITUACION } = require('../config/constants');

const operadorLike = sequelize.getDialect() === 'postgres' ? Op.iLike : Op.like;

function esAdmin(usuario) {
  return usuario.rol === 'administrador';
}

function incluirAutor() {
  return [{ model: Usuario, as: 'autor', attributes: ['id', 'nombre', 'correo'] }];
}

async function listar(req, res, next) {
  try {
    const { q, estado, tipo } = req.query;
    const where = {};

    if (!esAdmin(req.usuario)) {
      where.usuarioId = req.usuario.id;
    }
    if (estado && ESTADOS.includes(estado)) {
      where.estado = estado;
    }
    if (tipo) {
      where.tipo = tipo;
    }
    if (q && String(q).trim()) {
      const patron = `%${String(q).trim()}%`;
      where[Op.or] = [
        { tipo: { [operadorLike]: patron } },
        { lugar: { [operadorLike]: patron } },
        { descripcion: { [operadorLike]: patron } },
        { '$autor.nombre$': { [operadorLike]: patron } },
      ];
    }

    const situaciones = await Situacion.findAll({
      where,
      include: incluirAutor(),
      order: [['createdAt', 'DESC']],
    });

    return res.json({ situaciones });
  } catch (error) {
    return next(error);
  }
}

async function estadisticas(req, res, next) {
  try {
    const where = esAdmin(req.usuario) ? {} : { usuarioId: req.usuario.id };
    const situaciones = await Situacion.findAll({ where, attributes: ['estado'] });

    const porEstado = { Pendiente: 0, Activo: 0, Resuelto: 0 };
    situaciones.forEach((s) => {
      porEstado[s.estado] += 1;
    });

    return res.json({ total: situaciones.length, porEstado });
  } catch (error) {
    return next(error);
  }
}

async function obtener(req, res, next) {
  try {
    const situacion = await Situacion.findByPk(req.params.id, { include: incluirAutor() });

    if (!situacion) {
      return res.status(404).json({ mensaje: 'Situación no encontrada' });
    }
    if (!esAdmin(req.usuario) && situacion.usuarioId !== req.usuario.id) {
      return res.status(403).json({ mensaje: 'No tienes permisos para ver esta situación' });
    }

    return res.json({ situacion });
  } catch (error) {
    return next(error);
  }
}

async function crear(req, res, next) {
  try {
    const { tipo, fecha, lugar, descripcion, prioridad } = req.body;

    if (!tipo || !fecha || !descripcion || !String(descripcion).trim()) {
      return res.status(400).json({ mensaje: 'Tipo, fecha y descripción son obligatorios' });
    }
    if (!TIPOS_SITUACION.includes(tipo)) {
      return res.status(400).json({ mensaje: 'El tipo de situación no es válido' });
    }
    if (prioridad && !PRIORIDADES.includes(prioridad)) {
      return res.status(400).json({ mensaje: 'La prioridad no es válida' });
    }

    const situacion = await Situacion.create({
      tipo,
      fecha,
      lugar: lugar ? String(lugar).trim() : null,
      descripcion: String(descripcion).trim(),
      prioridad: prioridad || 'Medio',
      estado: 'Pendiente',
      seguimiento: '',
      usuarioId: req.usuario.id,
    });

    const creada = await Situacion.findByPk(situacion.id, { include: incluirAutor() });
    return res.status(201).json({ situacion: creada });
  } catch (error) {
    return next(error);
  }
}

// Actualiza el estado y/o el texto de seguimiento (solo administrador).
async function actualizarEstado(req, res, next) {
  try {
    const { estado, seguimiento } = req.body;
    const situacion = await Situacion.findByPk(req.params.id);

    if (!situacion) {
      return res.status(404).json({ mensaje: 'Situación no encontrada' });
    }
    if (estado === undefined && seguimiento === undefined) {
      return res.status(400).json({ mensaje: 'Debes enviar un estado o un seguimiento' });
    }
    if (estado !== undefined) {
      if (!ESTADOS.includes(estado)) {
        return res.status(400).json({ mensaje: 'El estado no es válido' });
      }
      situacion.estado = estado;
    }
    if (seguimiento !== undefined) {
      situacion.seguimiento = String(seguimiento).trim();
    }

    await situacion.save();
    const actualizada = await Situacion.findByPk(situacion.id, { include: incluirAutor() });
    return res.json({ situacion: actualizada });
  } catch (error) {
    return next(error);
  }
}

async function eliminar(req, res, next) {
  try {
    const situacion = await Situacion.findByPk(req.params.id);

    if (!situacion) {
      return res.status(404).json({ mensaje: 'Situación no encontrada' });
    }

    await situacion.destroy();
    return res.json({ mensaje: 'Situación eliminada correctamente' });
  } catch (error) {
    return next(error);
  }
}

module.exports = { listar, estadisticas, obtener, crear, actualizarEstado, eliminar };
