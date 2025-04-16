const mongoose = require('mongoose');
const { COLLECTIONS } = require('../constants');

/**
 * ScheduleFormat Schema
 * Represents a time slot in the schedule
 */
const ScheduleFormatSchema = new mongoose.Schema({
  slotId: {
    type: Number,
    required: true,
    unique: true,
    auto: true
  },
  slotNumber: {
    type: Number,
    required: true,
    unique: true
  },
  dayOfWeek: {
    type: String,
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    required: true
  },
  startTime: {
    type: String,
    required: true
  },
  endTime: {
    type: String,
    required: true
  }
}, {
  timestamps: true,
  versionKey: false,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for getting schedules using this slot
ScheduleFormatSchema.virtual('schedules', {
  ref: 'ClassSchedule',
  localField: 'slotId',
  foreignField: 'slotId',
  justOne: false
});

module.exports = mongoose.model('ScheduleFormat', ScheduleFormatSchema, COLLECTIONS.SLOT); 