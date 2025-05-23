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
    type: String,
    ref: 'UserAccount'
  },
  className: {
    type: String,
    required: true
  },
  grade: {
    type: Number,
    required: true
  },
  academicYear: {
    type: String,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  versionKey: false,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Thêm compound index để đảm bảo className là unique trong cùng một năm học
ClassSchema.index({ className: 1, academicYear: 1 }, { unique: true });

// Virtual for getting homeroom teacher info
ClassSchema.virtual('homeroomTeacher', {
  ref: 'Teacher',
  localField: 'homeroomTeacherId',
  foreignField: 'userId',
  justOne: true
});

// Virtual for getting students in this class
ClassSchema.virtual('students', {
  ref: 'Student',
  localField: 'classId',
  foreignField: 'classIds',
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