const mongoose = require('mongoose');
const { COLLECTIONS } = require('../constants');

/**
 * Announcement Schema
 * Represents announcement posts for the school community
 */
const AnnouncementSchema = new mongoose.Schema({
  announcementId: {
    type: Number,
    required: true,
    unique: true,
    auto: true
  },
  userId: {
    type: Number,
    required: true,
    ref: 'UserAccount'
  },
  content: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  versionKey: false,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for getting user info
AnnouncementSchema.virtual('user', {
  ref: 'UserAccount',
  localField: 'userId',
  foreignField: 'userId',
  justOne: true
});

module.exports = mongoose.model('Announcement', AnnouncementSchema, COLLECTIONS.ANNOUNCEMENT); 