const mongoose = require('mongoose');
const { COLLECTIONS } = require('../constants');

const TeacherSchema = new mongoose.Schema({
  teacherId: {
    type: Number,
    required: true,
    unique: true
  },
  userId: {
    type: String,
    required: true,
    unique: true
  },
  fullName: {
    type: String,
    required: true
  },
  email: {
    type: String
  },
  dateOfBirth: {
    type: Date
  },
  address: {
    type: String
  },
  phone: {
    type: String
  },
  gender: {
    type: Boolean
  },
  major: {
    type: String
  },
  WeeklyCapacity: {
    type: Number,
    default: 10
  }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for getting user info
TeacherSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: 'userId',
  justOne: true
});

// Virtual for getting assigned classes
TeacherSchema.virtual('classes', {
  ref: 'Class',
  localField: 'teacherId',
  foreignField: 'homeroomTeacherId'
});

// Virtual for getting teaching schedules
TeacherSchema.virtual('schedules', {
  ref: 'ClassSchedule',
  localField: 'teacherId',
  foreignField: 'teacherId'
});

module.exports = mongoose.model('Teacher', TeacherSchema, COLLECTIONS.TEACHER); 