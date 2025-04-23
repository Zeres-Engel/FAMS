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
  checkInFace: {
    type: Buffer
  },
  checkIn: {
    type: Date
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
    type: Number
  },
  isActive: {
    type: Boolean,
    default: true
  },
  userRole: {
    type: String,
    enum: ['teacher', 'student'],
    required: true
  },
  // Teacher information
  teacherId: {
    type: Number,
    ref: 'Teacher'
  },
  teacherName: {
    type: String
  },
  // Subject information
  subjectId: {
    type: Number,
    ref: 'Subject'
  },
  subjectName: {
    type: String
  },
  // Class information
  classId: {
    type: Number,
    ref: 'Class'
  },
  className: {
    type: String
  },
  // Classroom information
  classroomId: {
    type: Number,
    ref: 'Classroom'
  },
  classroomName: {
    type: String
  },
  // Student-specific information (only used for student attendance)
  studentId: {
    type: Number,
    ref: 'Student'
  },
  studentName: {
    type: String
  }
}, {
  timestamps: true,
  versionKey: false,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Create index on userId for faster queries
AttendanceLogSchema.index({ userId: 1 });

// Create compound indexes for common query patterns
AttendanceLogSchema.index({ userId: 1, subjectName: 1 });
AttendanceLogSchema.index({ userId: 1, className: 1 });
AttendanceLogSchema.index({ userId: 1, teacherName: 1 });

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