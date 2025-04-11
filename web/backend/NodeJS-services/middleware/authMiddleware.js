const jwt = require('jsonwebtoken');
const User = require('../database/models/User');

/**
 * Middleware bảo vệ route yêu cầu xác thực
 * Kiểm tra và xác thực JWT token để đảm bảo người dùng đã đăng nhập
 */
exports.protect = async (req, res, next) => {
  try {
    // 1) Kiểm tra token có tồn tại không
    let token;
    
    if (
      req.headers.authorization && 
      req.headers.authorization.startsWith('Bearer')
    ) {
      // Get token from Bearer header
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
      // Get token from cookie (for browser clients)
      token = req.cookies.token;
    } else if (req.query && req.query.token) {
      // Get token from query string (for special cases)
      token = req.query.token;
    }
    
    // Token không tồn tại
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'Bạn cần đăng nhập để truy cập chức năng này',
        code: 'NOT_AUTHENTICATED'
      });
    }
    
    // 2) Xác thực token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret_key');
    } catch (error) {
      // Xử lý các loại lỗi token khác nhau
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Token đã hết hạn. Vui lòng đăng nhập lại',
          code: 'TOKEN_EXPIRED'
        });
      }
      
      return res.status(401).json({
        success: false,
        message: 'Token không hợp lệ. Vui lòng đăng nhập lại',
        code: 'INVALID_TOKEN'
      });
    }
    
    // 3) Kiểm tra xem user còn tồn tại không
    const currentUser = await User.findOne({ userId: decoded.id || decoded.userId });
    
    if (!currentUser) {
      return res.status(401).json({
        success: false,
        message: 'Người dùng không tồn tại',
        code: 'USER_NOT_FOUND'
      });
    }
    
    // 4) Cho phép truy cập route
    req.user = {
      userId: currentUser.userId,
      email: currentUser.email,
      role: currentUser.role
    };
    
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi xác thực người dùng',
      code: 'AUTH_ERROR'
    });
  }
};

/**
 * Middleware phân quyền
 * Kiểm tra role của người dùng để đảm bảo họ có quyền truy cập
 * @param  {...string} roles - Các vai trò được phép truy cập
 */
exports.authorize = (...roles) => {
  return (req, res, next) => {
    // Đảm bảo middleware protect đã chạy
    if (!req.user) {
      return res.status(500).json({
        success: false,
        message: 'Lỗi hệ thống: Middleware xác thực chưa được chạy',
        code: 'MIDDLEWARE_ERROR'
      });
    }
    
    // Kiểm tra người dùng có quyền không
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Vai trò '${req.user.role}' không có quyền truy cập chức năng này`,
        code: 'UNAUTHORIZED'
      });
    }
    
    next();
  };
}; 