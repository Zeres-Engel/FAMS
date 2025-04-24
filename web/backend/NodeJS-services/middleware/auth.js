/**
 * Auth middleware
 * This file exports authentication-related middleware functions
 * It serves as an alias to the authMiddleware.js file for backward compatibility
 */

const { protect, authorize } = require('./authMiddleware');

// Export the isAuthenticated function (alias for protect)
exports.isAuthenticated = protect;

// Export the authorize function
exports.authorize = authorize;

module.exports = exports; 