const mongoose = require('mongoose');

/**
 * Check the connection status of MongoDB
 * @returns {string} Connection status
 */
const checkConnectionStatus = () => {
  const state = mongoose.connection.readyState;
  switch (state) {
    case 0:
      return 'Disconnected';
    case 1:
      return 'Connected';
    case 2:
      return 'Connecting';
    case 3:
      return 'Disconnecting';
    default:
      return 'Unknown';
  }
};

/**
 * Get database information including collections and stats
 * @returns {Promise<Object>} Database information
 */
const getDatabaseInfo = async () => {
  if (mongoose.connection.readyState !== 1) {
    return {
      status: 'Disconnected',
      collections: [],
      stats: null
    };
  }

  try {
    const collections = await mongoose.connection.db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    const stats = await mongoose.connection.db.stats();

    return {
      status: 'Connected',
      databaseName: mongoose.connection.db.databaseName,
      host: mongoose.connection.host,
      port: mongoose.connection.port,
      collections: collectionNames,
      stats: {
        collections: stats.collections,
        views: stats.views,
        objects: stats.objects,
        dataSize: stats.dataSize,
        storageSize: stats.storageSize,
        indexes: stats.indexes,
        indexSize: stats.indexSize
      }
    };
  } catch (error) {
    console.error('Error getting database info:', error);
    return {
      status: 'Error',
      error: error.message
    };
  }
};

/**
 * Format error response
 * @param {Error} error - Error object
 * @returns {Object} Formatted error response
 */
const formatErrorResponse = (error) => {
  return {
    success: false,
    error: error.message
  };
};

/**
 * Format success response
 * @param {*} data - Response data
 * @param {string} message - Success message
 * @returns {Object} Formatted success response
 */
const formatSuccessResponse = (data, message = '') => {
  return {
    success: true,
    data,
    message
  };
};

module.exports = {
  checkConnectionStatus,
  getDatabaseInfo,
  formatErrorResponse,
  formatSuccessResponse
}; 