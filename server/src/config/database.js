const { Sequelize } = require('sequelize');

let sequelize;
const dialect = process.env.DB_DIALECT || 'sqlite';

if (dialect === 'postgres') {
  if (!process.env.DATABASE_URL) {
    throw new Error('DB_DIALECT=postgres requiere definir DATABASE_URL en el archivo .env');
  }
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    logging: false,
    dialectOptions:
      process.env.DB_SSL === 'true'
        ? { ssl: { require: true, rejectUnauthorized: false } }
        : {},
  });
} else if (dialect === 'mysql') {
  if (!process.env.DB_NAME || !process.env.DB_USER) {
    throw new Error('DB_DIALECT=mysql requiere definir DB_NAME y DB_USER en el archivo .env');
  }

  const port = Number(process.env.DB_PORT || 3306);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('DB_PORT debe ser un puerto válido entre 1 y 65535');
  }

  sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD || '', {
    dialect: 'mysql',
    host: process.env.DB_HOST || 'localhost',
    port,
    logging: false,
  });
} else if (dialect === 'sqlite') {
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: process.env.SQLITE_PATH || './database.sqlite',
    logging: false,
  });
} else {
  throw new Error(`DB_DIALECT no soportado: ${dialect}`);
}

module.exports = sequelize;
