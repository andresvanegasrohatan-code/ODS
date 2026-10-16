function noEncontrado(req, res) {
  res.status(404).json({ mensaje: `Ruta no encontrada: ${req.method} ${req.originalUrl}` });
}

// eslint-disable-next-line no-unused-vars
function manejarErrores(err, req, res, next) {
  if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
    return res.status(400).json({
      mensaje: err.errors && err.errors[0] ? err.errors[0].message : 'Datos inválidos',
    });
  }

  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ mensaje: 'El cuerpo de la petición no es un JSON válido' });
  }

  console.error('Error no controlado:', err);
  return res.status(500).json({ mensaje: 'Error interno del servidor' });
}

module.exports = { noEncontrado, manejarErrores };
