// Export database connection functions
const { connectToFAMS } = require('./connection');
const { checkConnectionStatus, getDatabaseInfo } = require('./utils/dbUtils');

// Export models
const models = require('./models');

// Export API router
const apiRouter = require('./routes/databaseRoutes');

// Export batch service
const batchService = require('./services/batchService');

// Export initialization function
const initializeDatabase = () => {
  return new Promise((resolve) => {
    console.log('Database initialization has been disabled to prevent data loss.');
    console.log('To manually initialize the database, run: python backend/init_database.py');
    resolve({ success: false, message: 'Initialization disabled by design' });
  });
};

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
  batchService,
  
  // Initialization function
  initializeDatabase
}; 