const mongoose = require('mongoose');
const { COLLECTIONS } = require('../constants');

/**
 * Classroom Schema
 * Represents a physical classroom in the school
 */
const ClassroomSchema = new mongoose.Schema({
  classroomId: {
    type: Number,
    required: true,
    unique: true,
    auto: true
  },
  classroomName: {
    type: String,
    required: true
  },
  roomNumber: {
    type: String,
    required: true
  },
  roomName: {
    type: String
  },
  building: {
    type: String
  },
  location: {
    type: String
  },
  capacity: {
    type: Number,
    default: 40
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

// Virtual for getting schedules in this classroom
ClassroomSchema.virtual('schedules', {
  ref: 'ClassSchedule',
  localField: 'classroomId',
  foreignField: 'classroomId',
  justOne: false
});

module.exports = mongoose.model('Classroom', ClassroomSchema, COLLECTIONS.CLASSROOM); 