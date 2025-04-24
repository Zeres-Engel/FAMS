const express = require('express');
const { 
  recordAttendance,
  getAttendanceLogs,
  getUserAttendance,
  deleteAttendanceLog
} = require('../controllers/attendanceController');

const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// Apply authentication to all routes except record (which uses its own auth)
router.use(protect);

// Record attendance from RFID device (from Jetson Nano)
router.post('/record', recordAttendance);

// Get all attendance logs (admin only)
router.get('/', authorize('admin'), getAttendanceLogs);

// Get attendance by user ID
router.get('/user/:userId', getUserAttendance);

// Delete attendance log (admin only)
router.delete('/:id', authorize('admin'), deleteAttendanceLog);

module.exports = router; 