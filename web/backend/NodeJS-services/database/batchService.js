const mongoose = require('mongoose');
const { Batch } = require('./models');

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
 * Reference: 2021-2024 = 1
 * @param {number} startYear 
 * @param {number} endYear 
 * @returns {number} Numeric batch ID
 */
const calculateNumericBatchId = (startYear, endYear) => {
  // Base reference: 2021-2024 has ID 1
  const baseStartYear = 2021;
  
  // Calculate based on difference from base year
  // Each academic year that passes increases the ID by 1
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
    // For example, if current year is 2025, we might generate batches starting from 2023
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
    console.log('Creating batch with data:', JSON.stringify(batchData, null, 2));
    
    // If startDate or endDate is provided as a string, convert it to Date
    let startDate, endDate;

    if (batchData.startDate) {
      // Handle date conversion carefully
      if (typeof batchData.startDate === 'string') {
        try {
          startDate = new Date(batchData.startDate);
          // Validate that the date is valid
          if (isNaN(startDate.getTime())) {
            throw new Error(`Invalid startDate: ${batchData.startDate}`);
          }
        } catch (err) {
          console.error('Error parsing startDate:', err);
          throw new Error(`Invalid startDate format: ${batchData.startDate}`);
        }
      } else {
        startDate = batchData.startDate;
      }
    } else if (batchData.startYear) {
      // Generate from startYear if available
      startDate = generateStartDate(parseInt(batchData.startYear));
    } else {
      // Generate a default start date based on current year
      startDate = generateStartDate(new Date().getFullYear());
    }

    if (batchData.endDate) {
      // Handle date conversion carefully
      if (typeof batchData.endDate === 'string') {
        try {
          endDate = new Date(batchData.endDate);
          // Validate that the date is valid
          if (isNaN(endDate.getTime())) {
            throw new Error(`Invalid endDate: ${batchData.endDate}`);
          }
        } catch (err) {
          console.error('Error parsing endDate:', err);
          throw new Error(`Invalid endDate format: ${batchData.endDate}`);
        }
      } else {
        endDate = batchData.endDate;
      }
    } else if (batchData.endYear) {
      // Generate from endYear if available
      endDate = generateEndDate(parseInt(batchData.endYear));
    } else {
      // Default to start year + 3 years
      const startYear = startDate.getFullYear();
      endDate = generateEndDate(startYear + 3);
    }
    
    console.log('Processed dates:', {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString()
    });
    
    let batchId;
    
    // If batchId is provided, use it
    if (batchData.batchId) {
      batchId = batchData.batchId.toString();
    } else if (batchData.numericId) {
      // If numericId is provided, use that directly
      batchId = batchData.numericId.toString();
    } else {
      // Otherwise generate from dates
      const startYear = startDate.getFullYear();
      const endYear = endDate.getFullYear();
      const numericId = calculateNumericBatchId(startYear, endYear);
      batchId = numericId.toString();
    }
    
    // Check if batch already exists with this batchId
    let batch = await Batch.findOne({ batchId });
    
    if (batch) {
      return { success: true, data: batch, isNew: false };
    }
    
    // Get year range for display in batch name
    const startYear = startDate.getFullYear();
    const endYear = endDate.getFullYear();
    
    // Calculate grade level based on batch ID (batchId 1 = grade 10, 2 = grade 11, 3 = grade 12)
    let gradeLevel = '';
    const batchIdNum = parseInt(batchId);
    
    if (!isNaN(batchIdNum)) {
      // Base batch is 2021-2024 (ID: 1) = 10th grade
      // For year 2023, batch 1 (2021-2024) would be grade 12
      // For year 2023, batch 2 (2022-2025) would be grade 11
      // For year 2023, batch 3 (2023-2026) would be grade 10
      
      // Get current school year stage
      const currentYear = new Date().getFullYear();
      const monthNow = new Date().getMonth(); // 0-11
      
      // Determine current school year 
      // If we're in the second half of the school year (January-June), we're in the latter part
      // School years run from September to June
      const isSecondHalf = monthNow >= 0 && monthNow <= 5; // January to June
      const schoolYearBase = isSecondHalf ? currentYear - 1 : currentYear;
      
      // Calculate which year of high school this batch is in, based on the current school year
      const yearsFromStart = schoolYearBase - startYear;
      const currentGradeLevel = 10 + yearsFromStart; // Starting at grade 10
      
      if (currentGradeLevel >= 10 && currentGradeLevel <= 12) {
        gradeLevel = `Lớp ${currentGradeLevel}`;
      }
    }
    
    // Create formatted batch name if not provided
    let formattedBatchName;
    if (batchData.batchName) {
      formattedBatchName = batchData.batchName;
    } else if (gradeLevel) {
      formattedBatchName = `Khóa ${startYear}-${endYear} (${gradeLevel})`;
    } else {
      formattedBatchName = `Khóa ${startYear}-${endYear}`;
    }
    
    // Create the batch with the exact structure requested
    batch = await Batch.create({
      batchId,
      batchName: formattedBatchName,
      startDate,
      endDate,
      isActive: batchData.isActive !== undefined ? batchData.isActive : true
    });
    
    return { success: true, data: batch, isNew: true };
  } catch (error) {
    console.error('Error creating batch:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get batch by ID
 * @param {string} batchId - Batch ID to find
 * @returns {Promise<Object>} Batch object if found
 */
const getBatchById = async (batchId) => {
  try {
    const batch = await Batch.findOne({ batchId });
    
    if (!batch) {
      return { success: false, error: 'Batch not found' };
    }
    
    return { success: true, data: batch };
  } catch (error) {
    console.error('Error finding batch:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  getAllBatches,
  generateBatchOptions,
  createBatchIfNotExists,
  getBatchById,
  generateStartDate,
  generateEndDate,
  generateBatchIdFromDates,
  calculateNumericBatchId,
  getYearRangeFromNumericId
}; 