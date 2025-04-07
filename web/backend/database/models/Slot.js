const mongoose = require('mongoose');
const { COLLECTIONS } = require('../constants');

const SlotSchema = new mongoose.Schema({
  SlotNumber: {
    type: Number,
    required: true
  },
  DayOfWeek: {
    type: String,
    required: true,
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  },
  StartTime: {
    type: String,
    required: true
  },
  EndTime: {
    type: String,
    required: true
  }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound index to ensure uniqueness of DayOfWeek + SlotNumber combination
SlotSchema.index({ DayOfWeek: 1, SlotNumber: 1 }, { unique: true });

module.exports = mongoose.model('Slot', SlotSchema, COLLECTIONS.SLOT); 