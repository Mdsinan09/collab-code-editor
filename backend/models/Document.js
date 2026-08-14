const { DataTypes } = require('sequelize');
const { sequelize } = require('./db');

const Document = sequelize.define('Document', {
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  content: {
    type: DataTypes.TEXT,
    defaultValue: '',
  },
  language: {
    type: DataTypes.STRING,
    defaultValue: 'javascript',
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'documents',
  timestamps: true,
});

module.exports = { sequelize, Document };
