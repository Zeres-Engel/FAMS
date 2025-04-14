// This is a proxy file to maintain backward compatibility
// The functionality has been split into ./connection.js and ./utils/dbUtils.js

const { connectToFAMS } = require('./connection');
const { checkConnectionStatus, getDatabaseInfo } = require('./utils/dbUtils');

module.exports = {
  connectToFAMS,
  checkConnectionStatus,
  getDatabaseInfo
}; 