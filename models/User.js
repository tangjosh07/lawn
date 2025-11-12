const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    // Optional - only for email/password auth
  },
  googleId: {
    type: String,
    sparse: true, // Allows multiple nulls
    unique: true
  },
  picture: {
    type: String
  },
  userType: {
    type: String,
    enum: ['homeowner', 'provider'],
    default: 'homeowner'
  },
  authMethod: {
    type: String,
    enum: ['google', 'email'],
    default: 'email'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('User', userSchema);

