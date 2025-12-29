/**
 * ============================================
 * LOG ROUTES
 * ============================================
 * 
 * Handles system logs retrieval.
 */

import express from 'express';
import { Log } from '../models/index.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

/**
 * @route   GET /api/logs
 * @desc    Get logs for current user
 * @access  Private
 */
router.get('/', protect, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      level, 
      action, 
      search,
      startDate,
      endDate 
    } = req.query;

    const query = { user: req.user._id };
    
    if (level && level !== 'all') {
      query.level = level;
    }
    
    if (action && action !== 'all') {
      query.action = action;
    }
    
    if (search) {
      query.message = { $regex: search, $options: 'i' };
    }
    
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [logs, total] = await Promise.all([
      Log.find(query)
        .populate('project', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Log.countDocuments(query)
    ]);
    
    res.json({
      logs,
      totalPages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      total
    });
    
  } catch (error) {
    console.error('Get logs error:', error);
    res.status(500).json({
      error: 'Failed to get logs',
      message: error.message
    });
  }
});

export default router;
