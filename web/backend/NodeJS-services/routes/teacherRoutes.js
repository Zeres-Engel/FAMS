const express = require('express');
const { 
  getAllTeachers, 
  getTeacherById, 
  createTeacher, 
  updateTeacher, 
  deleteTeacher 
} = require('../controllers/teacherController');

const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// Apply authentication to all routes
router.use(protect);

// Teacher routes
router
  .route('/')
  .get(getAllTeachers)
  .post(authorize('admin'), createTeacher);

router
  .route('/:id')
  .get(getTeacherById)
  .put(authorize('admin'), updateTeacher)
  .delete(authorize('admin'), deleteTeacher);

module.exports = router; 