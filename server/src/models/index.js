const sequelize = require('../config/database');
const Usuario = require('./Usuario');
const Situacion = require('./Situacion');
const Oportunidad = require('./Oportunidad');
const CasoAnonimo = require('./CasoAnonimo');
const LlaveOrganizacion = require('./LlaveOrganizacion');
const AccesoCaso = require('./AccesoCaso');
const MensajeCaso = require('./MensajeCaso');
const EvidenciaCaso = require('./EvidenciaCaso');

Usuario.hasMany(Situacion, { foreignKey: { name: 'usuarioId', allowNull: false }, as: 'situaciones', onDelete: 'CASCADE' });
Situacion.belongsTo(Usuario, { foreignKey: { name: 'usuarioId', allowNull: false }, as: 'autor' });
LlaveOrganizacion.hasMany(CasoAnonimo, {
  foreignKey: { name: 'llaveOrganizacionId', allowNull: false },
  as: 'casos',
});
CasoAnonimo.belongsTo(LlaveOrganizacion, {
  foreignKey: { name: 'llaveOrganizacionId', allowNull: false },
  as: 'llaveOrganizacion',
});
CasoAnonimo.hasMany(MensajeCaso, {
  foreignKey: { name: 'casoId', allowNull: false },
  as: 'mensajes',
  onDelete: 'CASCADE',
});
MensajeCaso.belongsTo(CasoAnonimo, { foreignKey: 'casoId', as: 'caso' });
CasoAnonimo.hasMany(EvidenciaCaso, {
  foreignKey: { name: 'casoId', allowNull: false },
  as: 'evidencias',
  onDelete: 'CASCADE',
});
EvidenciaCaso.belongsTo(CasoAnonimo, { foreignKey: 'casoId', as: 'caso' });

module.exports = {
  sequelize,
  Usuario,
  Situacion,
  Oportunidad,
  CasoAnonimo,
  LlaveOrganizacion,
  AccesoCaso,
  MensajeCaso,
  EvidenciaCaso,
};
