// Export database connection functions
const { connectToFAMS, checkConnectionStatus, getDatabaseInfo } = require('./database');

// Export models
const models = require('./models');

// Export API router
const apiRouter = require('./api');

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
  
  // Initialization function
  initializeDatabase
}; 