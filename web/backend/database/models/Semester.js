const mongoose = require('mongoose');

const SemesterSchema = new mongoose.Schema({
  semesterId: {
    type: Number,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for getting schedules in this semester
SemesterSchema.virtual('schedules', {
  ref: 'Schedule',
  localField: 'semesterId',
  foreignField: 'semesterId',
  justOne: false
});

module.exports = mongoose.model('Semester', SemesterSchema, 'semesters'); 