const mongoose = require('mongoose');
const { COLLECTIONS } = require('../constants');

/**
 * Semester Schema
 * Represents a semester in the academic year
 */
const SemesterSchema = new mongoose.Schema({
  semesterId: {
    type: Number,
    required: true,
    unique: true,
    auto: true
  },
  semesterName: {
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
  curriculumId: {
    type: Number,
    required: true,
    ref: 'Curriculum'
  },
  batchId: {
    type: Number,
    required: true,
    ref: 'Batch'
  }
}, {
  timestamps: true,
  versionKey: false,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for getting curriculum info
SemesterSchema.virtual('curriculum', {
  ref: 'Curriculum',
  localField: 'curriculumId',
  foreignField: 'curriculumId',
  justOne: true
});

// Virtual for getting batch info
SemesterSchema.virtual('batch', {
  ref: 'Batch',
  localField: 'batchId',
  foreignField: 'batchId',
  justOne: true
});

// Virtual for getting schedules in this semester
SemesterSchema.virtual('schedules', {
  ref: 'ClassSchedule',
  localField: 'semesterId',
  foreignField: 'semesterId',
  justOne: false
});

module.exports = mongoose.model('Semester', SemesterSchema, COLLECTIONS.SEMESTER); 