const mongoose = require('mongoose');
const { COLLECTIONS } = require('../constants');

/**
 * RFID Schema
 * Represents RFID cards assigned to users
 */
const RFIDSchema = new mongoose.Schema({
  RFID_ID: {
    type: String,
    required: true,
    unique: true
  },
  UserID: {
    type: String,
    required: true,
    ref: 'UserAccount'
  },
  IssueDate: {
    type: Date,
    default: Date.now
  },
  ExpiryDate: {
    type: Date
  },
  Status: {
    type: String,
    enum: ['Active', 'Expired', 'Revoked', 'Lost'],
    default: 'Active'
  }
}, {
  timestamps: true,
  versionKey: false,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for getting user info
RFIDSchema.virtual('user', {
  ref: 'UserAccount',
  localField: 'UserID',
  foreignField: 'userId',
  justOne: true
});

module.exports = mongoose.model('RFID', RFIDSchema, COLLECTIONS.RFID); 