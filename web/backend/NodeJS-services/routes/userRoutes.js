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

// API để làm sạch dữ liệu học sinh, xóa các trường rỗng
router.post('/clean-student/:userId', protect, authorize('Admin', 'admin'), async (req, res) => {
  try {
    const { userId } = req.params;
    const Student = require('../database/models/Student');
    
    // Tìm học sinh theo userId
    const student = await Student.findOne({ userId });
    
    if (!student) {
      return res.status(404).json({
        success: false,
        message: `Student not found with userId: ${userId}`
      });
    }
    
    // Các trường cần làm sạch
    const fieldsToClean = ['parentCareers', 'parentEmails', 'parentGenders', 'parentIds', 'parentNames', 'parentPhones'];
    
    // Tạo object $unset để xóa các trường
    const unsetFields = {};
    fieldsToClean.forEach(field => {
      if (student[field] !== undefined) {
        unsetFields[field] = 1;
      }
    });
    
    // Thực hiện xóa nếu có trường cần xóa
    if (Object.keys(unsetFields).length > 0) {
      await Student.updateOne(
        { _id: student._id },
        { $unset: unsetFields }
      );
      
      return res.status(200).json({
        success: true,
        message: `Successfully cleaned student data for ${userId}`,
        cleaned_fields: Object.keys(unsetFields)
      });
    }
    
    return res.status(200).json({
      success: true,
      message: `No fields needed cleaning for student ${userId}`
    });
  } catch (error) {
    console.error('Error cleaning student data:', error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Manage single user
router.route('/:id')
  .get(protect, authorize('Admin', 'admin'), getUser)
  .put(protect, authorize('Admin', 'admin'), updateUser)
  .delete(protect, authorize('Admin', 'admin'), deleteUser);

module.exports = router; 