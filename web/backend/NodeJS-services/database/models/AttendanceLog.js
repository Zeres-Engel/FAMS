const mongoose = require('mongoose');
const { COLLECTIONS } = require('../constants');

/**
 * AttendanceLog Schema
 * Represents attendance records for scheduled classes
 */
const AttendanceLogSchema = new mongoose.Schema({
  attendanceId: {
    type: Number,
    required: true,
    unique: true,
    auto: true
  },
  scheduleId: {
    type: Number,
    required: true,
    ref: 'ClassSchedule'
  },
  userId: {
    type: Number,
    required: true,
    ref: 'UserAccount'
  },
  checkInFace: {
    type: Buffer
  },
  checkIn: {
    type: Date
  },
  status: {
    type: String,
    enum: ['Present', 'Late', 'Absent'],
    default: 'Absent'
  }
}, {
  timestamps: true,
  versionKey: false,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for getting schedule info
AttendanceLogSchema.virtual('schedule', {
  ref: 'ClassSchedule',
  localField: 'scheduleId',
  foreignField: 'scheduleId',
  justOne: true
});

// Virtual for getting user info
AttendanceLogSchema.virtual('user', {
  ref: 'UserAccount',
  localField: 'userId',
  foreignField: 'userId',
  justOne: true
});

module.exports = mongoose.model('AttendanceLog', AttendanceLogSchema, COLLECTIONS.ATTENDANCE_LOG); 