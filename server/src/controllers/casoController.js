const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const { AccesoCaso, CasoAnonimo, LlaveOrganizacion, sequelize } = require('../models');

const ALFABETO_CODIGO = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const CAMPOS_CREACION = new Set([
  'contenidoCifrado',
  'iv',
  'kParaOrg',
  'kParaDenunciante',
  'salKek',
  'salVerificador',
  'verificadorDerivado',
]);
const CAMPOS_ACCESO = new Set(['verificadorDerivado']);
const VENTANA_INTENTOS_MS = 60 * 60 * 1000;
const MAX_INTENTOS = 5;
const HASH_FALSO_PROMESA = bcrypt.hash(crypto.randomBytes(32).toString('hex'), 12);

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

function normalizarCodigo(codigo) {
  const normalizado = typeof codigo === 'string' ? codigo.trim().toUpperCase() : '';
  if (!new RegExp(`^[${ALFABETO_CODIGO}]{12}$`).test(normalizado)) {
    throw new TypeError('El código debe tener 12 caracteres válidos');
  }
  return normalizado;
}

function salFalsa(codigo, etiqueta) {
  return crypto
    .createHmac('sha256', process.env.JWT_SECRET)
    .update(`equigenero:${etiqueta}:${codigo}`)
    .digest()
    .subarray(0, 16)
    .toString('base64');
}

function hashCodigo(codigo) {
  return crypto.createHmac('sha256', process.env.JWT_SECRET).update(`acceso:${codigo}`).digest('hex');
}

async function consumirIntento(codigo) {
  const ahora = new Date();
  const codigoHash = hashCodigo(codigo);

  return sequelize.transaction(async (transaction) => {
    await AccesoCaso.destroy({
      where: { inicioVentana: { [Op.lt]: new Date(ahora.getTime() - VENTANA_INTENTOS_MS) } },
      transaction,
    });

    const [acceso] = await AccesoCaso.findOrCreate({
      where: { codigoHash },
      defaults: { codigoHash, intentosFallidos: 0, inicioVentana: ahora },
      transaction,
    });
    await acceso.reload({ transaction, lock: transaction.LOCK.UPDATE });

    if (ahora.getTime() - new Date(acceso.inicioVentana).getTime() >= VENTANA_INTENTOS_MS) {
      acceso.intentosFallidos = 0;
      acceso.inicioVentana = ahora;
    }

    if (acceso.intentosFallidos >= MAX_INTENTOS) {
      await acceso.save({ transaction });
      return { permitido: false, codigoHash };
    }

    acceso.intentosFallidos += 1;
    await acceso.save({ transaction });
    return { permitido: true, codigoHash };
  });
}

async function obtenerSales(req, res) {
  try {
    const codigo = normalizarCodigo(req.params.codigo);
    const caso = await CasoAnonimo.findOne({
      where: { codigo },
      attributes: ['salKek', 'salVerificador'],
    });

    return res.json({
      salKek: caso?.salKek || salFalsa(codigo, 'kek'),
      salVerificador: caso?.salVerificador || salFalsa(codigo, 'verificador'),
    });
  } catch (error) {
    if (error instanceof TypeError) {
      return res.status(400).json({ mensaje: error.message });
    }
    console.error('No se pudieron obtener las sales del caso');
    return res.status(500).json({ mensaje: 'No se pudo iniciar el acceso al caso' });
  }
}

async function crear(req, res) {
  try {
    if (!req.body || Object.keys(req.body).some((campo) => !CAMPOS_CREACION.has(campo))) {
      return res.status(400).json({ mensaje: 'La solicitud solo puede contener datos criptográficos permitidos' });
    }

    const {
      contenidoCifrado,
      iv,
      kParaOrg,
      kParaDenunciante,
      salKek,
      salVerificador,
      verificadorDerivado,
    } = req.body;

    decodificarBase64(contenidoCifrado, 'El contenido cifrado', 16, 500_000);
    decodificarBase64(iv, 'El IV', 12, 12);
    decodificarBase64(kParaOrg, 'La llave para la organización', 384, 384);
    decodificarBase64(kParaDenunciante, 'La llave para la persona denunciante', 40, 40);
    const salKekBytes = decodificarBase64(salKek, 'La sal de la llave', 16, 16);
    const salVerificadorBytes = decodificarBase64(salVerificador, 'La sal del verificador', 16, 16);

    if (typeof verificadorDerivado !== 'string' || !/^[a-f0-9]{64}$/i.test(verificadorDerivado)) {
      return res.status(400).json({ mensaje: 'El verificador derivado no tiene un formato válido' });
    }

    const llaveOrganizacion = await LlaveOrganizacion.findOne({
      where: { activa: true },
      attributes: ['id'],
      order: [['id', 'DESC']],
    });
    if (!llaveOrganizacion) {
      return res.status(503).json({ mensaje: 'La organización aún no ha configurado sus llaves' });
    }

    const codigo = await generarCodigoUnico();
    const verificadorHash = await bcrypt.hash(verificadorDerivado.toLowerCase(), 12);
    const caso = await CasoAnonimo.create({
      codigo,
      llaveOrganizacionId: llaveOrganizacion.id,
      contenidoCifrado,
      iv,
      kParaOrg,
      kParaDenunciante,
      salKek: salKekBytes.toString('base64'),
      salVerificador: salVerificadorBytes.toString('base64'),
      verificadorHash,
      estado: 'Pendiente',
    });

    return res.status(201).json({
      codigo: caso.codigo,
      estado: caso.estado,
      mensaje: 'Denuncia registrada. Guarda el código para consultar el caso.',
    });
  } catch (error) {
    if (error instanceof TypeError || error instanceof RangeError) {
      return res.status(400).json({ mensaje: error.message });
    }
    console.error('No se pudo crear el caso anónimo');
    return res.status(500).json({ mensaje: 'No se pudo crear la denuncia' });
  }
}

async function acceder(req, res) {
  try {
    const codigo = normalizarCodigo(req.params.codigo);
    if (!req.body || Object.keys(req.body).some((campo) => !CAMPOS_ACCESO.has(campo))) {
      return res.status(400).json({ mensaje: 'La solicitud de acceso solo puede contener el verificador derivado' });
    }
    const { verificadorDerivado } = req.body;
    if (typeof verificadorDerivado !== 'string' || !/^[a-f0-9]{64}$/i.test(verificadorDerivado)) {
      return res.status(400).json({ mensaje: 'El verificador derivado no tiene un formato válido' });
    }

    const limite = await consumirIntento(codigo);
    if (!limite.permitido) {
      return res.status(429).json({ mensaje: 'Se agotaron los intentos para este código. Inténtalo después de una hora.' });
    }

    const caso = await CasoAnonimo.findOne({ where: { codigo } });
    const hash = caso ? caso.verificadorHash : await HASH_FALSO_PROMESA;
    const valido = await bcrypt.compare(verificadorDerivado.toLowerCase(), hash);
    if (!caso || !valido) {
      return res.status(403).json({ mensaje: 'No se pudo autenticar el acceso al caso' });
    }

    await AccesoCaso.destroy({ where: { codigoHash: limite.codigoHash } });
    return res.json({
      codigo: caso.codigo,
      estado: caso.estado,
      sessionToken: jwt.sign(
        { tipo: 'caso', casoId: caso.id, codigo: caso.codigo, rol: 'denunciante' },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      ),
      contenidoCifrado: caso.contenidoCifrado,
      iv: caso.iv,
      kParaDenunciante: caso.kParaDenunciante,
      salKek: caso.salKek,
      creadoEn: caso.creadoEn,
    });
  } catch (error) {
    if (error instanceof TypeError) {
      return res.status(400).json({ mensaje: error.message });
    }
    console.error('No se pudo autenticar el acceso al caso');
    return res.status(500).json({ mensaje: 'No se pudo consultar el caso' });
  }
}

async function generarCodigoUnico() {
  for (let intento = 0; intento < 5; intento += 1) {
    const bytes = crypto.randomBytes(12);
    const codigo = Array.from(bytes, (byte) => ALFABETO_CODIGO[byte & 31]).join('');
    const existente = await CasoAnonimo.findOne({ where: { codigo } });
    if (!existente) return codigo;
  }
  throw new Error('No se pudo generar un código único');
}

module.exports = { crear, obtenerSales, acceder };
