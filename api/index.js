// Punto de entrada serverless para Vercel: reutiliza la app Express de /server.

function restaurarRutaApi(req) {
  const url = new URL(req.url, `https://${req.headers.host || 'localhost'}`);
  const ruta = url.searchParams.get('__api_path');

  if (ruta === null) return;

  url.searchParams.delete('__api_path');
  const consulta = url.searchParams.toString();
  req.url = `/api/${ruta}${consulta ? `?${consulta}` : ''}`;
}

// La conexión se reutiliza por instancia; las migraciones se ejecutan por separado.
let listo;
module.exports = async (req, res) => {
  restaurarRutaApi(req);

  try {
    const app = require('../server/src/app');
    const { sequelize } = require('../server/src/models');

    if (!listo) {
      listo = sequelize.authenticate().catch((error) => {
        listo = undefined;
        throw error;
      });
    }
    await listo;
    return app(req, res);
  } catch (error) {
    console.error('No se pudo iniciar la API o conectar a la base de datos:', error.message);
    return res.status(503).json({ mensaje: 'El servicio no está disponible temporalmente' });
  }
};
