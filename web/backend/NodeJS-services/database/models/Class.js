const mongoose = require('mongoose');
const { COLLECTIONS } = require('../constants');

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
    type: String,
    ref: 'User'
  },
  BatchID: {
    type: Number,
    ref: 'Batch'
  }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for getting homeroom teacher info
ClassSchema.virtual('homeroomTeacher', {
  ref: 'Teacher',
  localField: 'homeroomTeacherId',
  foreignField: 'userId',
  justOne: true
});

// Virtual for getting batch info
ClassSchema.virtual('batch', {
  ref: 'Batch',
  localField: 'BatchID',
  foreignField: 'batchId',
  justOne: true
});

// Virtual for getting students in this class
ClassSchema.virtual('students', {
  ref: 'Student',
  localField: 'classId',
  foreignField: 'classId'
});

// Virtual for getting schedules for this class
ClassSchema.virtual('schedules', {
  ref: 'Schedule',
  localField: 'classId',
  foreignField: 'classId',
  justOne: false
});

module.exports = mongoose.model('Class', ClassSchema, COLLECTIONS.CLASS); 