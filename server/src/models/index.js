const sequelize = require('../config/database');
const Usuario = require('./Usuario');
const Situacion = require('./Situacion');
const Oportunidad = require('./Oportunidad');

Usuario.hasMany(Situacion, { foreignKey: { name: 'usuarioId', allowNull: false }, as: 'situaciones', onDelete: 'CASCADE' });
Situacion.belongsTo(Usuario, { foreignKey: { name: 'usuarioId', allowNull: false }, as: 'autor' });

module.exports = { sequelize, Usuario, Situacion, Oportunidad };
