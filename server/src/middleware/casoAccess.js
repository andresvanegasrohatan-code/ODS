const jwt = require('jsonwebtoken');
const { CasoAnonimo, Usuario } = require('../models');

function leerBearer(req) {
  const [scheme, token] = (req.headers.authorization || '').split(' ');
  return scheme === 'Bearer' ? token : null;
}

async function verificarAccesoCaso(req, res, next) {
  const token = leerBearer(req);
  if (!token) {
    return res.status(401).json({ mensaje: 'Se requiere una sesión válida para el caso' });
  }

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return res.status(401).json({ mensaje: 'La sesión del caso expiró o no es válida' });
  }

  const codigo = String(req.params.codigo || '').trim().toUpperCase();
  let caso;
  try {
    caso = await CasoAnonimo.findOne({
      where: payload.tipo === 'caso'
        ? { id: payload.casoId, codigo }
        : { codigo },
      attributes: ['id', 'codigo'],
    });
  } catch (error) {
    return next(error);
  }
  if (!caso) {
    return res.status(404).json({ mensaje: 'No se encontró el caso' });
  }

  if (payload.tipo === 'caso') {
    if (payload.rol !== 'denunciante' || payload.codigo !== caso.codigo) {
      return res.status(403).json({ mensaje: 'La sesión no tiene acceso a este caso' });
    }
    req.caso = caso;
    req.autorCaso = 'denunciante';
    return next();
  }

  try {
    const usuario = await Usuario.findByPk(payload.id);
    if (!usuario || !usuario.activo || usuario.rol !== 'administrador') {
      return res.status(403).json({ mensaje: 'No tienes permisos para acceder a este caso' });
    }
    req.caso = caso;
    req.usuario = usuario;
    req.autorCaso = 'administradora';
    return next();
  } catch (error) {
    return next(error);
  }
}

module.exports = { verificarAccesoCaso };
