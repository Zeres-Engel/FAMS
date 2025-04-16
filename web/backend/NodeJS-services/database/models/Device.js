const mongoose = require('mongoose');
const { COLLECTIONS } = require('../constants');

/**
 * Device Schema
 * Represents physical devices used in the system
 */
const DeviceSchema = new mongoose.Schema({
  deviceId: {
    type: Number,
    required: true,
    unique: true,
    auto: true
  },
  deviceName: {
    type: String,
    required: true
  },
  deviceType: {
    type: String,
    default: 'Jetson Nano'
  },
  location: {
    type: String
  },
  status: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  versionKey: false,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for getting models deployed on this device
DeviceSchema.virtual('models', {
  ref: 'ModelVersion',
  localField: 'deviceId',
  foreignField: 'deviceId',
  justOne: false
});

module.exports = mongoose.model('Device', DeviceSchema, COLLECTIONS.DEVICE); 