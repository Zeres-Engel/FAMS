const mongoose = require('mongoose');

/**
 * AttendanceLog Schema
 * Represents attendance records for scheduled classes
 */
const AttendanceLogSchema = new mongoose.Schema({
  attendanceId: {
    type: Number,
    required: true,
    unique: true,
    default: () => Math.floor(Date.now() / 1000)
  },
  userId: {
    type: String,
    required: true,
    ref: 'UserAccount'
  },
  rfidId: {
    type: String,
    index: true
  },
  scheduleId: {
    type: Number,
    ref: 'ClassSchedule'
  },
  checkInFace: {
    type: String // Path to face image
  },
  checkIn: {
    type: Date
  },
  status: {
    type: String,
    enum: ['Present', 'Late', 'Absent', 'Not Now'],
    default: 'Not Now'
  },
  deviceId: {
    type: Number,
    ref: 'Device'
  },
  classId: {
    type: Number,
    ref: 'Class'
  },
  className: String,
  subjectId: {
    type: Number,
    ref: 'Subject'
  },
  subjectName: String,
  teacherId: {
    type: Number,
    ref: 'Teacher'
  },
  teacherName: String,
  classroomId: {
    type: Number,
    ref: 'Classroom'
  },
  classroomName: String,
  semesterNumber: {
    type: Number
  },
  userRole: {
    type: String,
    enum: ['student', 'teacher', 'admin']
  },
  note: String,
  checkedBy: {
    type: String,
    enum: ['teacher', 'jetson', 'rfid', 'manual'],
    default: 'manual'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
  collection: 'AttendanceLog'
});

// Index for efficient queries
AttendanceLogSchema.index({ userId: 1, timestamp: -1 });
AttendanceLogSchema.index({ rfidId: 1, timestamp: -1 });
AttendanceLogSchema.index({ classId: 1, scheduleId: 1, timestamp: -1 });

// Virtual for getting user information
AttendanceLogSchema.virtual('user', {
  ref: 'UserAccount',
  localField: 'userId',
  foreignField: 'userId',
  justOne: true
});

// Index for faster queries
AttendanceLogSchema.index({ userId: 1, scheduleId: 1 });
AttendanceLogSchema.index({ classId: 1, date: 1 });
AttendanceLogSchema.index({ subjectId: 1 });
AttendanceLogSchema.index({ semesterNumber: 1 });
AttendanceLogSchema.index({ deviceId: 1 });

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
  foreignField: 'scheduleId',
  justOne: true
});

// Virtual for getting device information
AttendanceLogSchema.virtual('device', {
  ref: 'Device',
  localField: 'deviceId',
  foreignField: 'deviceId',
  justOne: true
});

// Thêm virtual để populate thông tin student
AttendanceLogSchema.virtual('student', {
  ref: 'Student',
  localField: 'userId',
  foreignField: 'userId',
  justOne: true
});

module.exports = mongoose.model('AttendanceLog', AttendanceLogSchema); 