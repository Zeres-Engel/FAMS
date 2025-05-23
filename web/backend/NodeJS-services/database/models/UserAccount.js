const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { COLLECTIONS, FIELDS } = require('../constants');

/**
 * UserAccount Schema
 * Represents users in the system with authentication capabilities
 */
const UserAccountSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true
  },
  username: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  backup_email: {
    type: String,
    default: null
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['admin', 'teacher', 'parent', 'student'],
    default: 'student'
  },
  avatar: {
    type: String,
    default: null
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

/**
 * Pre-save middleware to hash passwords
 * Only hashes the password if it has been modified
 */
UserAccountSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }

  try {
    // Check if the password is already hashed
    if (this.password.startsWith('$2')) {
      return next();
    }

    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    console.error('Error hashing password:', error);
    next(error);
  }
});

/**
 * Method to match user entered password to hashed password in database
 */
UserAccountSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('UserAccount', UserAccountSchema, COLLECTIONS.USER_ACCOUNT); 