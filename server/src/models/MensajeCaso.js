const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const MensajeCaso = sequelize.define(
  'MensajeCaso',
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },
    casoId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      field: 'caso_id',
    },
    autor: {
      type: DataTypes.ENUM('denunciante', 'administradora'),
      allowNull: false,
    },
    contenidoCifrado: {
      type: DataTypes.TEXT('long'),
      allowNull: false,
      field: 'contenido_cifrado',
    },
    iv: {
      type: DataTypes.STRING(24),
      allowNull: false,
    },
    creadoEn: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'creado_en',
    },
  },
  {
    tableName: 'mensajes_caso',
    timestamps: false,
    indexes: [{ fields: ['caso_id', 'id'] }],
  }
);

module.exports = MensajeCaso;
