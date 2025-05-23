const mongoose = require('mongoose');
const { COLLECTIONS } = require('../constants');

/**
 * ClassSchedule Schema
 * Represents a scheduled class session
 */
const ClassScheduleSchema = new mongoose.Schema({
  scheduleId: {
    type: Number,
    required: true,
    unique: true,
    auto: true
  },
  semesterId: {
    type: Number,
    required: true,
    ref: 'Semester'
  },
  classId: {
    type: Number,
    required: true,
    ref: 'Class'
  },
  subjectId: {
    type: Number,
    required: true,
    ref: 'Subject'
  },
  teacherId: {
    type: Number,
    required: true,
    ref: 'Teacher'
  },
  classroomId: {
    type: Number,
    required: true,
    ref: 'Classroom'
  },
  slotId: {
    type: Number,
    required: true,
    ref: 'Slot'
  },
  topic: {
    type: String
  },
  sessionDate: {
    type: Date
  },
  sessionWeek: {
    type: String
  }
}, {
  timestamps: true,
  versionKey: false,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for getting semester info
ClassScheduleSchema.virtual('semester', {
  ref: 'Semester',
  localField: 'semesterId',
  foreignField: 'semesterId',
  justOne: true
});

// Virtual for getting class info
ClassScheduleSchema.virtual('class', {
  ref: 'Class',
  localField: 'classId',
  foreignField: 'classId',
  justOne: true
});

// Virtual for getting subject info
ClassScheduleSchema.virtual('subject', {
  ref: 'Subject',
  localField: 'subjectId',
  foreignField: 'subjectId',
  justOne: true
});

// Virtual for getting teacher info
ClassScheduleSchema.virtual('teacher', {
  ref: 'Teacher',
  localField: 'teacherId',
  foreignField: 'teacherId',
  justOne: true
});

// Virtual for getting classroom info
ClassScheduleSchema.virtual('classroom', {
  ref: 'Classroom',
  localField: 'classroomId',
  foreignField: 'classroomId',
  justOne: true
});

// Virtual for getting time slot info
ClassScheduleSchema.virtual('slot', {
  ref: 'ScheduleFormat',
  localField: 'slotId',
  foreignField: 'slotId',
  justOne: true
});

// Virtual for getting attendance records
ClassScheduleSchema.virtual('attendanceLogs', {
  ref: 'AttendanceLog',
  localField: 'scheduleId',
  foreignField: 'scheduleId',
  justOne: false
});

module.exports = mongoose.model('ClassSchedule', ClassScheduleSchema, COLLECTIONS.CLASS_SCHEDULE); 