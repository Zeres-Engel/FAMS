const mongoose = require('mongoose');

const ScheduleSchema = new mongoose.Schema({
  scheduleId: {
    type: Number,
    required: true,
    unique: true
  },
  semesterId: {
    type: mongoose.Schema.Types.Mixed,
    ref: 'Semester',
    required: true
  },
  classId: {
    type: Number,
    ref: 'Class',
    required: true
  },
  subjectId: {
    type: Number,
    ref: 'Subject'
  },
  teacherId: {
    type: Number,
    ref: 'Teacher'
  },
  classroomId: {
    type: Number,
    ref: 'Classroom'
  },
  WeekNumber: {
    type: Number,
    required: true
  },
  DayNumber: {
    type: Number,
    required: true
  },
  SessionDate: {
    type: String,
    required: true
  },
  SlotID: {
    type: Number,
    required: true
  },
  dayOfWeek: {
    type: String,
    required: true,
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  },
  startTime: {
    type: String,
    required: true
  },
  endTime: {
    type: String,
    required: true
  },
  Topic: {
    type: String
  },
  isFreeTime: {
    type: Boolean,
    default: false
  }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for getting class info
ScheduleSchema.virtual('class', {
  ref: 'Class',
  localField: 'classId',
  foreignField: 'classId',
  justOne: true
});

// Virtual for getting subject info
ScheduleSchema.virtual('subject', {
  ref: 'Subject',
  localField: 'subjectId',
  foreignField: 'subjectId',
  justOne: true
});

// Virtual for getting teacher info
ScheduleSchema.virtual('teacher', {
  ref: 'Teacher',
  localField: 'teacherId',
  foreignField: 'teacherId',
  justOne: true
});

// Virtual for getting classroom info
ScheduleSchema.virtual('classroom', {
  ref: 'Classroom',
  localField: 'classroomId',
  foreignField: 'classroomId',
  justOne: true
});

// Virtual for getting semester info
ScheduleSchema.virtual('semester', {
  ref: 'Semester',
  localField: 'semesterId',
  foreignField: 'semesterId',
  justOne: true
});

module.exports = mongoose.model('ClassSchedule', ScheduleSchema, 'ClassSchedule'); 