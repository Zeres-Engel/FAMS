const mongoose = require('mongoose');
const { COLLECTIONS } = require('../constants');

const ParentSchema = new mongoose.Schema({
  parentId: {
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
  career: {
    type: String
  },
  phone: {
    type: String
  },
  gender: {
    type: Boolean
  },
  studentIds: [{
    type: Number,
    ref: 'Student'
  }]
}, {
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

// Virtual for getting students
ParentSchema.virtual('students', {
  ref: 'Student',
  localField: 'studentIds',
  foreignField: 'studentId',
  justOne: false
});

module.exports = mongoose.model('Parent', ParentSchema, COLLECTIONS.PARENT); 