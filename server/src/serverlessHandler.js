let app;
let sequelize;
let databaseReady;

function loadApi() {
  if (!app || !sequelize) {
    app = require('./app');
    ({ sequelize } = require('./models'));
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
    await sequelize.sync();
    return app(req, res);
  } catch (error) {
    console.error('No se pudo inicializar la API o conectar con la base de datos:', error);
    const causa = error?.original?.code || error?.parent?.code || error?.code || error?.name || 'ERROR_DESCONOCIDO';
    return res.status(503).json({
      mensaje: 'El servicio no está disponible temporalmente',
      codigo: causa,
    });
  }
};
