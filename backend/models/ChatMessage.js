const { DataTypes } = require('sequelize');
const { sequelize } = require('./db');

const ChatMessage = sequelize.define('ChatMessage', {
  id: {
    type: DataTypes.STRING,
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
  userColor: {
    type: DataTypes.STRING,
    defaultValue: '#64748b',
  },
  text: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'chat_messages',
  timestamps: false,
});

module.exports = { ChatMessage };
