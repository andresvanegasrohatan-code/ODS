const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const EvidenciaCaso = sequelize.define(
  'EvidenciaCaso',
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    casoId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      field: 'caso_id',
    },
    rutaAlmacenamiento: {
      type: DataTypes.STRING(500),
      allowNull: false,
      unique: true,
      field: 'ruta_almacenamiento',
    },
    metadatosCifrados: {
      type: DataTypes.TEXT,
      allowNull: false,
      field: 'metadatos_cifrados',
    },
    metadatosIv: {
      type: DataTypes.STRING(24),
      allowNull: false,
      field: 'metadatos_iv',
    },
    contenidoIv: {
      type: DataTypes.STRING(24),
      allowNull: false,
      field: 'contenido_iv',
    },
    tamanoCifrado: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'tamano_cifrado',
    },
    estadoCarga: {
      type: DataTypes.ENUM('pendiente', 'lista'),
      allowNull: false,
      defaultValue: 'pendiente',
      field: 'estado_carga',
    },
    creadoEn: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'creado_en',
    },
  },
  {
    tableName: 'evidencias_caso',
    timestamps: false,
    indexes: [{ fields: ['caso_id', 'estado_carga'] }],
  }
);

module.exports = EvidenciaCaso;
