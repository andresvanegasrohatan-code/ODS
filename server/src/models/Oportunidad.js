const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Oportunidad = sequelize.define(
  'Oportunidad',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    etiqueta: {
      type: DataTypes.STRING(80),
      allowNull: false,
    },
    color: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'brand',
      validate: { isIn: [['brand', 'violet', 'gold']] },
    },
    titulo: {
      type: DataTypes.STRING(180),
      allowNull: false,
      unique: true,
      validate: { notEmpty: { msg: 'El título es obligatorio' } },
    },
    texto: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: { notEmpty: { msg: 'La descripción es obligatoria' } },
    },
    fecha: {
      type: DataTypes.STRING(120),
      allowNull: true,
    },
    url: {
      type: DataTypes.STRING(2048),
      allowNull: true,
      validate: {
        isValidActionUrl(value) {
          if (value && !/^(https?:\/\/[^\s]+|tel:\+?[0-9]+)$/i.test(value)) {
            throw new Error('El enlace debe usar http, https o tel');
          }
        },
      },
    },
    enlaceTexto: {
      type: DataTypes.STRING(120),
      allowNull: true,
      field: 'enlace_texto',
    },
    informacionUrl: {
      type: DataTypes.STRING(2048),
      allowNull: true,
      validate: { isUrl: { msg: 'El enlace informativo no es válido' } },
      field: 'informacion_url',
    },
    activo: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    orden: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
  },
  {
    tableName: 'oportunidades',
  }
);

module.exports = Oportunidad;
