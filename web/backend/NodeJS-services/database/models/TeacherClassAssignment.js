const mongoose = require('mongoose');
const { COLLECTIONS } = require('../constants');

const TeacherClassAssignmentSchema = new mongoose.Schema({
  TeacherID: {
    type: Number,
    required: true,
    ref: 'Teacher'
  },
  ClassID: {
    type: Number,
    required: true,
    ref: 'Class'
  }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound index to ensure uniqueness of TeacherID + ClassID combination
TeacherClassAssignmentSchema.index({ TeacherID: 1, ClassID: 1 }, { unique: true });

// Virtual for getting teacher info
TeacherClassAssignmentSchema.virtual('teacher', {
  ref: 'Teacher',
  localField: 'TeacherID',
  foreignField: 'teacherId',
  justOne: true
});

// Virtual for getting class info
TeacherClassAssignmentSchema.virtual('class', {
  ref: 'Class',
  localField: 'ClassID',
  foreignField: 'classId',
  justOne: true
});

module.exports = mongoose.model('TeacherClassAssignment', TeacherClassAssignmentSchema, COLLECTIONS.TEACHER_CLASS_ASSIGNMENT); 