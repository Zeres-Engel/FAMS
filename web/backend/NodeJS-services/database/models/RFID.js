const mongoose = require('mongoose');
const { COLLECTIONS } = require('../constants');

/**
 * RFID Schema
 * Represents RFID cards assigned to users
 */
const RFIDSchema = new mongoose.Schema({
  rfidId: {
    type: String,
    required: true,
    unique: true
  },
  userId: {
    type: Number,
    required: true,
    ref: 'UserAccount'
  },
  issueDate: {
    type: Date,
    default: Date.now
  },
  expiryDate: {
    type: Date
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
  localField: 'userId',
  foreignField: 'userId',
  justOne: true
});

module.exports = mongoose.model('RFID', RFIDSchema, COLLECTIONS.RFID); 