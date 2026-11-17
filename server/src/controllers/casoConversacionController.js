const crypto = require('crypto');
const { CasoAnonimo, EvidenciaCaso, MensajeCaso } = require('../models');
const { obtenerBucketEvidencias } = require('../services/supabaseStorage');

const TAMANO_MAXIMO_EVIDENCIA = 10 * 1024 * 1024 + 16;
const CAMPOS_MENSAJE = new Set(['contenidoCifrado', 'iv']);
const CAMPOS_EVIDENCIA = new Set(['contenidoIv', 'metadatosCifrados', 'metadatosIv', 'tamanoCifrado']);
const ESTADOS_VALIDOS = new Set(['Pendiente', 'Activo', 'Resuelto']);

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

function storageNoConfigurado(res) {
  return res.status(503).json({ mensaje: 'El almacenamiento privado de evidencias no está configurado' });
}

async function listarCasos(req, res, next) {
  try {
    const casos = await CasoAnonimo.findAll({
      attributes: [
        'id',
        'codigo',
        'kParaOrg',
        'contenidoCifrado',
        'iv',
        'estado',
        'creadoEn',
      ],
      order: [['creadoEn', 'DESC']],
    });
    return res.json(casos);
  } catch (error) {
    return next(error);
  }
}

async function cambiarEstado(req, res, next) {
  const { estado } = req.body || {};
  if (!ESTADOS_VALIDOS.has(estado)) {
    return res.status(400).json({ mensaje: 'El estado solicitado no es válido' });
  }
  try {
    const caso = await CasoAnonimo.findByPk(req.params.id);
    if (!caso) return res.status(404).json({ mensaje: 'No se encontró el caso' });
    caso.estado = estado;
    await caso.save();
    return res.json({ estado: caso.estado });
  } catch (error) {
    return next(error);
  }
}

async function listarMensajes(req, res, next) {
  try {
    const mensajes = await MensajeCaso.findAll({
      where: { casoId: req.caso.id },
      attributes: ['id', 'autor', 'contenidoCifrado', 'iv', 'creadoEn'],
      order: [['id', 'ASC']],
    });
    return res.json(mensajes);
  } catch (error) {
    return next(error);
  }
}

async function crearMensaje(req, res) {
  try {
    if (!req.body || Object.keys(req.body).some((campo) => !CAMPOS_MENSAJE.has(campo))) {
      return res.status(400).json({ mensaje: 'El mensaje solo puede incluir su contenido cifrado y el IV' });
    }
    decodificarBase64(req.body.contenidoCifrado, 'El mensaje cifrado', 17, 200_016);
    decodificarBase64(req.body.iv, 'El IV del mensaje', 12, 12);
    const mensaje = await MensajeCaso.create({
      casoId: req.caso.id,
      autor: req.autorCaso,
      contenidoCifrado: req.body.contenidoCifrado,
      iv: req.body.iv,
    });
    return res.status(201).json({
      id: mensaje.id,
      autor: mensaje.autor,
      contenidoCifrado: mensaje.contenidoCifrado,
      iv: mensaje.iv,
      creadoEn: mensaje.creadoEn,
    });
  } catch (error) {
    if (error instanceof TypeError || error instanceof RangeError) {
      return res.status(400).json({ mensaje: error.message });
    }
    console.error('No se pudo guardar el mensaje cifrado del caso');
    return res.status(500).json({ mensaje: 'No se pudo guardar el mensaje' });
  }
}

async function crearCargaEvidencia(req, res) {
  try {
    if (!req.body || Object.keys(req.body).some((campo) => !CAMPOS_EVIDENCIA.has(campo))) {
      return res.status(400).json({ mensaje: 'La solicitud de evidencia contiene campos no permitidos' });
    }
    const { contenidoIv, metadatosCifrados, metadatosIv, tamanoCifrado } = req.body;
    decodificarBase64(contenidoIv, 'El IV de la evidencia', 12, 12);
    decodificarBase64(metadatosCifrados, 'Los metadatos cifrados', 17, 5_000);
    decodificarBase64(metadatosIv, 'El IV de metadatos', 12, 12);
    if (!Number.isInteger(tamanoCifrado) || tamanoCifrado < 17 || tamanoCifrado > TAMANO_MAXIMO_EVIDENCIA) {
      return res.status(400).json({ mensaje: 'El tamaño cifrado de la evidencia no es válido' });
    }

    let bucket;
    try {
      bucket = obtenerBucketEvidencias();
    } catch (error) {
      if (error.code === 'STORAGE_NOT_CONFIGURED') return storageNoConfigurado(res);
      throw error;
    }

    const evidenciaId = crypto.randomUUID();
    const ruta = `casos/${req.caso.id}/${evidenciaId}.bin`;
    const evidencia = await EvidenciaCaso.create({
      id: evidenciaId,
      casoId: req.caso.id,
      rutaAlmacenamiento: ruta,
      metadatosCifrados,
      metadatosIv,
      contenidoIv,
      tamanoCifrado,
      estadoCarga: 'pendiente',
    });
    const { data, error } = await bucket.createSignedUploadUrl(ruta);
    if (error || !data?.token) {
      await evidencia.destroy();
      console.error('No se pudo crear el enlace de carga de una evidencia');
      return res.status(502).json({ mensaje: 'No se pudo preparar la carga segura de la evidencia' });
    }

    return res.status(201).json({ id: evidencia.id, ruta, token: data.token });
  } catch (error) {
    if (error instanceof TypeError || error instanceof RangeError) {
      return res.status(400).json({ mensaje: error.message });
    }
    console.error('No se pudo preparar la evidencia cifrada');
    return res.status(500).json({ mensaje: 'No se pudo preparar la evidencia' });
  }
}

async function completarCargaEvidencia(req, res, next) {
  let evidencia;
  try {
    evidencia = await EvidenciaCaso.findOne({
      where: { id: req.params.id, casoId: req.caso.id, estadoCarga: 'pendiente' },
    });
  } catch (error) {
    return next(error);
  }
  if (!evidencia) return res.status(404).json({ mensaje: 'No se encontró la evidencia pendiente' });

  try {
    const bucket = obtenerBucketEvidencias();
    const separador = evidencia.rutaAlmacenamiento.lastIndexOf('/');
    const carpeta = evidencia.rutaAlmacenamiento.slice(0, separador);
    const nombre = evidencia.rutaAlmacenamiento.slice(separador + 1);
    const { data, error } = await bucket.list(carpeta, { search: nombre, limit: 10 });
    const objeto = data?.find((item) => item.name === nombre);
    if (error || !objeto || Number(objeto.metadata?.size || 0) !== evidencia.tamanoCifrado) {
      return res.status(400).json({ mensaje: 'No se pudo verificar el archivo cifrado cargado' });
    }
    evidencia.estadoCarga = 'lista';
    await evidencia.save();
    return res.json({ id: evidencia.id, estado: evidencia.estadoCarga });
  } catch (error) {
    if (error.code === 'STORAGE_NOT_CONFIGURED') return storageNoConfigurado(res);
    console.error('No se pudo verificar la carga de la evidencia cifrada');
    return res.status(502).json({ mensaje: 'No se pudo verificar la carga de la evidencia' });
  }
}

async function cancelarCargaEvidencia(req, res, next) {
  let evidencia;
  try {
    evidencia = await EvidenciaCaso.findOne({
      where: { id: req.params.id, casoId: req.caso.id, estadoCarga: 'pendiente' },
    });
  } catch (error) {
    return next(error);
  }
  if (!evidencia) return res.status(204).end();
  try {
    const bucket = obtenerBucketEvidencias();
    const { error } = await bucket.remove([evidencia.rutaAlmacenamiento]);
    if (error) {
      console.error('No se pudo retirar una carga incompleta de evidencia');
      return res.status(502).json({ mensaje: 'No se pudo limpiar la carga incompleta' });
    }
    await evidencia.destroy();
    return res.status(204).end();
  } catch (error) {
    if (error.code === 'STORAGE_NOT_CONFIGURED') return storageNoConfigurado(res);
    console.error('No se pudo limpiar la carga incompleta de evidencia');
    return res.status(502).json({ mensaje: 'No se pudo limpiar la carga incompleta' });
  }
}

async function listarEvidencias(req, res, next) {
  try {
    const evidencias = await EvidenciaCaso.findAll({
      where: { casoId: req.caso.id, estadoCarga: 'lista' },
      attributes: ['id', 'metadatosCifrados', 'metadatosIv', 'contenidoIv', 'tamanoCifrado', 'creadoEn'],
      order: [['creadoEn', 'ASC']],
    });
    return res.json(evidencias);
  } catch (error) {
    return next(error);
  }
}

async function firmarDescargaEvidencia(req, res, next) {
  let evidencia;
  try {
    evidencia = await EvidenciaCaso.findOne({
      where: { id: req.params.id, casoId: req.caso.id, estadoCarga: 'lista' },
      attributes: ['rutaAlmacenamiento'],
    });
  } catch (error) {
    return next(error);
  }
  if (!evidencia) return res.status(404).json({ mensaje: 'No se encontró la evidencia solicitada' });

  try {
    const bucket = obtenerBucketEvidencias();
    const { data, error } = await bucket.createSignedUrl(evidencia.rutaAlmacenamiento, 60);
    if (error || !data?.signedUrl) {
      console.error('No se pudo firmar una descarga de evidencia');
      return res.status(502).json({ mensaje: 'No se pudo preparar la descarga de la evidencia' });
    }
    return res.json({ urlFirmada: data.signedUrl });
  } catch (error) {
    if (error.code === 'STORAGE_NOT_CONFIGURED') return storageNoConfigurado(res);
    console.error('No se pudo firmar una descarga de evidencia');
    return res.status(502).json({ mensaje: 'No se pudo preparar la descarga de la evidencia' });
  }
}

module.exports = {
  cambiarEstado,
  cancelarCargaEvidencia,
  completarCargaEvidencia,
  crearCargaEvidencia,
  crearMensaje,
  firmarDescargaEvidencia,
  listarCasos,
  listarEvidencias,
  listarMensajes,
};
