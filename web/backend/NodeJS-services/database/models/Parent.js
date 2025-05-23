const mongoose = require('mongoose');
const { COLLECTIONS } = require('../constants');

/**
 * Parent Schema
 * Represents parents in the system
 */
const ParentSchema = new mongoose.Schema({
  parentId: {
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
  career: {
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
ParentSchema.virtual('user', {
  ref: 'UserAccount',
  localField: 'userId',
  foreignField: 'userId',
  justOne: true
});

// Virtual for getting children information through ParentStudent relation
ParentSchema.virtual('children', {
  ref: 'ParentStudent',
  localField: 'parentId',
  foreignField: 'parentId',
  justOne: false
});

module.exports = mongoose.model('Parent', ParentSchema, COLLECTIONS.PARENT); 