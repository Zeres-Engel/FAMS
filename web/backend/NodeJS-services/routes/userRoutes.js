const express = require('express');
const { 
  getUsers, 
  getUser, 
  createUser, 
  updateUser, 
  deleteUser,
  getTeacherSchedule,
  getUserDetails
} = require('../controllers/userController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { asyncHandler, sendResponse, sendError } = require('../utils/routeUtils');

const router = express.Router();

// Get teacher schedule
router.get('/teachers/:id/schedule', protect, getTeacherSchedule);

// Get user details based on role
router.get('/details/:id', protect, getUserDetails);

// GET all users with filtering (Admin only)
router.get('/', protect, authorize('Admin', 'admin'), asyncHandler(getUsers));

// Create new user (Admin only) - Existing route
router.post('/', protect, authorize('Admin', 'admin'), createUser);

// Create new user with /create endpoint (Admin only)
router.post('/create', protect, authorize('Admin', 'admin'), createUser);

// Unified update API route - accepts any role by userId
// Can also update RFID information with the 'rfid' property
// Example: { rfid: { RFID_ID: "RFID12345", ExpiryDate: "3y" } }
router.put('/update/:userId', protect, require('../controllers/unifiedUpdateController'));

// Manage single user
router.route('/:id')
  .get(protect, authorize('Admin', 'admin'), getUser)
  .put(protect, authorize('Admin', 'admin'), updateUser)
  .delete(protect, authorize('Admin', 'admin'), deleteUser);

module.exports = router; 