const mongoose = require('mongoose');
const { COLLECTIONS } = require('../constants');

const ParentSchema = new mongoose.Schema({
  parentId: {
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
  career: {
    type: String
  },
  phone: {
    type: String
  },
  gender: {
    type: Boolean
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
ParentSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: 'userId',
  justOne: true
});

// Virtual for getting students linked to this parent
ParentSchema.virtual('students', {
  ref: 'ParentStudent',
  localField: 'parentId',
  foreignField: 'parentId',
  justOne: false
});

// Generate user ID based on name
ParentSchema.statics.generateUserId = function(firstName, lastName, parentId) {
  if (!firstName || !lastName || !parentId) {
    throw new Error('Missing required fields for userId generation');
  }
  
  // In Vietnamese naming, lastName is the family name (Nguyễn Phước), 
  // firstName is the given name (Thành)
  
  // Names should already be normalized (accents removed) in the controller
  
  // Extract the first letter of each word in the lastName
  const lastNameParts = lastName.split(' ');
  const lastNameInitials = lastNameParts.map(part => part.charAt(0).toLowerCase()).join('');
  
  // Combine with firstName, "pr" suffix and ID
  return `${firstName.toLowerCase()}${lastNameInitials}pr${parentId}`;
};

module.exports = mongoose.model('Parent', ParentSchema, COLLECTIONS.PARENT); 