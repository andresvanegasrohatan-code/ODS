const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const { PRIORIDADES, ESTADOS, TIPOS_SITUACION } = require('../config/constants');

const Situacion = sequelize.define(
  'Situacion',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    tipo: {
      type: DataTypes.STRING(80),
      allowNull: false,
      validate: {
        isIn: {
          args: [TIPOS_SITUACION],
          msg: 'El tipo de situación no es válido',
        },
      },
    },
    fecha: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      validate: { isDate: { msg: 'La fecha no es válida' } },
    },
    lugar: {
      type: DataTypes.STRING(200),
      allowNull: true,
    },
    descripcion: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: { notEmpty: { msg: 'La descripción es obligatoria' } },
    },
    prioridad: {
      type: DataTypes.ENUM(...PRIORIDADES),
      allowNull: false,
      defaultValue: 'Medio',
    },
    estado: {
      type: DataTypes.ENUM(...ESTADOS),
      allowNull: false,
      defaultValue: 'Pendiente',
    },
    seguimiento: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: '',
    },
  },
  {
    tableName: 'situaciones',
  }
);

module.exports = Situacion;
