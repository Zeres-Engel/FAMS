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
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  deviceId: {
    type: String,
    default: 'unknown'
  },
  location: {
    type: String,
    default: 'Main Entrance'
  },
  status: {
    type: String,
    enum: ['present', 'absent', 'late', 'excused'],
    default: 'present'
  },
  verificationMethod: {
    type: String,
    enum: ['rfid', 'rfid+face', 'manual'],
    default: 'rfid'
  },
  verificationScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 1
  },
  antiSpoofingResult: {
    type: Boolean,
    default: false
  },
  faceImage: {
    type: Buffer
  },
  // Optional fields for linking to class sessions
  classId: {
    type: Number,
    ref: 'Class',
    index: true
  },
  scheduleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ClassSchedule',
    index: true
  },
  // Additional metadata
  notes: {
    type: String
  },
  updatedBy: {
    type: String
  },
  manualEntry: {
    type: Boolean,
    default: false
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