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
    type: String,
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
  classIds: {
    type: [Number],
    default: []
  },
  batchId: {
    type: Number
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
  },
  parentIds: {
    type: [String],
    default: []
  },
  parentNames: {
    type: [String],
    default: []
  },
  parentCareers: {
    type: [String],
    default: []
  },
  parentPhones: {
    type: [String],
    default: []
  },
  parentGenders: {
    type: [Boolean],
    default: []
  },
  parentEmails: {
    type: [String],
    default: []
  }
}, {
  timestamps: true,
  versionKey: false,
  toJSON: { 
    virtuals: true,
    transform: function(doc, ret) {
      // Remove unnecessary fields from the response
      delete ret.parentCareers;
      delete ret.parentEmails;
      delete ret.parentGenders;
      delete ret.parentIds;
      delete ret.parentNames;
      delete ret.parentPhones;
      return ret;
    }
  },
  toObject: { 
    virtuals: true,
    transform: function(doc, ret) {
      // Remove unnecessary fields from the response
      delete ret.parentCareers;
      delete ret.parentEmails;
      delete ret.parentGenders;
      delete ret.parentIds;
      delete ret.parentNames;
      delete ret.parentPhones;
      return ret;
    }
  }
});

// Virtual for getting user info
StudentSchema.virtual('user', {
  ref: 'UserAccount',
  localField: 'userId',
  foreignField: 'userId',
  justOne: true
});

// Virtual for getting class info
StudentSchema.virtual('classes', {
  ref: 'Class',
  localField: 'classIds',
  foreignField: 'classId',
  justOne: false
});

// Virtual for getting parent information through ParentStudent relation
StudentSchema.virtual('parents', {
  ref: 'ParentStudent',
  localField: 'studentId',
  foreignField: 'studentId',
  justOne: false
});

// Static method to generate a userId for a student
StudentSchema.statics.generateUserId = function(fullName, batchId, studentId) {
  if (!fullName || !batchId || !studentId) {
    throw new Error('Full name, batch ID, and student ID are required to generate userId');
  }
  
  // Split full name to get first name and last name parts
  const nameParts = fullName.split(' ');
  const firstName = nameParts.pop().toLowerCase(); // Last part is first name
  
  // Get initials of last name (all words)
  const lastNameInitials = nameParts
    .map(part => part.charAt(0).toLowerCase())
    .join('');
  
  // Combine with 'st' prefix, batchId and studentId
  return `${firstName}${lastNameInitials}st${batchId}${studentId}`;
};

module.exports = mongoose.model('Student', StudentSchema, COLLECTIONS.STUDENT); 