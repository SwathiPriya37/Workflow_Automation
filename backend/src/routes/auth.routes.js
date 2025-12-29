/**
 * ============================================
 * AUTHENTICATION ROUTES
 * ============================================
 * 
 * Handles user registration and login.
 */

import express from 'express';
import User from '../models/User.model.js';
import { generateToken, protect } from '../middleware/auth.middleware.js';
import { validateRegister, validateLogin } from '../middleware/validation.middleware.js';
import { sendWelcomeEmail } from '../services/email.service.js';
import Log from '../models/Log.model.js';

const router = express.Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', validateRegister, async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        error: 'Email already registered',
        message: 'Please use a different email or try logging in'
      });
    }
    
    // Create new user
    const user = await User.create({
      name,
      email,
      password
    });
    
    // Generate JWT token
    const token = generateToken(user._id);
    
    // Log the registration
    await Log.info('auth', `New user registered: ${email}`, { user: user._id });
    
    // Send welcome email (don't wait for it)
    sendWelcomeEmail(user).catch(err => console.error('Welcome email failed:', err));
    
    res.status(201).json({
      message: 'Registration successful',
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      },
      token
    });
    
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      error: 'Registration failed',
      message: error.message
    });
  }
});

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login', validateLogin, async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user and include password for comparison
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      return res.status(401).json({
        error: 'Invalid credentials',
        message: 'Email or password is incorrect'
      });
    }
    
    // Check if account is active
    if (!user.isActive) {
      return res.status(401).json({
        error: 'Account disabled',
        message: 'Your account has been disabled'
      });
    }
    
    // Verify password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        error: 'Invalid credentials',
        message: 'Email or password is incorrect'
      });
    }
    
    // Update last login
    user.lastLogin = new Date();
    await user.save();
    
    // Generate token
    const token = generateToken(user._id);
    
    // Log the login
    await Log.info('auth', `User logged in: ${email}`, { user: user._id });
    
    res.json({
      message: 'Login successful',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        emailSettings: user.emailSettings
      },
      token
    });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: 'Login failed',
      message: error.message
    });
  }
});

/**
 * @route   GET /api/auth/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        emailSettings: user.emailSettings,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin
      }
    });
    
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      error: 'Failed to get profile',
      message: error.message
    });
  }
});

/**
 * @route   PUT /api/auth/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put('/profile', protect, async (req, res) => {
  try {
    const { name, emailSettings } = req.body;
    
    const updates = {};
    if (name) updates.name = name;
    if (emailSettings) updates.emailSettings = emailSettings;
    
    const user = await User.findByIdAndUpdate(
      req.user._id,
      updates,
      { new: true }
    );
    
    res.json({
      message: 'Profile updated',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        emailSettings: user.emailSettings
      }
    });
    
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      error: 'Failed to update profile',
      message: error.message
    });
  }
});

/**
 * @route   PUT /api/auth/password
 * @desc    Change password
 * @access  Private
 */
router.put('/password', protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    // Get user with password
    const user = await User.findById(req.user._id).select('+password');
    
    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({
        error: 'Invalid password',
        message: 'Current password is incorrect'
      });
    }
    
    // Update password
    user.password = newPassword;
    await user.save();
    
    // Generate new token
    const token = generateToken(user._id);
    
    res.json({
      message: 'Password changed successfully',
      token
    });
    
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      error: 'Failed to change password',
      message: error.message
    });
  }
});

export default router;
