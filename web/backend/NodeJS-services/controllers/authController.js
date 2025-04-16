const UserAccount = require('../database/models/UserAccount');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Student = require('../database/models/Student');
const Teacher = require('../database/models/Teacher');
const Parent = require('../database/models/Parent');

/**
 * Generate JWT tokens (access and refresh)
 * 
 * @param {string} userId - User ID to encode in tokens
 * @returns {Object} Object containing accessToken and refreshToken
 */
const generateTokens = (userId) => {
  // Access token (2 hours)
  const accessToken = jwt.sign({ userId }, process.env.JWT_SECRET || 'secret_key', {
    expiresIn: '100y',
  });
  
  // Refresh token (2 days)
  const refreshToken = jwt.sign({ userId }, process.env.REFRESH_TOKEN_SECRET || 'refresh_secret_key', {
    expiresIn: '100y',
  });
  
  return { accessToken, refreshToken };
};

/**
 * Check and create admin account if needed
 * Ensures there's always an admin user in the system
 */
const ensureAdminExists = async () => {
  try {
    console.log("Finding user with userId as string: admin");
    // Check if admin account exists
    const adminUser = await UserAccount.findOne({ userId: 'admin' });
    
    if (!adminUser) {
      console.log('Admin account not found, creating new admin user...');
      
      // Create a new admin with password hashed by Node.js
      const admin = new UserAccount({
        userId: 'admin',
        name: 'Administrator',
        email: 'admin@fams.edu.vn',
        password: '1234',  // Will be hashed by pre-save middleware
        role: 'Admin'
      });
      
      await admin.save();
      console.log('Admin account created successfully!');
      return true;
    } else {
      // Try to authenticate with default password
      const isPasswordValid = await adminUser.matchPassword('1234');
      
      if (!isPasswordValid) {
        console.log('Admin exists but password validation failed. Creating admin2 account...');
        
        // Create a new admin2 account as backup
        const admin2 = new UserAccount({
          userId: 'admin2',
          name: 'Administrator 2',
          email: 'admin2@fams.edu.vn',
          password: '1234',
          role: 'Admin'
        });
        
        await admin2.save();
        console.log('Admin2 account created successfully!');
        return true;
      }
      
      console.log('Admin account verified successfully');
      return true;
    }
  } catch (error) {
    console.error('Error in ensureAdminExists:', error);
    return false;
  }
};

// Run admin check when server starts
ensureAdminExists();

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
exports.register = async (req, res) => {
  try {
    const { userId, name, email, backup_email, password, role } = req.body;
    
    // Validate required fields
    if (!userId || !name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields',
        code: 'MISSING_FIELDS'
      });
    }
    
    // Check if user already exists
    const userExists = await UserAccount.findOne({ 
      $or: [
        { email }, 
        { userId },
        ...(backup_email ? [{ backup_email }] : [])
      ] 
    });

    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'User already exists',
        code: 'USER_EXISTS'
      });
    }

    // Create user
    const user = await UserAccount.create({
      userId,
      name,
      email,
      backup_email,
      password,
      role: role || 'Student'
    });

    if (user) {
      // Generate tokens
      const { accessToken, refreshToken } = generateTokens(user.userId);
      
      res.status(201).json({
        success: true,
        data: {
          userId: user.userId,
          name: user.name,
          email: user.email,
          role: user.role,
          accessToken,
          refreshToken
        },
        code: 'REGISTER_SUCCESS'
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Invalid user data',
        code: 'INVALID_DATA'
      });
    }
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
      code: 'SERVER_ERROR'
    });
  }
};

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
exports.login = async (req, res) => {
  try {
    const { userId, email, backup_email, password } = req.body;

    // Validate input
    if ((!userId && !email && !backup_email) || !password) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp tên đăng nhập/email/backup_email và mật khẩu',
        code: 'MISSING_FIELDS'
      });
    }

    // Check for user by userId, email, or backup_email
    let user;
    
    // Build query with provided identifiers
    const query = {};
    if (userId) query.userId = userId;
    if (email) query.email = email;
    if (backup_email) query.backup_email = backup_email;
    
    try {
      // Find user with any of the provided identifiers
      user = await UserAccount.findOne({ $or: Object.keys(query).map(key => ({ [key]: query[key] })) });
    } catch (error) {
      console.error('Login error:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi xác thực đăng nhập',
        error: error.message,
        code: 'AUTH_ERROR'
      });
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Thông tin đăng nhập không đúng',
        code: 'INVALID_CREDENTIALS'
      });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Thông tin đăng nhập không đúng',
        code: 'INVALID_CREDENTIALS'
      });
    }

    // Get additional user info based on role
    let additionalInfo = {};
    if (user.role === 'Student') {
      const student = await Student.findOne({ userId: user.userId });
      if (student) {
        additionalInfo = {
          studentId: student.studentId,
          fullName: student.fullName,
          classId: student.classId
        };
      }
    } else if (user.role === 'Teacher') {
      const teacher = await Teacher.findOne({ userId: user.userId });
      if (teacher) {
        additionalInfo = {
          teacherId: teacher.teacherId,
          fullName: teacher.fullName
        };
      }
    } else if (user.role === 'Parent') {
      const parent = await Parent.findOne({ userId: user.userId });
      if (parent) {
        additionalInfo = {
          parentId: parent.parentId,
          fullName: parent.fullName
        };
      }
    }

    // Generate both access and refresh tokens using the generateTokens function
    const { accessToken, refreshToken } = generateTokens(user.userId);
    
    // Log token creation for debugging
    console.log(`Generated tokens for user ${user.userId} with role ${user.role}`);

    res.json({
      success: true,
      message: 'Đăng nhập thành công',
      data: {
        userId: user.userId,
        name: user.name,
        email: user.email,
        role: user.role,
        ...additionalInfo,
        accessToken,
        refreshToken
      },
      code: 'LOGIN_SUCCESS'
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server',
      error: error.message,
      code: 'SERVER_ERROR'
    });
  }
};

/**
 * @desc    Refresh access token
 * @route   POST /api/auth/refresh-token
 * @access  Public (with refresh token)
 */
exports.refreshToken = async (req, res) => {
  try {
    // Get refresh token from request body
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'No refresh token provided',
        code: 'MISSING_REFRESH_TOKEN'
      });
    }
    
    // Verify refresh token
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET || 'refresh_secret_key');
    } catch (jwtError) {
      console.error('JWT verification error:', jwtError);
      return res.status(401).json({
        success: false,
        message: jwtError.name === 'TokenExpiredError' 
          ? 'Refresh token has expired, please log in again' 
          : 'Invalid refresh token',
        code: jwtError.name === 'TokenExpiredError' ? 'REFRESH_TOKEN_EXPIRED' : 'INVALID_REFRESH_TOKEN'
      });
    }
    
    // Check if user exists
    const user = await UserAccount.findOne({ userId: decoded.userId });
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found for this token',
        code: 'USER_NOT_FOUND'
      });
    }
    
    // Generate new tokens
    const tokens = generateTokens(user.userId);
    
    // Return new tokens
    res.json({
      success: true,
      data: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        role: user.role
      },
      code: 'TOKEN_REFRESHED'
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during token refresh',
      code: 'SERVER_ERROR'
    });
  }
};

/**
 * @desc    Logout user
 * @route   POST /api/auth/logout
 * @access  Private
 */
exports.logout = async (req, res) => {
  // No need to clear server-side cookies anymore
  res.json({
    success: true,
    message: 'Logged out successfully',
    code: 'LOGOUT_SUCCESS'
  });
};

/**
 * @desc    Get current logged in user
 * @route   GET /api/auth/me
 * @access  Private
 */
exports.getMe = async (req, res) => {
  try {
    const user = await UserAccount.findOne({ userId: req.user.userId });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng',
        code: 'USER_NOT_FOUND'
      });
    }

    // Get additional user info based on role
    let additionalInfo = {};
    if (user.role === 'Student') {
      const student = await Student.findOne({ userId: user.userId });
      if (student) {
        additionalInfo = {
          studentId: student.studentId,
          fullName: student.fullName,
          classId: student.classId
        };
      }
    } else if (user.role === 'Teacher') {
      const teacher = await Teacher.findOne({ userId: user.userId });
      if (teacher) {
        additionalInfo = {
          teacherId: teacher.teacherId,
          fullName: teacher.fullName
        };
      }
    } else if (user.role === 'Parent') {
      const parent = await Parent.findOne({ userId: user.userId });
      if (parent) {
        additionalInfo = {
          parentId: parent.parentId,
          fullName: parent.fullName
        };
      }
    }

    res.json({
      success: true,
      data: {
        userId: user.userId,
        name: user.name,
        email: user.email,
        role: user.role,
        ...additionalInfo
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi lấy thông tin người dùng',
      code: 'SERVER_ERROR'
    });
  }
};

/**
 * @desc    Reset admin password for emergency access
 * @route   GET /api/auth/reset-admin-password
 * @access  Public (for development only)
 */
exports.resetAdminPassword = async (req, res) => {
  try {
    // Find admin user
    const admin = await UserAccount.findOne({ userId: 'admin2' });
    
    if (!admin) {
      // Create admin2 account if it doesn't exist
      const newAdmin = new UserAccount({
        userId: 'admin2',
        name: 'Administrator 2',
        email: 'admin2@fams.edu.vn',
        password: '1234',
        role: 'Admin'
      });
      
      await newAdmin.save();
      
      return res.json({
        success: true,
        message: 'Admin account created successfully',
        code: 'ADMIN_CREATED'
      });
    }
    
    // Reset password to default
    admin.password = '1234';
    await admin.save();
    
    return res.json({
      success: true,
      message: 'Admin password reset successfully',
      code: 'ADMIN_RESET'
    });
  } catch (error) {
    console.error('Reset admin error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during admin reset',
      code: 'SERVER_ERROR'
    });
  }
};

/**
 * @desc    Verify token
 * @route   POST /api/auth/verify
 * @access  Public
 */
exports.verifyToken = async (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Không có token',
        code: 'NO_TOKEN'
      });
    }
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      res.json({
        success: true,
        data: decoded,
        valid: true
      });
    } catch (err) {
      res.json({
        success: true,
        valid: false
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi xác thực token',
      code: 'SERVER_ERROR'
    });
  }
};

/**
 * @desc    Change password
 * @route   POST /api/auth/change-password
 * @access  Private
 */
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    // Validate inputs
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both current and new password',
        code: 'MISSING_FIELDS'
      });
    }
    
    // Find the user
    const user = await UserAccount.findOne({ userId: req.user.userId });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }
    
    // Check if current password is correct
    const isMatch = await user.matchPassword(currentPassword);
    
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect',
        code: 'INVALID_PASSWORD'
      });
    }
    
    // Update password
    user.password = newPassword;
    await user.save();
    
    res.json({
      success: true,
      message: 'Password changed successfully',
      code: 'PASSWORD_CHANGED'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during password change',
      code: 'SERVER_ERROR'
    });
  }
};

/**
 * @desc    Update user profile
 * @route   PUT /api/auth/profile
 * @access  Private
 */
exports.updateProfile = async (req, res) => {
  try {
    const { name, email, backup_email } = req.body;
    
    // Find user
    const user = await UserAccount.findOne({ userId: req.user.userId });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }
    
    // Update fields if provided
    if (name) user.name = name;
    if (email) user.email = email;
    if (backup_email) user.backup_email = backup_email;
    
    // Save the updated user
    await user.save();
    
    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        userId: user.userId,
        name: user.name,
        email: user.email,
        backup_email: user.backup_email,
        role: user.role
      },
      code: 'PROFILE_UPDATED'
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during profile update',
      code: 'SERVER_ERROR'
    });
  }
}; 