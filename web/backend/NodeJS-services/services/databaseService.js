/**
 * Database Service
 * Provides centralized methods for common database operations
 */

const mongoose = require('mongoose');

/**
 * Connect to MongoDB with error handling and retry logic
 * 
 * @param {string} mongoUri - MongoDB connection string
 * @param {number} maxRetries - Maximum number of connection retries
 * @returns {Promise<mongoose.Connection>} Mongoose connection object
 */
exports.connectDatabase = async (mongoUri, maxRetries = 5) => {
  let retries = 0;
  
  while (retries < maxRetries) {
    try {
      console.log(`Connecting to MongoDB (attempt ${retries + 1})...`);
      
      await mongoose.connect(mongoUri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        tlsAllowInvalidCertificates: true
      });
      
      console.log('MongoDB connected successfully!');
      return mongoose.connection;
    } catch (error) {
      console.error(`MongoDB connection error (attempt ${retries + 1}):`, error.message);
      
      // Wait before retrying (exponential backoff)
      const waitTime = Math.pow(2, retries) * 1000;
      await new Promise(resolve => setTimeout(resolve, waitTime));
      
      retries++;
      if (retries >= maxRetries) {
        console.error('Max connection retries reached. Could not connect to MongoDB.');
        throw new Error('Failed to connect to MongoDB after multiple attempts');
      }
    }
  }
};

/**
 * Safely find a document by ID with error handling
 * 
 * @param {mongoose.Model} model - Mongoose model to query
 * @param {string|number} id - ID to search for
 * @param {string} idField - Field name to match the ID (default: '_id')
 * @param {string|Array<string>} populate - Field(s) to populate
 * @returns {Promise<Object|null>} Found document or null
 */
exports.findById = async (model, id, idField = '_id', populate = null) => {
  try {
    const query = {};
    query[idField] = id;
    
    let queryBuilder = model.findOne(query);
    
    if (populate) {
      if (Array.isArray(populate)) {
        populate.forEach(field => {
          queryBuilder = queryBuilder.populate(field);
        });
      } else {
        queryBuilder = queryBuilder.populate(populate);
      }
    }
    
    return await queryBuilder.exec();
  } catch (error) {
    console.error(`Error finding document by ${idField}:`, error);
    return null;
  }
};

/**
 * Safely update a document by ID with error handling
 * 
 * @param {mongoose.Model} model - Mongoose model to update
 * @param {string|number} id - ID to search for
 * @param {Object} updateData - Data to update
 * @param {string} idField - Field name to match the ID (default: '_id')
 * @returns {Promise<Object|null>} Updated document or null
 */
exports.updateById = async (model, id, updateData, idField = '_id') => {
  try {
    const query = {};
    query[idField] = id;
    
    return await model.findOneAndUpdate(
      query,
      { $set: updateData },
      { new: true, runValidators: true }
    );
  } catch (error) {
    console.error(`Error updating document by ${idField}:`, error);
    return null;
  }
};

/**
 * Safely create a new document with error handling
 * 
 * @param {mongoose.Model} model - Mongoose model to create
 * @param {Object} data - Document data
 * @returns {Promise<Object|null>} Created document or null
 */
exports.createDocument = async (model, data) => {
  try {
    return await model.create(data);
  } catch (error) {
    console.error('Error creating document:', error);
    return null;
  }
};

/**
 * Safely delete a document by ID with error handling
 * 
 * @param {mongoose.Model} model - Mongoose model to delete from
 * @param {string|number} id - ID to search for
 * @param {string} idField - Field name to match the ID (default: '_id')
 * @returns {Promise<boolean>} True if deletion was successful
 */
exports.deleteById = async (model, id, idField = '_id') => {
  try {
    const query = {};
    query[idField] = id;
    
    const result = await model.deleteOne(query);
    return result.deletedCount > 0;
  } catch (error) {
    console.error(`Error deleting document by ${idField}:`, error);
    return false;
  }
}; 