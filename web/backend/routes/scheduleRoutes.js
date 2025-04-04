const express = require('express');
const { 
  getWeeklySchedule, 
  getDailySchedule, 
  getSemesterSchedule 
} = require('../controllers/scheduleController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Protect all routes
router.use(protect);

// @route   GET /api/schedules/weekly
// @desc    Get weekly schedule for current user
router.get('/weekly', getWeeklySchedule);

// @route   GET /api/schedules/daily/:date
// @desc    Get daily schedule for a specific date
router.get('/daily/:date', getDailySchedule);

// @route   GET /api/schedules/semester/:semesterId
// @desc    Get schedule for an entire semester
router.get('/semester/:semesterId', getSemesterSchedule);

// @route   GET /api/schedules/user/:userId/weekly
// @desc    Get weekly schedule for a specific user (admin only)
router.get('/user/:userId/weekly', getWeeklySchedule);

// @route   GET /api/schedules/class/:classId/weekly
// @desc    Get weekly schedule for a specific class
router.get('/class/:classId/weekly', getWeeklySchedule);

module.exports = router; 