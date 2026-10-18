const app = require('../server/src/app');
const { sequelize } = require('../server/src/models');

let databaseReady;

async function ensureDatabaseConnection() {
  if (!databaseReady) {
    databaseReady = sequelize.authenticate().catch((error) => {
      databaseReady = undefined;
      throw error;
    });
  }

  return databaseReady;
}

module.exports = async function handleApiRequest(req, res) {
  try {
    await ensureDatabaseConnection();
    return app(req, res);
  } catch (error) {
    console.error('No se pudo conectar con la base de datos:', error);
    return res.status(503).json({ mensaje: 'El servicio no está disponible temporalmente' });
  }
};
