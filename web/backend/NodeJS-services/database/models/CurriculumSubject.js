const mongoose = require('mongoose');
const { COLLECTIONS } = require('../constants');

/**
 * CurriculumSubject Schema
 * Represents the relationship between a curriculum and its subjects
 */
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

// Compound index to ensure unique curriculum-subject combinations
CurriculumSubjectSchema.index({ curriculumId: 1, subjectId: 1 }, { unique: true });

// Virtual for getting curriculum details
CurriculumSubjectSchema.virtual('curriculum', {
  ref: 'Curriculum',
  localField: 'curriculumId',
  foreignField: 'curriculumId',
  justOne: true
});

// Virtual for getting subject details
CurriculumSubjectSchema.virtual('subject', {
  ref: 'Subject',
  localField: 'subjectId',
  foreignField: 'subjectId',
  justOne: true
});

module.exports = mongoose.model('CurriculumSubject', CurriculumSubjectSchema, COLLECTIONS.CURRICULUM_SUBJECT); 