const mongoose = require('mongoose');

const ClassSchema = new mongoose.Schema({
  classId: {
    type: Number,
    required: true,
    unique: true
  },
  className: {
    type: String,
    required: true
  },
  homeroomTeacherId: {
    type: Number,
    ref: 'Teacher'
  },
  batchId: {
    type: Number,
    ref: 'Batch',
    required: true
  }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for getting batch info
ClassSchema.virtual('batch', {
  ref: 'Batch',
  localField: 'batchId',
  foreignField: 'batchId',
  justOne: true
});

// Virtual for getting homeroom teacher
ClassSchema.virtual('homeroomTeacher', {
  ref: 'Teacher',
  localField: 'homeroomTeacherId',
  foreignField: 'teacherId',
  justOne: true
});

// Virtual for getting students in this class
ClassSchema.virtual('students', {
  ref: 'Student',
  localField: 'classId',
  foreignField: 'classId',
  justOne: false
});

// Virtual for getting schedules for this class
ClassSchema.virtual('schedules', {
  ref: 'Schedule',
  localField: 'classId',
  foreignField: 'classId',
  justOne: false
});

module.exports = mongoose.model('Class', ClassSchema, 'classes'); 