const { DataTypes } = require('sequelize');
const { sequelize } = require('./db');

const File = sequelize.define('File', {
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
  },
  roomId: {
    type: DataTypes.STRING,
    allowNull: false,
    index: true,
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
  tableName: 'files',
  timestamps: true,
});

module.exports = { File };
