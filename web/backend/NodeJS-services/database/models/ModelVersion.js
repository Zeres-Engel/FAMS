const mongoose = require('mongoose');
const { COLLECTIONS } = require('../constants');

/**
 * ModelVersion Schema
 * Represents a version of a face recognition model
 */
const ModelVersionSchema = new mongoose.Schema({
  modelId: {
    type: Number,
    required: true,
    unique: true,
    auto: true
  },
  modelName: {
    type: String,
    required: true
  },
  version: {
    type: String,
    required: true
  },
  deploymentDate: {
    type: Date,
    default: Date.now
  },
  description: {
    type: String
  },
  deviceId: {
    type: Number,
    ref: 'Device'
  },
  checkpointPath: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive'],
    default: 'Active'
  }
}, {
  timestamps: true,
  versionKey: false,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for getting device info
ModelVersionSchema.virtual('device', {
  ref: 'Device',
  localField: 'deviceId',
  foreignField: 'deviceId',
  justOne: true
});

// Virtual for getting face vectors using this model
ModelVersionSchema.virtual('faceVectors', {
  ref: 'FaceVector',
  localField: 'modelId',
  foreignField: 'modelId',
  justOne: false
});

module.exports = mongoose.model('ModelVersion', ModelVersionSchema, COLLECTIONS.MODEL_VERSION); 