const mongoose = require('mongoose');
const { COLLECTIONS } = require('../constants');

const StudentSchema = new mongoose.Schema({
  studentId: {
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
  email: {
    type: String,
    required: true
  },
  fullName: {
    type: String,
    default: function() {
      return `${this.firstName} ${this.lastName}`.trim();
    }
  },
  dateOfBirth: {
    type: Date
  },
  classId: {
    type: Number,
    ref: 'Class'
  },
  batchId: {
    type: Number,
    ref: 'Batch',
    get: v => v,
    set: v => typeof v === 'string' ? parseInt(v) : v
  },
  gender: {
    type: Boolean,
    required: true
  },
  address: {
    type: String
  },
  phone: {
    type: String
  },
  isActive: {
    type: Boolean,
    default: true
  },
  // Parent information arrays
  parentIds: [{
    type: String
  }],
  parentNames: [{
    type: String
  }],
  parentCareers: [{
    type: String
  }],
  parentPhones: [{
    type: String
  }],
  parentGenders: [{
    type: Boolean
  }]
}, {
  timestamps: true,
  versionKey: false,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for getting user info
StudentSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: 'userId',
  justOne: true
});

// Generate user ID based on name and IDs
StudentSchema.statics.generateUserId = function(firstName, lastName, batchId, studentId) {
  if (!firstName || !lastName || !batchId || !studentId) {
    throw new Error('Missing required fields for userId generation');
  }
  
  // In Vietnamese naming, lastName is the family name (Nguyễn Phước), 
  // firstName is the given name (Thành)
  
  // Extract the first letter of each word in the lastName
  const lastNameParts = lastName.split(' ');
  const lastNameInitials = lastNameParts.map(part => part.charAt(0).toLowerCase()).join('');
  
  // Combine with firstName, "st" suffix, and IDs
  return `${firstName.toLowerCase()}${lastNameInitials}st${batchId}${studentId}`;
};

module.exports = mongoose.model('Student', StudentSchema, COLLECTIONS.STUDENT); 