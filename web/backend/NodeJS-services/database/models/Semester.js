const mongoose = require('mongoose');
const { COLLECTIONS } = require('../constants');

const SemesterSchema = new mongoose.Schema({
  semesterId: {
    type: mongoose.Schema.Types.Mixed,
    unique: true,
    sparse: true
  },
  SemesterName: {
    type: String,
    required: true
  },
  StartDate: {
    type: Date,
    required: true
  },
  EndDate: {
    type: Date,
    required: true
  },
  CurriculumID: {
    type: Number,
    ref: 'Curriculum'
  },
  BatchID: {
    type: Number,
    ref: 'Batch'
  }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
  id: false
});

// Virtual for getting schedules in this semester
SemesterSchema.virtual('schedules', {
  ref: 'ClassSchedule',
  localField: 'semesterId',
  foreignField: 'semesterId',
  justOne: false
});

module.exports = mongoose.model('Semester', SemesterSchema, COLLECTIONS.SEMESTER); 