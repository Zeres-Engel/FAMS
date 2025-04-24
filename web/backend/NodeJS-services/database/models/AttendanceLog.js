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
    type: String,
    required: true,
    ref: 'UserAccount'
  },
  checkIn: {
    type: Date,
    default: null
  },
  checkInFace: {
    type: Buffer
  },
  note: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['Present', 'Late', 'Absent', 'Not Now'],
    default: 'Not Now'
  },
  semesterNumber: {
    type: Number,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  userRole: {
    type: String,
    enum: ['student', 'teacher'],
    required: true
  },
  // Teacher info
  teacherId: {
    type: Number,
    ref: 'Teacher'
  },
  teacherName: {
    type: String
  },
  // Subject info
  subjectId: {
    type: Number,
    ref: 'Subject'
  },
  subjectName: {
    type: String
  },
  // Class info
  classId: {
    type: Number,
    ref: 'Class'
  },
  className: {
    type: String
  },
  // For students
  studentId: {
    type: Number,
    ref: 'Student'
  },
  studentName: {
    type: String
  },
  // Classroom info
  classroomId: {
    type: Number,
    ref: 'Classroom'
  },
  classroomName: {
    type: String
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

// Index for faster queries
AttendanceLogSchema.index({ userId: 1, scheduleId: 1 });
AttendanceLogSchema.index({ classId: 1, date: 1 });
AttendanceLogSchema.index({ subjectId: 1 });
AttendanceLogSchema.index({ semesterNumber: 1 });

module.exports = mongoose.model('AttendanceLog', AttendanceLogSchema, COLLECTIONS.ATTENDANCE_LOG); 