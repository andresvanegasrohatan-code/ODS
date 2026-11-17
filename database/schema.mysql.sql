CREATE DATABASE IF NOT EXISTS equigenero
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE equigenero;

CREATE TABLE IF NOT EXISTS usuarios (
  id INT NOT NULL AUTO_INCREMENT,
  nombre VARCHAR(120) NOT NULL,
  correo VARCHAR(160) NOT NULL,
  contrasena VARCHAR(100) NOT NULL,
  rol ENUM('usuario', 'administrador') NOT NULL DEFAULT 'usuario',
  activo TINYINT(1) NOT NULL DEFAULT 1,
  createdAt DATETIME NOT NULL,
  updatedAt DATETIME NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY usuarios_correo_unique (correo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS situaciones (
  id INT NOT NULL AUTO_INCREMENT,
  tipo VARCHAR(80) NOT NULL,
  fecha DATE NOT NULL,
  lugar VARCHAR(200) NULL,
  descripcion TEXT NOT NULL,
  prioridad ENUM('Bajo', 'Medio', 'Alto') NOT NULL DEFAULT 'Medio',
  estado ENUM('Pendiente', 'Activo', 'Resuelto') NOT NULL DEFAULT 'Pendiente',
  seguimiento TEXT NOT NULL,
  usuarioId INT NOT NULL,
  createdAt DATETIME NOT NULL,
  updatedAt DATETIME NOT NULL,
  PRIMARY KEY (id),
  KEY situaciones_usuarioId_index (usuarioId),
  CONSTRAINT situaciones_usuarioId_fk
    FOREIGN KEY (usuarioId) REFERENCES usuarios (id)
    ON UPDATE CASCADE
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS oportunidades (
  id INT NOT NULL AUTO_INCREMENT,
  etiqueta VARCHAR(80) NOT NULL,
  color VARCHAR(20) NOT NULL DEFAULT 'brand',
  titulo VARCHAR(180) NOT NULL,
  texto TEXT NOT NULL,
  fecha VARCHAR(120) NULL,
  url VARCHAR(2048) NULL,
  enlace_texto VARCHAR(120) NULL,
  informacion_url VARCHAR(2048) NULL,
  activo TINYINT(1) NOT NULL DEFAULT 1,
  orden INT NOT NULL DEFAULT 0,
  createdAt DATETIME NOT NULL,
  updatedAt DATETIME NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY oportunidades_titulo_unique (titulo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS llaves_organizacion (
  id INT NOT NULL AUTO_INCREMENT,
  publica_spki TEXT NOT NULL,
  privada_cifrada TEXT NOT NULL,
  sal VARCHAR(24) NOT NULL,
  iv VARCHAR(24) NOT NULL,
  activa TINYINT(1) NOT NULL DEFAULT 1,
  creada_en DATETIME NOT NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS casos_anonimos (
  id BIGINT NOT NULL AUTO_INCREMENT,
  codigo CHAR(12) NOT NULL,
  llave_organizacion_id INT NOT NULL,
  k_para_org TEXT NOT NULL,
  k_para_denunciante TEXT NOT NULL,
  sal_kek VARCHAR(24) NOT NULL,
  sal_verificador VARCHAR(24) NOT NULL,
  verificador_hash VARCHAR(100) NOT NULL,
  contenido_cifrado LONGTEXT NOT NULL,
  iv VARCHAR(16) NOT NULL,
  estado ENUM('Pendiente', 'Activo', 'Resuelto') NOT NULL DEFAULT 'Pendiente',
  creado_en DATETIME NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY casos_anonimos_codigo_unique (codigo),
  KEY casos_anonimos_llave_organizacion_index (llave_organizacion_id),
  CONSTRAINT casos_anonimos_llave_organizacion_fk
    FOREIGN KEY (llave_organizacion_id) REFERENCES llaves_organizacion (id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS accesos_caso (
  codigo_hash CHAR(64) NOT NULL,
  intentos_fallidos INT NOT NULL DEFAULT 0,
  inicio_ventana DATETIME NOT NULL,
  PRIMARY KEY (codigo_hash),
  KEY accesos_caso_inicio_ventana_index (inicio_ventana)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS mensajes_caso (
  id BIGINT NOT NULL AUTO_INCREMENT,
  caso_id BIGINT NOT NULL,
  autor ENUM('denunciante', 'administradora') NOT NULL,
  contenido_cifrado LONGTEXT NOT NULL,
  iv VARCHAR(24) NOT NULL,
  creado_en DATETIME NOT NULL,
  PRIMARY KEY (id),
  KEY mensajes_caso_caso_id_id_index (caso_id, id),
  CONSTRAINT mensajes_caso_caso_fk
    FOREIGN KEY (caso_id) REFERENCES casos_anonimos (id)
    ON UPDATE CASCADE
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS evidencias_caso (
  id CHAR(36) NOT NULL,
  caso_id BIGINT NOT NULL,
  ruta_almacenamiento VARCHAR(500) NOT NULL,
  metadatos_cifrados TEXT NOT NULL,
  metadatos_iv VARCHAR(24) NOT NULL,
  contenido_iv VARCHAR(24) NOT NULL,
  tamano_cifrado INT NOT NULL,
  estado_carga ENUM('pendiente', 'lista') NOT NULL DEFAULT 'pendiente',
  creado_en DATETIME NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY evidencias_caso_ruta_unique (ruta_almacenamiento),
  KEY evidencias_caso_caso_id_estado_index (caso_id, estado_carga),
  CONSTRAINT evidencias_caso_caso_fk
    FOREIGN KEY (caso_id) REFERENCES casos_anonimos (id)
    ON UPDATE CASCADE
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
