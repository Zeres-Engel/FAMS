const mongoose = require('mongoose');

/**
 * AttendanceLog Schema
 * Represents attendance records for scheduled classes
 */
const AttendanceLogSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: [true, 'User ID is required'],
    index: true
  },
  rfidId: {
    type: String,
    required: [true, 'RFID ID is required'],
    index: true
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
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index for efficient queries
AttendanceLogSchema.index({ userId: 1, timestamp: -1 });
AttendanceLogSchema.index({ rfidId: 1, timestamp: -1 });
AttendanceLogSchema.index({ classId: 1, scheduleId: 1, timestamp: -1 });

// Virtual for getting user information
AttendanceLogSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: 'userId',
  justOne: true
});

// Index for faster queries
AttendanceLogSchema.index({ userId: 1, scheduleId: 1 });
AttendanceLogSchema.index({ classId: 1, date: 1 });
AttendanceLogSchema.index({ subjectId: 1 });
AttendanceLogSchema.index({ semesterNumber: 1 });

// Virtual for getting rfid information
AttendanceLogSchema.virtual('rfid', {
  ref: 'RFID',
  localField: 'rfidId',
  foreignField: 'RFID_ID',
  justOne: true
});

// Virtual for getting class information
AttendanceLogSchema.virtual('class', {
  ref: 'Class',
  localField: 'classId',
  foreignField: 'classId',
  justOne: true
});

// Virtual for getting schedule information
AttendanceLogSchema.virtual('schedule', {
  ref: 'ClassSchedule',
  localField: 'scheduleId',
  foreignField: '_id',
  justOne: true
});

module.exports = mongoose.model('AttendanceLog', AttendanceLogSchema); 