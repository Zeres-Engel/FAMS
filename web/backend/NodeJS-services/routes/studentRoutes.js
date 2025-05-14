const express = require('express');
const router = express.Router();

/**
 * Deprecated Routes - Redirects to User API
 * These routes have been deprecated and will be removed in future versions.
 * Please use the User API instead.
 */

// Redirect all GET requests to User API
router.get('/*', (req, res) => {
  res.status(301).json({
    success: false,
    message: 'This API endpoint is deprecated. Please use /api/users with appropriate filters instead.',
    code: 'DEPRECATED_API',
    suggestion: 'Use /api/users with role=student filter'
  });
});

// Redirect all POST requests to User API
router.post('/*', (req, res) => {
  res.status(301).json({
    success: false,
    message: 'This API endpoint is deprecated. Please use /api/users/create with role=student instead.',
    code: 'DEPRECATED_API',
    suggestion: 'Use /api/users/create with role=student'
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