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
