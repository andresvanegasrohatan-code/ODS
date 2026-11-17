const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const { ESTADOS } = require('../config/constants');

const CasoAnonimo = sequelize.define(
  'CasoAnonimo',
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },
    codigo: {
      type: DataTypes.CHAR(12),
      allowNull: false,
      unique: true,
    },
    llaveOrganizacionId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'llave_organizacion_id',
    },
    kParaOrg: {
      type: DataTypes.TEXT,
      allowNull: false,
      field: 'k_para_org',
    },
    kParaDenunciante: {
      type: DataTypes.TEXT,
      allowNull: false,
      field: 'k_para_denunciante',
    },
    salKek: {
      type: DataTypes.STRING(24),
      allowNull: false,
      field: 'sal_kek',
    },
    salVerificador: {
      type: DataTypes.STRING(24),
      allowNull: false,
      field: 'sal_verificador',
    },
    verificadorHash: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: 'verificador_hash',
    },
    contenidoCifrado: {
      type: DataTypes.TEXT('long'),
      allowNull: false,
      field: 'contenido_cifrado',
    },
    iv: {
      type: DataTypes.STRING(16),
      allowNull: false,
    },
    estado: {
      type: DataTypes.ENUM(...ESTADOS),
      allowNull: false,
      defaultValue: 'Pendiente',
    },
    creadoEn: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'creado_en',
    },
  },
  {
    tableName: 'casos_anonimos',
    timestamps: false,
    indexes: [{ fields: ['llave_organizacion_id'] }],
  }
);

module.exports = CasoAnonimo;
