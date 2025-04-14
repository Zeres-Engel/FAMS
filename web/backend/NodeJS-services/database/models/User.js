const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { COLLECTIONS } = require('../constants');

/**
 * User Schema
 * Represents users in the system with authentication capabilities
 */
const UserSchema = new mongoose.Schema({
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
  password: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  backup_email: {
    type: String,
    sparse: true,
    index: true,
    default: null
  },
  role: {
    type: String,
    enum: ['admin', 'teacher', 'parent', 'student', 'Admin', 'Teacher', 'Parent', 'Student'],
    default: 'student'
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
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }

  try {
    // Check if the password is already hashed
    if (this.password.startsWith('$2')) {
      console.log('Password already hashed, skipping...');
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
 * Handles both Node.js and Python-generated bcrypt hashes
 */
UserSchema.methods.matchPassword = async function(enteredPassword) {
  // This assumes bcrypt was used to hash the password
  return await bcrypt.compare(enteredPassword, this.password);
};

// Set username to userId if not provided
UserSchema.pre('validate', function(next) {
  if (!this.username && this.userId) {
    this.username = this.userId;
  }
  next();
});

module.exports = mongoose.model('User', UserSchema, COLLECTIONS.USER_ACCOUNT); 