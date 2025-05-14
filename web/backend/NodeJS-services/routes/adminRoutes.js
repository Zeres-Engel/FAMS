const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const UserAccount = require('../database/models/UserAccount');
const Student = require('../database/models/Student');
const Teacher = require('../database/models/Teacher');
const Parent = require('../database/models/Parent');
const ParentStudent = require('../database/models/ParentStudent');
const Batch = require('../database/models/Batch');
const batchService = require('../database/batchService');

/**
 * @desc    Create any entity (Student, Teacher, Parent, etc.)
 * @route   POST /api/admin/create
 * @access  Private/Admin
 */
router.post('/create', protect, authorize('Admin', 'admin'), async (req, res) => {
  try {
    const { entityType, userData, entityData } = req.body;
    
    if (!entityType || !entityData) {
      return res.status(400).json({
        success: false,
        message: 'Please provide entityType and entityData',
        code: 'MISSING_FIELDS'
      });
    }
    
    // Generate userData from entityData if not provided
    let userDataToUse = userData;
    
    if (!userDataToUse) {
      // For students, generate userData based on batch and name
      if (entityType.toLowerCase() === 'student') {
        const { firstName, lastName, batchId } = entityData;
        
        if (!firstName || !lastName || !batchId) {
          return res.status(400).json({
            success: false,
            message: 'For auto-generation of user credentials, please provide firstName, lastName, and batchId',
            code: 'MISSING_FIELDS'
          });
        }
        
        // Get batch info
        const batch = await Batch.findOne({ batchId });
        if (!batch) {
          return res.status(404).json({
            success: false,
            message: `Batch with ID ${batchId} not found`,
            code: 'BATCH_NOT_FOUND'
          });
        }
        
        // Generate userId based on batch and student name
        // Format: S{batchStartYear}{FirstLetter of FirstName}{LastName} 
        // Example: S2022JNguyen for a student named John Nguyen in batch starting 2022
        const normalizedLastName = lastName.normalize('NFD').replace(/[\u0300-\u036f]/g, ''); // remove accents
        const firstNameInitial = firstName.charAt(0).toUpperCase();
        
        const userId = `S${batch.startYear}${firstNameInitial}${normalizedLastName}`.replace(/\s+/g, '');
        
        // Check if userId already exists and add number if needed
        let finalUserId = userId;
        let counter = 1;
        let userExists = await UserAccount.findOne({ userId: finalUserId });
        
        while (userExists) {
          finalUserId = `${userId}${counter}`;
          counter++;
          userExists = await UserAccount.findOne({ userId: finalUserId });
        }
        
        // Generate email based on userId
        const email = `${finalUserId.toLowerCase()}@fams.edu.vn`;
        
        userDataToUse = {
          userId: finalUserId,
          name: `${firstName} ${lastName}`,
          email,
          password: '1234'  // Default password
        };
      } else {
        return res.status(400).json({
          success: false,
          message: 'Please provide userData for non-student entities',
          code: 'MISSING_FIELDS'
        });
      }
    } else {
      // Check if user with this userId or email already exists
      const userExists = await User.findOne({ 
        $or: [
          { email: userDataToUse.email },
          { userId: userDataToUse.userId }
        ] 
      });

      if (userExists) {
        return res.status(400).json({
          success: false,
          message: 'User with this userId or email already exists',
          code: 'USER_EXISTS'
        });
      }
    }
    
    // Create user first
    const user = await User.create({
      userId: userDataToUse.userId,
      name: userDataToUse.name || `${entityData.firstName} ${entityData.lastName}`,
      email: userDataToUse.email,
      password: userDataToUse.password || '1234', // Default password if not provided
      role: entityType === 'student' ? 'Student' : 
            entityType === 'teacher' ? 'Teacher' : 
            entityType === 'parent' ? 'Parent' : 'Student',
      backup_email: userDataToUse.backup_email || null
    });
    
    // Based on entityType, create the appropriate entity
    let entity;
    switch (entityType.toLowerCase()) {
      case 'student':
        // Generate studentId if not provided
        if (!entityData.studentId) {
          const lastStudent = await Student.findOne().sort({ studentId: -1 });
          // Convert to number to ensure proper incrementation
          const lastId = lastStudent ? parseInt(lastStudent.studentId) : 0;
          entityData.studentId = lastId + 1;
        }
        
        // Process parents data if provided
        let parentInfo = [];
        let parents = [];
        
        if (entityData.parents && entityData.parents.length > 0) {
          parents = entityData.parents.map(parent => ({
            parentId: parent.parentId,
            relationship: parent.relationship || 'Other',
            isEmergencyContact: parent.isEmergencyContact || false
          }));
          
          // If we have parentInfo data, use it directly
          if (entityData.parentInfo && entityData.parentInfo.length > 0) {
            parentInfo = entityData.parentInfo;
          } 
          // Otherwise, try to fetch parent data from database
          else {
            const parentIds = parents.map(p => p.parentId);
            if (parentIds.length > 0) {
              const parentDetails = await Parent.find({ parentId: { $in: parentIds } });
              
              parentInfo = parents.map(parent => {
                const detail = parentDetails.find(p => p.parentId === parent.parentId);
                if (detail) {
                  return {
                    name: detail.fullName,
                    career: detail.career,
                    phone: detail.phone,
                    gender: detail.gender,
                    relationship: parent.relationship
                  };
                }
                return null;
              }).filter(p => p !== null);
            }
          }
        } 
        // For backward compatibility - handle single parentId
        else if (entityData.parentId) {
          const parentDetail = await Parent.findOne({ parentId: entityData.parentId });
          if (parentDetail) {
            parents = [{
              parentId: entityData.parentId,
              relationship: entityData.relationship || 'Other',
              isEmergencyContact: true
            }];
            
            parentInfo = [{
              name: parentDetail.fullName,
              career: parentDetail.career,
              phone: parentDetail.phone,
              gender: parentDetail.gender,
              relationship: entityData.relationship || 'Other'
            }];
          }
        }
        
        entity = await Student.create({
          ...entityData,
          userId: user.userId,
          fullName: `${entityData.firstName} ${entityData.lastName}`,
          firstName: entityData.firstName,
          lastName: entityData.lastName,
          parents,
          parentInfo,
          email: entityData.email,
          gender: typeof entityData.gender === 'string' ? 
                  (entityData.gender === 'Male' ? 'Male' : 'Female') : 
                  (entityData.gender === true ? 'Male' : 'Female')
        });
        
        // Create parent-student relationships in ParentStudent collection
        if (parents.length > 0) {
          const parentStudentRelations = parents.map(parent => ({
            ParentID: parent.parentId,
            StudentID: entity.studentId
          }));
          
          await ParentStudent.insertMany(parentStudentRelations);
          
          // Also update parent documents to include this student
          await Promise.all(parents.map(parent => 
            Parent.findOneAndUpdate(
              { parentId: parent.parentId },
              { $addToSet: { studentIds: entity.studentId } }
            )
          ));
        }
        break;
        
      case 'teacher':
        // Generate teacherId if not provided
        if (!entityData.teacherId) {
          // First, count total teachers to determine the base ID
          const teacherCount = await Teacher.countDocuments();
          let newTeacherId = teacherCount + 1;
          
          // Check if this teacherId already exists
          let teacherExists = await Teacher.findOne({ teacherId: newTeacherId.toString() });
          
          // If exists, keep incrementing until we find an available ID
          while (teacherExists) {
            newTeacherId++;
            teacherExists = await Teacher.findOne({ teacherId: newTeacherId.toString() });
          }
          
          entityData.teacherId = newTeacherId.toString();
          console.log(`Generated new teacherId: ${entityData.teacherId}`);
        }
        
        // Chuyển đổi gender từ string sang boolean nếu cần
        if (entityData.gender !== undefined) {
          entityData.gender = typeof entityData.gender === 'string'
            ? (entityData.gender.toLowerCase() === 'male' || entityData.gender.toLowerCase() === 'true')
            : Boolean(entityData.gender);
        }
        
        entity = await Teacher.create({
          ...entityData,
          userId: user.userId,
          fullName: `${entityData.firstName} ${entityData.lastName}`
        });
        break;
        
      case 'parent':
        // Generate parentId if not provided
        if (!entityData.parentId) {
          const lastParent = await Parent.findOne().sort({ parentId: -1 });
          entityData.parentId = lastParent ? lastParent.parentId + 1 : 3000;
        }
        
        // Chuyển đổi gender từ string sang boolean nếu cần
        if (entityData.gender !== undefined) {
          entityData.gender = typeof entityData.gender === 'string'
            ? (entityData.gender.toLowerCase() === 'male' || entityData.gender.toLowerCase() === 'true')
            : Boolean(entityData.gender);
        }
        
        entity = await Parent.create({
          ...entityData,
          userId: user.userId,
          fullName: `${entityData.firstName} ${entityData.lastName}`
        });
        
        // If children/students are specified, create relationships
        if (entityData.studentIds && entityData.studentIds.length > 0) {
          const parentStudentRelations = entityData.studentIds.map(studentId => ({
            ParentID: entity.parentId,
            StudentID: studentId
          }));
          
          await ParentStudent.insertMany(parentStudentRelations);
          
          // Update student documents to include this parent
          await Promise.all(entityData.studentIds.map(studentId => 
            Student.findOneAndUpdate(
              { studentId },
              { 
                $addToSet: { 
                  parents: {
                    parentId: entity.parentId,
                    relationship: 'Other'
                  } 
                }
              }
            )
          ));
        }
        break;
        
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid entity type. Supported types: student, teacher, parent',
          code: 'INVALID_ENTITY_TYPE'
        });
    }
    
    res.status(201).json({
      success: true,
      data: {
        user,
        entity
      },
      code: 'CREATE_SUCCESS'
    });
    
  } catch (error) {
    console.error(`Error creating ${req.body.entityType}:`, error);
    res.status(500).json({
      success: false,
      message: error.message,
      code: 'SERVER_ERROR'
    });
  }
});

/**
 * @desc    Get parents for autocomplete when creating/editing students
 * @route   GET /api/admin/parents
 * @access  Private/Admin
 */
router.get('/parents', protect, authorize('Admin', 'admin'), async (req, res) => {
  try {
    const { search } = req.query;
    
    let query = {};
    if (search) {
      query = {
        $or: [
          { fullName: new RegExp(search, 'i') },
          { career: new RegExp(search, 'i') }
        ]
      };
    }
    
    const parents = await Parent.find(query).select('parentId fullName career phone gender').limit(20);
    
    res.status(200).json({
      success: true,
      data: parents,
      code: 'PARENTS_FETCHED'
    });
  } catch (error) {
    console.error('Error fetching parents:', error);
    res.status(500).json({
      success: false,
      message: error.message,
      code: 'SERVER_ERROR'
    });
  }
});

/**
 * @desc    Get all batches
 * @route   GET /api/admin/batches
 * @access  Private/Admin
 */
router.get('/batches', protect, authorize('Admin', 'admin'), async (req, res) => {
  try {
    const batches = await Batch.find().sort({ startYear: -1, grade: 1 });
    
    res.status(200).json({
      success: true,
      count: batches.length,
      data: batches,
      code: 'BATCHES_FETCHED'
    });
  } catch (error) {
    console.error('Error fetching batches:', error);
    res.status(500).json({
      success: false,
      message: error.message,
      code: 'SERVER_ERROR'
    });
  }
});

/**
 * @desc    Create a new batch
 * @route   POST /api/admin/batches
 * @access  Private/Admin
 */
router.post('/batches', protect, authorize('Admin', 'admin'), async (req, res) => {
  try {
    console.log('Batch creation request:', JSON.stringify(req.body, null, 2));
    const { batchName } = req.body;
    
    // Generate dates from provided years or use current year
    let startDate, endDate;
    
    if (req.body.startDate) {
      try {
        startDate = new Date(req.body.startDate);
        if (isNaN(startDate.getTime())) {
          return res.status(400).json({
            success: false,
            message: `Invalid startDate format: ${req.body.startDate}`,
            code: 'INVALID_DATE'
          });
        }
      } catch (err) {
        return res.status(400).json({
          success: false,
          message: `Error parsing startDate: ${err.message}`,
          code: 'INVALID_DATE'
        });
      }
    } else if (req.body.startYear) {
      try {
        const startYear = parseInt(req.body.startYear);
        if (isNaN(startYear)) {
          return res.status(400).json({
            success: false,
            message: `Invalid startYear: ${req.body.startYear}`,
            code: 'INVALID_YEAR'
          });
        }
        startDate = batchService.generateStartDate(startYear);
      } catch (err) {
        return res.status(400).json({
          success: false,
          message: `Error generating startDate: ${err.message}`,
          code: 'INVALID_DATE'
        });
      }
    } else {
      // Default to current year's September 1st
      startDate = batchService.generateStartDate(new Date().getFullYear());
    }
    
    if (req.body.endDate) {
      try {
        endDate = new Date(req.body.endDate);
        if (isNaN(endDate.getTime())) {
          return res.status(400).json({
            success: false,
            message: `Invalid endDate format: ${req.body.endDate}`,
            code: 'INVALID_DATE'
          });
        }
      } catch (err) {
        return res.status(400).json({
          success: false,
          message: `Error parsing endDate: ${err.message}`,
          code: 'INVALID_DATE'
        });
      }
    } else if (req.body.endYear) {
      try {
        const endYear = parseInt(req.body.endYear);
        if (isNaN(endYear)) {
          return res.status(400).json({
            success: false,
            message: `Invalid endYear: ${req.body.endYear}`,
            code: 'INVALID_YEAR'
          });
        }
        endDate = batchService.generateEndDate(endYear);
      } catch (err) {
        return res.status(400).json({
          success: false,
          message: `Error generating endDate: ${err.message}`,
          code: 'INVALID_DATE'
        });
      }
    } else {
      // Default to start year + 3 years, June 30th
      const startYear = startDate.getFullYear();
      endDate = batchService.generateEndDate(startYear + 3);
    }
    
    console.log('Generated dates:', {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString()
    });
    
    // Generate batchId from dates (YYYY-YYYY format)
    const batchId = req.body.batchId || batchService.generateBatchIdFromDates(startDate, endDate);
    
    // Check if batch with this batchId already exists
    const existingBatch = await Batch.findOne({ batchId });
    if (existingBatch) {
      return res.status(200).json({
        success: true,
        data: existingBatch,
        message: 'Batch already exists',
        code: 'BATCH_EXISTS'
      });
    }
    
    // Create formatted batch name if not provided
    const formattedBatchName = batchName || `Khóa ${batchId}`;
    
    // Create batch with the exact structure needed
    const newBatch = await Batch.create({
      batchId,
      batchName: formattedBatchName,
      startDate,
      endDate,
      isActive: true
    });
    
    res.status(201).json({
      success: true,
      data: newBatch,
      code: 'BATCH_CREATED'
    });
  } catch (error) {
    console.error('Error creating batch:', error);
    res.status(500).json({
      success: false,
      message: error.message,
      code: 'SERVER_ERROR'
    });
  }
});

/**
 * @desc    Create User (Student/Teacher)
 * @route   POST /api/admin/users
 * @access  Private/Admin
 */
router.post('/users', protect, authorize('Admin', 'admin'), async (req, res) => {
  try {
    // Lấy dữ liệu từ request
    const userData = req.body;
    
    if (!userData || !userData.firstName || !userData.lastName || !userData.role) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp đầy đủ thông tin: firstName, lastName, role',
        code: 'MISSING_FIELDS'
      });
    }
    
    // Xác định loại người dùng từ trường role
    const userType = userData.role.toLowerCase();
    
    if (userType !== 'student' && userType !== 'teacher') {
      return res.status(400).json({
        success: false,
        message: 'Role phải là "Student" hoặc "Teacher"',
        code: 'INVALID_ROLE'
      });
    }
    
    // Xử lý từng loại người dùng
    let userId, email, entity;
    let userExists = null; // Declare userExists once here
    const fullName = `${userData.firstName} ${userData.lastName}`;
    
    // Role in user collection phải viết hoa chữ cái đầu
    const userRole = userType.charAt(0).toUpperCase() + userType.slice(1);
    
    switch (userType) {
      case 'student':
        // Kiểm tra batchId
        if (!userData.batchId) {
          return res.status(400).json({
            success: false,
            message: 'Vui lòng cung cấp batchId cho học sinh',
            code: 'MISSING_FIELDS'
          });
        }
        
        // Lấy thông tin batch
        const batch = await Batch.findOne({ batchId: userData.batchId });
        if (!batch) {
          return res.status(404).json({
            success: false,
            message: `Batch with ID ${userData.batchId} not found`,
            code: 'BATCH_NOT_FOUND'
          });
        }
        
        // Generate studentId if not provided
        if (!userData.studentId) {
          // Count total students to determine the next ID
          const studentCount = await Student.countDocuments();
          userData.studentId = studentCount + 1;
          console.log(`Generated new studentId: ${userData.studentId} based on count: ${studentCount}`);
        }
        
        // Sinh userId: tên + chữ cái đầu của các từ trong họ
        // Chuẩn hóa tên để loại bỏ dấu
        const normalizedFirstName = userData.firstName.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        const normalizedLastName = userData.lastName.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        
        // Lấy chữ cái đầu của mỗi từ trong họ
        const lastNameParts = normalizedLastName.split(' ');
        const lastNameInitials = lastNameParts.map(part => part.charAt(0).toLowerCase()).join('');
        
        // Tạo userId và email - bao gồm cả tên, họ, "st" suffix, batchId và studentId
        userId = `${normalizedFirstName.toLowerCase()}${lastNameInitials}st${userData.batchId}${userData.studentId}`.replace(/\s+/g, '');
        email = `${userId}@fams.edu.vn`;
        
        // Kiểm tra xem userId và email đã tồn tại chưa
        userExists = await User.findOne({ 
          $or: [
            { email },
            { userId }
          ]
        });
        
        // Nếu tồn tại, thêm số vào cuối
        let counter = 1;
        let originalUserId = userId;
        while (userExists) {
          userId = `${originalUserId}${counter}`;
          email = `${userId}@fams.edu.vn`;
          counter++;
          userExists = await User.findOne({ 
            $or: [
              { email },
              { userId }
            ]
          });
        }
        
        // Tạo user
        const user = await User.create({
          userId,
          name: fullName,
          email,
          password: userData.password || '1234', // Mật khẩu mặc định
          role: userRole,
          backup_email: userData.backup_email || null
        });
        
        // Xử lý thông tin phụ huynh
        let parents = [];
        let parentInfo = [];
        
        if (userData.parents && userData.parents.length > 0) {
          // Sử dụng thông tin phụ huynh được cung cấp
          parents = userData.parents.map(parent => ({
            parentId: parent.parentId,
            relationship: parent.relationship || 'Other',
            isEmergencyContact: parent.isEmergencyContact || false
          }));
          
          if (userData.parentInfo && userData.parentInfo.length > 0) {
            parentInfo = userData.parentInfo;
          } else {
            // Lấy thông tin chi tiết phụ huynh từ database
            const parentIds = parents.map(p => p.parentId);
            if (parentIds.length > 0) {
              const parentDetails = await Parent.find({ parentId: { $in: parentIds } });
              
              parentInfo = parents.map(parent => {
                const detail = parentDetails.find(p => p.parentId === parent.parentId);
                if (detail) {
                  return {
                    name: detail.fullName,
                    career: detail.career,
                    phone: detail.phone,
                    gender: detail.gender,
                    relationship: parent.relationship
                  };
                }
                return null;
              }).filter(p => p !== null);
            }
          }
        }
        
        // Tạo student
        entity = await Student.create({
          ...userData,
          userId: user.userId,
          fullName,
          parents,
          parentInfo,
          email,
          gender: typeof userData.gender === 'string' ? 
                  (userData.gender === 'Male' ? 'Male' : 'Female') : 
                  (userData.gender === true ? 'Male' : 'Female')
        });
        
        // Tạo quan hệ phụ huynh-học sinh
        if (parents.length > 0) {
          const parentStudentRelations = parents.map(parent => ({
            ParentID: parent.parentId,
            StudentID: entity.studentId
          }));
          
          await ParentStudent.insertMany(parentStudentRelations);
          
          // Cập nhật thông tin phụ huynh
          await Promise.all(parents.map(parent => 
            Parent.findOneAndUpdate(
              { parentId: parent.parentId },
              { $addToSet: { studentIds: entity.studentId } }
            )
          ));
        }
        break;
        
      case 'teacher':
        // Generate teacherId if not provided
        if (!userData.teacherId) {
          // First, count total teachers to determine the base ID
          const teacherCount = await Teacher.countDocuments();
          let newTeacherId = teacherCount + 1;
          
          // Check if this teacherId already exists
          let teacherExists = await Teacher.findOne({ teacherId: newTeacherId.toString() });
          
          // If exists, keep incrementing until we find an available ID
          while (teacherExists) {
            newTeacherId++;
            teacherExists = await Teacher.findOne({ teacherId: newTeacherId.toString() });
          }
          
          userData.teacherId = newTeacherId.toString();
          console.log(`Generated new teacherId: ${userData.teacherId}`);
        }
        
        // Normalize names
        const teacherFirstName = userData.firstName.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        const teacherLastName = userData.lastName.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        
        // Get initials from last name
        const teacherLastNameParts = teacherLastName.split(' ');
        const teacherLastNameInitials = teacherLastNameParts.map(part => part.charAt(0).toLowerCase()).join('');
        
        // Create userId and email with teacherId
        userId = `${teacherFirstName.toLowerCase()}${teacherLastNameInitials}${userData.teacherId}`.replace(/\s+/g, '');
        email = `${userId}@fams.edu.vn`;
        
        // Check if user exists
        userExists = await User.findOne({ 
          $or: [
            { email },
            { userId }
          ]
        });
        
        // If exists, add a counter suffix like we do for students
        let teacherCounter = 1;
        let originalTeacherUserId = userId;
        while (userExists) {
          userId = `${originalTeacherUserId}${teacherCounter}`;
          email = `${userId}@fams.edu.vn`;
          teacherCounter++;
          userExists = await User.findOne({ 
            $or: [
              { email },
              { userId }
            ]
          });
        }
        
        // Tạo user
        const teacherUser = await User.create({
          userId,
          name: fullName,
          email,
          password: userData.password || '1234', // Mật khẩu mặc định
          role: userRole,
          backup_email: userData.backup_email || null
        });
        
        // Tạo teacher
        entity = await Teacher.create({
          ...userData,
          userId: teacherUser.userId,
          fullName,
          email,
          gender: typeof userData.gender === 'string'
                 ? (userData.gender.toLowerCase() === 'male' || userData.gender.toLowerCase() === 'true')
                 : Boolean(userData.gender)
        });
        break;
        
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid role. Must be either "Student" or "Teacher"',
          code: 'INVALID_ROLE'
        });
    }
    
    res.status(201).json({
      success: true,
      data: {
        userId,
        email,
        [userType]: entity
      },
      message: `${userType} created successfully`
    });
  } catch (error) {
    console.error(`Error creating user:`, error);
    res.status(500).json({
      success: false,
      message: error.message,
      code: 'SERVER_ERROR'
    });
  }
});

module.exports = router; 