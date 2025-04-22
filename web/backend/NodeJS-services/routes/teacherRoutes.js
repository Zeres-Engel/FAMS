const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { searchTeachers } = require('../controllers/teacherSearchController');

/**
 * @route   GET /api/teachers/search
 * @desc    Search teachers with minimal info (userId and name)
 * @access  Private
 */
router.get('/search', protect, searchTeachers);

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