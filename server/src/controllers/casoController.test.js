const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const { after, before, test } = require('node:test');
const os = require('node:os');
const path = require('node:path');
const fs = require('node:fs/promises');

process.env.DB_DIALECT = 'sqlite';
process.env.SQLITE_PATH = path.join(os.tmpdir(), `equigenero-access-${crypto.randomBytes(8).toString('hex')}.sqlite`);
process.env.JWT_SECRET = crypto.randomBytes(48).toString('hex');

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { AccesoCaso, CasoAnonimo, LlaveOrganizacion, sequelize } = require('../models');
const { acceder, obtenerSales } = require('./casoController');

const CODIGO_EXISTENTE = 'ABCDEFGHJKLM';
const VERIFICADOR_CORRECTO = 'a'.repeat(64);
const VERIFICADOR_INCORRECTO = 'b'.repeat(64);

function hashCodigo(codigo) {
  return crypto.createHmac('sha256', process.env.JWT_SECRET).update(`acceso:${codigo}`).digest('hex');
}

function respuestaFalsa() {
  return {
    statusCode: 200,
    body: undefined,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
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
  await CasoAnonimo.create({
    codigo: CODIGO_EXISTENTE,
    llaveOrganizacionId: llave.id,
    kParaOrg: crypto.randomBytes(384).toString('base64'),
    kParaDenunciante: crypto.randomBytes(40).toString('base64'),
    salKek: crypto.randomBytes(16).toString('base64'),
    salVerificador: crypto.randomBytes(16).toString('base64'),
    verificadorHash: await bcrypt.hash(VERIFICADOR_CORRECTO, 12),
    contenidoCifrado: crypto.randomBytes(32).toString('base64'),
    iv: crypto.randomBytes(12).toString('base64'),
    estado: 'Pendiente',
  });
});

after(async () => {
  await sequelize.close();
  await fs.unlink(process.env.SQLITE_PATH).catch(() => {});
});

test('sales tienen el mismo formato y son deterministas cuando el código no existe', async () => {
  const primera = respuestaFalsa();
  const segunda = respuestaFalsa();
  await obtenerSales({ params: { codigo: 'ZZZZZZZZZZZZ' } }, primera);
  await obtenerSales({ params: { codigo: 'ZZZZZZZZZZZZ' } }, segunda);

  assert.deepEqual(Object.keys(primera.body).sort(), ['salKek', 'salVerificador']);
  assert.deepEqual(segunda.body, primera.body);
  assert.match(primera.body.salKek, /^[A-Za-z0-9+/]{22}==$/);
  assert.match(primera.body.salVerificador, /^[A-Za-z0-9+/]{22}==$/);
});

test('una frase incorrecta recibe la misma denegación para códigos existentes e inexistentes', async () => {
  const existente = respuestaFalsa();
  const inexistente = respuestaFalsa();
  await acceder(
    { params: { codigo: CODIGO_EXISTENTE }, body: { verificadorDerivado: VERIFICADOR_INCORRECTO } },
    existente
  );
  await acceder(
    { params: { codigo: 'YYYYYYYYYYYY' }, body: { verificadorDerivado: VERIFICADOR_INCORRECTO } },
    inexistente
  );

  assert.equal(existente.statusCode, 403);
  assert.deepEqual(inexistente.body, existente.body);
});

test('el acceso correcto devuelve solo contenido cifrado y limpia el contador de fallos', async () => {
  const response = respuestaFalsa();
  await acceder(
    { params: { codigo: CODIGO_EXISTENTE }, body: { verificadorDerivado: VERIFICADOR_CORRECTO } },
    response
  );

  assert.equal(response.statusCode, 200);
  assert.equal(typeof response.body.contenidoCifrado, 'string');
  assert.equal(typeof response.body.sessionToken, 'string');
  assert.equal(jwt.verify(response.body.sessionToken, process.env.JWT_SECRET).tipo, 'caso');
  assert.equal('verificadorHash' in response.body, false);
  assert.equal('titulo' in response.body, false);
  assert.equal('kParaOrg' in response.body, false);
  assert.equal(await AccesoCaso.count({ where: { codigoHash: hashCodigo(CODIGO_EXISTENTE) } }), 0);
});

test('bloquea el sexto intento de acceso fallido dentro de una hora', async () => {
  const codigo = 'BBBB2222CCCC';
  const estados = [];
  for (let intento = 0; intento < 6; intento += 1) {
    const response = respuestaFalsa();
    await acceder({ params: { codigo }, body: { verificadorDerivado: VERIFICADOR_INCORRECTO } }, response);
    estados.push(response.statusCode);
  }

  assert.deepEqual(estados, [403, 403, 403, 403, 403, 429]);
});
