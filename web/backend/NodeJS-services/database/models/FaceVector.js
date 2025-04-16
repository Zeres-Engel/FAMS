const mongoose = require('mongoose');
const { COLLECTIONS } = require('../constants');

/**
 * FaceVector Schema
 * Represents face recognition vectors for users
 */
const FaceVectorSchema = new mongoose.Schema({
  faceVectorId: {
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
  modelId: {
    type: Number,
    ref: 'ModelVersion'
  },
  vector: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  capturedDate: {
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
FaceVectorSchema.virtual('user', {
  ref: 'UserAccount',
  localField: 'userId',
  foreignField: 'userId',
  justOne: true
});

// Virtual for getting model info
FaceVectorSchema.virtual('model', {
  ref: 'ModelVersion',
  localField: 'modelId',
  foreignField: 'modelId',
  justOne: true
});

module.exports = mongoose.model('FaceVector', FaceVectorSchema, COLLECTIONS.FACE_VECTOR); 