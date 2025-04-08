const mongoose = require('mongoose');
const { COLLECTIONS } = require('../constants');

const ParentStudentSchema = new mongoose.Schema({
  ParentID: {
    type: Number,
    required: true,
    ref: 'Parent'
  },
  StudentID: {
    type: Number,
    required: true,
    ref: 'Student'
  }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound index to ensure uniqueness of ParentID + StudentID combination
ParentStudentSchema.index({ ParentID: 1, StudentID: 1 }, { unique: true });

// Virtual for getting parent info
ParentStudentSchema.virtual('parent', {
  ref: 'Parent',
  localField: 'ParentID',
  foreignField: 'parentId',
  justOne: true
});

// Virtual for getting student info
ParentStudentSchema.virtual('student', {
  ref: 'Student',
  localField: 'StudentID',
  foreignField: 'studentId',
  justOne: true
});

module.exports = mongoose.model('ParentStudent', ParentStudentSchema, COLLECTIONS.PARENT_STUDENT); 