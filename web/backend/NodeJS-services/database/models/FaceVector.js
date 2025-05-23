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
    default: () => Math.floor(Date.now() / 1000)
  },
  userId: {
    type: String,
    required: true,
    ref: 'UserAccount'
  },
  modelId: {
    type: Number,
    ref: 'ModelVersion'
  },
  category: {
    type: String,
    enum: ['front', 'up', 'down', 'left', 'right'],
    required: true
  },
  vector: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  score: {
    type: Number,
    default: 0
  },
  capturedDate: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  versionKey: false,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Create compound index for unique face vector per user and type
FaceVectorSchema.index({ userId: 1, category: 1 }, { unique: true });

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