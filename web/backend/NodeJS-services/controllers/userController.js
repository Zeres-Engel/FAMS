const User = require('../database/models/User');
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

    // Different logic based on role
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
      batchYear,
      parentNames,
      parentCareers,
      parentPhones,
      parentGenders
    } = req.body;

    // Normalize firstName and lastName by removing accents
    const normalizedFirstName = removeVietnameseAccents(firstName);
    const normalizedLastName = removeVietnameseAccents(lastName);

    const User = require('../database/models/User');
    const Student = require('../database/models/Student');
    const Parent = require('../database/models/Parent');
    const ParentStudent = require('../database/models/ParentStudent');
    const Batch = require('../database/models/Batch');

    // 1. Check or create batch
    let batch;
    if (batchYear) {
      const [startYear, endYear] = batchYear.split('-').map(year => year.trim());
      
      // Tính batchId theo quy tắc:
      // 2021-2024 -> batchId = 1
      // 2022-2025 -> batchId = 2
      // 2023-2026 -> batchId = 3
      // 2024-2027 -> batchId = 4
      // Công thức: batchId = startYear - 2020
      const batchId = parseInt(startYear) - 2020;
      
      // Check if batch exists with this ID
      batch = await Batch.findOne({ batchId: batchId.toString() });

      // Create batch if it doesn't exist
      if (!batch) {
        const startDate = new Date(`${startYear}-09-01`);
        const endDate = new Date(`${endYear}-06-30`);
        
        const gradeName = getGradeNameFromBatchYear(startYear, endYear);
        
        batch = await Batch.create({
          batchId: batchId.toString(),
          batchName: `Khóa ${startYear}-${endYear} ${gradeName}`,
          startDate,
          endDate,
          isActive: true
        });
      }
    } else {
      return res.status(400).json({
        success: false,
        message: 'Batch year is required for student creation'
      });
    }

    // 2. Cải tiến cách tạo student ID để đảm bảo luôn lấy giá trị lớn nhất
    // Lấy tất cả student ID và tìm giá trị lớn nhất
    const students = await Student.find({}, 'studentId');
    let maxStudentId = 0;
    
    if (students && students.length > 0) {
      // Chuyển đổi tất cả studentId sang số và tìm giá trị lớn nhất
      students.forEach(student => {
        const studentIdAsNum = parseInt(student.studentId);
        if (!isNaN(studentIdAsNum) && studentIdAsNum > maxStudentId) {
          maxStudentId = studentIdAsNum;
        }
      });
    }
    
    const newStudentId = maxStudentId + 1;
    
    // 3. Generate userId for student - now using normalized names
    const userId = Student.generateUserId(normalizedFirstName, normalizedLastName, batch.batchId, newStudentId);
    
    // 4. Create user account - Email luôn được tạo từ userId (không dấu)
    const user = await User.create({
      userId,
      username: userId,
      password: defaultPassword,
      email: `${userId}@fams.edu.vn`, // Luôn tạo email từ userId không dấu
      backup_email: email || backup_email, // Sử dụng email nhập vào làm backup_email
      role: 'student',
      isActive: true
    });

    // 5. Create student record
    const student = await Student.create({
      studentId: newStudentId.toString(),
      userId,
      firstName,
      lastName,
      email: `${userId}@fams.edu.vn`, // Email luôn khớp với email trong tài khoản
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
      gender: typeof gender === 'string' ? gender : (gender === true || gender === 'true' ? 'Male' : 'Female'),
      address,
      phone,
      batchId: parseInt(batch.batchId),
      isActive: true,
      // Initialize empty arrays for parent data
      parentIds: [],
      parentNames: [],
      parentCareers: [],
      parentPhones: [],
      parentGenders: []
    });

    // 6. Create parents if provided
    const createdParents = [];
    if (parentNames && parentNames.length > 0) {
      for (let i = 0; i < parentNames.length; i++) {
        const parentName = parentNames[i];
        if (!parentName) continue;
        
        // Split parent name into first and last name
        const nameParts = parentName.split(' ');
        const parentFirstName = nameParts.pop();
        const parentLastName = nameParts.join(' ');
        
        // Normalize parent name components
        const normalizedParentFirstName = removeVietnameseAccents(parentFirstName);
        const normalizedParentLastName = removeVietnameseAccents(parentLastName);
        
        // Cải tiến cách tạo parent ID để đảm bảo luôn lấy giá trị lớn nhất
        const parents = await Parent.find({}, 'parentId');
        let maxParentId = 0;
        
        if (parents && parents.length > 0) {
          // Chuyển đổi tất cả parentId sang số và tìm giá trị lớn nhất
          parents.forEach(parent => {
            const parentIdAsNum = parseInt(parent.parentId);
            if (!isNaN(parentIdAsNum) && parentIdAsNum > maxParentId) {
              maxParentId = parentIdAsNum;
            }
          });
        }
        
        const newParentId = maxParentId + 1;
        
        // Generate parent userId using normalized names
        const parentUserId = Parent.generateUserId(normalizedParentFirstName, normalizedParentLastName, newParentId);
        
        // Create parent user account
        await User.create({
          userId: parentUserId,
          username: parentUserId,
          password: defaultPassword,
          email: `${parentUserId}@fams.edu.vn`, // Luôn tạo email từ userId không dấu
          role: 'parent',
          isActive: true
        });
        
        // Create parent record
        const parent = await Parent.create({
          parentId: newParentId.toString(),
          userId: parentUserId,
          firstName: parentFirstName,
          lastName: parentLastName,
          email: `${parentUserId}@fams.edu.vn`, // Luôn sử dụng email được tạo từ userId không dấu
          career: parentCareers && parentCareers[i] ? parentCareers[i] : null,
          phone: parentPhones && parentPhones[i] ? parentPhones[i] : null,
          gender: parentGenders && parentGenders[i] !== undefined 
                  ? (typeof parentGenders[i] === 'string'
                     ? (parentGenders[i].toLowerCase() === 'male' || parentGenders[i].toLowerCase() === 'true')
                     : Boolean(parentGenders[i]))
                  : null,
          isActive: true
        });
        
        // Create parent-student relationship
        await ParentStudent.create({
          parentId: parent.parentId,
          studentId: student.studentId,
          relationship: i === 0 ? 'Father' : i === 1 ? 'Mother' : 'Guardian'
        });
        
        // Update student's parent arrays
        student.parentIds.push(parent.parentId);
        student.parentNames.push(parentName);
        student.parentCareers.push(parent.career);
        student.parentPhones.push(parent.phone);
        student.parentGenders.push(parent.gender);
        
        createdParents.push(parent);
      }
      
      // Save updated student record
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
      weeklyCapacity
    } = req.body;

    // Normalize firstName and lastName by removing accents
    const normalizedFirstName = removeVietnameseAccents(firstName);
    const normalizedLastName = removeVietnameseAccents(lastName);

    const User = require('../database/models/User');
    const Teacher = require('../database/models/Teacher');

    // 1. Cải tiến cách tạo teacher ID để đảm bảo luôn lấy giá trị lớn nhất
    // Lấy tất cả teacher ID và tìm giá trị lớn nhất
    const teachers = await Teacher.find({}, 'teacherId');
    let maxTeacherId = 0;
    
    if (teachers && teachers.length > 0) {
      // Chuyển đổi tất cả teacherId sang số và tìm giá trị lớn nhất
      teachers.forEach(teacher => {
        const teacherIdAsNum = parseInt(teacher.teacherId);
        if (!isNaN(teacherIdAsNum) && teacherIdAsNum > maxTeacherId) {
          maxTeacherId = teacherIdAsNum;
        }
      });
    }
    
    const newTeacherId = maxTeacherId + 1;
    
    // 2. Generate userId for teacher - now using normalized names
    const userId = Teacher.generateUserId(normalizedFirstName, normalizedLastName, newTeacherId);
    
    // 3. Create user account
    const user = await User.create({
      userId,
      username: userId,
      password: defaultPassword,
      email: `${userId}@fams.edu.vn`, // Luôn tạo email từ userId không dấu
      backup_email: email || backup_email, // Sử dụng email nhập vào làm backup_email
      role: 'teacher',
      isActive: true
    });

    // 4. Create teacher record
    const teacher = await Teacher.create({
      teacherId: newTeacherId.toString(),
      userId,
      firstName,
      lastName,
      email: `${userId}@fams.edu.vn`, // Email luôn khớp với email trong tài khoản
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
      gender: typeof gender === 'string' 
              ? (gender.toLowerCase() === 'male' || gender.toLowerCase() === 'true') 
              : Boolean(gender),
      address,
      phone,
      major,
      WeeklyCapacity: weeklyCapacity || 16,
      isActive: true
    });

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
const createParent = async (req, res, defaultPassword) => {
  try {
    const { 
      firstName, 
      lastName, 
      email, // Email nhập vào sẽ được sử dụng làm backup_email
      backup_email,
      phone, 
      gender,
      career
    } = req.body;

    // Normalize firstName and lastName by removing accents
    const normalizedFirstName = removeVietnameseAccents(firstName);
    const normalizedLastName = removeVietnameseAccents(lastName);

    const User = require('../database/models/User');
    const Parent = require('../database/models/Parent');

    // 1. Cải tiến cách tạo parent ID để đảm bảo luôn lấy giá trị lớn nhất
    // Lấy tất cả parent ID và tìm giá trị lớn nhất
    const parents = await Parent.find({}, 'parentId');
    let maxParentId = 0;
    
    if (parents && parents.length > 0) {
      // Chuyển đổi tất cả parentId sang số và tìm giá trị lớn nhất
      parents.forEach(parent => {
        const parentIdAsNum = parseInt(parent.parentId);
        if (!isNaN(parentIdAsNum) && parentIdAsNum > maxParentId) {
          maxParentId = parentIdAsNum;
        }
      });
    }
    
    const newParentId = maxParentId + 1;
    
    // 2. Generate userId for parent - now using normalized names
    const userId = Parent.generateUserId(normalizedFirstName, normalizedLastName, newParentId);
    
    // 3. Create user account
    const user = await User.create({
      userId,
      username: userId,
      password: defaultPassword,
      email: `${userId}@fams.edu.vn`, // Luôn tạo email từ userId không dấu
      backup_email: email || backup_email, // Sử dụng email nhập vào làm backup_email
      role: 'parent',
      isActive: true
    });

    // 4. Create parent record
    const parent = await Parent.create({
      parentId: newParentId.toString(),
      userId,
      firstName: firstName,
      lastName: lastName,
      email: `${userId}@fams.edu.vn`, // Email luôn khớp với email trong tài khoản
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
    const user = await User.findOneAndUpdate(
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
    const User = require('../database/models/User');
    const user = await User.findOne({ userId });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }
    
    // Get additional details based on role
    const role = user.role.toLowerCase();
    let additionalData = null;
    
    if (role === 'student') {
      const Student = require('../database/models/Student');
      const Batch = require('../database/models/Batch');
      const Class = require('../database/models/Class');
      
      // Get student details
      const student = await Student.findOne({ userId });
      
      if (student) {
        // Get batch info
        const batch = await Batch.findOne({ batchId: student.batchId.toString() });
        
        // Get class info if available
        let classInfo = null;
        if (student.classId) {
          classInfo = await Class.findOne({ classId: student.classId.toString() });
        }
        
        additionalData = {
          student,
          batch: batch || null,
          class: classInfo || null
        };
      }
    } 
    else if (role === 'teacher') {
      const Teacher = require('../database/models/Teacher');
      const ClassSchedule = require('../database/models/ClassSchedule');
      
      // Get teacher details
      const teacher = await Teacher.findOne({ userId });
      
      if (teacher) {
        // Get classes taught
        const classes = await ClassSchedule.find({ teacherId: teacher.teacherId })
          .populate('class')
          .distinct('class')
          .lean();
          
        additionalData = {
          teacher,
          classes: classes || []
        };
      }
    } 
    else if (role === 'parent') {
      const Parent = require('../database/models/Parent');
      const ParentStudent = require('../database/models/ParentStudent');
      const Student = require('../database/models/Student');
      
      // Get parent details
      const parent = await Parent.findOne({ userId });
      
      if (parent) {
        // Get associated students
        const studentRelations = await ParentStudent.find({ parentId: parent.parentId });
        const studentIds = studentRelations.map(relation => relation.studentId);
        
        // Fetch student details
        const students = await Student.find({ studentId: { $in: studentIds } });
        
        additionalData = {
          parent,
          students: students || [],
          relations: studentRelations || []
        };
      }
    }
    
    res.status(200).json({
      success: true,
      data: {
        user,
        ...additionalData
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