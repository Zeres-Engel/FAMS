/**
 * Database Service
 * Provides centralized methods for common database operations
 */

const mongoose = require('mongoose');
const { models } = require('../database');

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

/**
 * Tìm nhiều documents với pagination và filtering
 * 
 * @param {mongoose.Model} model - Mongoose model to query
 * @param {Object} filter - Filter criteria
 * @param {Object} options - Query options (sort, pagination, projection, populate)
 * @returns {Promise<Object>} Object containing documents, count, and pagination info
 */
exports.findWithPagination = async (model, filter = {}, options = {}) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      sort = {}, 
      projection = null,
      populate = null
    } = options;
    
    const skip = (page - 1) * limit;
    
    // Build query
    let query = model.find(filter);
    
    // Apply projection if provided
    if (projection) {
      query = query.select(projection);
    }
    
    // Apply populate if provided
    if (populate) {
      if (Array.isArray(populate)) {
        populate.forEach(field => {
          query = query.populate(field);
        });
      } else {
        query = query.populate(populate);
      }
    }
    
    // Execute query with pagination
    const documents = await query
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .exec();
      
    // Get total count
    const total = await model.countDocuments(filter);
    
    return {
      data: documents,
      count: documents.length,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    console.error('Error finding documents with pagination:', error);
    return { data: [], count: 0, pagination: { total: 0, page, limit, pages: 0 } };
  }
};

/**
 * Tạo hoặc cập nhật document (upsert)
 * 
 * @param {mongoose.Model} model - Mongoose model
 * @param {Object} filter - Filter criteria to find document
 * @param {Object} data - Data to update or create
 * @returns {Promise<Object>} Updated or created document
 */
exports.upsertDocument = async (model, filter, data) => {
  try {
    const result = await model.findOneAndUpdate(
      filter,
      { $set: data },
      { new: true, upsert: true, runValidators: true }
    );
    
    return { success: true, data: result, isNew: !result._id };
  } catch (error) {
    console.error('Error upserting document:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Thực hiện truy vấn tìm kiếm với nhiều điều kiện phức tạp
 * 
 * @param {mongoose.Model} model - Mongoose model to query
 * @param {Object} queryOptions - Query options
 * @returns {Promise<Array>} Array of documents
 */
exports.advancedSearch = async (model, queryOptions = {}) => {
  try {
    const {
      filters = {},
      sort = {},
      limit = 100,
      skip = 0,
      populate = null,
      textSearch = null,
      dateRange = null,
      aggregation = null
    } = queryOptions;
    
    // Start with a basic query
    let query = model.find(filters);
    
    // Apply text search if provided
    if (textSearch && textSearch.value) {
      const searchFields = textSearch.fields || ['name', 'description'];
      const searchQuery = {};
      
      if (searchFields.length === 1) {
        searchQuery[searchFields[0]] = { $regex: textSearch.value, $options: 'i' };
      } else {
        searchQuery['$or'] = searchFields.map(field => {
          const fieldQuery = {};
          fieldQuery[field] = { $regex: textSearch.value, $options: 'i' };
          return fieldQuery;
        });
      }
      
      query = model.find({ ...filters, ...searchQuery });
    }
    
    // Apply date range if provided
    if (dateRange && dateRange.field && dateRange.start) {
      const dateQuery = {};
      dateQuery[dateRange.field] = { $gte: new Date(dateRange.start) };
      
      if (dateRange.end) {
        dateQuery[dateRange.field].$lte = new Date(dateRange.end);
      }
      
      query = model.find({ ...filters, ...dateQuery });
    }
    
    // Apply aggregation if needed
    if (aggregation) {
      return await model.aggregate(aggregation).exec();
    }
    
    // Apply populate
    if (populate) {
      if (Array.isArray(populate)) {
        populate.forEach(field => {
          query = query.populate(field);
        });
      } else {
        query = query.populate(populate);
      }
    }
    
    // Apply sort, skip and limit
    return await query
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .exec();
  } catch (error) {
    console.error('Error in advanced search:', error);
    return [];
  }
};

/**
 * Database compatibility layer to support transition between 
 * old and new database structures
 */
const databaseService = {
  /**
   * Maps fields from the new database schema to the old schema
   * @param {Object} data - Data from the new database structure
   * @param {String} modelName - Name of the model being processed
   * @returns {Object} Data transformed to match the old schema
   */
  mapToOldSchema: function(data, modelName) {
    if (!data) return null;
    
    // Clone the data to avoid modifying the original
    const result = JSON.parse(JSON.stringify(data));
    
    // Apply model-specific transformations
    switch(modelName) {
      case 'Student':
        // Add any field mappings needed for the Student model
        // Example: if the new schema uses 'name' but old uses 'fullName'
        if (result.name && !result.fullName) {
          result.fullName = result.name;
        }
        break;
        
      case 'Teacher':
        // Add teacher-specific mappings
        break;
        
      case 'UserAccount':
        // Add user account specific mappings
        break;
        
      // Add cases for other models as needed
    }
    
    return result;
  },
  
  /**
   * Maps fields from the old database schema to the new schema
   * @param {Object} data - Data from the old database structure
   * @param {String} modelName - Name of the model being processed
   * @returns {Object} Data transformed to match the new schema
   */
  mapToNewSchema: function(data, modelName) {
    if (!data) return null;
    
    // Clone the data to avoid modifying the original
    const result = JSON.parse(JSON.stringify(data));
    
    // Apply model-specific transformations
    switch(modelName) {
      case 'Student':
        // Add any field mappings needed for the Student model
        // Example: if the old schema uses 'fullName' but new uses 'name'
        if (result.fullName && !result.name) {
          result.name = result.fullName;
        }
        break;
        
      case 'Teacher':
        // Add teacher-specific mappings
        break;
        
      case 'UserAccount':
        // Add user account specific mappings
        break;
        
      // Add cases for other models as needed
    }
    
    return result;
  },
  
  /**
   * Resolves references between different collections/models
   * @param {Object} data - The data with references to resolve
   * @param {Array} populateFields - Fields to populate
   * @returns {Promise<Object>} Data with resolved references
   */
  resolveReferences: async function(data, populateFields = []) {
    // Implementation depends on your specific reference structure
    return data;
  }
};

module.exports = databaseService;