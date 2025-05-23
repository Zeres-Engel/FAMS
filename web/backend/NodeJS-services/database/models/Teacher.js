const mongoose = require('mongoose');
const { COLLECTIONS } = require('../constants');

/**
 * Teacher Schema
 * Represents teachers in the system
 */
const TeacherSchema = new mongoose.Schema({
  teacherId: {
    type: Number,
    required: true,
    unique: true,
    auto: true
  },
  userId: {
    type: String,
    required: true,
    unique: true,
    ref: 'UserAccount'
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
    type: Boolean,
    set: function(v) {
      if (typeof v === 'string') {
        return v.toLowerCase() === 'male' || v === 'true';
      }
      return v;
    },
    get: function(v) {
      return v ? 'Male' : 'Female';
    }
  },
  classIds: {
    type: [Number],
    default: []
  },
  major: {
    type: String
  },
  weeklyCapacity: {
    type: Number,
    default: 10
  },
  degree: {
    type: String
  },
  academicYear: {
    type: String
  }
}, {
  timestamps: true,
  versionKey: false,
  toJSON: { 
    virtuals: true,
    transform: function(doc, ret) {
      // Remove unnecessary fields from the response
      delete ret.firstName;
      delete ret.lastName;
      return ret;
    }
  },
  toObject: { 
    virtuals: true,
    transform: function(doc, ret) {
      // Remove unnecessary fields from the response
      delete ret.firstName;
      delete ret.lastName;
      return ret;
    }
  }
});

// Virtual for getting user info
TeacherSchema.virtual('user', {
  ref: 'UserAccount',
  localField: 'userId',
  foreignField: 'userId',
  justOne: true
});

// Virtual for getting classes where teacher is homeroom teacher
TeacherSchema.virtual('homeroomClasses', {
  ref: 'Class',
  localField: 'teacherId',
  foreignField: 'homeroomTeacherId',
  justOne: false
});

// Virtual for getting all teaching classes
TeacherSchema.virtual('teachingClasses', {
  ref: 'Class',
  localField: 'classIds',
  foreignField: 'classId',
  justOne: false
});

module.exports = mongoose.model('Teacher', TeacherSchema, COLLECTIONS.TEACHER); 