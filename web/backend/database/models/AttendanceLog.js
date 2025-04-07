const mongoose = require('mongoose');
const { COLLECTIONS } = require('../constants');

const AttendanceLogSchema = new mongoose.Schema({
  ScheduleID: {
    type: Number,
    required: true,
    ref: 'ClassSchedule'
  },
  UserID: {
    type: String,
    required: true,
    ref: 'User'
  },
  CheckIn: {
    type: Date
  },
  Status: {
    type: String,
    required: true,
    enum: ['Present', 'Late', 'Absent'],
    default: 'Absent'
  }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
  timestamps: true
});

// Virtual for getting user info
AttendanceLogSchema.virtual('user', {
  ref: 'User',
  localField: 'UserID',
  foreignField: 'userId',
  justOne: true
});

// Virtual for getting schedule info
AttendanceLogSchema.virtual('schedule', {
  ref: 'ClassSchedule',
  localField: 'ScheduleID',
  foreignField: 'scheduleId',
  justOne: true
});

module.exports = mongoose.model('AttendanceLog', AttendanceLogSchema, COLLECTIONS.ATTENDANCE_LOG); 