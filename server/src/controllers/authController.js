const jwt = require('jsonwebtoken');
const { Usuario } = require('../models');

function generarToken(usuario) {
  return jwt.sign({ id: usuario.id, rol: usuario.rol }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '8h',
  });
}

async function registrar(req, res, next) {
  try {
    const { nombre, correo, contrasena } = req.body;

    if (!nombre || !correo || !contrasena) {
      return res.status(400).json({ mensaje: 'Nombre, correo y contraseña son obligatorios' });
    }
    if (String(contrasena).length < 8) {
      return res.status(400).json({ mensaje: 'La contraseña debe tener al menos 8 caracteres' });
    }

    const existente = await Usuario.findOne({ where: { correo: String(correo).trim().toLowerCase() } });
    if (existente) {
      return res.status(409).json({ mensaje: 'Ya existe una cuenta con ese correo' });
    }

    // Seguridad: el registro público SIEMPRE crea usuarios con rol "usuario".
    // Los administradores se crean con "npm run seed" o los asigna otro administrador.
    const usuario = await Usuario.create({
      nombre: String(nombre).trim(),
      correo,
      contrasena,
      rol: 'usuario',
    });

    return res.status(201).json({ usuario, token: generarToken(usuario) });
  } catch (error) {
    return next(error);
  }
}

async function iniciarSesion(req, res, next) {
  try {
    const { correo, contrasena } = req.body;

    if (!correo || !contrasena) {
      return res.status(400).json({ mensaje: 'Correo y contraseña son obligatorios' });
    }

    const usuario = await Usuario.findOne({ where: { correo: String(correo).trim().toLowerCase() } });
    const valido = usuario && usuario.activo && (await usuario.verificarContrasena(contrasena));

    if (!valido) {
      return res.status(401).json({ mensaje: 'Credenciales incorrectas' });
    }

    return res.json({ usuario, token: generarToken(usuario) });
  } catch (error) {
    return next(error);
  }
}

function perfil(req, res) {
  return res.json({ usuario: req.usuario });
}

module.exports = { registrar, iniciarSesion, perfil };
