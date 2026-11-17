const ITERACIONES_PBKDF2 = 600_000;
const TAMANO_SAL = 16;
const TAMANO_IV_GCM = 12;

function obtenerCrypto() {
  if (!globalThis.crypto?.subtle) {
    throw new Error('Web Crypto API no está disponible en este contexto');
  }
  return globalThis.crypto;
}

function validarBytes(valor, nombre) {
  if (valor instanceof Uint8Array) return valor;
  if (valor instanceof ArrayBuffer) return new Uint8Array(valor);
  if (ArrayBuffer.isView(valor)) {
    return new Uint8Array(valor.buffer, valor.byteOffset, valor.byteLength);
  }
  throw new TypeError(`${nombre} debe ser un ArrayBuffer o una vista de bytes`);
}

export function aleatorio(cantidad) {
  if (!Number.isInteger(cantidad) || cantidad < 1 || cantidad > 65_536) {
    throw new RangeError('La cantidad debe ser un entero entre 1 y 65536');
  }
  return obtenerCrypto().getRandomValues(new Uint8Array(cantidad));
}

export function nuevaLlaveCaso() {
  return obtenerCrypto().subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
}

export async function cifrar(llave, datos) {
  const cryptoApi = obtenerCrypto();
  const iv = aleatorio(TAMANO_IV_GCM);
  const bytes = typeof datos === 'string'
    ? new TextEncoder().encode(datos)
    : validarBytes(datos, 'datos');
  const cifrado = await cryptoApi.subtle.encrypt({ name: 'AES-GCM', iv }, llave, bytes);
  return { iv, cifrado: new Uint8Array(cifrado) };
}

export async function descifrarTexto(llave, iv, cifrado) {
  const claro = await descifrarBytes(llave, iv, cifrado);
  return new TextDecoder().decode(claro);
}

export async function descifrarBytes(llave, iv, cifrado) {
  const cryptoApi = obtenerCrypto();
  const ivBytes = validarBytes(iv, 'iv');
  if (ivBytes.byteLength !== TAMANO_IV_GCM) {
    throw new RangeError('El IV de AES-GCM debe tener 12 bytes');
  }
  const cifradoBytes = validarBytes(cifrado, 'cifrado');
  const claro = await cryptoApi.subtle.decrypt(
    { name: 'AES-GCM', iv: ivBytes },
    llave,
    cifradoBytes
  );
  return new Uint8Array(claro);
}

export async function derivar(frase, sal, uso) {
  if (typeof frase !== 'string' || frase.length === 0) {
    throw new TypeError('La frase debe ser una cadena no vacía');
  }
  const salt = validarBytes(sal, 'sal');
  if (salt.byteLength !== TAMANO_SAL) {
    throw new RangeError('La sal PBKDF2 debe tener 16 bytes');
  }
  const base = await obtenerCrypto().subtle.importKey(
    'raw',
    new TextEncoder().encode(frase),
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  );
  const parametros = {
    name: 'PBKDF2',
    salt,
    iterations: ITERACIONES_PBKDF2,
    hash: 'SHA-256',
  };

  if (uso === 'kek') {
    return obtenerCrypto().subtle.deriveKey(
      parametros,
      base,
      { name: 'AES-KW', length: 256 },
      false,
      ['wrapKey', 'unwrapKey']
    );
  }

  if (uso === 'verificador') {
    const bits = await obtenerCrypto().subtle.deriveBits(parametros, base, 256);
    return new Uint8Array(bits);
  }

  if (uso === 'maestra') {
    return obtenerCrypto().subtle.deriveKey(
      parametros,
      base,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  throw new TypeError("El uso debe ser 'kek', 'verificador' o 'maestra'");
}

function bytesABase64(bytes) {
  const tamanoBloque = 32_768;
  let binario = '';
  for (let inicio = 0; inicio < bytes.length; inicio += tamanoBloque) {
    binario += String.fromCharCode(...bytes.subarray(inicio, inicio + tamanoBloque));
  }
  return btoa(binario);
}

function base64ABytes(texto) {
  if (typeof texto !== 'string' || !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(texto)) {
    throw new TypeError('El valor debe ser Base64 válido');
  }
  const binario = atob(texto);
  return Uint8Array.from(binario, (caracter) => caracter.charCodeAt(0));
}

export async function generarLlavesOrganizacion(fraseMaestra) {
  if (typeof fraseMaestra !== 'string' || fraseMaestra.trim().length < 12) {
    throw new TypeError('La frase maestra debe tener al menos 12 caracteres');
  }

  const cryptoApi = obtenerCrypto();
  const parLlaves = await cryptoApi.subtle.generateKey(
    {
      name: 'RSA-OAEP',
      modulusLength: 3072,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: 'SHA-256',
    },
    true,
    ['wrapKey', 'unwrapKey']
  );
  const publica = new Uint8Array(await cryptoApi.subtle.exportKey('spki', parLlaves.publicKey));
  const privada = new Uint8Array(await cryptoApi.subtle.exportKey('pkcs8', parLlaves.privateKey));
  try {
    const sal = aleatorio(TAMANO_SAL);
    const llaveCifrado = await derivar(fraseMaestra, sal, 'maestra');
    const privadaProtegida = await cifrar(llaveCifrado, privada);

    return {
      publicaSpki: bytesABase64(publica),
      privadaCifrada: bytesABase64(privadaProtegida.cifrado),
      sal: bytesABase64(sal),
      iv: bytesABase64(privadaProtegida.iv),
    };
  } finally {
    privada.fill(0);
  }
}

export async function abrirLlavePrivadaOrganizacion({ privadaCifrada, sal, iv, fraseMaestra }) {
  const salBytes = base64ABytes(sal);
  const ivBytes = base64ABytes(iv);
  if (salBytes.byteLength !== TAMANO_SAL || ivBytes.byteLength !== TAMANO_IV_GCM) {
    throw new RangeError('La sal o el IV de la llave de organización no tienen una longitud válida');
  }

  const llaveCifrado = await derivar(fraseMaestra, salBytes, 'maestra');
  const privada = await obtenerCrypto().subtle.decrypt(
    { name: 'AES-GCM', iv: ivBytes },
    llaveCifrado,
    base64ABytes(privadaCifrada)
  );
  const llavePrivada = await obtenerCrypto().subtle.importKey(
    'pkcs8',
    privada,
    { name: 'RSA-OAEP', hash: 'SHA-256' },
    false,
    ['unwrapKey']
  );
  new Uint8Array(privada).fill(0);
  return llavePrivada;
}

export async function importarLlavePublicaOrganizacion(publicaSpki) {
  return obtenerCrypto().subtle.importKey(
    'spki',
    base64ABytes(publicaSpki),
    { name: 'RSA-OAEP', hash: 'SHA-256' },
    true,
    ['wrapKey']
  );
}

export async function prepararCasoAnonimo({ titulo, tipo, descripcion, fraseSecreta, publicaSpki }) {
  if (typeof fraseSecreta !== 'string' || fraseSecreta.trim().length < 12) {
    throw new TypeError('La frase secreta debe tener al menos 12 caracteres');
  }
  if (!String(titulo || '').trim() || !String(tipo || '').trim() || !String(descripcion || '').trim()) {
    throw new TypeError('El título, el tipo y la descripción son obligatorios');
  }

  const llaveCaso = await nuevaLlaveCaso();
  const contenido = new TextEncoder().encode(JSON.stringify({
    titulo: String(titulo).trim(),
    tipo: String(tipo).trim(),
    descripcion: String(descripcion).trim(),
  }));
  const contenidoProtegido = await cifrar(llaveCaso, contenido);
  const llavePublica = await importarLlavePublicaOrganizacion(publicaSpki);
  const salKek = aleatorio(TAMANO_SAL);
  const kParaDenunciante = await envolverKConFrase(llaveCaso, fraseSecreta, salKek);
  const salVerificador = aleatorio(TAMANO_SAL);
  const verificadorDerivado = await derivar(fraseSecreta, salVerificador, 'verificador');

  return {
    contenidoCifrado: bytesABase64(contenidoProtegido.cifrado),
    iv: bytesABase64(contenidoProtegido.iv),
    kParaOrg: bytesABase64(await envolverKConRSA(llaveCaso, llavePublica)),
    kParaDenunciante: bytesABase64(kParaDenunciante),
    salKek: bytesABase64(salKek),
    salVerificador: bytesABase64(salVerificador),
    verificadorDerivado: Array.from(verificadorDerivado, (byte) => byte.toString(16).padStart(2, '0')).join(''),
  };
}

export async function derivarVerificador(fraseSecreta, salBase64) {
  const derivado = await derivar(fraseSecreta, base64ABytes(salBase64), 'verificador');
  return Array.from(derivado, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export async function descifrarCasoDenunciante(fraseSecreta, caso) {
  const { contenido } = await descifrarCasoDenuncianteCompleto(fraseSecreta, caso);
  return contenido;
}

export async function descifrarCasoDenuncianteCompleto(fraseSecreta, caso) {
  const llaveCaso = await abrirKConFrase(base64ABytes(caso.kParaDenunciante), fraseSecreta, base64ABytes(caso.salKek));
  const texto = await descifrarTexto(
    llaveCaso,
    base64ABytes(caso.iv),
    base64ABytes(caso.contenidoCifrado)
  );
  return { contenido: JSON.parse(texto), llaveCaso };
}

export async function descifrarCasoOrganizacion(caso, llavePrivada) {
  const llaveCaso = await abrirKConRSA(base64ABytes(caso.kParaOrg), llavePrivada);
  const texto = await descifrarTexto(
    llaveCaso,
    base64ABytes(caso.iv),
    base64ABytes(caso.contenidoCifrado)
  );
  return { contenido: JSON.parse(texto), llaveCaso };
}

export async function cifrarMensajeCaso(llaveCaso, texto) {
  if (typeof texto !== 'string' || !texto.trim() || texto.length > 50_000) {
    throw new TypeError('El mensaje debe tener entre 1 y 50000 caracteres');
  }
  const cifrado = await cifrar(llaveCaso, texto.trim());
  return {
    contenidoCifrado: bytesABase64(cifrado.cifrado),
    iv: bytesABase64(cifrado.iv),
  };
}

export async function descifrarMensajeCaso(llaveCaso, mensaje) {
  return descifrarTexto(llaveCaso, base64ABytes(mensaje.iv), base64ABytes(mensaje.contenidoCifrado));
}

const TAMANO_MAXIMO_EVIDENCIA = 10 * 1024 * 1024;
const TIPOS_EVIDENCIA = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]);

export async function cifrarEvidencia(llaveCaso, archivo) {
  if (!archivo || !Number.isInteger(archivo.size) || archivo.size < 1 || archivo.size > TAMANO_MAXIMO_EVIDENCIA) {
    throw new RangeError('La evidencia debe ocupar como máximo 10 MB');
  }
  if (!TIPOS_EVIDENCIA.has(archivo.type)) {
    throw new TypeError('Solo se permiten imágenes PNG, JPEG, WebP, GIF o archivos PDF');
  }
  if (typeof archivo.name !== 'string' || archivo.name.length > 255) {
    throw new TypeError('El nombre del archivo no es válido');
  }

  const cifradoArchivo = await cifrar(llaveCaso, new Uint8Array(await archivo.arrayBuffer()));
  const cifradoMetadatos = await cifrar(
    llaveCaso,
    JSON.stringify({ nombre: archivo.name, tipo: archivo.type })
  );
  return {
    contenidoCifrado: cifradoArchivo.cifrado,
    contenidoIv: bytesABase64(cifradoArchivo.iv),
    metadatosCifrados: bytesABase64(cifradoMetadatos.cifrado),
    metadatosIv: bytesABase64(cifradoMetadatos.iv),
  };
}

export async function descifrarMetadatosEvidencia(llaveCaso, evidencia) {
  const texto = await descifrarTexto(
    llaveCaso,
    base64ABytes(evidencia.metadatosIv),
    base64ABytes(evidencia.metadatosCifrados)
  );
  const metadatos = JSON.parse(texto);
  if (
    typeof metadatos.nombre !== 'string'
    || typeof metadatos.tipo !== 'string'
    || !TIPOS_EVIDENCIA.has(metadatos.tipo)
  ) {
    throw new TypeError('Los metadatos descifrados de la evidencia no son válidos');
  }
  return metadatos;
}

export async function descifrarEvidencia(llaveCaso, evidencia, contenidoCifrado) {
  return descifrarBytes(llaveCaso, base64ABytes(evidencia.contenidoIv), contenidoCifrado);
}

export async function envolverKConRSA(llaveCaso, llavePublica) {
  return new Uint8Array(
    await obtenerCrypto().subtle.wrapKey('raw', llaveCaso, llavePublica, { name: 'RSA-OAEP' })
  );
}

export async function abrirKConRSA(llaveEnvuelta, llavePrivada) {
  return obtenerCrypto().subtle.unwrapKey(
    'raw',
    validarBytes(llaveEnvuelta, 'llaveEnvuelta'),
    llavePrivada,
    { name: 'RSA-OAEP' },
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
}

export async function envolverKConFrase(llaveCaso, frase, sal) {
  const kek = await derivar(frase, sal, 'kek');
  return new Uint8Array(
    await obtenerCrypto().subtle.wrapKey('raw', llaveCaso, kek, { name: 'AES-KW' })
  );
}

export async function abrirKConFrase(llaveEnvuelta, frase, sal) {
  const kek = await derivar(frase, sal, 'kek');
  return obtenerCrypto().subtle.unwrapKey(
    'raw',
    validarBytes(llaveEnvuelta, 'llaveEnvuelta'),
    kek,
    { name: 'AES-KW' },
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
}
