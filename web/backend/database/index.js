// Export database connection functions
const { connectToFAMS, checkConnectionStatus, getDatabaseInfo } = require('./database');

// Export models
const models = require('./models');

// Export API router
const apiRouter = require('./api');

// Export initialization function
const initializeDatabase = () => {
  return new Promise((resolve, reject) => {
    try {
      // Run the database initialization script
      const initDb = require('./initDatabase');
      resolve(initDb);
    } catch (error) {
      reject(error);
    }
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
  
  // Initialization function
  initializeDatabase
}; 