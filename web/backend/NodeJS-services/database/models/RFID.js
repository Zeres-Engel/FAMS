const mongoose = require('mongoose');
const { COLLECTIONS } = require('../constants');

const RFIDSchema = new mongoose.Schema({
  RFID_ID: {
    type: String,
    required: true,
    unique: true
  },
  UserID: {
    type: String,
    required: true,
    ref: 'User'
  },
  IssueDate: {
    type: Date,
    default: Date.now
  },
  ExpiryDate: {
    type: Date,
    required: true
  }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for getting user info
RFIDSchema.virtual('user', {
  ref: 'User',
  localField: 'UserID',
  foreignField: 'userId',
  justOne: true
});

module.exports = mongoose.model('RFID', RFIDSchema, COLLECTIONS.RFID); 