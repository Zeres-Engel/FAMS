const UserAccount = require('../database/models/UserAccount');
const ClassSchedule = require('../database/models/ClassSchedule');
const userService = require('../services/userService');
const { asyncHandler } = require('../utils/routeUtils');

// @desc    Get all users with filtering
// @route   GET /api/users
// @access  Private/Admin
exports.getUsers = async (req, res) => {
  try {
    // Tách riêng các tham số đặc biệt
    const { page, limit, sortBy, sortDir, search, className, roles, phone, grade, academicYear, ...otherFilters } = req.query;
    
    // Build sort object
    const sort = {};
    if (sortBy) {
      sort[sortBy] = sortDir === 'desc' ? -1 : 1;
    } else {
      sort.userId = 1; // Default sorting
    }
    
    // Cấu hình options với tất cả các tham số
    const options = {
      page: parseInt(page, 10) || 1,
      limit: parseInt(limit, 10) || 10,
      sort,
      filter: otherFilters, // Tất cả các tham số còn lại được xem là filter
      search,
      className,
      roles,
      phone,
      grade,
      academicYear
    };
    
    console.log("User request query:", req.query);
    console.log("User search options:", JSON.stringify(options, null, 2));
    
    const result = await userService.getUsers(options);
    
    if (result.success) {
      return res.status(200).json({ 
        success: true, 
        data: result.data, 
        count: result.count,
        pagination: result.pagination
      });
    }
    
    return res.status(500).json({
      success: false, 
      message: result.error
    });
  } catch (error) {
    console.error('Error getting users:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Private/Admin
exports.getUser = async (req, res) => {
  try {
    const result = await userService.getUserById(req.params.id, true);
    
    if (result.success) {
      return res.status(200).json({
        success: true,
        data: result.data
      });
    }
    
    return res.status(404).json({
      success: false,
      message: result.error,
      code: result.code
    });
  } catch (error) {
    console.error('Error getting user by ID:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Create user
// @route   POST /api/users
// @access  Private/Admin
exports.createUser = async (req, res) => {
  try {
    const { 
      role, 
      firstName, 
      lastName, 
      email, 
      backup_email,
      phone, 
      gender, 
      dateOfBirth, 
      address,
      // Teacher specific
      major,
      weeklyCapacity,
      // Student specific
      batchYear,
      // Parent specific
      parentNames,
      parentCareers,
      parentPhones,
      parentGenders,
      parentEmails,
      career
    } = req.body;

    // Validate required fields - email không còn là trường bắt buộc
    if (!role || !firstName || !lastName || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
        requiredFields: ['role', 'firstName', 'lastName', 'phone']
      });
    }

    // Set default password (can be changed later)
    const defaultPassword = 'FAMS@2023';

    // Store avatar file if provided
    const avatarFile = req.file;
    let avatarData = null;
    
    if (avatarFile) {
      // We'll process the avatar after user creation
      avatarData = {
        path: avatarFile.path,
        mimetype: avatarFile.mimetype
      };
    }

    // Different logic based on role (ensure first letter capitalized)
    let result;
    
    if (role.toLowerCase() === 'student') {
      result = await createStudent(req, res, defaultPassword, avatarData);
    } else if (role.toLowerCase() === 'teacher') {
      result = await createTeacher(req, res, defaultPassword, avatarData);
    } else if (role.toLowerCase() === 'parent') {
      result = await createParent(req, res, defaultPassword, avatarData);
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid role specified. Must be student, teacher, or parent.'
      });
    }
    
    return result;
  } catch (error) {
    console.error('Error creating user:', error);
    
    // Clean up avatar file if there was an error
    if (req.file && req.file.path) {
      const fs = require('fs');
      try {
        fs.unlinkSync(req.file.path);
      } catch (unlinkError) {
        console.error('Error cleaning up avatar file:', unlinkError);
      }
    }
    
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Helper function to remove Vietnamese accents
const removeVietnameseAccents = (str) => {
  if (!str) return '';
  
  // Mapping of Vietnamese characters with accents to non-accented equivalents
  const map = {
    'à': 'a', 'á': 'a', 'ả': 'a', 'ã': 'a', 'ạ': 'a',
    'ă': 'a', 'ằ': 'a', 'ắ': 'a', 'ẳ': 'a', 'ẵ': 'a', 'ặ': 'a',
    'â': 'a', 'ầ': 'a', 'ấ': 'a', 'ẩ': 'a', 'ẫ': 'a', 'ậ': 'a',
    'đ': 'd',
    'è': 'e', 'é': 'e', 'ẻ': 'e', 'ẽ': 'e', 'ẹ': 'e',
    'ê': 'e', 'ề': 'e', 'ế': 'e', 'ể': 'e', 'ễ': 'e', 'ệ': 'e',
    'ì': 'i', 'í': 'i', 'ỉ': 'i', 'ĩ': 'i', 'ị': 'i',
    'ò': 'o', 'ó': 'o', 'ỏ': 'o', 'õ': 'o', 'ọ': 'o',
    'ô': 'o', 'ồ': 'o', 'ố': 'o', 'ổ': 'o', 'ỗ': 'o', 'ộ': 'o',
    'ơ': 'o', 'ờ': 'o', 'ớ': 'o', 'ở': 'o', 'ỡ': 'o', 'ợ': 'o',
    'ù': 'u', 'ú': 'u', 'ủ': 'u', 'ũ': 'u', 'ụ': 'u',
    'ư': 'u', 'ừ': 'u', 'ứ': 'u', 'ử': 'u', 'ữ': 'u', 'ự': 'u',
    'ỳ': 'y', 'ý': 'y', 'ỷ': 'y', 'ỹ': 'y', 'ỵ': 'y',
    'À': 'A', 'Á': 'A', 'Ả': 'A', 'Ã': 'A', 'Ạ': 'A',
    'Ă': 'A', 'Ằ': 'A', 'Ắ': 'A', 'Ẳ': 'A', 'Ẵ': 'A', 'Ặ': 'A',
    'Â': 'A', 'Ầ': 'A', 'Ấ': 'A', 'Ẩ': 'A', 'Ẫ': 'A', 'Ậ': 'A',
    'Đ': 'D',
    'È': 'E', 'É': 'E', 'Ẻ': 'E', 'Ẽ': 'E', 'Ẹ': 'E',
    'Ê': 'E', 'Ề': 'E', 'Ế': 'E', 'Ể': 'E', 'Ễ': 'E', 'Ệ': 'E',
    'Ì': 'I', 'Í': 'I', 'Ỉ': 'I', 'Ĩ': 'I', 'Ị': 'I',
    'Ò': 'O', 'Ó': 'O', 'Ỏ': 'O', 'Õ': 'O', 'Ọ': 'O',
    'Ô': 'O', 'Ồ': 'O', 'Ố': 'O', 'Ổ': 'O', 'Ỗ': 'O', 'Ộ': 'O',
    'Ơ': 'O', 'Ờ': 'O', 'Ớ': 'O', 'Ở': 'O', 'Ỡ': 'O', 'Ợ': 'O',
    'Ù': 'U', 'Ú': 'U', 'Ủ': 'U', 'Ũ': 'U', 'Ụ': 'U',
    'Ư': 'U', 'Ừ': 'U', 'Ứ': 'U', 'Ử': 'U', 'Ữ': 'U', 'Ự': 'U',
    'Ỳ': 'Y', 'Ý': 'Y', 'Ỷ': 'Y', 'Ỹ': 'Y', 'Ỵ': 'Y'
  };
  
  return str.replace(/[^\u0000-\u007E]/g, char => map[char] || char);
};

// Helper function to create student
const createStudent = async (req, res, defaultPassword, avatarData) => {
  try {
    const { 
      firstName, 
      lastName, 
      email, // Email nhập vào sẽ được sử dụng làm backup_email
      backup_email,
      phone, 
      gender, 
      dateOfBirth, 
      address,
      parentNames,
      parentCareers,
      parentPhones,
      parentGenders,
      parentEmails
    } = req.body;

    // Normalize firstName and lastName by removing accents
    const normalizedFirstName = removeVietnameseAccents(firstName);
    const normalizedLastName = removeVietnameseAccents(lastName);

    const UserAccount = require('../database/models/UserAccount');
    const Student = require('../database/models/Student');
    const Parent = require('../database/models/Parent');
    const ParentStudent = require('../database/models/ParentStudent');
    const Batch = require('../database/models/Batch');
    const Class = require('../database/models/Class');

    // 1. Get current year for batch
    const currentYear = new Date().getFullYear();
    
    // 2. Find or create batch based on current year
    const batch = await Batch.findOrCreateByStartYear(currentYear);
    
    // 3. First create a temporary student object to get a student ID
    const tempStudent = new Student({
      firstName,
      lastName,
      fullName: `${lastName} ${firstName}`,
      gender: typeof gender === 'string' ? gender : (gender === true || gender === 'true' ? 'Male' : 'Female'),
      batchId: batch.batchId
    });
    
    // Get the next available studentId without saving yet
    let newStudentId;
    
    // Get highest studentId
    const maxStudent = await Student.findOne().sort('-studentId');
    newStudentId = maxStudent ? parseInt(maxStudent.studentId) + 1 : 1;
    
    // 4. Now create the userId based on the new format: {firstName}{lastName initials}st{batchId}{studentId}
    const lastNameInitials = normalizedLastName.split(' ')
      .map(part => part.charAt(0).toLowerCase())
      .join('');
    
    const userId = `${normalizedFirstName.toLowerCase()}${lastNameInitials}st${batch.batchId}${newStudentId}`;
    
    // 5. Check if userId already exists
    const userExists = await UserAccount.findOne({ userId });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'User ID already exists',
        userId
      });
    }
    
    // 6. Create new UserAccount
    const studentUsername = userId;
    const user = await UserAccount.create({
      userId,
      username: studentUsername,
      email: email || `${userId}@fams.edu.vn`, // Default email if not provided
      backup_email: backup_email || null,
      password: defaultPassword,
      role: 'student'
    });
    
    // 7. Now create the actual student with the user ID
    const student = await Student.create({
      userId,
      studentId: newStudentId,
      firstName,
      lastName,
      fullName: `${lastName} ${firstName}`, // Vietnamese format: lastName first
      gender: typeof gender === 'string' ? gender : (gender === true || gender === 'true' ? 'Male' : 'Female'),
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
      address,
      phone: phone ? phone.toString() : '',
      batchId: batch.batchId,
      batchYear: batch.startYear,
      enrollmentDate: new Date()
    });
    
    // 8. Process parents if provided
    let createdParents = [];
    if (parentNames && parentNames.length > 0 && Array.isArray(parentNames)) {
      // Process each parent
      for (let i = 0; i < parentNames.length; i++) {
        if (!parentNames[i]) continue; // Skip if name not provided
        
        const parentName = parentNames[i];
        const nameParts = parentName.split(' ');
        
        // Extract first and last name
        const parentFirstName = nameParts.length > 1 ? nameParts.pop() : parentName;
        const parentLastName = nameParts.length > 0 ? nameParts.join(' ') : '';
        
        // Normalize parent names
        const normalizedParentFirstName = removeVietnameseAccents(parentFirstName);
        const normalizedParentLastName = removeVietnameseAccents(parentLastName || '');
        
        // Create parent userId: {firstName}{lastNameInitials}p{childStudentId}
        const parentLastNameInitials = normalizedParentLastName.split(' ')
          .map(part => part.charAt(0).toLowerCase())
          .join('');
        
        const parentUserId = `${normalizedParentFirstName.toLowerCase()}${parentLastNameInitials}p${newStudentId}${i+1}`;
        
        // Check if parent user already exists
        const parentUserExists = await UserAccount.findOne({ userId: parentUserId });
        
        if (!parentUserExists) {
          // Create parent user account
          const parentUser = await UserAccount.create({
            userId: parentUserId,
            username: parentUserId,
            email: (parentEmails && parentEmails[i]) || `${parentUserId}@fams.edu.vn`,
            password: defaultPassword,
            role: 'parent'
          });
          
          // Create parent record
          const parent = await Parent.create({
            userId: parentUserId,
            firstName: parentFirstName,
            lastName: parentLastName || '',
            fullName: parentName,
            gender: (parentGenders && parentGenders[i]) || 'Unknown',
            phone: (parentPhones && parentPhones[i]) || '',
            career: (parentCareers && parentCareers[i]) || ''
          });
          
          // Link parent to student
          await ParentStudent.create({
            parentId: parentUserId,
            studentId: student.userId,
            relationship: i === 0 ? 'Father' : (i === 1 ? 'Mother' : 'Guardian')
          });
          
          // Add to student's parentIds
          if (!student.parentIds) student.parentIds = [];
          student.parentIds.push(parentUserId);
          
          createdParents.push({
            userId: parentUserId,
            name: parentName,
            email: (parentEmails && parentEmails[i]) || `${parentUserId}@fams.edu.vn`,
            phone: (parentPhones && parentPhones[i]) || ''
          });
        }
      }
      
      // Save updated student with parentIds
      if (student.parentIds && student.parentIds.length > 0) {
        await student.save();
      }
    }
    
    // 9. Process avatar if provided
    if (avatarData) {
      const fs = require('fs');
      const path = require('path');
      const sharp = require('sharp');
      
      try {
        // Define the avatar directory based on role
        const rootUploadDir = path.join(__dirname, '../public/avatars');
        const roleDir = path.join(rootUploadDir, 'student');
        
        // Ensure directory exists
        if (!fs.existsSync(roleDir)) {
          fs.mkdirSync(roleDir, { recursive: true });
        }
        
        // Process image with sharp
        const targetPath = path.join(roleDir, `${userId}.jpg`);
        
        // Optimize and resize image to 400x400
        await sharp(avatarData.path)
          .resize(400, 400, { fit: 'cover' })
          .jpeg({ quality: 80 })
          .toFile(targetPath);
        
        // Clean up the temp file
        fs.unlinkSync(avatarData.path);
        
        // Get domain from request for URL
        const protocol = req.headers['x-forwarded-proto'] || 'http';
        const host = req.headers.host || 'fams.io.vn';
        const avatarUrl = `${protocol}://${host}/avatars/student/${userId}.jpg`;
        
        // Update user with avatar URL
        user.avatar = avatarUrl;
        await user.save();
      } catch (avatarError) {
        console.error('Error processing avatar:', avatarError);
        // Continue with user creation even if avatar processing fails
      }
    }
    
    res.status(201).json({
      success: true,
      message: 'Student created successfully',
      data: {
        user,
        student,
        batch,
        parents: createdParents
      }
    });
  } catch (error) {
    console.error('Error creating student:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Helper function to create teacher
const createTeacher = async (req, res, defaultPassword, avatarData) => {
  try {
    const {
      firstName,
      lastName,
      email,
      backup_email,
      phone,
      gender,
      dateOfBirth,
      address,
      major,
      weeklyCapacity,
      degree
    } = req.body;

    // Normalize firstName and lastName by removing accents
    const normalizedFirstName = removeVietnameseAccents(firstName);
    const normalizedLastName = removeVietnameseAccents(lastName);

    const UserAccount = require('../database/models/UserAccount');
    const Teacher = require('../database/models/Teacher');

    // Get the next available teacherId
    let newTeacherId;
    const maxTeacher = await Teacher.findOne().sort('-teacherId');
    newTeacherId = maxTeacher ? parseInt(maxTeacher.teacherId) + 1 : 1;

    // Create the userId based on the format: {firstName}{lastName initials}tc{teacherId}
    const lastNameInitials = normalizedLastName.split(' ')
      .map(part => part.charAt(0).toLowerCase())
      .join('');

    const userId = `${normalizedFirstName.toLowerCase()}${lastNameInitials}tc${newTeacherId}`;

    // Check if userId already exists
    const userExists = await UserAccount.findOne({ userId });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'User ID already exists',
        userId
      });
    }

    // Create user account
    const teacherUsername = userId;
    const user = await UserAccount.create({
      userId,
      username: teacherUsername,
      email: email || `${userId}@fams.edu.vn`, // Default email if not provided
      backup_email: backup_email || null,
      password: defaultPassword,
      role: 'teacher'
    });

    // Create teacher record
    const teacher = await Teacher.create({
      userId,
      teacherId: newTeacherId,
      firstName,
      lastName,
      fullName: `${lastName} ${firstName}`, // Vietnamese format: lastName first
      gender: typeof gender === 'string' ? gender : (gender === true || gender === 'true' ? 'Male' : 'Female'),
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
      address,
      phone: phone ? phone.toString() : '',
      major: major || '',
      weeklyCapacity: weeklyCapacity || 40,
      degree: degree || null,
      joinDate: new Date()
    });

    // Process avatar if provided
    if (avatarData) {
      const fs = require('fs');
      const path = require('path');
      const sharp = require('sharp');
      
      try {
        // Define the avatar directory based on role
        const rootUploadDir = path.join(__dirname, '../public/avatars');
        const roleDir = path.join(rootUploadDir, 'teacher');
        
        // Ensure directory exists
        if (!fs.existsSync(roleDir)) {
          fs.mkdirSync(roleDir, { recursive: true });
        }
        
        // Process image with sharp
        const targetPath = path.join(roleDir, `${userId}.jpg`);
        
        // Optimize and resize image to 400x400
        await sharp(avatarData.path)
          .resize(400, 400, { fit: 'cover' })
          .jpeg({ quality: 80 })
          .toFile(targetPath);
        
        // Clean up the temp file
        fs.unlinkSync(avatarData.path);
        
        // Get domain from request for URL
        const protocol = req.headers['x-forwarded-proto'] || 'http';
        const host = req.headers.host || 'fams.io.vn';
        const avatarUrl = `${protocol}://${host}/avatars/teacher/${userId}.jpg`;
        
        // Update user with avatar URL
        user.avatar = avatarUrl;
        await user.save();
      } catch (avatarError) {
        console.error('Error processing avatar:', avatarError);
        // Continue with user creation even if avatar processing fails
      }
    }

    res.status(201).json({
      success: true,
      message: 'Teacher created successfully',
      data: {
        user,
        teacher
      }
    });
  } catch (error) {
    console.error('Error creating teacher:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Helper function to create parent
const createParent = async (req, res, defaultPassword, avatarData) => {
  try {
    const {
      firstName,
      lastName,
      email,
      backup_email,
      phone,
      gender,
      dateOfBirth,
      address,
      career,
      childrenIds
    } = req.body;

    // Normalize firstName and lastName by removing accents
    const normalizedFirstName = removeVietnameseAccents(firstName);
    const normalizedLastName = removeVietnameseAccents(lastName);

    const UserAccount = require('../database/models/UserAccount');
    const Parent = require('../database/models/Parent');
    const Student = require('../database/models/Student');
    const ParentStudent = require('../database/models/ParentStudent');

    // Get the next available parentId (used for ID generation)
    let newParentId;
    const maxParent = await Parent.findOne().sort('-parentId');
    newParentId = maxParent ? parseInt(maxParent.parentId) + 1 : 1;

    // Create the userId based on the format: {firstName}{lastName initials}pt{parentId}
    const lastNameInitials = normalizedLastName.split(' ')
      .map(part => part.charAt(0).toLowerCase())
      .join('');

    const userId = `${normalizedFirstName.toLowerCase()}${lastNameInitials}pt${newParentId}`;

    // Check if userId already exists
    const userExists = await UserAccount.findOne({ userId });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'User ID already exists',
        userId
      });
    }

    // Create user account
    const parentUsername = userId;
    const user = await UserAccount.create({
      userId,
      username: parentUsername,
      email: email || `${userId}@fams.edu.vn`, // Default email if not provided
      backup_email: backup_email || null,
      password: defaultPassword,
      role: 'parent'
    });

    // Create parent record
    const parent = await Parent.create({
      userId,
      parentId: newParentId,
      firstName,
      lastName,
      fullName: `${lastName} ${firstName}`,
      gender: typeof gender === 'string' ? gender : (gender === true || gender === 'true' ? 'Male' : 'Female'),
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
      address,
      phone: phone ? phone.toString() : '',
      career: career || ''
    });

    // Link to children if provided
    const linkedChildren = [];
    if (childrenIds && Array.isArray(childrenIds) && childrenIds.length > 0) {
      for (const childId of childrenIds) {
        // Check if student exists
        const student = await Student.findOne({ 
          $or: [
            { studentId: childId },
            { userId: childId }
          ]
        });

        if (student) {
          // Create parent-student relationship
          await ParentStudent.create({
            parentId: parent.userId,
            studentId: student.userId,
            relationship: 'Parent' // Default relationship
          });

          // Add parent to student's parentIds if needed
          if (!student.parentIds) student.parentIds = [];
          if (!student.parentIds.includes(parent.userId)) {
            student.parentIds.push(parent.userId);
            await student.save();
          }

          linkedChildren.push({
            studentId: student.studentId,
            userId: student.userId,
            name: student.fullName
          });
        }
      }
    }

    // Process avatar if provided
    if (avatarData) {
      const fs = require('fs');
      const path = require('path');
      const sharp = require('sharp');
      
      try {
        // Define the avatar directory based on role
        const rootUploadDir = path.join(__dirname, '../public/avatars');
        const roleDir = path.join(rootUploadDir, 'parent');
        
        // Ensure directory exists
        if (!fs.existsSync(roleDir)) {
          fs.mkdirSync(roleDir, { recursive: true });
        }
        
        // Process image with sharp
        const targetPath = path.join(roleDir, `${userId}.jpg`);
        
        // Optimize and resize image to 400x400
        await sharp(avatarData.path)
          .resize(400, 400, { fit: 'cover' })
          .jpeg({ quality: 80 })
          .toFile(targetPath);
        
        // Clean up the temp file
        fs.unlinkSync(avatarData.path);
        
        // Get domain from request for URL
        const protocol = req.headers['x-forwarded-proto'] || 'http';
        const host = req.headers.host || 'fams.io.vn';
        const avatarUrl = `${protocol}://${host}/avatars/parent/${userId}.jpg`;
        
        // Update user with avatar URL
        user.avatar = avatarUrl;
        await user.save();
      } catch (avatarError) {
        console.error('Error processing avatar:', avatarError);
        // Continue with user creation even if avatar processing fails
      }
    }

    res.status(201).json({
      success: true,
      message: 'Parent created successfully',
      data: {
        user,
        parent,
        children: linkedChildren
      }
    });
  } catch (error) {
    console.error('Error creating parent:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private/Admin
exports.updateUser = async (req, res) => {
  try {
    const user = await UserAccount.findOneAndUpdate(
      { userId: req.params.id },
      req.body,
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
exports.deleteUser = async (req, res) => {
  try {
    // Sử dụng userService để xóa người dùng và dữ liệu liên quan
    const result = await userService.deleteUser(req.params.id);
    
    if (!result.success) {
      return res.status(result.code === 'USER_NOT_FOUND' ? 404 : 500).json({
        success: false,
        message: result.error,
        code: result.code || 'DELETE_FAILED'
      });
    }
    
    res.status(200).json(result);
  } catch (error) {
    console.error('Error in deleteUser controller:', error);
    res.status(500).json({
      success: false,
      message: error.message,
      code: 'SERVER_ERROR'
    });
  }
};

// @desc    Get teacher schedule
// @route   GET /api/users/teachers/:id/schedule
// @access  Private
exports.getTeacherSchedule = async (req, res) => {
  try {
    const teacherId = req.params.id;
    const Teacher = require('../database/models/Teacher');
    
    // First find the teacher to verify they exist
    const teacher = await Teacher.findOne({ userId: teacherId });
    
    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy giáo viên'
      });
    }
    
    // Get current semester - this would typically come from your settings or semester service
    const Semester = require('../database/models/Semester');
    const currentSemester = await Semester.findOne().sort('-semesterId').limit(1);
    
    if (!currentSemester) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy học kỳ hiện tại'
      });
    }
    
    // Find schedules for the teacher in the current semester
    const schedules = await ClassSchedule.find({ 
      teacherId: teacher.teacherId,
      semesterId: currentSemester.semesterId
    }).populate('subject').populate('classroom').populate('class').populate('semester');
    
    res.status(200).json({
      success: true,
      data: schedules
    });
  } catch (error) {
    console.error('Error getting teacher schedule:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Helper function to determine grade name based on batch year
function getGradeNameFromBatchYear(startYear, endYear) {
  const currentYear = new Date().getFullYear();
  const yearDiff = currentYear - parseInt(startYear);
  
  // Decide grade name based on year difference
  switch(yearDiff) {
    case 0:
      return "(Lớp 10)";
    case 1:
      return "(Lớp 11)";
    case 2:
      return "(Lớp 12)";
    default:
      return ""; // No specific grade name if outside of high school years
  }
}

// @desc    Get user details based on role
// @route   GET /api/users/details/:id
// @access  Private
exports.getUserDetails = async (req, res) => {
  try {
    const userId = req.params.id;
    
    // Get user account
    const UserAccount = require('../database/models/UserAccount');
    const user = await UserAccount.findOne({ userId });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }
    
    // Get additional details based on role
    const role = user.role.toLowerCase();
    let additionalData = {};
    
    if (role === 'student') {
      const Student = require('../database/models/Student');
      const Batch = require('../database/models/Batch');
      const Class = require('../database/models/Class');
      const RFID = require('../database/models/RFID');
      
      // Get student details
      const student = await Student.findOne({ userId });
      
      if (student) {
        // Get class information
        let classes = [];
        if (student.classIds && student.classIds.length > 0) {
          classes = await Class.find({ classId: { $in: student.classIds } });
        }
        
        // Get batch info
        let batchInfo = null;
        if (student.batchId) {
          batchInfo = await Batch.findOne({ batchId: student.batchId });
        }
        
        // Get RFID info
        const rfid = await RFID.findOne({ UserID: userId });
        
        // Get parents info directly from student document
        const parentInfo = [];
        if (student.parentIds && student.parentIds.length > 0) {
          for (let i = 0; i < student.parentIds.length; i++) {
            const parentUserId = student.parentIds[i];
            const parentData = {
              userId: parentUserId,
              fullName: student.parentNames?.[i] || '',
              phone: student.parentPhones?.[i] || '',
              gender: student.parentGenders?.[i] !== undefined ? 
                (student.parentGenders[i] ? 'Male' : 'Female') : '',
              email: student.parentEmails?.[i] || '',
              career: student.parentCareers?.[i] || ''
            };
            parentInfo.push(parentData);
          }
        }
        
        additionalData = {
          student,
          classes: classes.map(cls => ({
            classId: cls.classId,
            className: cls.className,
            grade: cls.grade,
            academicYear: cls.academicYear,
            homeroomTeacherId: cls.homeroomTeacherId
          })),
          batch: batchInfo,
          rfid: rfid || null,
          parents: parentInfo
        };
      }
    }
    else if (role === 'teacher') {
      const Teacher = require('../database/models/Teacher');
      const Class = require('../database/models/Class');
      const RFID = require('../database/models/RFID');
      
      // Get teacher details
      const teacher = await Teacher.findOne({ userId });
      
      if (teacher) {
        // Get classes
        let teachingClasses = [];
        if (teacher.classIds && teacher.classIds.length > 0) {
          teachingClasses = await Class.find({ classId: { $in: teacher.classIds } });
        }
        
        // Get homeroom classes
        const homeroomClasses = await Class.find({ homeroomTeacherId: userId });
        
        // Get RFID info
        const rfid = await RFID.findOne({ UserID: userId });
        
        additionalData = {
          teacher,
          teachingClasses: teachingClasses.map(cls => ({
            classId: cls.classId,
            className: cls.className,
            grade: cls.grade,
            academicYear: cls.academicYear
          })),
          homeroomClasses: homeroomClasses.map(cls => ({
            classId: cls.classId,
            className: cls.className,
            grade: cls.grade,
            academicYear: cls.academicYear
          })),
          rfid: rfid || null
        };
      }
    }
    else if (role === 'parent') {
      const Student = require('../database/models/Student');
      const Class = require('../database/models/Class');
      const RFID = require('../database/models/RFID');
      
      // Find students where parent is listed in parentIds
      const students = await Student.find({ parentIds: userId });
      
      if (students.length > 0) {
        // Get all class IDs from all children
        const allClassIds = [];
        students.forEach(student => {
          if (student.classIds && student.classIds.length > 0) {
            allClassIds.push(...student.classIds);
          }
        });
        
        // Get class information
        const uniqueClassIds = [...new Set(allClassIds)];
        const classes = await Class.find({ classId: { $in: uniqueClassIds } });
        
        // Get RFID info
        const rfid = await RFID.findOne({ UserID: userId });
        
        // Prepare student details with classes
        const enhancedStudents = await Promise.all(students.map(async (student) => {
          const studentClasses = classes.filter(cls => 
            student.classIds && student.classIds.includes(cls.classId)
          );
          
          // Find relationship and parent index for this student
          let relationship = 'Other';
          let parentIndex = -1;
          
          if (student.parentIds) {
            parentIndex = student.parentIds.indexOf(userId);
            if (parentIndex !== -1) {
              // Determine relationship based on gender
              const parentGender = student.parentGenders?.[parentIndex];
              relationship = parentGender === true ? 'Father' : 
                             parentGender === false ? 'Mother' : 'Other';
            }
          }
          
          return {
            ...student.toObject(),
            classes: studentClasses.map(cls => ({
              classId: cls.classId,
              className: cls.className,
              grade: cls.grade,
              academicYear: cls.academicYear
            })),
            relationship
          };
        }));
        
        // Get academic years from classes
        const academicYears = [...new Set(classes.map(cls => cls.academicYear))];
        
        additionalData = {
          students: enhancedStudents,
          academicYears,
          rfid: rfid || null
        };
      }
    }
    
    return res.status(200).json({
      success: true,
      data: {
        user,
        role: {
          type: role,
          ...additionalData
        }
      }
    });
  } catch (error) {
    console.error('Error getting user details:', error);
    res.status(500).json({
      success: false,
      message: error.message,
      code: 'SERVER_ERROR'
    });
  }
}; 