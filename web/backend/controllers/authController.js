const User = require('../database/models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Generate JWT
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET || 'secret_key', {
    expiresIn: '30d',
  });
};

// Create or update admin user function
const ensureAdminExists = async () => {
  try {
    // Kiểm tra xem tài khoản admin đã tồn tại chưa
    const adminExists = await User.findOne({ userId: 'admin' }).select('+password');
    
    // Nếu admin chưa tồn tại, tạo mới
    if (!adminExists) {
      console.log('Admin account not found, creating new admin account...');
      
      // Tạo tài khoản admin
      const admin = new User({
        userId: 'admin',
        name: 'Administrator',
        email: 'admin@fams.edu.vn',
        password: '1234',  // Mật khẩu sẽ được hash bởi middleware pre-save
        role: 'Admin'
      });
      
      await admin.save();
      console.log('Admin account created successfully!');
    } else {
      console.log('Admin account already exists');
      
      // Chỉ kiểm tra mật khẩu nếu có thể truy xuất mật khẩu
      if (adminExists.password) {
        // Kiểm tra thử mật khẩu '1234' với tài khoản admin
        const isPasswordValid = await adminExists.matchPassword('1234');
        console.log('Is default password valid:', isPasswordValid);
        
        // Nếu mật khẩu không phải là 1234, reset lại
        if (!isPasswordValid) {
          console.log('Resetting admin password to default');
          adminExists.password = '1234'; // Mật khẩu sẽ được hash bởi middleware pre-save
          await adminExists.save();
          console.log('Admin password reset successfully');
        }
      } else {
        console.log('Admin password not accessible, skipping password check');
      }
    }
  } catch (error) {
    console.error('Error managing admin account:', error);
  }
};

// Run this when module loads
ensureAdminExists();

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const { userId, name, email, password, role } = req.body;
    
    // Check if user already exists
    const userExists = await User.findOne({ $or: [{ email }, { userId }] });

    if (userExists) {
      return res.status(400).json({ success: false, message: 'User already exists' });
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
      res.status(201).json({
        success: true,
        data: {
          userId: user.userId,
          name: user.name,
          email: user.email,
          role: user.role,
          token: generateToken(user.userId)
        }
      });
    } else {
      res.status(400).json({ success: false, message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Login user & get token
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { userId, password } = req.body;
    
    console.log('Login attempt:', { userId, passwordProvided: !!password });

    // Check for user by userId
    const user = await User.findOne({ userId }).select('+password');
    
    console.log('User found:', !!user);

    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Tài khoản không tồn tại. Vui lòng kiểm tra lại.' 
      });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);
    
    console.log('Password match:', isMatch);

    if (!isMatch) {
      return res.status(401).json({ 
        success: false, 
        message: 'Mật khẩu không chính xác. Vui lòng thử lại.' 
      });
    }

    const response = {
      success: true,
      data: {
        userId: user.userId,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user.userId)
      }
    };

    console.log('Sending response:', response);
    res.json(response);
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Lỗi đăng nhập: ' + error.message 
    });
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findOne({ userId: req.user.userId });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Get additional data based on user role
    let profileData = null;
    if (user.role === 'Student') {
      const Student = require('../database/models/Student');
      profileData = await Student.findOne({ userId: user.userId });
    } else if (user.role === 'Teacher') {
      const Teacher = require('../database/models/Teacher');
      profileData = await Teacher.findOne({ userId: user.userId });
    } else if (user.role === 'Parent') {
      const Parent = require('../database/models/Parent');
      profileData = await Parent.findOne({ userId: user.userId });
    }

    res.status(200).json({
      success: true,
      data: {
        userId: user.userId,
        name: user.name,
        email: user.email,
        role: user.role,
        profile: profileData
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}; 