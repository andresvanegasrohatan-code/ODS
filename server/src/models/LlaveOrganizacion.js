const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const LlaveOrganizacion = sequelize.define(
  'LlaveOrganizacion',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    publicaSpki: {
      type: DataTypes.TEXT,
      allowNull: false,
      field: 'publica_spki',
    },
    privadaCifrada: {
      type: DataTypes.TEXT,
      allowNull: false,
      field: 'privada_cifrada',
    },
    sal: {
      type: DataTypes.STRING(24),
      allowNull: false,
    },
    iv: {
      type: DataTypes.STRING(24),
      allowNull: false,
    },
    activa: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    creadaEn: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'creada_en',
    },
  },
  {
    tableName: 'llaves_organizacion',
    timestamps: false,
  }
);

module.exports = LlaveOrganizacion;
