const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { searchTeachers } = require('../controllers/teacherSearchController');

/**
 * @route   GET /api/teachers/search
 * @desc    Search teachers with minimal info (userId and name)
 * @access  Public - no authentication required
 */
router.get('/search', searchTeachers);

/**
 * @route   GET /api/teachers/userid-to-teacherid/:userId
 * @desc    Convert a teacher's userId to teacherId
 * @access  Public - no authentication required
 */
router.get('/userid-to-teacherid/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'UserId is required',
        code: 'MISSING_USERID'
      });
    }
    
    // Tìm giáo viên theo userId
    const Teacher = require('../database/models/Teacher');
    const teacher = await Teacher.findOne({ userId });
    
    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: `Teacher with userId ${userId} not found`,
        code: 'TEACHER_NOT_FOUND'
      });
    }
    
    return res.json({
      success: true,
      data: {
        userId: teacher.userId,
        teacherId: teacher.teacherId,
        fullName: teacher.fullName
      }
    });
  } catch (error) {
    console.error('Error converting userId to teacherId:', error);
    return res.status(500).json({
      success: false,
      message: error.message,
      code: 'SERVER_ERROR'
    });
  }
});

/**
 * Deprecated Routes - Redirects to User API
 * These routes have been deprecated and will be removed in future versions.
 * Please use the User API instead.
 */

// Redirect all GET requests to User API (except our new search endpoint)
router.get('/:path([^search].*)?', (req, res) => {
  res.status(301).json({
    success: false,
    message: 'This API endpoint is deprecated. Please use /api/users with appropriate filters instead.',
    code: 'DEPRECATED_API',
    suggestion: 'Use /api/users with role=teacher filter'
  });
});

// Redirect all POST requests to User API
router.post('/*', (req, res) => {
  res.status(301).json({
    success: false,
    message: 'This API endpoint is deprecated. Please use /api/users/create with role=teacher instead.',
    code: 'DEPRECATED_API',
    suggestion: 'Use /api/users/create with role=teacher'
  });
});

// Redirect all PUT requests to User API
router.put('/:id', (req, res) => {
  res.status(301).json({
    success: false,
    message: 'This API endpoint is deprecated. Please use /api/users/update/:userId instead.',
    code: 'DEPRECATED_API',
    suggestion: 'Use /api/users/update/:userId with PUT method for unified updates across all roles'
  });
});

// Redirect all DELETE requests to User API
router.delete('/:id', (req, res) => {
  res.status(301).json({
    success: false,
    message: 'This API endpoint is deprecated. Please use /api/users/:id instead.',
    code: 'DEPRECATED_API',
    suggestion: 'Use /api/users/:id with DELETE method'
  });
});

module.exports = router; 