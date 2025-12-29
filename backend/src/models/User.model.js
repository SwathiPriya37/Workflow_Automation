/**
 * ============================================
 * USER MODEL
 * ============================================
 * 
 * MongoDB schema for user accounts.
 * Handles authentication and user preferences.
 */

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  // Basic user info
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters']
  },
  
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
  },
  
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false // Don't include password in queries by default
  },
  
  // Email notification settings
  emailSettings: {
    enabled: { type: Boolean, default: true },
    dailyReport: { type: Boolean, default: true },
    weeklyReport: { type: Boolean, default: false },
    reportTime: { type: String, default: '09:00' }, // HH:mm format
    timezone: { type: String, default: 'UTC' }
  },
  
  // Account status
  isActive: {
    type: Boolean,
    default: true
  },
  
  lastLogin: {
    type: Date
  }
  
}, {
  timestamps: true // Adds createdAt and updatedAt
});

// ============================================
// MIDDLEWARE - Hash password before saving
// ============================================

userSchema.pre('save', async function(next) {
  // Only hash password if it's modified
  if (!this.isModified('password')) return next();
  
  // Hash password with strength of 12
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// ============================================
// INSTANCE METHODS
// ============================================

/**
 * Compare provided password with stored hash
 * @param {string} candidatePassword - Password to check
 * @returns {Promise<boolean>} - True if passwords match
 */
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

/**
 * Remove sensitive fields when converting to JSON
 */
userSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  delete obj.__v;
  return obj;
};

const User = mongoose.model('User', userSchema);

export default User;
