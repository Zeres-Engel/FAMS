const mongoose = require('mongoose');

const StudentSchema = new mongoose.Schema({
  studentId: {
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
  dateOfBirth: {
    type: Date
  },
  classId: {
    type: Number,
    ref: 'Class'
  },
  batchId: {
    type: Number,
    ref: 'Batch'
  },
  gender: {
    type: Boolean
  },
  address: {
    type: String
  },
  phone: {
    type: String
  },
  parentIds: [{
    type: Number,
    ref: 'Parent'
  }]
}, {
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

module.exports = mongoose.model('Student', StudentSchema, 'Student'); 