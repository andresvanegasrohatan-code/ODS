const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AccesoCaso = sequelize.define(
  'AccesoCaso',
  {
    codigoHash: {
      type: DataTypes.CHAR(64),
      primaryKey: true,
      field: 'codigo_hash',
    },
    intentosFallidos: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'intentos_fallidos',
    },
    inicioVentana: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'inicio_ventana',
    },
  },
  {
    tableName: 'accesos_caso',
    timestamps: false,
    indexes: [{ fields: ['inicio_ventana'] }],
  }
);

module.exports = AccesoCaso;
