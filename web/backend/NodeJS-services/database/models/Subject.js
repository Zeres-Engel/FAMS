const mongoose = require('mongoose');
const { COLLECTIONS } = require('../constants');

/**
 * Subject Schema
 * Represents a subject in the curriculum
 */
const SubjectSchema = new mongoose.Schema({
  subjectId: {
    type: Number,
    required: true,
    unique: true,
    auto: true
  },
  subjectName: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  subjectType: {
    type: String,
    enum: ['Chinh', 'TuChon', 'NgoaiKhoa'],
    required: true
  }
}, {
  timestamps: true,
  versionKey: false,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for getting schedules for this subject
SubjectSchema.virtual('schedules', {
  ref: 'ClassSchedule',
  localField: 'subjectId',
  foreignField: 'subjectId',
  justOne: false
});

// Virtual for getting curriculum that includes this subject
SubjectSchema.virtual('curriculums', {
  ref: 'Curriculum',
  localField: 'subjectId',
  foreignField: 'subjectIds',
  justOne: false
});

module.exports = mongoose.model('Subject', SubjectSchema, COLLECTIONS.SUBJECT); 