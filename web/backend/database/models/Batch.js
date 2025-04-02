const mongoose = require('mongoose');

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
  endYear: {
    type: Number,
    required: true
  },
  grade: {
    type: Number,
    required: true
  }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for getting classes in this batch
BatchSchema.virtual('classes', {
  ref: 'Class',
  localField: 'batchId',
  foreignField: 'batchId',
  justOne: false
});

// Virtual for getting students in this batch
BatchSchema.virtual('students', {
  ref: 'Student',
  localField: 'batchId',
  foreignField: 'batchId',
  justOne: false
});

// Virtual for getting curriculum for this batch
BatchSchema.virtual('curriculum', {
  ref: 'Curriculum',
  localField: 'batchId',
  foreignField: 'batchId',
  justOne: true
});

module.exports = mongoose.model('Batch', BatchSchema, 'batches'); 