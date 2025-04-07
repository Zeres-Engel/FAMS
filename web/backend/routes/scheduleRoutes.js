const express = require('express');
const { 
  getWeeklySchedule, 
  getDailySchedule, 
  getSemesterSchedule,
  getCurrentSemester,
  getAllSemesters
} = require('../controllers/scheduleController');
const { protect } = require('../middleware/authMiddleware');
const mongoose = require('mongoose');

const router = express.Router();

// Create separate router for debug routes
const debugRouter = express.Router();

// Debug route - NO AUTHENTICATION REQUIRED
debugRouter.get('/schedules/:classId', async (req, res) => {
  try {
    const classId = parseInt(req.params.classId);
    
    // Check if ClassSchedule collection exists
    const collections = await mongoose.connection.db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    
    if (!collectionNames.includes('ClassSchedule')) {
      return res.status(404).json({
        success: false,
        message: 'ClassSchedule collection not found in database',
        availableCollections: collectionNames
      });
    }
    
    // Query specifically the ClassSchedule collection
    const schedules = await mongoose.connection.db.collection('ClassSchedule')
      .find({ classId: classId })
      .limit(10)
      .toArray();
    
    return res.json({
      success: true,
      message: `Found ${schedules.length} schedules for class ID ${classId}`,
      collection: 'ClassSchedule',
      data: schedules,
      query: { classId: classId }
    });
  } catch (error) {
    console.error('Debug route error:', error);
    return res.status(500).json({
      success: false,
      message: error.message,
      stack: error.stack
    });
  }
});

// Debug route to check connection and JWT verification
debugRouter.get('/token-test', async (req, res) => {
  try {
    const token = req.headers.authorization ? 
      req.headers.authorization.split(' ')[1] : null;
    
    let tokenInfo = { exists: !!token };
    
    if (token) {
      try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret_key');
        tokenInfo.valid = true;
        tokenInfo.decoded = decoded;
      } catch (e) {
        tokenInfo.valid = false;
        tokenInfo.error = e.message;
      }
    }
    
    return res.json({
      success: true,
      message: 'Connection test successful',
      tokenInfo,
      headers: {
        authorization: req.headers.authorization ? 'Present' : 'Missing'
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Add a debug route to list all users
debugRouter.get('/users', async (req, res) => {
  try {
    const users = await mongoose.connection.db.collection('UserAccount')
      .find({})
      .project({ userId: 1, name: 1, role: 1, _id: 0 })
      .limit(10)
      .toArray();
    
    return res.json({
      success: true,
      message: `Found ${users.length} users`,
      data: users
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Add a debug route to list all collections
debugRouter.get('/collections', async (req, res) => {
  try {
    const collections = await mongoose.connection.db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    
    // Get count of documents in each collection
    const collectionStats = [];
    for (const name of collectionNames) {
      const count = await mongoose.connection.db.collection(name).countDocuments();
      collectionStats.push({ name, count });
    }
    
    return res.json({
      success: true,
      message: `Found ${collectionNames.length} collections`,
      data: collectionStats
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Debug route to get student schedule by UserID
debugRouter.get('/student/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    
    // 1. Find student record using the userId
    const student = await mongoose.connection.db.collection('Student')
      .findOne({ userId: userId });
      
    if (!student) {
      return res.status(404).json({
        success: false,
        message: `No student found with UserID ${userId}`,
        code: 'STUDENT_NOT_FOUND'
      });
    }
    
    // 2. Get the classId from the student record
    const classId = student.classId;
    
    if (!classId) {
      return res.status(404).json({
        success: false,
        message: `Student with UserID ${userId} has no assigned class`,
        code: 'NO_CLASS_ASSIGNED',
        student: student
      });
    }
    
    // 3. Query the ClassSchedule using the classId
    const schedules = await mongoose.connection.db.collection('ClassSchedule')
      .find({ classId: classId })
      .toArray();
    
    return res.json({
      success: true,
      message: `Found ${schedules.length} schedules for student with UserID ${userId} in class ${classId}`,
      data: {
        student: student,
        schedules: schedules
      }
    });
  } catch (error) {
    console.error('Error getting student schedule:', error);
    return res.status(500).json({
      success: false,
      message: error.message,
      stack: error.stack
    });
  }
});

// Mount debug router WITHOUT protection
router.use('/debug', debugRouter);

// Protect all other routes
router.use(protect);

// Regular routes
router.get('/semester/current', getCurrentSemester);
router.get('/weekly', getWeeklySchedule);
router.get('/daily/:date', getDailySchedule);
router.get('/semester/:semesterId', getSemesterSchedule);
router.get('/user/:userId/weekly', getWeeklySchedule);
router.get('/class/:classId/weekly', getWeeklySchedule);
router.get('/semesters', getAllSemesters);

// Universal endpoint for getting schedule based on user role
router.get('/me', async (req, res) => {
  try {
    // 1. Get user info from auth token
    const userId = req.user.userId;
    const userRole = req.user.role;
    
    // Variables to store result data
    let schedules = [];
    let userData = null;
    let message = '';
    
    // 2. Handle different roles
    if (userRole === 'Student') {
      // For students: Get their class schedule
      const student = await mongoose.connection.db.collection('Student')
        .findOne({ userId: userId });
        
      if (!student) {
        return res.status(404).json({
          success: false,
          message: 'Student record not found',
          code: 'STUDENT_NOT_FOUND'
        });
      }
      
      const classId = student.classId;
      
      if (!classId) {
        return res.status(404).json({
          success: false,
          message: 'Student has no assigned class',
          code: 'NO_CLASS_ASSIGNED'
        });
      }
      
      schedules = await mongoose.connection.db.collection('ClassSchedule')
        .find({ classId: classId })
        .toArray();
        
      userData = {
        studentId: student.studentId,
        fullName: student.fullName,
        classId: student.classId,
        userId: student.userId
      };
      
      message = `Found ${schedules.length} schedules for student in class ${classId}`;
    } 
    else if (userRole === 'Teacher') {
      // For teachers: Get schedules where they teach
      const teacher = await mongoose.connection.db.collection('Teacher')
        .findOne({ userId: userId });
        
      if (!teacher) {
        return res.status(404).json({
          success: false,
          message: 'Teacher record not found',
          code: 'TEACHER_NOT_FOUND'
        });
      }
      
      const teacherId = teacher.teacherId;
      
      schedules = await mongoose.connection.db.collection('ClassSchedule')
        .find({ teacherId: teacherId })
        .toArray();
        
      userData = {
        teacherId: teacher.teacherId,
        fullName: teacher.fullName,
        userId: teacher.userId,
        major: teacher.major,
        weeklyCapacity: teacher.weeklyCapacity
      };
      
      message = `Found ${schedules.length} teaching schedules for teacher`;
    }
    else if (userRole === 'Parent') {
      // For parents: Get schedules of their children
      const parent = await mongoose.connection.db.collection('Parent')
        .findOne({ userId: userId });
        
      if (!parent) {
        return res.status(404).json({
          success: false,
          message: 'Parent record not found',
          code: 'PARENT_NOT_FOUND'
        });
      }
      
      // Get list of student IDs associated with this parent
      const studentIds = parent.studentIds || [];
      
      if (studentIds.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Parent has no linked students',
          code: 'NO_STUDENTS_LINKED'
        });
      }
      
      // Check if a specific student ID is requested
      let targetStudentId = req.query.studentId ? parseInt(req.query.studentId) : studentIds[0];
      
      // Verify that the requested student belongs to this parent
      if (req.query.studentId && !studentIds.includes(parseInt(req.query.studentId))) {
        return res.status(403).json({
          success: false,
          message: 'Parent is not authorized to view this student\'s schedule',
          code: 'UNAUTHORIZED_STUDENT_ACCESS'
        });
      }
      
      // Get student details
      const student = await mongoose.connection.db.collection('Student')
        .findOne({ studentId: targetStudentId });
        
      if (!student) {
        return res.status(404).json({
          success: false,
          message: 'Student record not found',
          code: 'STUDENT_NOT_FOUND'
        });
      }
      
      const classId = student.classId;
      
      if (!classId) {
        return res.status(404).json({
          success: false,
          message: 'Student has no assigned class',
          code: 'NO_CLASS_ASSIGNED'
        });
      }
      
      schedules = await mongoose.connection.db.collection('ClassSchedule')
        .find({ classId: classId })
        .toArray();
        
      userData = {
        parentId: parent.parentId,
        parentName: parent.fullName,
        userId: parent.userId,
        student: {
          studentId: student.studentId,
          fullName: student.fullName,
          classId: student.classId
        },
        allStudentIds: studentIds
      };
      
      message = `Found ${schedules.length} schedules for student ${student.fullName} (child of parent)`;
    }
    else if (userRole === 'Admin') {
      // For admin: Return info based on query parameters
      if (req.query.classId) {
        const classId = parseInt(req.query.classId);
        schedules = await mongoose.connection.db.collection('ClassSchedule')
          .find({ classId: classId })
          .toArray();
        message = `Found ${schedules.length} schedules for class ${classId} (admin view)`;
      } 
      else if (req.query.teacherId) {
        const teacherId = parseInt(req.query.teacherId);
        schedules = await mongoose.connection.db.collection('ClassSchedule')
          .find({ teacherId: teacherId })
          .toArray();
        message = `Found ${schedules.length} schedules for teacher ${teacherId} (admin view)`;
      }
      else {
        return res.status(400).json({
          success: false,
          message: 'Admin must specify classId or teacherId parameter',
          code: 'MISSING_PARAMETERS'
        });
      }
      
      userData = {
        userId: userId,
        role: 'Admin'
      };
    }
    
    // 3. Get semester info
    let semesterInfo = null;
    try {
      const currentSemester = await mongoose.connection.db.collection('Semester')
        .findOne({ 
          startDate: { $lte: new Date() }, 
          endDate: { $gte: new Date() }
        });
      
      if (currentSemester) {
        semesterInfo = {
          semesterId: currentSemester.semesterId,
          semesterName: currentSemester.semesterName,
          startDate: currentSemester.startDate,
          endDate: currentSemester.endDate
        };
      }
    } catch (error) {
      console.warn('Error getting semester info:', error.message);
    }
    
    return res.json({
      success: true,
      message: message,
      data: {
        user: userData,
        role: userRole,
        schedules: schedules,
        semester: semesterInfo
      }
    });
  } catch (error) {
    console.error('Error in /me endpoint:', error);
    return res.status(500).json({
      success: false,
      message: error.message,
      code: 'SERVER_ERROR'
    });
  }
});

router.get('/student', async (req, res) => {
  try {
    // 1. Get user ID from authenticated user
    const userId = req.user.userId;
    
    // 2. Check if user is a student
    if (req.user.role !== 'Student') {
      return res.status(403).json({
        success: false,
        message: 'Only students can access this endpoint',
        code: 'ACCESS_DENIED'
      });
    }
    
    // 3. Find student record
    const student = await mongoose.connection.db.collection('Student')
      .findOne({ userId: userId });
      
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student record not found',
        code: 'STUDENT_NOT_FOUND'
      });
    }
    
    // 4. Get the classId from the student record
    const classId = student.classId;
    
    if (!classId) {
      return res.status(404).json({
        success: false,
        message: 'Student has no assigned class',
        code: 'NO_CLASS_ASSIGNED'
      });
    }
    
    // 5. Query the ClassSchedule using the classId
    const schedules = await mongoose.connection.db.collection('ClassSchedule')
      .find({ classId: classId })
      .toArray();
    
    // 6. Get semester info if available
    let semesterInfo = null;
    try {
      const currentSemester = await mongoose.connection.db.collection('Semester')
        .findOne({ 
          startDate: { $lte: new Date() }, 
          endDate: { $gte: new Date() }
        });
      
      if (currentSemester) {
        semesterInfo = {
          semesterId: currentSemester.semesterId,
          semesterName: currentSemester.semesterName,
          startDate: currentSemester.startDate,
          endDate: currentSemester.endDate
        };
      }
    } catch (error) {
      console.warn('Error getting semester info:', error.message);
    }
    
    return res.json({
      success: true,
      message: `Found ${schedules.length} schedules for student`,
      data: {
        schedules: schedules,
        student: {
          studentId: student.studentId,
          fullName: student.fullName,
          classId: student.classId
        },
        semester: semesterInfo
      }
    });
  } catch (error) {
    console.error('Error in /student endpoint:', error);
    return res.status(500).json({
      success: false,
      message: error.message,
      code: 'SERVER_ERROR'
    });
  }
});

module.exports = router; 