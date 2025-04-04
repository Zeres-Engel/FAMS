const User = require('../database/models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

/**
 * Generate JWT tokens (access and refresh)
 * 
 * @param {string} userId - User ID to encode in tokens
 * @returns {Object} Object containing accessToken and refreshToken
 */
const generateTokens = (userId) => {
  // Access token (2 hours)
  const accessToken = jwt.sign({ userId }, process.env.JWT_SECRET || 'secret_key', {
    expiresIn: '2h',
  });
  
  // Refresh token (2 days)
  const refreshToken = jwt.sign({ userId }, process.env.REFRESH_TOKEN_SECRET || 'refresh_secret_key', {
    expiresIn: '2d',
  });
  
  return { accessToken, refreshToken };
};

/**
 * Check and create admin account if needed
 * Ensures there's always an admin user in the system
 */
const ensureAdminExists = async () => {
  try {
    // Check if admin account exists
    const adminUser = await User.findOne({ userId: 'admin' });
    
    if (!adminUser) {
      console.log('Admin account not found, creating new admin user...');
      
      // Create a new admin with password hashed by Node.js
      const admin = new User({
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
        const admin2 = new User({
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
    const { userId, name, email, password, role } = req.body;
    
    // Validate required fields
    if (!userId || !name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields',
        code: 'MISSING_FIELDS'
      });
    }
    
    // Check if user already exists
    const userExists = await User.findOne({ $or: [{ email }, { userId }] });

    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'User already exists',
        code: 'USER_EXISTS'
      });
    }

    // Create user
    const user = await User.create({
      userId,
      name,
      email,
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
 * @desc    Login user & get token
 * @route   POST /api/auth/login
 * @access  Public
 */
exports.login = async (req, res) => {
  try {
    const { userId, password } = req.body;
    
    // Validate required fields
    if (!userId || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both userId and password',
        code: 'MISSING_CREDENTIALS'
      });
    }
    
    console.log('Login attempt:', { userId, passwordProvided: !!password });

    // Check for user by userId with explicit password selection
    const user = await User.findOne({ userId }).select('+password');
    
    console.log('User found:', !!user);
    if (user) {
      console.log('User details:', {
        id: user._id,
        userId: user.userId,
        passwordAvailable: !!user.password,
        passwordLength: user.password?.length
      });
    }

    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Tài khoản không tồn tại. Vui lòng kiểm tra lại.',
        code: 'USER_NOT_FOUND'
      });
    }

    // Double check if password exists
    if (!user.password) {
      // If no password exists, reset it
      console.log('Password missing for user, resetting password...');
      user.password = '1234';
      await user.save();
      console.log('Password reset for user:', user.userId);
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);
    
    console.log('Password match:', isMatch);

    if (!isMatch) {
      return res.status(401).json({ 
        success: false, 
        message: 'Mật khẩu không chính xác. Vui lòng thử lại.',
        code: 'INVALID_PASSWORD'
      });
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user.userId);

    const response = {
      success: true,
      data: {
        userId: user.userId,
        name: user.name,
        email: user.email,
        role: user.role,
        accessToken,
        refreshToken
      },
      code: 'LOGIN_SUCCESS'
    };

    console.log('Sending response:', response);
    res.json(response);
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Lỗi đăng nhập: ' + error.message,
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
    const user = await User.findOne({ userId: decoded.userId });
    
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
        refreshToken: tokens.refreshToken
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
 * @desc    Get current logged in user profile
 * @route   GET /api/auth/me
 * @access  Private
 */
exports.getMe = async (req, res) => {
  try {
    const user = await User.findOne({ userId: req.user.userId });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    // Get additional data based on user role
    let profileData = null;
    if (user.role === 'Student') {
      const Student = require('../database/models/Student');
      profileData = await Student.findOne({ userId: user.userId })
        .select('studentId fullName dateOfBirth gender address phone') // Explicitly select fields
        .populate('classId')
        .populate({
          path: 'classId',
          populate: {
            path: 'homeroomTeacherId',
            model: 'Teacher'
          }
        });
    } else if (user.role === 'Teacher') {
      const Teacher = require('../database/models/Teacher');
      profileData = await Teacher.findOne({ userId: user.userId })
        .select('teacherId fullName dateOfBirth gender address phone major') // Explicitly select fields
        .populate('classes');
    } else if (user.role === 'Parent') {
      const Parent = require('../database/models/Parent');
      profileData = await Parent.findOne({ userId: user.userId })
        .select('parentId fullName gender phone career') // Explicitly select fields
        .populate({
          path: 'studentIds',
          populate: {
            path: 'classId',
            model: 'Class'
          }
        });
    }

    res.status(200).json({
      success: true,
      data: {
        userId: user.userId,
        name: user.name,
        email: user.email,
        role: user.role,
        profile: profileData
      },
      code: 'PROFILE_FETCHED'
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({
      success: false,
      message: error.message,
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
    const admin = await User.findOne({ userId: 'admin2' });
    
    if (!admin) {
      // Create admin2 account if it doesn't exist
      const newAdmin = new User({
        userId: 'admin2',
        name: 'Administrator 2',
        email: 'admin2@fams.edu.vn',
        password: '1234',
        role: 'Admin'
      });
      
      await newAdmin.save();
      
      return res.status(201).json({
        success: true,
        message: 'Admin2 account created with default password: 1234',
        code: 'ADMIN_CREATED'
      });
    }
    
    // Reset password
    admin.password = '1234';
    await admin.save();
    
    return res.status(200).json({
      success: true,
      message: 'Admin2 password reset to: 1234',
      code: 'PASSWORD_RESET'
    });
  } catch (error) {
    console.error('Reset admin password error:', error);
    res.status(500).json({
      success: false,
      message: 'Error resetting admin password: ' + error.message,
      code: 'SERVER_ERROR'
    });
  }
}; 