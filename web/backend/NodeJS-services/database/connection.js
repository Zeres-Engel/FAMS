const mongoose = require('mongoose');
const { checkConnectionStatus } = require('./utils/dbUtils');

// Database name
const DATABASE_NAME = 'fams';

/**
 * Connect to the FAMS MongoDB database
 * @returns {Promise<Object>} Connection result
 */
const connectToFAMS = async () => {
  try {
    // Get MongoDB URI from environment variables
    if (!process.env.MONGO_URI) {
      console.error('MONGO_URI is not defined in .env file');
      return {
        success: false,
        message: 'MONGO_URI is not defined in environment variables'
      };
    }
    
    const mongoURI = process.env.MONGO_URI;
    
    // Ensure URI has the correct database name (fams)
    const uriWithDatabase = mongoURI.includes('/fams?') ? 
      mongoURI : 
      mongoURI.replace(/\/([^/?]+)?(\?|$)/, '/fams$2');
    
    console.log('Connecting to MongoDB...');
    
    // Connect to the database
    await mongoose.connect(uriWithDatabase, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000
    });
    
    console.log(`MongoDB Connected: ${mongoose.connection.host}`);
    console.log(`Database Name: ${mongoose.connection.db.databaseName}`);
    
    return {
      success: true,
      message: `Connected to ${mongoose.connection.db.databaseName} database at ${mongoose.connection.host}`
    };
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    return {
      success: false,
      message: `Connection failed: ${error.message}`
    };
  }
};

module.exports = {
  connectToFAMS
}; 