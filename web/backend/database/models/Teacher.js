const mongoose = require('mongoose');

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
  phone: {
    type: String
  },
  gender: {
    type: Boolean
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

// Virtual for getting classes where teacher is homeroom teacher
TeacherSchema.virtual('classes', {
  ref: 'Class',
  localField: 'teacherId',
  foreignField: 'homeroomTeacherId',
  justOne: false
});

module.exports = mongoose.model('Teacher', TeacherSchema, 'teachers'); 