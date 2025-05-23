// Export database connection functions
const { connectToFAMS } = require('./connection');
const { checkConnectionStatus, getDatabaseInfo } = require('./utils/dbUtils');

// Export models
const models = require('./models');

// Export API router
const apiRouter = require('./routes/databaseRoutes');

// Export batch service
const batchService = require('./services/batchService');

module.exports = {
  // Database connection functions
  connectToFAMS,
  checkConnectionStatus,
  getDatabaseInfo,
  
  // Models
  models,
  
  // API router
  apiRouter,
  
  // Batch service
  batchService
}; 