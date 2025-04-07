const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

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
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['Admin', 'Teacher', 'Parent', 'Student'],
    default: 'Student'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
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

    const salt = await bcrypt.genSalt(10);
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

module.exports = mongoose.model('User', UserSchema, 'UserAccount'); 