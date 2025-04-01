const express = require('express');
const multer = require('multer');
const { 
  getStudents, 
  getStudent, 
  createStudent, 
  updateStudent, 
  deleteStudent,
  importStudentsFromCSV
} = require('../controllers/studentController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Set up multer storage for CSV uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'backend/uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

// Check file type
const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'text/csv') {
    cb(null, true);
  } else {
    cb(new Error('Only CSV files are allowed'), false);
  }
};

const upload = multer({ 
  storage,
  fileFilter,
  limits: { fileSize: 5000000 } // 5MB limit
});

const router = express.Router();

// CSV import route - admin only
router.post(
  '/import', 
  protect, 
  authorize('admin'), 
  upload.single('file'), 
  importStudentsFromCSV
);

// Standard CRUD routes
router
  .route('/')
  .get(protect, getStudents)
  .post(protect, authorize('admin'), createStudent);

router
  .route('/:id')
  .get(protect, getStudent)
  .put(protect, authorize('admin'), updateStudent)
  .delete(protect, authorize('admin'), deleteStudent);

module.exports = router; 