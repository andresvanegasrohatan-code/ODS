let app;
let sequelize;
let databaseReady;

function loadApi() {
  if (!app || !sequelize) {
    app = require('../server/src/app');
    ({ sequelize } = require('../server/src/models'));
  }
}

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
    loadApi();
    await ensureDatabaseConnection();
    return app(req, res);
  } catch (error) {
    console.error('No se pudo inicializar la API o conectar con la base de datos:', error);
    return res.status(503).json({ mensaje: 'El servicio no está disponible temporalmente' });
  }
};
