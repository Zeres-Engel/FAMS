const mongoose = require('mongoose');
const { COLLECTIONS } = require('../constants');

/**
 * Student Schema
 * Represents students in the system
 */
const StudentSchema = new mongoose.Schema({
  studentId: {
    type: Number,
    required: true,
    unique: true,
    auto: true
  },
  userId: {
    type: Number,
    required: true,
    unique: true,
    ref: 'UserAccount'
  },
  fullName: {
    type: String,
    required: true
  },
  dateOfBirth: {
    type: Date
  },
  classId: {
    type: Number,
    ref: 'Class'
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
  address: {
    type: String
  },
  phone: {
    type: String
  }
}, {
  timestamps: true,
  versionKey: false,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for getting user info
StudentSchema.virtual('user', {
  ref: 'UserAccount',
  localField: 'userId',
  foreignField: 'userId',
  justOne: true
});

// Virtual for getting class info
StudentSchema.virtual('class', {
  ref: 'Class',
  localField: 'classId',
  foreignField: 'classId',
  justOne: true
});

// Virtual for getting parent information through ParentStudent relation
StudentSchema.virtual('parents', {
  ref: 'ParentStudent',
  localField: 'studentId',
  foreignField: 'studentId',
  justOne: false
});

module.exports = mongoose.model('Student', StudentSchema, COLLECTIONS.STUDENT); 