const express = require('express');
const { 
  getAllCurriculums,
  getCurriculumWithSubjects,
  updateCurriculum,
  updateCurriculumSubjects,
  deleteCurriculum,
  addSubjectToCurriculum,
  removeSubjectFromCurriculum,
  updateSubjectInCurriculum
} = require('../controllers/curriculumController');

const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// Apply authentication to all routes
router.use(protect);

// Get all curriculums
router.route('/').get(getAllCurriculums);

// Get, update and delete curriculum
router.route('/:id')
  .get(getCurriculumWithSubjects)
  .put(authorize('admin'), updateCurriculum)
  .delete(authorize('admin'), deleteCurriculum);

// Update all subjects in a curriculum
router.route('/:id/subjects')
  .put(authorize('admin'), updateCurriculumSubjects)
  .post(authorize('admin'), addSubjectToCurriculum);

// Manage individual subjects in a curriculum
router.route('/:id/subjects/:subjectId')
  .delete(authorize('admin'), removeSubjectFromCurriculum)
  .put(authorize('admin'), updateSubjectInCurriculum);

module.exports = router; 