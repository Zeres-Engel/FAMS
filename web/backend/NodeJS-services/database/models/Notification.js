const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Schema definition based on SQL schema
const notificationSchema = new Schema({
  NotificationID: {
    type: Number,
    required: true,
    unique: true
  },
  SenderID: {
    type: String,
    required: true,
    ref: 'UserAccount'
  },
  ReceiverID: {
    type: String,
    required: true,
    ref: 'UserAccount'
  },
  Message: {
    type: String,
    required: true
  },
  Title: {
    type: String,
    default: 'Thông báo mới'
  },
  SentDate: {
    type: Date,
    default: Date.now
  },
  ReadStatus: {
    type: Boolean,
    default: false
  },
  Archived: {
    type: Boolean,
    default: false
  },
  ClassID: {
    type: Number,
    ref: 'Class',
    default: null
  },
  ClassName: {
    type: String,
    default: null
  },
  CreatedAt: {
    type: Date,
    default: Date.now
  },
  UpdatedAt: {
    type: Date,
    default: Date.now
  },
  IsActiveSender: {
    type: Boolean,
    default: true
  },
  IsActiveReceiver: {
    type: Boolean,
    default: true
  }
}, {
  collection: 'Notification' // Ensure we're using the correct collection name
});

// Middleware để cập nhật trường UpdatedAt trước khi save
notificationSchema.pre('save', function(next) {
  this.UpdatedAt = new Date();
  next();
});

// Tạo và xuất model
module.exports = mongoose.model('Notification', notificationSchema); 