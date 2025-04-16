const mongoose = require('mongoose');
const { COLLECTIONS } = require('../constants');

/**
 * Batch Schema
 * Represents a batch/cohort of students
 */
const BatchSchema = new mongoose.Schema({
  batchId: {
    type: Number,
    required: true,
    unique: true,
    auto: true
  },
  batchName: {
    type: String,
    required: true
  },
  startYear: {
    type: Number
  }
}, {
  timestamps: true,
  versionKey: false,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for getting semesters for this batch
BatchSchema.virtual('semesters', {
  ref: 'Semester',
  localField: 'batchId',
  foreignField: 'batchId',
  justOne: false
});

// Virtual for getting classes in this batch
BatchSchema.virtual('classes', {
  ref: 'Class',
  localField: 'batchId',
  foreignField: 'batchId',
  justOne: false
});

module.exports = mongoose.model('Batch', BatchSchema, COLLECTIONS.BATCH); 