const fs = require('fs');
const path = require('path');
const multer = require('multer');
const sharp = require('sharp');
const { UserAccount } = require('../database/models');
const asyncHandler = require('../middleware/asyncHandler');

// Ensure root avatars directory exists
const rootUploadDir = path.join(__dirname, '../public/avatars');
if (!fs.existsSync(rootUploadDir)) {
  fs.mkdirSync(rootUploadDir, { recursive: true });
}

// Ensure role-based directories exist
const roles = ['student', 'teacher', 'parent', 'admin'];
roles.forEach(role => {
  const roleDir = path.join(rootUploadDir, role);
  if (!fs.existsSync(roleDir)) {
    fs.mkdirSync(roleDir, { recursive: true });
  }
});

// Configure multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Get user role (default to student if not found)
    const role = (req.user?.role || 'student').toLowerCase();
    // Use role-specific directory
    const roleDir = path.join(rootUploadDir, roles.includes(role) ? role : 'student');
    cb(null, roleDir);
  },
  filename: function (req, file, cb) {
    // Use fixed userId as filename for consistent path
    const userId = req.user.userId;
    cb(null, `${userId}.jpg`);
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
      
      // Process image with sharp directly over the uploaded file - no need for processed version
      const originalFilePath = req.file.path;
      
      // Optimize and resize image to 400x400, overwrite the original file
      await sharp(originalFilePath)
        .resize(400, 400, { fit: 'cover' })
        .jpeg({ quality: 80 })
        .toFile(`${originalFilePath}.temp`);
      
      // Replace original with optimized version
      fs.unlinkSync(originalFilePath);
      fs.renameSync(`${originalFilePath}.temp`, originalFilePath);
      
      // Get user role for path construction
      const userRole = (user.role || 'student').toLowerCase();
      const validRole = roles.includes(userRole) ? userRole : 'student';
      
      // Create role-based relative path
      const relativePath = `/avatars/${validRole}/${user.userId}.jpg`;
      
      // Get domain from request or default domain
      const protocol = req.headers['x-forwarded-proto'] || 'http';
      const host = req.headers.host || 'fams.io.vn';
      const fullAvatarUrl = `${protocol}://${host}${relativePath}`;
      
      // Save full URL to database
      user.avatar = fullAvatarUrl;
      
      try {
        // Make sure to preserve all required fields
        if (!user.username) {
          // If username is missing, set it to userId as a fallback
          user.username = user.userId;
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
            // Map any role value to valid enum values but KEEP LOWERCASE
            const roleMap = {
              'admin': 'admin',
              'teacher': 'teacher',
              'parent': 'parent',
              'student': 'student'
            };
            
            if (user.role && roleMap[user.role.toLowerCase()]) {
              // Keep it lowercase but ensure it's a valid value
              user.role = roleMap[user.role.toLowerCase()];
              console.log(`Setting role to "${user.role}"`);
              needToSaveAgain = true;
            } else {
              // Default to student (lowercase) if role is invalid
              user.role = 'student';
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
  
  // Get user role for path construction
  const userRole = (user.role || 'student').toLowerCase();
  const validRole = roles.includes(userRole) ? userRole : 'student';
  const avatarPath = path.join(rootUploadDir, validRole, `${user.userId}.jpg`);
  
  // Kiểm tra xem avatar có tồn tại trong filesystem không
  const fileExists = fs.existsSync(avatarPath);
  
  // Check if we need to create a default avatar
  if (!user.avatar || !fileExists) {
    // Create URL based on role directory structure even if file doesn't exist yet
    const relativePath = `/avatars/${validRole}/${user.userId}.jpg`;
    const protocol = req.headers['x-forwarded-proto'] || 'http';
    const host = req.headers.host || 'fams.io.vn';
    const avatarUrl = `${protocol}://${host}${relativePath}`;
    
    // Update user's avatar URL in database
    if (!user.avatar) {
      user.avatar = avatarUrl;
      await user.save();
    }
    
    // If avatar doesn't exist in database or file doesn't exist on disk
    if (!fileExists) {
      return res.status(404).json({
        success: false,
        message: 'Người dùng chưa có avatar',
        avatarUrl: avatarUrl, // Return URL even if file doesn't exist yet
        code: 'NO_AVATAR_FILE'
      });
    }
  }
  
  // Get user role for path construction if needed
  let avatarUrl = user.avatar;
  
  // Kiểm tra nếu avatar là URL đầy đủ hoặc đường dẫn tương đối
  if (!avatarUrl.startsWith('http')) {
    // Nếu chỉ là đường dẫn tương đối hoặc không có avatar URL hợp lệ
    // tạo URL dựa trên cấu trúc thư mục role
    const relativePath = `/avatars/${validRole}/${user.userId}.jpg`;
    
    const protocol = req.headers['x-forwarded-proto'] || 'http';
    const host = req.headers.host || 'fams.io.vn';
    avatarUrl = `${protocol}://${host}${relativePath}`;
    
    // Cập nhật lại URL trong database
    user.avatar = avatarUrl;
    await user.save();
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
  
  try {
    // Get user role for path construction
    const userRole = (user.role || 'student').toLowerCase();
    const validRole = roles.includes(userRole) ? userRole : 'student';
    
    // Direct path to user's avatar using userId and role
    const avatarPath = path.join(rootUploadDir, validRole, `${user.userId}.jpg`);
    console.log('Deleting avatar file:', avatarPath);
    
    // Check if avatar file exists before attempting to delete
    if (fs.existsSync(avatarPath)) {
      try {
        fs.unlinkSync(avatarPath);
        console.log(`Successfully deleted avatar file: ${avatarPath}`);
      } catch (unlinkError) {
        console.error(`Error deleting file: ${unlinkError.message}`);
        // Continue processing even if file deletion fails
      }
    } else {
      console.log(`Avatar file does not exist at path: ${avatarPath}`);
      // No need to fail if file doesn't exist, just update database
    }
    
    // Update user in database regardless of whether file existed
    if (user.avatar) {
      user.avatar = null;
      await user.save();
    }
    
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