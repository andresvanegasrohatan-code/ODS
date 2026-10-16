const jwt = require('jsonwebtoken');
const { Usuario } = require('../models');

async function verificarToken(req, res, next) {
  try {
    const cabecera = req.headers.authorization || '';
    const [esquema, token] = cabecera.split(' ');

    if (esquema !== 'Bearer' || !token) {
      return res.status(401).json({ mensaje: 'Token de autenticación requerido' });
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const usuario = await Usuario.findByPk(payload.id);

    if (!usuario || !usuario.activo) {
      return res.status(401).json({ mensaje: 'Usuario no válido o inactivo' });
    }

    req.usuario = usuario;
    return next();
  } catch (error) {
    return res.status(401).json({ mensaje: 'Token inválido o expirado' });
  }
}

function requiereRol(...roles) {
  return (req, res, next) => {
    if (!req.usuario || !roles.includes(req.usuario.rol)) {
      return res.status(403).json({ mensaje: 'No tienes permisos para realizar esta acción' });
    }
    return next();
  };
}

module.exports = { verificarToken, requiereRol };
