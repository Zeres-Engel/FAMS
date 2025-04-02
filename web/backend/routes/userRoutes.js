const express = require('express');
const { 
  getUsers, 
  getUser, 
  createUser, 
  updateUser, 
  deleteUser,
  getTeacherSchedule
} = require('../controllers/userController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// Get teacher schedule
router.get('/teachers/:id/schedule', protect, getTeacherSchedule);

// GET all users (Admin only)
router.get('/', protect, authorize('Admin'), (req, res) => {
  res.status(200).json({
    success: true,
    message: 'User route is setup but not implemented yet'
  });
});

module.exports = router; 