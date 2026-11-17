import assert from 'node:assert/strict';
import { webcrypto } from 'node:crypto';
import test from 'node:test';

Object.defineProperty(globalThis, 'crypto', {
  configurable: true,
  value: webcrypto,
});

const {
  aleatorio,
  abrirKConFrase,
  abrirKConRSA,
  abrirLlavePrivadaOrganizacion,
  cifrar,
  cifrarEvidencia,
  cifrarMensajeCaso,
  descifrarBytes,
  descifrarCasoOrganizacion,
  descifrarMetadatosEvidencia,
  descifrarMensajeCaso,
  descifrarTexto,
  derivar,
  envolverKConFrase,
  envolverKConRSA,
  generarLlavesOrganizacion,
  nuevaLlaveCaso,
  prepararCasoAnonimo,
} = await import('./cripto.js');

test('aleatorio entrega bytes de la longitud solicitada y rechaza longitudes inválidas', () => {
  const muestra = aleatorio(24);
  assert.equal(muestra.length, 24);
  assert.throws(() => aleatorio(0), RangeError);
  assert.throws(() => aleatorio(65_537), RangeError);
});

test('cifrar y descifrarTexto recuperan texto UTF-8 con AES-GCM', async () => {
  const llave = await nuevaLlaveCaso();
  const resultado = await cifrar(llave, 'Texto ficticio para una prueba');

  assert.equal(resultado.iv.length, 12);
  assert.notEqual(new TextDecoder().decode(resultado.cifrado), 'Texto ficticio para una prueba');
  assert.equal(
    await descifrarTexto(llave, resultado.iv, resultado.cifrado),
    'Texto ficticio para una prueba'
  );
});

test('los mensajes cifrados se pueden abrir con la llave del caso', async () => {
  const llave = await nuevaLlaveCaso();
  const paquete = await cifrarMensajeCaso(llave, 'Mensaje ficticio de prueba');

  assert.equal('texto' in paquete, false);
  assert.equal(await descifrarMensajeCaso(llave, paquete), 'Mensaje ficticio de prueba');
  await assert.rejects(cifrarMensajeCaso(llave, '  '), TypeError);
});

test('las evidencias y sus metadatos se cifran y recuperan con la llave del caso', async () => {
  const llave = await nuevaLlaveCaso();
  const original = Uint8Array.from([137, 80, 78, 71, 13, 10, 26, 10, 1, 2, 3]);
  const archivo = new File([original], 'prueba-ficticia.png', { type: 'image/png' });
  const paquete = await cifrarEvidencia(llave, archivo);
  const metadatos = await descifrarMetadatosEvidencia(llave, paquete);
  const iv = Uint8Array.from(atob(paquete.contenidoIv), (byte) => byte.charCodeAt(0));
  const claro = await descifrarBytes(llave, iv, paquete.contenidoCifrado);

  assert.deepEqual(metadatos, { nombre: 'prueba-ficticia.png', tipo: 'image/png' });
  assert.deepEqual(claro, original);
  assert.notDeepEqual(paquete.contenidoCifrado, original);
  await assert.rejects(
    cifrarEvidencia(llave, new File([original], 'prueba.txt', { type: 'text/plain' })),
    TypeError
  );
});

test('derivar crea la llave AES-KW y el verificador con PBKDF2/SHA-256', async () => {
  const sal = aleatorio(16);
  const kek = await derivar('frase ficticia de prueba', sal, 'kek');
  const verificador = await derivar('frase ficticia de prueba', sal, 'verificador');

  assert.equal(kek.algorithm.name, 'AES-KW');
  assert.equal(verificador.length, 32);
  await assert.rejects(derivar('frase ficticia', sal, 'desconocido'), TypeError);
});

test('la llave del caso se puede envolver y abrir con AES-KW derivado de la frase', async () => {
  const llaveCaso = await nuevaLlaveCaso();
  const sal = aleatorio(16);
  const envuelta = await envolverKConFrase(llaveCaso, 'frase ficticia para prueba', sal);
  const recuperada = await abrirKConFrase(envuelta, 'frase ficticia para prueba', sal);
  const resultado = await cifrar(llaveCaso, 'Contenido de prueba');

  assert.equal(
    await descifrarTexto(recuperada, resultado.iv, resultado.cifrado),
    'Contenido de prueba'
  );
  await assert.rejects(
    abrirKConFrase(envuelta, 'otra frase ficticia', sal)
  );
});

test('la llave del caso se puede envolver y abrir con RSA-OAEP/SHA-256', async () => {
  const cryptoApi = globalThis.crypto;
  const parRSA = await cryptoApi.subtle.generateKey(
    {
      name: 'RSA-OAEP',
      modulusLength: 3072,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: 'SHA-256',
    },
    false,
    ['wrapKey', 'unwrapKey']
  );
  const llaveCaso = await nuevaLlaveCaso();
  const envuelta = await envolverKConRSA(llaveCaso, parRSA.publicKey);
  const recuperada = await abrirKConRSA(envuelta, parRSA.privateKey);
  const resultado = await cifrar(llaveCaso, 'Contenido RSA de prueba');

  assert.equal(
    await descifrarTexto(recuperada, resultado.iv, resultado.cifrado),
    'Contenido RSA de prueba'
  );
});

test('la llave privada de organización queda cifrada y requiere la frase maestra para abrirse', async () => {
  const paquete = await generarLlavesOrganizacion('frase maestra ficticia segura');
  const privada = await abrirLlavePrivadaOrganizacion({
    ...paquete,
    fraseMaestra: 'frase maestra ficticia segura',
  });

  assert.equal(privada.algorithm.name, 'RSA-OAEP');
  assert.equal(privada.algorithm.hash.name, 'SHA-256');
  await assert.rejects(
    abrirLlavePrivadaOrganizacion({ ...paquete, fraseMaestra: 'frase maestra incorrecta' })
  );
});

test('prepararCasoAnonimo no envía texto claro y envuelve K para organización y denunciante', async () => {
  const parRSA = await webcrypto.subtle.generateKey(
    {
      name: 'RSA-OAEP',
      modulusLength: 3072,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: 'SHA-256',
    },
    true,
    ['wrapKey', 'unwrapKey']
  );
  const spki = new Uint8Array(await webcrypto.subtle.exportKey('spki', parRSA.publicKey));
  const publicaSpki = btoa(String.fromCharCode(...spki));
  const entrada = {
    titulo: 'Título ficticio',
    tipo: 'Tipo ficticio',
    descripcion: 'Descripción ficticia para prueba',
    fraseSecreta: 'frase secreta ficticia',
    publicaSpki,
  };
  const paquete = await prepararCasoAnonimo(entrada);

  assert.equal('titulo' in paquete, false);
  assert.equal('descripcion' in paquete, false);
  assert.equal('fraseSecreta' in paquete, false);
  assert.match(paquete.verificadorDerivado, /^[a-f0-9]{64}$/);

  const llaveOrg = await abrirKConRSA(
    Uint8Array.from(atob(paquete.kParaOrg), (byte) => byte.charCodeAt(0)),
    parRSA.privateKey
  );
  const llaveDenunciante = await abrirKConFrase(
    Uint8Array.from(atob(paquete.kParaDenunciante), (byte) => byte.charCodeAt(0)),
    entrada.fraseSecreta,
    Uint8Array.from(atob(paquete.salKek), (byte) => byte.charCodeAt(0))
  );
  const contenidoOrg = JSON.parse(await descifrarTexto(
    llaveOrg,
    Uint8Array.from(atob(paquete.iv), (byte) => byte.charCodeAt(0)),
    Uint8Array.from(atob(paquete.contenidoCifrado), (byte) => byte.charCodeAt(0))
  ));
  const contenidoDenunciante = JSON.parse(await descifrarTexto(
    llaveDenunciante,
    Uint8Array.from(atob(paquete.iv), (byte) => byte.charCodeAt(0)),
    Uint8Array.from(atob(paquete.contenidoCifrado), (byte) => byte.charCodeAt(0))
  ));

  assert.deepEqual(contenidoOrg, {
    titulo: entrada.titulo,
    tipo: entrada.tipo,
    descripcion: entrada.descripcion,
  });
  assert.deepEqual(contenidoDenunciante, contenidoOrg);

  const casoAdministradora = await descifrarCasoOrganizacion({
    ...paquete,
    contenidoCifrado: paquete.contenidoCifrado,
  }, parRSA.privateKey);
  assert.deepEqual(casoAdministradora.contenido, contenidoOrg);
});
