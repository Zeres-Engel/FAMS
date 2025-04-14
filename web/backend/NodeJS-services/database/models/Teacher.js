const mongoose = require('mongoose');
const { COLLECTIONS } = require('../constants');

const TeacherSchema = new mongoose.Schema({
  teacherId: {
    type: String,
    required: true,
    unique: true
  },
  userId: {
    type: String,
    required: true,
    unique: true
  },
  firstName: {
    type: String,
    required: true
  },
  lastName: {
    type: String,
    required: true
  },
  fullName: {
    type: String,
    default: function() {
      return `${this.firstName} ${this.lastName}`.trim();
    }
  },
  email: {
    type: String,
    required: true
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
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  versionKey: false,
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

// Generate user ID based on name
TeacherSchema.statics.generateUserId = function(firstName, lastName, teacherId) {
  if (!firstName || !lastName || !teacherId) {
    throw new Error('Missing required fields for userId generation');
  }
  
  // In Vietnamese naming, lastName is the family name (Nguyễn Phước), 
  // firstName is the given name (Thành)
  
  // Extract the first letter of each word in the lastName
  const lastNameParts = lastName.split(' ');
  const lastNameInitials = lastNameParts.map(part => part.charAt(0).toLowerCase()).join('');
  
  // Combine with firstName and ID
  return `${firstName.toLowerCase()}${lastNameInitials}${teacherId}`;
};

module.exports = mongoose.model('Teacher', TeacherSchema, COLLECTIONS.TEACHER); 