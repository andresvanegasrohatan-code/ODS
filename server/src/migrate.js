require('dotenv').config();
const { sequelize } = require('./models');

async function migrar() {
  try {
    await sequelize.authenticate();
    // alter: ajusta las tablas existentes al modelo sin borrar datos
    await sequelize.sync({ alter: true });
    console.log(
      'Migración completada: tablas de usuarios, situaciones, oportunidades, llaves y casos anónimos, mensajes, evidencias y límites de acceso listas.'
    );
    process.exit(0);
  } catch (error) {
    console.error('Error durante la migración:', error);
    process.exit(1);
  }
}

migrar();
