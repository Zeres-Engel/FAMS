const express = require('express');
const { 
  getAllCurriculums,
  getCurriculumWithSubjects
} = require('../controllers/curriculumController');

const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// Apply authentication to all routes
router.use(protect);

// Get all curriculums
router.route('/').get(getAllCurriculums);

// Get curriculum with subjects by ID
router.route('/:id').get(getCurriculumWithSubjects);

module.exports = router; 