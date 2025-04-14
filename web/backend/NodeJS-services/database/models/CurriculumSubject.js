const mongoose = require('mongoose');
const { COLLECTIONS } = require('../constants');

const CurriculumSubjectSchema = new mongoose.Schema({
  curriculumId: {
    type: Number,
    required: true,
    ref: 'Curriculum'
  },
  subjectId: {
    type: Number,
    required: true,
    ref: 'Subject'
  },
  sessions: {
    type: Number,
    required: true,
    default: 2
  }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound index to ensure uniqueness of curriculumId + subjectId combination
CurriculumSubjectSchema.index({ curriculumId: 1, subjectId: 1 }, { unique: true });

// Virtual for getting curriculum info
CurriculumSubjectSchema.virtual('curriculum', {
  ref: 'Curriculum',
  localField: 'curriculumId',
  foreignField: 'curriculumId',
  justOne: true
});

// Virtual for getting subject info
CurriculumSubjectSchema.virtual('subject', {
  ref: 'Subject',
  localField: 'subjectId',
  foreignField: 'subjectId',
  justOne: true
});

module.exports = mongoose.model('CurriculumSubject', CurriculumSubjectSchema, COLLECTIONS.CURRICULUM_SUBJECT); 