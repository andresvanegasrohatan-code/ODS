// Punto de entrada serverless para Vercel: reutiliza la app Express de /server
// (todas las rutas /api/* se redirigen aquí desde vercel.json).
const app = require('../server/src/app');
const { sequelize } = require('../server/src/models');

// La conexión y la sincronización se hacen una sola vez por instancia en frío.
let listo;
function prepararBaseDeDatos() {
  if (!listo) {
    listo = sequelize
      .authenticate()
      .then(() => sequelize.sync())
      .catch((error) => {
        listo = undefined; // permite reintentar en la siguiente petición
        throw error;
      });
  }
  return listo;
}

module.exports = async (req, res) => {
  try {
    await prepararBaseDeDatos();
  } catch (error) {
    console.error('No se pudo conectar a la base de datos:', error.message);
    return res.status(503).json({ mensaje: 'Base de datos no disponible' });
  }
  return app(req, res);
};
