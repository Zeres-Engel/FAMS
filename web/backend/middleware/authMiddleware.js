const jwt = require('jsonwebtoken');
const User = require('../database/models/User');

/**
 * Authentication middleware that protects routes
 * Verifies JWT token and adds user info to the request
 */
exports.protect = async (req, res, next) => {
  let token;

  // Check if token exists in Authorization header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    // Extract token from Bearer header
    token = req.headers.authorization.split(' ')[1];
  }

  // If no token found, return unauthorized
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route',
      code: 'TOKEN_MISSING'
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret_key');

    // Find user by userId from token
    const user = await User.findOne({ userId: decoded.userId });
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    // Add user info to request for use in protected routes
    req.user = {
      userId: user.userId,
      role: user.role
    };

    next();
  } catch (error) {
    console.error('Auth middleware error:', error.name, error.message);
    
    // Handle different token error types
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token has expired, please log in again',
        code: 'TOKEN_EXPIRED'
      });
    } else if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token format',
        code: 'INVALID_TOKEN_FORMAT'
      });
    }
    
    return res.status(401).json({
      success: false,
      message: 'Authentication failed',
      code: 'AUTH_FAILED'
    });
  }
};

/**
 * Role-based authorization middleware
 * Grants access to specific roles only
 */
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(500).json({
        success: false,
        message: 'Auth middleware error: User not found in request',
        code: 'AUTH_MIDDLEWARE_ERROR'
      });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role ${req.user.role} is not authorized to access this route`,
        code: 'FORBIDDEN_ROLE'
      });
    }
    
    next();
  };
}; 