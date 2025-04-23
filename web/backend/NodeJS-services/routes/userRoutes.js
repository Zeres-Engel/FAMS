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
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// Configure multer for file upload
const tempDir = path.join(__dirname, '../temp');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, tempDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: (req, file, cb) => {
    // Accept images only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
      return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
  }
});

// Get teacher schedule
router.get('/teachers/:id/schedule', protect, getTeacherSchedule);

// Get user details based on role - Cho phép tất cả các role truy cập
router.get('/details/:id', protect, getUserDetails);

// GET all users with filtering (Admin only)
router.get('/', protect, authorize('Admin', 'admin'), asyncHandler(getUsers));

// Create new user (Admin only) - Existing route with avatar upload
router.post('/', protect, authorize('Admin', 'admin'), upload.single('avatar'), createUser);

// Create new user with /create endpoint (Admin only) with avatar upload
router.post('/create', protect, authorize('Admin', 'admin'), upload.single('avatar'), createUser);

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