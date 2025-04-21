const fs = require('fs');
const path = require('path');
const multer = require('multer');
const sharp = require('sharp');
const { UserAccount } = require('../database/models');
const asyncHandler = require('../middleware/asyncHandler');

// Ensure avatars directory exists
const uploadDir = path.join(__dirname, '../public/avatars');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Use userId as filename + timestamp to avoid overwriting
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const userId = req.user.userId;
    const fileExt = path.extname(file.originalname);
    
    cb(null, `${userId}-${uniqueSuffix}${fileExt}`);
  }
});

// Filter for image files only
const fileFilter = (req, file, cb) => {
  // Accept images only
  if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
    return cb(new Error('Chỉ chấp nhận file hình ảnh!'), false);
  }
  cb(null, true);
};

// Configure upload
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: fileFilter
});

/**
 * @desc    Upload avatar for current user
 * @route   POST /api/avatar/upload
 * @access  Private
 */
exports.uploadAvatar = [
  // Use multer as middleware for single file upload with field name 'avatar'
  upload.single('avatar'),
  
  asyncHandler(async (req, res) => {
    // If file upload fails, multer will throw an error
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng upload một file hình ảnh',
        code: 'NO_FILE_UPLOADED'
      });
    }

    try {
      console.log("Avatar upload request user:", {
        userId: req.user?.userId,
        role: req.user?.role
      });
      
      // Find user and ensure we get all fields, not just userId
      const user = await UserAccount.findOne({ userId: req.user.userId });
      
      if (!user) {
        // Remove uploaded file if user not found
        if (req.file.path && fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
        
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy người dùng',
          code: 'USER_NOT_FOUND'
        });
      }
      
      console.log("Found user in database:", {
        userId: user.userId,
        username: user.username, // Make sure username exists
        role: user.role
      });
      
      // Process image with sharp
      const originalFilePath = req.file.path;
      const processedFilePath = originalFilePath.replace(/\.[^/.]+$/, '') + '_processed.jpg';
      
      // Optimize and resize image to 400x400
      await sharp(originalFilePath)
        .resize(400, 400, { fit: 'cover' })
        .jpeg({ quality: 80 })
        .toFile(processedFilePath);
      
      // Delete original file after processing
      if (fs.existsSync(originalFilePath)) {
        fs.unlinkSync(originalFilePath);
      }
      
      // Delete old avatar if exists
      if (user.avatar) {
        const oldAvatarPath = path.join(__dirname, '../public', user.avatar.replace(/^\//, ''));
        
        if (fs.existsSync(oldAvatarPath)) {
          fs.unlinkSync(oldAvatarPath);
        }
      }
      
      // Update user with new avatar path
      // Tạo cả đường dẫn tương đối và URL đầy đủ
      const relativePath = '/avatars/' + path.basename(processedFilePath);
      
      // Lấy domain từ request hoặc domain mặc định
      const protocol = req.headers['x-forwarded-proto'] || 'http';
      const host = req.headers.host || 'fams.io.vn';
      const fullAvatarUrl = `${protocol}://${host}${relativePath}`;
      
      // Lưu URL đầy đủ vào database thay vì chỉ đường dẫn tương đối
      user.avatar = fullAvatarUrl;
      
      try {
        // Make sure to preserve all required fields
        if (!user.username) {
          // If username is missing, set it to userId as a fallback
          user.username = user.userId;
        }
        
        // Ensure role is capitalized to match enum values
        if (user.role && typeof user.role === 'string') {
          const correctRole = user.role.charAt(0).toUpperCase() + user.role.slice(1).toLowerCase();
          user.role = correctRole;
        }
        
        await user.save();
      } catch (saveError) {
        console.error("Error saving user:", saveError);
        // Try to handle validation errors
        if (saveError.name === 'ValidationError') {
          console.log("Validation error details:", saveError.errors);
          
          // Fix common validation errors
          let needToSaveAgain = false;
          
          // Fix username
          if (saveError.errors && saveError.errors.username) {
            console.log("Fixing missing username");
            user.username = user.userId; // Use userId as username
            needToSaveAgain = true;
          }
          
          // Fix role enum
          if (saveError.errors && saveError.errors.role) {
            console.log("Fixing role validation error");
            // Map any role value to valid enum values
            const roleMap = {
              'admin': 'Admin',
              'teacher': 'Teacher',
              'parent': 'Parent',
              'student': 'Student'
            };
            
            if (user.role && roleMap[user.role.toLowerCase()]) {
              user.role = roleMap[user.role.toLowerCase()];
              console.log(`Converting role to "${user.role}"`);
              needToSaveAgain = true;
            } else {
              // Default to Student if role is invalid
              user.role = 'Student';
              needToSaveAgain = true;
            }
          }
          
          // Try to save again with fixes
          if (needToSaveAgain) {
            await user.save();
          } else {
            throw saveError; // Re-throw if fixes didn't help
          }
        } else {
          throw saveError; // Re-throw if it's not a validation error
        }
      }
      
      res.json({
        success: true,
        message: 'Avatar đã được tải lên thành công',
        data: {
          userId: user.userId,
          avatar: user.avatar,
          avatarUrl: user.avatar // Sử dụng URL đã lưu trong DB
        },
        code: 'AVATAR_UPLOADED'
      });
    } catch (error) {
      // Clean up uploaded file in case of error
      if (req.file && req.file.path && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      
      console.error('Avatar upload error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server trong quá trình upload avatar',
        error: error.message,
        code: 'SERVER_ERROR'
      });
    }
  })
];

/**
 * @desc    Get avatar for a user
 * @route   GET /api/avatar/:userId
 * @access  Public
 */
exports.getAvatar = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  
  // Find user
  const user = await UserAccount.findOne({ userId });
  
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'Không tìm thấy người dùng',
      code: 'USER_NOT_FOUND'
    });
  }
  
  if (!user.avatar) {
    return res.status(404).json({
      success: false,
      message: 'Người dùng chưa có avatar',
      code: 'NO_AVATAR'
    });
  }
  
  // Kiểm tra nếu avatar là URL đầy đủ hoặc đường dẫn tương đối
  let avatarUrl = user.avatar;
  
  // Nếu chỉ là đường dẫn tương đối (bắt đầu bằng /), thêm domain vào
  if (user.avatar.startsWith('/')) {
    const protocol = req.headers['x-forwarded-proto'] || 'http';
    const host = req.headers.host || 'fams.io.vn';
    avatarUrl = `${protocol}://${host}${user.avatar}`;
  }
  
  res.json({
    success: true,
    data: {
      userId: user.userId,
      avatar: user.avatar,
      avatarUrl: avatarUrl
    },
    code: 'AVATAR_FOUND'
  });
});

/**
 * @desc    Delete avatar for current user
 * @route   DELETE /api/avatar
 * @access  Private
 */
exports.deleteAvatar = asyncHandler(async (req, res) => {
  // Find user
  const user = await UserAccount.findOne({ userId: req.user.userId });
  
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'Không tìm thấy người dùng',
      code: 'USER_NOT_FOUND'
    });
  }
  
  if (!user.avatar) {
    return res.status(404).json({
      success: false,
      message: 'Người dùng chưa có avatar',
      code: 'NO_AVATAR'
    });
  }
  
  try {
    // Trích xuất tên tệp từ URL đầy đủ hoặc đường dẫn tương đối
    let avatarRelativePath = user.avatar;
    
    // Nếu là URL đầy đủ (bắt đầu bằng http:// hoặc https://), trích xuất đường dẫn tương đối
    if (user.avatar.startsWith('http')) {
      const url = new URL(user.avatar);
      avatarRelativePath = url.pathname; // Lấy phần path từ URL
    }
    
    // Xóa dấu / đầu tiên nếu có
    avatarRelativePath = avatarRelativePath.replace(/^\//, '');
    
    // Delete avatar file
    const avatarPath = path.join(__dirname, '../public', avatarRelativePath);
    console.log('Deleting avatar file:', avatarPath);
    
    if (fs.existsSync(avatarPath)) {
      fs.unlinkSync(avatarPath);
    }
    
    // Update user
    user.avatar = null;
    await user.save();
    
    res.json({
      success: true,
      message: 'Avatar đã được xóa thành công',
      code: 'AVATAR_DELETED'
    });
  } catch (error) {
    console.error('Avatar delete error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server trong quá trình xóa avatar',
      error: error.message,
      code: 'SERVER_ERROR'
    });
  }
}); 