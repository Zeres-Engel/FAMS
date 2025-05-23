const mongoose = require('mongoose');
const { checkConnectionStatus } = require('./utils/dbUtils');

// Database name
const DATABASE_NAME = process.env.MONGO_DB_NAME || 'fams';

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
    
    // Ensure URI has the correct database name
    const uriWithDatabase = mongoURI.includes(`/${DATABASE_NAME}?`) ? 
      mongoURI : 
      mongoURI.replace(/\/([^/?]+)?(\?|$)/, `/${DATABASE_NAME}$2`);
    
    console.log(`Connecting to MongoDB database: ${DATABASE_NAME}...`);
    
    // Connect to the database with updated options
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
        
        // Check for collection and document availability
        await checkCollectionStatus(collections);
        
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

/**
 * Check the status of key collections
 * @param {Array} collections - Array of collection info objects
 */
async function checkCollectionStatus(collections) {
  // Check if Student collection exists and has documents
  if (collections.some(c => c.name === 'students')) {
    const studentsCount = await mongoose.connection.db.collection('students').countDocuments();
    console.log(`Students collection has ${studentsCount} documents`);
  } else {
    console.warn('Students collection not found in database!');
  }
  
  // Check other key collections
  const keyCollections = ['users', 'teachers', 'classes', 'schedules'];
  for (const collection of keyCollections) {
    if (collections.some(c => c.name === collection)) {
      const count = await mongoose.connection.db.collection(collection).countDocuments();
      console.log(`${collection} collection has ${count} documents`);
    } else {
      console.warn(`${collection} collection not found in database!`);
    }
  }
}

module.exports = {
  connectToFAMS
}; 