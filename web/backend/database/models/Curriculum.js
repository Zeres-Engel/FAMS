const mongoose = require('mongoose');

const CurriculumSchema = new mongoose.Schema({
  curriculumId: {
    type: Number,
    required: true,
    unique: true
  },
  curriculumName: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  batchId: {
    type: Number,
    ref: 'Batch',
    required: true
  },
  subjectIds: [{
    type: Number,
    ref: 'Subject'
  }]
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for getting batch info
CurriculumSchema.virtual('batch', {
  ref: 'Batch',
  localField: 'batchId',
  foreignField: 'batchId',
  justOne: true
});

// Virtual for getting subjects in this curriculum
CurriculumSchema.virtual('subjects', {
  ref: 'Subject',
  localField: 'subjectIds',
  foreignField: 'subjectId',
  justOne: false
});

module.exports = mongoose.model('Curriculum', CurriculumSchema, 'curriculums'); 