const crypto = require('crypto');
const { LlaveOrganizacion } = require('../models');

function decodificarBase64(valor, nombre, minimo, maximo) {
  if (
    typeof valor !== 'string'
    || !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(valor)
  ) {
    throw new TypeError(`${nombre} debe ser Base64 válido`);
  }

  const bytes = Buffer.from(valor, 'base64');
  if (bytes.length < minimo || bytes.length > maximo) {
    throw new RangeError(`${nombre} tiene un tamaño inválido`);
  }
  return bytes;
}

async function obtenerPublica(req, res, next) {
  try {
    const llave = await LlaveOrganizacion.findOne({
      where: { activa: true },
      attributes: ['publicaSpki', 'creadaEn'],
      order: [['id', 'DESC']],
    });

    if (!llave) {
      return res.status(404).json({ mensaje: 'La organización aún no ha configurado sus llaves' });
    }

    return res.json({
      publicaSpki: llave.publicaSpki,
      creadaEn: llave.creadaEn,
    });
  } catch (error) {
    return next(error);
  }
}

async function obtenerCifrada(req, res, next) {
  try {
    const llave = await LlaveOrganizacion.findOne({
      where: { activa: true },
      attributes: ['publicaSpki', 'privadaCifrada', 'sal', 'iv', 'creadaEn'],
      order: [['id', 'DESC']],
    });

    if (!llave) {
      return res.status(404).json({ mensaje: 'La organización aún no ha configurado sus llaves' });
    }

    return res.json(llave);
  } catch (error) {
    return next(error);
  }
}

async function crear(req, res, next) {
  try {
    const { publicaSpki, privadaCifrada, sal, iv } = req.body;
    const publicaBytes = decodificarBase64(publicaSpki, 'La llave pública', 1, 10_000);
    decodificarBase64(privadaCifrada, 'La llave privada cifrada', 1, 10_000);
    const salBytes = decodificarBase64(sal, 'La sal', 16, 16);
    const ivBytes = decodificarBase64(iv, 'El IV', 12, 12);

    let clavePublica;
    try {
      clavePublica = crypto.createPublicKey({
        key: publicaBytes,
        format: 'der',
        type: 'spki',
      });
    } catch {
      return res.status(400).json({ mensaje: 'La llave pública SPKI no es válida' });
    }
    if (clavePublica.asymmetricKeyType !== 'rsa' || clavePublica.asymmetricKeyDetails?.modulusLength !== 3072) {
      return res.status(400).json({ mensaje: 'La llave pública debe ser RSA de 3072 bits' });
    }

    const existente = await LlaveOrganizacion.findOne({ where: { activa: true } });
    if (existente) {
      return res.status(409).json({
        mensaje: 'Ya existe una llave activa. No se permite reemplazarla desde esta pantalla.',
      });
    }

    const llave = await LlaveOrganizacion.create({
      publicaSpki: publicaSpki.trim(),
      privadaCifrada: privadaCifrada.trim(),
      sal: salBytes.toString('base64'),
      iv: ivBytes.toString('base64'),
      activa: true,
    });

    return res.status(201).json({
      activa: llave.activa,
      creadaEn: llave.creadaEn,
      mensaje: 'Llaves de la organización guardadas',
    });
  } catch (error) {
    if (error instanceof TypeError || error instanceof RangeError) {
      return res.status(400).json({ mensaje: error.message });
    }
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ mensaje: 'Ya existe una llave de organización registrada' });
    }
    console.error('No se pudo persistir la configuración de llaves de organización');
    return res.status(500).json({ mensaje: 'No se pudieron guardar las llaves de organización' });
  }
}

module.exports = { obtenerPublica, obtenerCifrada, crear };
