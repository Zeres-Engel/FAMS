const mongoose = require('mongoose');
const { Batch } = require('../models');

/**
 * Get all batches from the database
 * @returns {Promise<Array>} Array of batch documents
 */
const getAllBatches = async () => {
  try {
    const batches = await Batch.find().sort({ startDate: 1 });
    return { success: true, data: batches };
  } catch (error) {
    console.error('Error fetching batches:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Calculate numeric batch ID based on year range
 * @param {number} startYear 
 * @param {number} endYear 
 * @returns {number} Numeric batch ID
 */
const calculateNumericBatchId = (startYear, endYear) => {
  // Base reference: 2021-2024 has ID 1
  const baseStartYear = 2021;
  
  // Calculate based on difference from base year
  return startYear - baseStartYear + 1;
};

/**
 * Get year range from numeric batch ID
 * @param {number} numericId 
 * @returns {Object} Object with startYear and endYear
 */
const getYearRangeFromNumericId = (numericId) => {
  const baseStartYear = 2021;
  const startYear = baseStartYear + numericId - 1;
  const endYear = startYear + 3; // 3-year program
  
  return { startYear, endYear };
};

/**
 * Generate batch ID from start and end date
 * @param {Date} startDate 
 * @param {Date} endDate 
 * @returns {string} Batch ID as a number in string format
 */
const generateBatchIdFromDates = (startDate, endDate) => {
  const startYear = startDate.getFullYear();
  const endYear = endDate.getFullYear();
  
  // Return numeric ID as string to maintain compatibility
  return calculateNumericBatchId(startYear, endYear).toString();
};

/**
 * Generate start date for a batch (September 1st of start year)
 * @param {number} startYear 
 * @returns {Date}
 */
const generateStartDate = (startYear) => {
  return new Date(Date.UTC(startYear, 8, 1)); // Month is 0-indexed, so 8 = September
};

/**
 * Generate end date for a batch (June 30th of end year)
 * @param {number} endYear 
 * @returns {Date}
 */
const generateEndDate = (endYear) => {
  return new Date(Date.UTC(endYear, 5, 30)); // Month is 0-indexed, so 5 = June
};

/**
 * Generate batch options based on current year
 * @param {number} currentYear - Current year (defaults to current year if not provided)
 * @param {number} count - Number of batches to generate (default: 5)
 * @returns {Promise<Array>} Array of batch objects
 */
const generateBatchOptions = async (currentYear = new Date().getFullYear(), count = 5) => {
  try {
    // Get existing batches from database
    const { success, data: existingBatches, error } = await getAllBatches();
    
    if (!success) {
      throw new Error(error || 'Failed to fetch existing batches');
    }
    
    // Create a map of existing batches for quick lookup by batchId
    const batchMap = new Map();
    existingBatches.forEach(batch => {
      batchMap.set(batch.batchId, batch);
    });
    
    // Calculate the starting year for high school batches
    const startingYear = currentYear - 2;
    
    // Generate batch options
    const options = [];
    
    for (let i = 0; i < count; i++) {
      const startYear = startingYear + i;
      const endYear = startYear + 3; // 3-year high school program
      const numericId = calculateNumericBatchId(startYear, endYear);
      const batchId = numericId.toString();
      
      // Check if this batch already exists in the database
      if (batchMap.has(batchId)) {
        // Use existing batch
        options.push(batchMap.get(batchId));
      } else {
        // Create a new batch object (not saved to DB yet)
        const startDate = generateStartDate(startYear);
        const endDate = generateEndDate(endYear);
        
        // Calculate grade level based on the academic year
        const currentYear = new Date().getFullYear();
        const monthNow = new Date().getMonth(); // 0-11
        
        // Determine current school year 
        const isSecondHalf = monthNow >= 0 && monthNow <= 5; // January to June
        const schoolYearBase = isSecondHalf ? currentYear - 1 : currentYear;
        
        // Calculate which year of high school this batch is in
        const yearsFromStart = schoolYearBase - startYear;
        const currentGradeLevel = 10 + yearsFromStart; // Starting at grade 10
        
        let batchName = `Khóa ${startYear}-${endYear}`;
        if (currentGradeLevel >= 10 && currentGradeLevel <= 12) {
          batchName = `Khóa ${startYear}-${endYear} (Lớp ${currentGradeLevel})`;
        }
        
        options.push({
          batchId,
          batchName: batchName,
          startDate,
          endDate,
          isActive: true,
          _isNew: true, // Flag to indicate this is not in the database yet
          startYear,
          endYear
        });
      }
    }
    
    return { success: true, data: options };
  } catch (error) {
    console.error('Error generating batch options:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Check if a batch exists and create it if not
 * @param {Object} batchData - Batch data object
 * @returns {Promise<Object>} Created or existing batch
 */
const createBatchIfNotExists = async (batchData) => {
  try {
    // If startDate or endDate is provided as a string, convert it to Date
    let startDate, endDate;

    if (batchData.startDate) {
      if (typeof batchData.startDate === 'string') {
        startDate = new Date(batchData.startDate);
        if (isNaN(startDate.getTime())) {
          throw new Error(`Invalid startDate: ${batchData.startDate}`);
        }
      } else {
        startDate = batchData.startDate;
      }
    } else if (batchData.startYear) {
      startDate = generateStartDate(parseInt(batchData.startYear));
    } else {
      startDate = generateStartDate(new Date().getFullYear());
    }

    if (batchData.endDate) {
      if (typeof batchData.endDate === 'string') {
        endDate = new Date(batchData.endDate);
        if (isNaN(endDate.getTime())) {
          throw new Error(`Invalid endDate: ${batchData.endDate}`);
        }
      } else {
        endDate = batchData.endDate;
      }
    } else if (batchData.endYear) {
      endDate = generateEndDate(parseInt(batchData.endYear));
    } else {
      endDate = generateEndDate(new Date().getFullYear() + 3);
    }

    // Generate batch ID if not provided
    let batchId = batchData.batchId;
    if (!batchId) {
      batchId = generateBatchIdFromDates(startDate, endDate);
    }

    // Check if batch exists
    const existingBatch = await Batch.findOne({ batchId });
    
    if (existingBatch) {
      return { 
        success: true, 
        data: existingBatch, 
        isNew: false,
        message: `Batch ${batchId} already exists` 
      };
    }
    
    // Create a new batch with provided data and calculated fields
    const startYear = startDate.getFullYear();
    const endYear = endDate.getFullYear();
    
    const newBatch = new Batch({
      batchId,
      batchName: batchData.batchName || `Khóa ${startYear}-${endYear}`,
      startDate,
      endDate,
      isActive: batchData.isActive !== undefined ? batchData.isActive : true,
      notes: batchData.notes || ''
    });
    
    const savedBatch = await newBatch.save();
    
    return { 
      success: true, 
      data: savedBatch, 
      isNew: true,
      message: `Created new batch ${batchId}` 
    };
  } catch (error) {
    console.error('Error creating batch:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get batch by ID
 * @param {string} batchId - Batch ID
 * @returns {Promise<Object>} Batch document
 */
const getBatchById = async (batchId) => {
  try {
    const batch = await Batch.findOne({ batchId });
    
    if (!batch) {
      return { success: false, error: 'Batch not found' };
    }
    
    return { success: true, data: batch };
  } catch (error) {
    console.error('Error fetching batch:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  getAllBatches,
  calculateNumericBatchId,
  getYearRangeFromNumericId,
  generateBatchIdFromDates,
  generateStartDate,
  generateEndDate,
  generateBatchOptions,
  createBatchIfNotExists,
  getBatchById
}; 