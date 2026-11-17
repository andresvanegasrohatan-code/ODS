const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const { after, before, test } = require('node:test');
const os = require('node:os');
const path = require('node:path');
const fs = require('node:fs/promises');

process.env.DB_DIALECT = 'sqlite';
process.env.SQLITE_PATH = path.join(os.tmpdir(), `equigenero-chat-${crypto.randomBytes(8).toString('hex')}.sqlite`);

const {
  CasoAnonimo,
  EvidenciaCaso,
  LlaveOrganizacion,
  MensajeCaso,
  sequelize,
} = require('../models');
const {
  cambiarEstado,
  crearMensaje,
  listarMensajes,
} = require('./casoConversacionController');

let caso;

function respuesta() {
  return {
    statusCode: 200,
    body: undefined,
    ended: false,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
    end() {
      this.ended = true;
      return this;
    },
  };
}

before(async () => {
  await sequelize.sync({ force: true });
  const llave = await LlaveOrganizacion.create({
    publicaSpki: 'AA==',
    privadaCifrada: 'AA==',
    sal: crypto.randomBytes(16).toString('base64'),
    iv: crypto.randomBytes(12).toString('base64'),
    activa: true,
  });
  caso = await CasoAnonimo.create({
    codigo: 'ABCDEFGHJKLM',
    llaveOrganizacionId: llave.id,
    kParaOrg: crypto.randomBytes(384).toString('base64'),
    kParaDenunciante: crypto.randomBytes(40).toString('base64'),
    salKek: crypto.randomBytes(16).toString('base64'),
    salVerificador: crypto.randomBytes(16).toString('base64'),
    verificadorHash: 'hash-de-prueba',
    contenidoCifrado: crypto.randomBytes(32).toString('base64'),
    iv: crypto.randomBytes(12).toString('base64'),
    estado: 'Pendiente',
  });
});

after(async () => {
  await sequelize.close();
  await fs.unlink(process.env.SQLITE_PATH).catch(() => {});
});

test('los mensajes guardan y devuelven únicamente ciphertext, IV y autor', async () => {
  const res = respuesta();
  const paquete = {
    contenidoCifrado: crypto.randomBytes(64).toString('base64'),
    iv: crypto.randomBytes(12).toString('base64'),
  };
  await crearMensaje({
    body: paquete,
    caso,
    autorCaso: 'denunciante',
  }, res);

  assert.equal(res.statusCode, 201);
  assert.equal(res.body.contenidoCifrado, paquete.contenidoCifrado);
  assert.equal(res.body.autor, 'denunciante');
  assert.equal('texto' in res.body, false);
  assert.equal(await MensajeCaso.count({ where: { casoId: caso.id } }), 1);

  const listado = respuesta();
  await listarMensajes({ caso }, listado);
  assert.equal(listado.body.length, 1);
  assert.equal('mensaje' in listado.body[0], false);
});

test('rechaza texto claro o campos adicionales en una solicitud de mensaje', async () => {
  const res = respuesta();
  await crearMensaje({
    body: {
      contenidoCifrado: crypto.randomBytes(32).toString('base64'),
      iv: crypto.randomBytes(12).toString('base64'),
      texto: 'contenido ficticio que no debe guardarse',
    },
    caso,
    autorCaso: 'denunciante',
  }, res);

  assert.equal(res.statusCode, 400);
  assert.equal(await MensajeCaso.count({ where: { casoId: caso.id } }), 1);
});

test('permite a la administradora cambiar el estado del caso', async () => {
  const res = respuesta();
  await cambiarEstado({ params: { id: caso.id }, body: { estado: 'Activo' } }, res);

  assert.equal(res.statusCode, 200);
  assert.equal((await CasoAnonimo.findByPk(caso.id)).estado, 'Activo');
  assert.equal(await EvidenciaCaso.count(), 0);
});

