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
    const { page, limit, sortBy, sortDir, search, className, roles, phone, grade, ...otherFilters } = req.query;
    
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
      grade
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

    // Different logic based on role (ensure first letter capitalized)
    if (role.toLowerCase() === 'student') {
      return await createStudent(req, res, defaultPassword);
    } else if (role.toLowerCase() === 'teacher') {
      return await createTeacher(req, res, defaultPassword);
    } else if (role.toLowerCase() === 'parent') {
      return await createParent(req, res, defaultPassword);
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid role specified. Must be student, teacher, or parent.'
      });
    }
  } catch (error) {
    console.error('Error creating user:', error);
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
const createStudent = async (req, res, defaultPassword) => {
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
    const existingUser = await UserAccount.findOne({ userId });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: `User ID ${userId} already exists. Please try with a different name or contact administrator.`,
        code: 'DUPLICATE_USERID'
      });
    }
    
    // 6. Create user account - Email luôn được tạo từ userId (không dấu)
    const user = await UserAccount.create({
      userId,
      username: userId,
      password: defaultPassword,
      email: `${userId}@fams.edu.vn`, // Luôn tạo email từ userId không dấu
      backup_email: email || backup_email, // Sử dụng email nhập vào làm backup_email
      role: 'Student', // Viết hoa chữ cái đầu để phù hợp với enum
      isActive: true
    });

    // 7. Create student record with the ID we determined
    const student = await Student.create({
      studentId: newStudentId,
      userId,
      firstName,
      lastName,
      fullName: `${lastName} ${firstName}`, // Tạo fullName theo định dạng lastName firstName
      email: `${userId}@fams.edu.vn`, // Email luôn khớp với email trong tài khoản
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
      gender: typeof gender === 'string' ? gender : (gender === true || gender === 'true' ? 'Male' : 'Female'),
      address,
      phone,
      batchId: batch.batchId,
      isActive: true,
      // Initialize empty arrays for parent data
      parentIds: [],
      parentNames: [],
      parentCareers: [],
      parentPhones: [],
      parentGenders: [],
      parentEmails: []
    });

    // 8. Create parents if provided
    const createdParents = [];
    if (parentNames && parentNames.length > 0) {
      // Ensure all arrays have same length by filling with undefined/null values
      const maxLength = Math.max(
        parentNames.length,
        (parentCareers || []).length,
        (parentPhones || []).length,
        (parentGenders || []).length,
        (parentEmails || []).length
      );
      
      const normalizedParentNames = [...parentNames];
      const normalizedParentCareers = [...(parentCareers || [])];
      const normalizedParentPhones = [...(parentPhones || [])];
      const normalizedParentGenders = [...(parentGenders || [])];
      const normalizedParentEmails = [...(parentEmails || [])];
      
      // Normalize all arrays to the same length
      while (normalizedParentNames.length < maxLength) normalizedParentNames.push(null);
      while (normalizedParentCareers.length < maxLength) normalizedParentCareers.push(null);
      while (normalizedParentPhones.length < maxLength) normalizedParentPhones.push(null);
      while (normalizedParentGenders.length < maxLength) normalizedParentGenders.push(null);
      while (normalizedParentEmails.length < maxLength) normalizedParentEmails.push(null);
      
      // Create each parent
      for (let i = 0; i < maxLength; i++) {
        if (!normalizedParentNames[i]) continue;
        
        // Parse parent name into first name and last name
        // For Vietnamese names like "Nguyễn Văn A", last name is "Nguyễn Văn", first name is "A"
        const nameParts = normalizedParentNames[i].split(' ');
        const parentFirstName = nameParts.pop() || ''; // Last part is first name
        const parentLastName = nameParts.join(' '); // Rest is last name
        
        // Normalize parent names
        const normalizedParentFirstName = removeVietnameseAccents(parentFirstName);
        const normalizedParentLastName = removeVietnameseAccents(parentLastName);
        
        // Get next available parent ID
        const maxParent = await Parent.findOne().sort('-parentId');
        const newParentId = maxParent ? parseInt(maxParent.parentId) + 1 : 1;
        
        // Generate unique parent userId - new format: {firstName}{lastName-initials}pr{parentId}
        const lastNameInitials = normalizedParentLastName.split(' ')
          .map(part => part.charAt(0).toLowerCase())
          .join('');
        const parentUserId = `${normalizedParentFirstName.toLowerCase()}${lastNameInitials}pr${newParentId}`;
        
        // Check if parentUserId already exists
        const existingParentUser = await UserAccount.findOne({ userId: parentUserId });
        if (existingParentUser) {
          console.warn(`Parent user ID ${parentUserId} already exists. Skipping parent creation.`);
          continue;
        }
        
        // Create parent user account
        const parentUser = await UserAccount.create({
          userId: parentUserId,
          username: parentUserId,
          password: defaultPassword,
          email: `${parentUserId}@fams.edu.vn`,
          backup_email: normalizedParentEmails[i] || null,
          role: 'Parent', // Viết hoa chữ cái đầu để phù hợp với enum
          isActive: true
        });
        
        // Determine parent gender
        let parentGender = normalizedParentGenders[i];
        if (parentGender === undefined || parentGender === null) {
          // Default parent gender if not provided
          parentGender = parentFirstName === 'Thị' ? false : true;
        } else if (typeof parentGender === 'string') {
          parentGender = parentGender.toLowerCase() === 'male' || parentGender === 'true';
        }
        
        // Create parent record
        const parent = await Parent.create({
          parentId: newParentId,
          userId: parentUserId,
          firstName: parentFirstName,
          lastName: parentLastName,
          fullName: `${parentLastName} ${parentFirstName}`, // Tạo fullName theo định dạng lastName firstName
          email: normalizedParentEmails[i] || `${parentUserId}@fams.edu.vn`, // Sử dụng email riêng nếu có hoặc email mặc định
          career: normalizedParentCareers[i] || '',
          phone: normalizedParentPhones[i] || '',
          gender: parentGender
        });
        
        // Create parent-student relation
        await ParentStudent.create({
          parentId: newParentId,
          studentId: newStudentId,
          relationship: 'Other'
        });
        
        // Update student record with parent info
        student.parentIds.push(newParentId.toString());
        student.parentNames.push(normalizedParentNames[i]);
        student.parentCareers.push(normalizedParentCareers[i] || '');
        student.parentPhones.push(normalizedParentPhones[i] || '');
        student.parentGenders.push(parentGender);
        student.parentEmails.push(normalizedParentEmails[i] || `${parentUserId}@fams.edu.vn`);
        
        createdParents.push({
          parentId: newParentId.toString(),
          name: normalizedParentNames[i],
          userId: parentUserId,
          email: normalizedParentEmails[i] || `${parentUserId}@fams.edu.vn`
        });
      }
      
      // Save updated student with parent info
      await student.save();
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
const createTeacher = async (req, res, defaultPassword) => {
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
      major,
      weeklyCapacity,
      degree
    } = req.body;

    // Normalize firstName and lastName by removing accents
    const normalizedFirstName = removeVietnameseAccents(firstName);
    const normalizedLastName = removeVietnameseAccents(lastName);

    const UserAccount = require('../database/models/UserAccount');
    const Teacher = require('../database/models/Teacher');
    const Class = require('../database/models/Class');
    const RFID = require('../database/models/RFID');
    const ClassSchedule = require('../database/models/ClassSchedule');
    const Subject = require('../database/models/Subject');

    // 1. Get highest teacherId
    const maxTeacher = await Teacher.findOne().sort('-teacherId');
    const newTeacherId = maxTeacher ? parseInt(maxTeacher.teacherId) + 1 : 1;
    
    // 2. Generate userId based on name and teacherId
    const userId = `${normalizedFirstName.charAt(0).toLowerCase()}${normalizedLastName.split(' ').map(part => part.charAt(0).toLowerCase()).join('')}${newTeacherId}`;
    
    // 3. Check if userId already exists
    const existingUser = await UserAccount.findOne({ userId });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: `User ID ${userId} already exists. Please try with a different name or contact administrator.`,
        code: 'DUPLICATE_USERID'
      });
    }
    
    // 4. Create user account
    const user = await UserAccount.create({
      userId,
      username: userId,
      password: defaultPassword,
      email: `${userId}@fams.edu.vn`, // Luôn tạo email từ userId không dấu
      backup_email: email || backup_email, // Sử dụng email nhập vào làm backup_email
      role: 'Teacher', // Viết hoa chữ cái đầu để phù hợp với enum
      isActive: true
    });

    // 5. Create teacher record
    const teacher = await Teacher.create({
      teacherId: newTeacherId,
      userId,
      firstName,
      lastName,
      fullName: `${lastName} ${firstName}`,
      email: `${userId}@fams.edu.vn`, // Email luôn khớp với email trong tài khoản
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
      gender: typeof gender === 'string' ? gender : (gender === true || gender === 'true' ? 'Male' : 'Female'),
      address,
      phone,
      major,
      weeklyCapacity: weeklyCapacity || 10,
      degree: degree || null
    });

    // Get classes where teacher is homeroom teacher
    const homeroomClasses = await Class.find({ homeroomTeacherId: teacher.teacherId.toString() });
    
    // Get all classes that the teacher teaches (từ bảng ClassSchedule)
    const teachingSchedules = await ClassSchedule.find({ 
      teacherId: teacher.teacherId 
    }).populate('class').populate('subject');
    
    // Lấy danh sách unique các lớp mà giáo viên dạy
    const teachingClassIds = [...new Set(teachingSchedules.map(schedule => schedule.classId))];
    const teachingClasses = await Class.find({ classId: { $in: teachingClassIds } });
    
    // Tạo danh sách môn học mà giáo viên dạy cho mỗi lớp
    const classSubjects = {};
    teachingSchedules.forEach(schedule => {
      const classId = schedule.classId;
      if (!classSubjects[classId]) {
        classSubjects[classId] = new Set();
      }
      if (schedule.subjectId) {
        classSubjects[classId].add(schedule.subjectId);
      }
    });
    
    // Lấy thông tin chi tiết về các môn học
    const allSubjectIds = [...new Set(teachingSchedules.map(s => s.subjectId))];
    const subjects = await Subject.find({ subjectId: { $in: allSubjectIds } });
    
    // Format classes theo định dạng yêu cầu (không bao gồm subjects)
    const classes = teachingClasses.map(cls => ({
      classId: cls.classId,
      className: cls.className,
      grade: cls.className ? cls.className.match(/^(\d+)/)?.[1] || '' : ''
    }));
    
    // Get RFID info
    const rfid = await RFID.findOne({ UserID: userId });
    
    res.status(201).json({
      success: true,
      message: 'Teacher created successfully',
      data: {
        user,
        teacher,
        classes,
        rfid: rfid || null
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
const createParent = async (req, res, defaultPassword) => {
  try {
    const { 
      firstName, 
      lastName, 
      email, // Email nhập vào sẽ được sử dụng làm backup_email
      parentEmail, // Email riêng cho phụ huynh
      backup_email,
      phone, 
      gender,
      career
    } = req.body;

    // Normalize firstName and lastName by removing accents
    const normalizedFirstName = removeVietnameseAccents(firstName);
    const normalizedLastName = removeVietnameseAccents(lastName);

    const UserAccount = require('../database/models/UserAccount');
    const Parent = require('../database/models/Parent');

    // 1. Get highest parentId
    const maxParent = await Parent.findOne().sort('-parentId');
    const newParentId = maxParent ? parseInt(maxParent.parentId) + 1 : 1;
    
    // 2. Generate userId based on name and parentId - new format: {firstName}{lastName-initials}pr{parentId}
    const lastNameInitials = normalizedLastName.split(' ')
      .map(part => part.charAt(0).toLowerCase())
      .join('');
    const userId = `${normalizedFirstName.toLowerCase()}${lastNameInitials}pr${newParentId}`;
    
    // 3. Check if userId already exists
    const existingUser = await UserAccount.findOne({ userId });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: `User ID ${userId} already exists. Please try with a different name or contact administrator.`,
        code: 'DUPLICATE_USERID'
      });
    }
    
    // 4. Create user account
    const user = await UserAccount.create({
      userId,
      username: userId,
      password: defaultPassword,
      email: `${userId}@fams.edu.vn`, // Luôn tạo email từ userId không dấu
      backup_email: email || backup_email, // Sử dụng email nhập vào làm backup_email
      role: 'Parent', // Viết hoa chữ cái đầu để phù hợp với enum
      isActive: true
    });

    // 5. Create parent record
    const parent = await Parent.create({
      parentId: newParentId,
      userId,
      firstName: firstName,
      lastName: lastName,
      fullName: `${lastName} ${firstName}`, // Tạo fullName theo định dạng lastName firstName
      email: parentEmail || `${userId}@fams.edu.vn`, // Sử dụng email riêng nếu có hoặc email mặc định
      career,
      phone,
      gender: typeof gender === 'string' 
              ? (gender.toLowerCase() === 'male' || gender.toLowerCase() === 'true') 
              : Boolean(gender),
      isActive: true
    });

    res.status(201).json({
      success: true,
      message: 'Parent created successfully',
      data: {
        user,
        parent
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
      const Parent = require('../database/models/Parent');
      const ParentStudent = require('../database/models/ParentStudent');
      const RFID = require('../database/models/RFID');
      
      // Get student details
      const student = await Student.findOne({ userId });
      
      if (student) {
        // Get class info if available
        let classInfo = null;
        if (student.classId) {
          classInfo = await Class.findOne({ classId: student.classId.toString() });
        }
        
        // Get parents
        const parentStudentRelations = await ParentStudent.find({ 
          studentId: student.studentId ? student.studentId.toString() : ""
        });
        const parentIds = parentStudentRelations.map(rel => rel.parentId);
        const parents = await Parent.find({ parentId: { $in: parentIds } });
        
        // Get RFID info
        const rfid = await RFID.findOne({ UserID: userId });
        
        // Tạo bản sao student mà không có các trường dư thừa
        const studentCopy = student.toObject();
        delete studentCopy.parentIds;
        delete studentCopy.parentNames;
        delete studentCopy.parentCareers;
        delete studentCopy.parentPhones;
        delete studentCopy.parentGenders;
        delete studentCopy.parentEmails;
        
        additionalData = {
          student: studentCopy,
          class: classInfo || null,
          parents: parents || [],
          rfid: rfid || null
        };
      }
    } else if (role === 'teacher') {
      const Teacher = require('../database/models/Teacher');
      const Class = require('../database/models/Class');
      const RFID = require('../database/models/RFID');
      const ClassSchedule = require('../database/models/ClassSchedule');
      const Subject = require('../database/models/Subject');
      
      // Get teacher details
      const teacher = await Teacher.findOne({ userId });
      
      if (teacher) {
        // Ensure teacherId is available
        const teacherId = teacher.teacherId ? teacher.teacherId : null;
        
        if (!teacherId) {
          additionalData = {
            teacher,
            classes: [],
            rfid: null
          };
        } else {
          // Get classes where teacher is homeroom teacher
          const homeroomClasses = await Class.find({ homeroomTeacherId: teacherId.toString() });
          
          // Get all classes that the teacher teaches (từ bảng ClassSchedule)
          const teachingSchedules = await ClassSchedule.find({ 
            teacherId: teacherId 
          }).populate('class').populate('subject');
          
          // Lấy danh sách unique các lớp mà giáo viên dạy
          const teachingClassIds = [...new Set(teachingSchedules.map(schedule => schedule.classId))];
          const teachingClasses = await Class.find({ classId: { $in: teachingClassIds } });
          
          // Tạo danh sách môn học mà giáo viên dạy cho mỗi lớp
          const classSubjects = {};
          teachingSchedules.forEach(schedule => {
            const classId = schedule.classId;
            if (!classSubjects[classId]) {
              classSubjects[classId] = new Set();
            }
            if (schedule.subjectId) {
              classSubjects[classId].add(schedule.subjectId);
            }
          });
          
          // Lấy thông tin chi tiết về các môn học
          const allSubjectIds = [...new Set(teachingSchedules.map(s => s.subjectId))];
          const subjects = await Subject.find({ subjectId: { $in: allSubjectIds } });
          
          // Format classes theo định dạng yêu cầu (không bao gồm subjects)
          const classes = teachingClasses.map(cls => ({
            classId: cls.classId,
            className: cls.className,
            grade: cls.className ? cls.className.match(/^(\d+)/)?.[1] || '' : ''
          }));
          
          // Get RFID info
          const rfid = await RFID.findOne({ UserID: userId });
          
          additionalData = {
            teacher,
            classes,
            rfid: rfid || null
          };
        }
      }
    } else if (role === 'parent') {
      const Parent = require('../database/models/Parent');
      const Student = require('../database/models/Student');
      const ParentStudent = require('../database/models/ParentStudent');
      const Class = require('../database/models/Class');
      const RFID = require('../database/models/RFID');
      
      // Get parent details
      const parent = await Parent.findOne({ userId });
      
      if (parent) {
        // Get parent-student relations
        const relations = await ParentStudent.find({ parentId: parent.parentId ? parent.parentId.toString() : "" });
        
        // Get students
        const studentIds = relations.map(rel => rel.studentId);
        const students = await Student.find({ studentId: { $in: studentIds } });
        
        // Get class info for each student
        const enhancedStudents = await Promise.all(students.map(async (student) => {
          let classInfo = null;
          if (student.classId) {
            classInfo = await Class.findOne({ classId: student.classId.toString() });
          }
          
          return {
            ...student.toObject(),
            className: classInfo ? classInfo.className : null,
            relationship: relations.find(r => r.studentId && student.studentId && 
                                          r.studentId.toString() === student.studentId.toString())?.relationship || 'Other'
          };
        }));
        
        // Get RFID info
        const rfid = await RFID.findOne({ UserID: userId });
        
        additionalData = {
          parent,
          students: enhancedStudents || [],
          relations,
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