const { DataTypes } = require('sequelize');
const { sequelize } = require('./db');

const Execution = sequelize.define('Execution', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  roomId: {
    type: DataTypes.STRING,
    allowNull: false,
    index: true,
  },
  userName: {
    type: DataTypes.STRING,
    defaultValue: 'Anonymous',
  },
  language: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  code: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  output: {
    type: DataTypes.TEXT,
    defaultValue: '',
  },
  error: {
    type: DataTypes.TEXT,
    defaultValue: '',
  },
  exitCode: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  executionTime: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'executions',
  timestamps: false,
});

module.exports = { Execution };
