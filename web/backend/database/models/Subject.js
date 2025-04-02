const mongoose = require('mongoose');

const SubjectSchema = new mongoose.Schema({
  subjectId: {
    type: Number,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  type: {
    type: String
  },
  description: {
    type: String
  }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for getting schedules for this subject
SubjectSchema.virtual('schedules', {
  ref: 'Schedule',
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

module.exports = mongoose.model('Subject', SubjectSchema, 'subjects'); 