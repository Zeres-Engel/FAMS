const mongoose = require('mongoose');
const { COLLECTIONS } = require('../constants');

/**
 * Batch Schema
 * Represents student batches/cohorts in the system
 */
const BatchSchema = new mongoose.Schema({
  batchId: {
    type: Number,
    required: true,
    unique: true
  },
  batchName: {
    type: String,
    required: true
  },
  startYear: {
    type: Number,
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  versionKey: false
});

// Static method to calculate end year (startYear + 3 for 3-year high school programs)
BatchSchema.statics.calculateEndYear = function(startYear) {
  return startYear + 3;
};

// Static method to generate batch name
BatchSchema.statics.generateBatchName = function(startYear) {
  const endYear = this.calculateEndYear(startYear);
  return `Khóa ${startYear}-${endYear}`;
};

// Static method to find or create a batch by start year
BatchSchema.statics.findOrCreateByStartYear = async function(startYear) {
  try {
    // Find existing batch
    let batch = await this.findOne({ startYear });
    
    // If batch exists, return it
    if (batch) {
      return batch;
    }
    
    // Calculate next batchId
    const maxBatchDoc = await this.findOne({}).sort({ batchId: -1 });
    const nextBatchId = maxBatchDoc ? maxBatchDoc.batchId + 1 : 1;
    
    // Calculate end year (high school is typically 3 years)
    const endYear = this.calculateEndYear(startYear);
    
    // Create default start and end dates (September 1st to June 30th)
    const startDate = new Date(`${startYear}-09-01`);
    const endDate = new Date(`${endYear}-06-30`);
    
    // Create new batch
    batch = await this.create({
      batchId: nextBatchId,
      batchName: this.generateBatchName(startYear),
      startYear,
      startDate,
      endDate,
      isActive: true
    });
    
    return batch;
  } catch (error) {
    console.error('Error in findOrCreateByStartYear:', error);
    throw error;
  }
};

module.exports = mongoose.model('Batch', BatchSchema, COLLECTIONS.BATCH); 