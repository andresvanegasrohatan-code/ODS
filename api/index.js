// Punto de entrada serverless para Vercel: reutiliza la app Express de /server
// (todas las rutas /api/* se redirigen aquí desde vercel.json).
const app = require('../server/src/app');
const { sequelize } = require('../server/src/models');

function restaurarRutaApi(req) {
  const url = new URL(req.url, `https://${req.headers.host || 'localhost'}`);
  const ruta = url.searchParams.get('__api_path');

  if (ruta === null) return;

  url.searchParams.delete('__api_path');
  const consulta = url.searchParams.toString();
  req.url = `/api/${ruta}${consulta ? `?${consulta}` : ''}`;
}

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
  restaurarRutaApi(req);

  try {
    await prepararBaseDeDatos();
  } catch (error) {
    console.error('No se pudo conectar a la base de datos:', error.message);
    return res.status(503).json({ mensaje: 'Base de datos no disponible' });
  }
  return app(req, res);
};
