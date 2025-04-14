const mongoose = require('mongoose');
const { COLLECTIONS } = require('../constants');

const ClassroomSchema = new mongoose.Schema({
  classroomId: {
    type: Number,
    required: true,
    unique: true
  },
  roomNumber: {
    type: String,
    required: true
  },
  building: {
    type: String
  },
  capacity: {
    type: Number
  }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for getting schedules for this classroom
ClassroomSchema.virtual('schedules', {
  ref: 'Schedule',
  localField: 'classroomId',
  foreignField: 'classroomId',
  justOne: false
});

module.exports = mongoose.model('Classroom', ClassroomSchema, COLLECTIONS.CLASSROOM); 