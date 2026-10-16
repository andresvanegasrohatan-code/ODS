require('dotenv').config();

if (!process.env.JWT_SECRET) {
  console.error('Falta JWT_SECRET en el archivo .env. Copia .env.example a .env y configúralo.');
  process.exit(1);
}

const app = require('./src/app');
const { sequelize } = require('./src/models');

const PORT = process.env.PORT || 4000;

async function iniciar() {
  try {
    await sequelize.authenticate();
    await sequelize.sync();
    console.log('Base de datos conectada y tablas sincronizadas');

    app.listen(PORT, () => {
      console.log(`API de EquiGénero escuchando en http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('No se pudo iniciar el servidor:', error);
    process.exit(1);
  }
}

iniciar();
