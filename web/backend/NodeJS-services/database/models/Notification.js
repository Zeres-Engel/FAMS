const mongoose = require('mongoose');
const { COLLECTIONS } = require('../constants');

/**
 * Notification Schema
 * Represents notifications sent between users
 */
const NotificationSchema = new mongoose.Schema({
  notificationId: {
    type: Number,
    required: true,
    unique: true,
    auto: true
  },
  senderId: {
    type: Number,
    required: true,
    ref: 'UserAccount'
  },
  receiverId: {
    type: Number,
    required: true,
    ref: 'UserAccount'
  },
  message: {
    type: String,
    required: true
  },
  sentDate: {
    type: Date,
    default: Date.now
  },
  readStatus: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  versionKey: false,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for getting sender info
NotificationSchema.virtual('sender', {
  ref: 'UserAccount',
  localField: 'senderId',
  foreignField: 'userId',
  justOne: true
});

// Virtual for getting receiver info
NotificationSchema.virtual('receiver', {
  ref: 'UserAccount',
  localField: 'receiverId',
  foreignField: 'userId',
  justOne: true
});

module.exports = mongoose.model('Notification', NotificationSchema, COLLECTIONS.NOTIFICATION);