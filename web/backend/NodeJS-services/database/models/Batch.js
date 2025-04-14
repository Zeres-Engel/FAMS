const mongoose = require('mongoose');
const { COLLECTIONS } = require('../constants');

const BatchSchema = new mongoose.Schema({
  batchId: {
    type: String,
    required: true,
    unique: true
  },
  batchName: {
    type: String,
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
  versionKey: false,
  toJSON: { 
    virtuals: true,
    transform: function (doc, ret) {
      return ret;
    }
  },
  toObject: { 
    virtuals: true,
    transform: function (doc, ret) {
      return ret;
    }
  }
});

// Virtual getters for startYear and endYear
BatchSchema.virtual('startYear').get(function() {
  return this.startDate ? this.startDate.getFullYear() : null;
});

BatchSchema.virtual('endYear').get(function() {
  return this.endDate ? this.endDate.getFullYear() : null;
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

module.exports = mongoose.model('Batch', BatchSchema, COLLECTIONS.BATCH); 