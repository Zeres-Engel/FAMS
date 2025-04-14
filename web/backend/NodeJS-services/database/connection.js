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
    console.log('MongoDB URI:', mongoURI.substring(0, mongoURI.indexOf('@') > 0 ? mongoURI.indexOf('@') : 20) + '...');
    
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
    
    // Log connection details and collection names
    if (mongoose.connection.readyState === 1) {
      try {
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log(`Found ${collections.length} collections in database`);
        console.log('Collections:', collections.map(c => c.name).join(', '));
        
        // Check if Student collection exists and has documents
        if (collections.some(c => c.name === 'students')) {
          const studentsCount = await mongoose.connection.db.collection('students').countDocuments();
          console.log(`Students collection has ${studentsCount} documents`);
        } else {
          console.warn('Students collection not found in database!');
        }
      } catch (err) {
        console.error('Error checking collections:', err.message);
      }
    }
    
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