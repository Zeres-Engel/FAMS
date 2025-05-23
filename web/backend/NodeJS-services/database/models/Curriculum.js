const mongoose = require('mongoose');
const { COLLECTIONS } = require('../constants');

/**
 * Curriculum Schema
 * Represents a curriculum for a specific grade
 */
const CurriculumSchema = new mongoose.Schema({
  curriculumId: {
    type: Number,
    required: true,
    unique: true,
    auto: true
  },
  curriculumName: {
    type: String,
    required: true
  },
  description: {
    type: String
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

// Virtual for getting subjects in this curriculum
CurriculumSchema.virtual('subjects', {
  ref: 'CurriculumSubject',
  localField: 'curriculumId',
  foreignField: 'curriculumId',
  justOne: false
});

// Virtual for getting semesters using this curriculum
CurriculumSchema.virtual('semesters', {
  ref: 'Semester',
  localField: 'curriculumId',
  foreignField: 'curriculumId',
  justOne: false
});

module.exports = mongoose.model('Curriculum', CurriculumSchema, COLLECTIONS.CURRICULUM); 