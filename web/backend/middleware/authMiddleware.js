const jwt = require('jsonwebtoken');
const User = require('../database/models/User');

/**
 * Authentication middleware that protects routes
 * Verifies JWT token and adds user info to the request
 */
exports.protect = async (req, res, next) => {
  let token;

  // Check if auth header exists and starts with Bearer
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    // Get token from header
    token = req.headers.authorization.split(' ')[1];
  }

  // Check if no token
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Không có quyền truy cập',
      code: 'NO_TOKEN'
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret_key');
    
    // Check and log the decoded token
    console.log('Decoded token:', decoded);

    // Add user to req - Use the property name in the decoded token (id) 
    // to fetch user by userId
    req.user = await User.findOne({ userId: decoded.id });
    
    if (!req.user) {
      console.log('User not found for userId:', decoded.id);
      return res.status(401).json({
        success: false, 
        message: 'Token hợp lệ nhưng người dùng không tồn tại',
        code: 'USER_NOT_FOUND'
      });
    }

    next();
  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(401).json({
      success: false,
      message: 'Token không hợp lệ',
      code: 'INVALID_TOKEN'
    });
  }
};

/**
 * Role-based authorization middleware
 * Grants access to specific roles only
 */
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Không có quyền thực hiện hành động này',
        code: 'ROLE_UNAUTHORIZED'
      });
    }
    next();
  };
}; 