const mongoose = require('mongoose');
const { COLLECTIONS } = require('../constants');

/**
 * Class Schema
 * Represents a class in the system
 */
const ClassSchema = new mongoose.Schema({
  classId: {
    type: Number,
    required: true,
    unique: true,
    auto: true
  },
  homeroomTeacherId: {
    type: Number,
    ref: 'Teacher'
  },
  className: {
    type: String,
    required: true
  },
  grade: {
    type: Number
  }
}, {
  timestamps: true,
  versionKey: false,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for getting homeroom teacher info
ClassSchema.virtual('homeroomTeacher', {
  ref: 'Teacher',
  localField: 'homeroomTeacherId',
  foreignField: 'teacherId',
  justOne: true
});

// Virtual for getting students in this class
ClassSchema.virtual('students', {
  ref: 'Student',
  localField: 'classId',
  foreignField: 'classId',
  justOne: false
});

// Virtual for getting class schedules
ClassSchema.virtual('schedules', {
  ref: 'ClassSchedule',
  localField: 'classId',
  foreignField: 'classId',
  justOne: false
});

module.exports = mongoose.model('Class', ClassSchema, COLLECTIONS.CLASS); 