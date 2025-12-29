/**
 * ============================================
 * VALIDATION MIDDLEWARE
 * ============================================
 * 
 * Input validation using express-validator.
 * Validates request data before processing.
 */

import { body, param, validationResult } from 'express-validator';

/**
 * Handle validation errors
 * Returns 400 with validation errors if any
 */
export const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation Error',
      details: errors.array().map(err => ({
        field: err.path,
        message: err.msg
      }))
    });
  }
  
  next();
};

// ============================================
// AUTH VALIDATORS
// ============================================

export const validateRegister = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 50 }).withMessage('Name must be 2-50 characters'),
  
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail(),
  
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  
  handleValidation
];

export const validateLogin = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail(),
  
  body('password')
    .notEmpty().withMessage('Password is required'),
  
  handleValidation
];

// ============================================
// PROJECT VALIDATORS
// ============================================

export const validateProject = [
  body('name')
    .trim()
    .notEmpty().withMessage('Project name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),
  
  body('github.owner')
    .trim()
    .notEmpty().withMessage('GitHub owner/organization is required'),
  
  body('github.repo')
    .trim()
    .notEmpty().withMessage('GitHub repository name is required'),
  
  body('github.branch')
    .optional()
    .trim(),
  
  handleValidation
];

export const validateProjectId = [
  param('id')
    .isMongoId().withMessage('Invalid project ID'),
  
  handleValidation
];

// ============================================
// REPORT VALIDATORS
// ============================================

export const validateReportId = [
  param('id')
    .isMongoId().withMessage('Invalid report ID'),
  
  handleValidation
];

// ============================================
// EMAIL VALIDATORS
// ============================================

export const validateEmailSend = [
  body('reportId')
    .optional()
    .isMongoId().withMessage('Invalid report ID'),
  
  body('recipients')
    .optional()
    .isArray().withMessage('Recipients must be an array'),
  
  body('recipients.*')
    .optional()
    .isEmail().withMessage('Invalid email in recipients'),
  
  handleValidation
];

export const validateEmailSchedule = [
  body('enabled')
    .optional()
    .isBoolean().withMessage('Enabled must be boolean'),
  
  body('time')
    .optional()
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Time must be in HH:mm format'),
  
  body('timezone')
    .optional()
    .isString().withMessage('Timezone must be a string'),
  
  handleValidation
];

export default {
  handleValidation,
  validateRegister,
  validateLogin,
  validateProject,
  validateProjectId,
  validateReportId,
  validateEmailSend,
  validateEmailSchedule
};
