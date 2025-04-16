const mongoose = require('mongoose');
const { COLLECTIONS } = require('../constants');

/**
 * ParentStudent Schema
 * Represents the relationship between parents and students
 */
const ParentStudentSchema = new mongoose.Schema({
  parentId: {
    type: Number,
    required: true,
    ref: 'Parent'
  },
  studentId: {
    type: Number,
    required: true,
    ref: 'Student'
  },
  relationship: {
    type: String,
    enum: ['Father', 'Mother', 'Guardian', 'Other'],
    default: 'Other'
  },
  isEmergencyContact: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  versionKey: false,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound index to ensure unique parent-student relationships
ParentStudentSchema.index({ parentId: 1, studentId: 1 }, { unique: true });

// Virtual for getting parent details
ParentStudentSchema.virtual('parent', {
  ref: 'Parent',
  localField: 'parentId',
  foreignField: 'parentId',
  justOne: true
});

// Virtual for getting student details
ParentStudentSchema.virtual('student', {
  ref: 'Student',
  localField: 'studentId',
  foreignField: 'studentId',
  justOne: true
});

module.exports = mongoose.model('ParentStudent', ParentStudentSchema, COLLECTIONS.PARENT_STUDENT); 