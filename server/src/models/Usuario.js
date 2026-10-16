const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const sequelize = require('../config/database');
const { ROLES } = require('../config/constants');

const Usuario = sequelize.define(
  'Usuario',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    nombre: {
      type: DataTypes.STRING(120),
      allowNull: false,
      validate: { notEmpty: { msg: 'El nombre es obligatorio' } },
    },
    correo: {
      type: DataTypes.STRING(160),
      allowNull: false,
      unique: true,
      validate: { isEmail: { msg: 'El correo no es válido' } },
    },
    contrasena: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    rol: {
      type: DataTypes.ENUM(...ROLES),
      allowNull: false,
      defaultValue: 'usuario',
    },
    activo: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    tableName: 'usuarios',
    hooks: {
      beforeSave: async (usuario) => {
        if (usuario.changed('contrasena')) {
          const salt = await bcrypt.genSalt(10);
          usuario.contrasena = await bcrypt.hash(usuario.contrasena, salt);
        }
        if (usuario.changed('correo')) {
          usuario.correo = usuario.correo.trim().toLowerCase();
        }
      },
    },
  }
);

Usuario.prototype.verificarContrasena = function verificarContrasena(plana) {
  return bcrypt.compare(plana, this.contrasena);
};

Usuario.prototype.toJSON = function toJSON() {
  const valores = { ...this.get() };
  delete valores.contrasena;
  return valores;
};

module.exports = Usuario;
