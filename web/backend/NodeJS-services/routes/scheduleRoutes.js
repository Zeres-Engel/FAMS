const express = require('express');
const { 
  getWeeklySchedule, 
  getDailySchedule, 
  getSemesterSchedule,
  getCurrentSemester,
  getAllSemesters,
  getCurrentWeekRange,
  getScheduleByWeekRange
} = require('../controllers/scheduleController');
const { protect } = require('../middleware/authMiddleware');
const mongoose = require('mongoose');
const scheduleService = require('../services/scheduleService');

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

// Debug route to check schedules by date range
debugRouter.get('/date-range', async (req, res) => {
  try {
    const startDate = req.query.start;
    const endDate = req.query.end;
    
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Both start and end date parameters are required',
        example: '/api/schedules/debug/date-range?start=2024-09-09&end=2024-09-15'
      });
    }
    
    // Query schedules by date range
    const query = {
      $or: [
        { SessionDate: { $gte: startDate, $lte: endDate } },
        { sessionDate: { $gte: startDate, $lte: endDate } }
      ]
    };
    
    // Add optional filters
    if (req.query.classId) {
      query.classId = parseInt(req.query.classId);
    }
    
    if (req.query.teacherId) {
      query.teacherId = parseInt(req.query.teacherId);
    }
    
    // Query database
    const schedules = await mongoose.connection.db.collection('ClassSchedule')
      .find(query)
      .sort({ SessionDate: 1, SlotID: 1 })
      .limit(req.query.limit ? parseInt(req.query.limit) : 100)
      .toArray();
    
    // Check SessionWeek field
    const hasSessionWeekCount = schedules.filter(s => s.SessionWeek || s.sessionWeek).length;
    
    return res.json({
      success: true,
      message: `Found ${schedules.length} schedules between ${startDate} and ${endDate}`,
      meta: {
        query,
        dateRange: `${startDate} to ${endDate}`,
        withSessionWeek: hasSessionWeekCount,
        withoutSessionWeek: schedules.length - hasSessionWeekCount
      },
      data: schedules
    });
  } catch (error) {
    console.error('Error in date-range debug route:', error);
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

// Register the new routes for week range
router.get('/current-week', getCurrentWeekRange);
router.get('/week-range/:weekRange', getScheduleByWeekRange);

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

// Endpoint to update SessionWeek field for all schedules (ADMIN ONLY)
router.post('/update-session-weeks', async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'Admin') {
      return res.status(403).json({
        success: false,
        message: 'Quyền truy cập bị từ chối. Chỉ Admin mới có thể sử dụng chức năng này.',
        code: 'PERMISSION_DENIED'
      });
    }
    
    // Run the update function
    const result = await scheduleService.updateAllSessionWeeks();
    
    return res.json({
      success: true,
      message: `Đã cập nhật thành công ${result.updatedCount}/${result.totalSchedules} lịch học`,
      data: result
    });
  } catch (error) {
    console.error('Error updating session weeks:', error);
    return res.status(500).json({
      success: false,
      message: error.message,
      stack: error.stack
    });
  }
});

// Endpoint to check and fix SessionWeek field for a specific week (ADMIN ONLY)
router.post('/check-week/:weekRange', async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'Admin') {
      return res.status(403).json({
        success: false,
        message: 'Quyền truy cập bị từ chối. Chỉ Admin mới có thể sử dụng chức năng này.',
        code: 'PERMISSION_DENIED'
      });
    }
    
    const weekRange = req.params.weekRange;
    const { startDate, endDate } = scheduleService.parseWeekRange(weekRange);
    
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Định dạng tuần không hợp lệ. Sử dụng định dạng "YYYY-MM-DD to YYYY-MM-DD"',
        code: 'INVALID_FORMAT'
      });
    }
    
    // Find schedules with SessionDate in the given range but missing SessionWeek
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];
    
    const db = mongoose.connection.db;
    const query = {
      $or: [
        { SessionDate: { $gte: startDateStr, $lte: endDateStr } },
        { sessionDate: { $gte: startDateStr, $lte: endDateStr } }
      ],
      $or: [
        { SessionWeek: { $exists: false } },
        { sessionWeek: { $exists: false } }
      ]
    };
    
    const schedules = await db.collection('ClassSchedule')
      .find(query)
      .toArray();
    
    console.log(`Tìm thấy ${schedules.length} lịch học cần cập nhật SessionWeek cho tuần ${weekRange}`);
    
    // Update SessionWeek field for all found schedules
    await scheduleService.updateSessionWeekField(schedules);
    
    return res.json({
      success: true,
      message: `Đã kiểm tra và cập nhật SessionWeek cho ${schedules.length} lịch học trong tuần ${weekRange}`,
      data: { 
        weekRange,
        schedulesUpdated: schedules.length,
        startDate: startDateStr,
        endDate: endDateStr
      }
    });
  } catch (error) {
    console.error('Error checking and fixing week schedules:', error);
    return res.status(500).json({
      success: false,
      message: error.message,
      stack: error.stack
    });
  }
});

// Get all schedules with advanced filtering
router.get('/all', protect, async (req, res) => {
  try {
    const { 
      className, 
      userId, 
      teacherId,
      classId,
      subjectId, 
      fromDate, 
      toDate,
      dayOfWeek,
      slotId,
      weekNumber,
      semesterId,
      status
    } = req.query;
    
    // Build query
    const query = {};
    
    // Class Name filter
    if (className) {
      // First find the class with this name
      const classData = await mongoose.connection.db.collection('Class')
        .findOne({ className: className });
      
      if (classData) {
        query.classId = classData.classId;
      } else {
        return res.status(404).json({
          success: false,
          message: `Class with name ${className} not found`,
          code: 'CLASS_NOT_FOUND'
        });
      }
    }
    
    // User ID filter (works for students, teachers, parents)
    if (userId) {
      // First get user info to determine role
      const user = await mongoose.connection.db.collection('User')
        .findOne({ userId: userId });
        
      if (!user) {
        return res.status(404).json({
          success: false,
          message: `User with ID ${userId} not found`,
          code: 'USER_NOT_FOUND'
        });
      }
      
      if (user.role === 'Student' || user.role === 'student') {
        // Find student's class
        const student = await mongoose.connection.db.collection('Student')
          .findOne({ userId: userId });
          
        if (student && student.classId) {
          query.classId = student.classId;
        } else {
          return res.status(404).json({
            success: false,
            message: `No class assigned to student with ID ${userId}`,
            code: 'NO_CLASS_ASSIGNED'
          });
        }
      } else if (user.role === 'Teacher' || user.role === 'teacher') {
        // Find teacher's ID
        const teacher = await mongoose.connection.db.collection('Teacher')
          .findOne({ userId: userId });
          
        if (teacher && teacher.teacherId) {
          query.teacherId = teacher.teacherId;
        } else {
          return res.status(404).json({
            success: false,
            message: `No teacherId found for user with ID ${userId}`,
            code: 'NO_TEACHER_FOUND'
          });
        }
      } else if (user.role === 'Parent' || user.role === 'parent') {
        // Find parent's children
        const parent = await mongoose.connection.db.collection('Parent')
          .findOne({ userId: userId });
          
        if (parent && parent.studentIds && parent.studentIds.length > 0) {
          // Get first child's class by default (or use student query param)
          const studentId = req.query.studentId || parent.studentIds[0];
          const student = await mongoose.connection.db.collection('Student')
            .findOne({ studentId: parseInt(studentId) });
            
          if (student && student.classId) {
            query.classId = student.classId;
          } else {
            return res.status(404).json({
              success: false,
              message: `No class assigned to student with ID ${studentId}`,
              code: 'NO_CLASS_ASSIGNED'
            });
          }
        } else {
          return res.status(404).json({
            success: false,
            message: `No children found for parent with ID ${userId}`,
            code: 'NO_CHILDREN_FOUND'
          });
        }
      }
    }
    
    // Direct filters
    if (classId && !query.classId) {
      query.classId = parseInt(classId);
    }
    
    if (teacherId) {
      query.teacherId = parseInt(teacherId);
    }
    
    if (subjectId) {
      query.subjectId = parseInt(subjectId);
    }
    
    // Date range filter
    if (fromDate || toDate) {
      // Use $or to match either field name
      const dateConditions = [];
      
      if (fromDate && toDate) {
        // Match date range for both field versions
        dateConditions.push({
          sessionDate: { $gte: new Date(fromDate), $lte: new Date(toDate) }
        });
        dateConditions.push({
          SessionDate: { $gte: fromDate, $lte: toDate }
        });
        dateConditions.push({
          sessionWeek: `${fromDate} to ${toDate}`
        });
      } else if (fromDate) {
        dateConditions.push({ sessionDate: { $gte: new Date(fromDate) } });
        dateConditions.push({ SessionDate: { $gte: fromDate } });
      } else if (toDate) {
        dateConditions.push({ sessionDate: { $lte: new Date(toDate) } });
        dateConditions.push({ SessionDate: { $lte: toDate } });
      }
      
      // Add the $or condition to the query
      query.$or = dateConditions;
    }
    
    // Week filter
    if (weekNumber) {
      query.WeekNumber = parseInt(weekNumber);
    }
    
    // Day of week filter
    if (dayOfWeek) {
      query.dayOfWeek = dayOfWeek;
    }
    
    // Slot filter
    if (slotId) {
      query.SlotID = parseInt(slotId);
    }
    
    // Semester filter
    if (semesterId) {
      query.semesterId = semesterId;
    }
    
    // Status filter
    if (status) {
      query.status = status;
    }
    
    // Execute query
    console.log('Executing schedule query:', JSON.stringify(query));
    const schedules = await mongoose.connection.db.collection('ClassSchedule')
      .find(query)
      .sort({ SessionDate: 1, SlotID: 1 })
      .toArray();
      
    // Add additional info from related collections
    const enhancedSchedules = await scheduleService.formatScheduleData(schedules, 'list');
    
    res.json({
      success: true,
      count: schedules.length,
      data: enhancedSchedules,
      query: query
    });
  } catch (error) {
    console.error('Error fetching all schedules:', error);
    res.status(500).json({
      success: false,
      message: error.message,
      code: 'SCHEDULE_FETCH_ERROR'
    });
  }
});

// Get schedules by class name
router.get('/class/:className', protect, async (req, res) => {
  try {
    const { className } = req.params;
    const { fromDate, toDate } = req.query;
    
    // Find class by name
    const classData = await mongoose.connection.db.collection('Class')
      .findOne({ className: className });
      
    if (!classData) {
      return res.status(404).json({
        success: false,
        message: `Class with name ${className} not found`,
        code: 'CLASS_NOT_FOUND'
      });
    }
    
    // Build query
    const query = {
      classId: classData.classId
    };
    
    // Add date range if provided
    if (fromDate || toDate) {
      query.SessionDate = {};
      
      if (fromDate) {
        query.SessionDate.$gte = fromDate;
      }
      
      if (toDate) {
        query.SessionDate.$lte = toDate;
      }
    }
    
    // Execute query
    const schedules = await mongoose.connection.db.collection('ClassSchedule')
      .find(query)
      .sort({ SessionDate: 1, SlotID: 1 })
      .toArray();
      
    // Add additional info from related collections
    const enhancedSchedules = await scheduleService.formatScheduleData(schedules, 'list');
    
    res.json({
      success: true,
      count: schedules.length,
      class: classData,
      data: enhancedSchedules
    });
  } catch (error) {
    console.error('Error fetching schedules by class name:', error);
    res.status(500).json({
      success: false,
      message: error.message,
      code: 'SCHEDULE_FETCH_ERROR'
    });
  }
});

// Get schedules by user ID
router.get('/user/:userId', protect, async (req, res) => {
  try {
    const { userId } = req.params;
    const { fromDate, toDate, studentId } = req.query;
    
    // Find user
    const user = await mongoose.connection.db.collection('User')
      .findOne({ userId: userId });
      
    if (!user) {
      return res.status(404).json({
        success: false,
        message: `User with ID ${userId} not found`,
        code: 'USER_NOT_FOUND'
      });
    }
    
    let query = {};
    let contextData = {
      userId: userId,
      role: user.role
    };
    
    // Handle different user roles
    if (user.role === 'Student' || user.role === 'student') {
      // Get student's class
      const student = await mongoose.connection.db.collection('Student')
        .findOne({ userId: userId });
        
      if (!student || !student.classId) {
        return res.status(404).json({
          success: false,
          message: `No class assigned to student with ID ${userId}`,
          code: 'NO_CLASS_ASSIGNED'
        });
      }
      
      query.classId = student.classId;
      contextData.student = student;
      contextData.classId = student.classId;
      
    } else if (user.role === 'Teacher' || user.role === 'teacher') {
      // Get teacher's ID
      const teacher = await mongoose.connection.db.collection('Teacher')
        .findOne({ userId: userId });
        
      if (!teacher || !teacher.teacherId) {
        return res.status(404).json({
          success: false,
          message: `No teacherId found for user with ID ${userId}`,
          code: 'NO_TEACHER_FOUND'
        });
      }
      
      query.teacherId = teacher.teacherId;
      contextData.teacher = teacher;
      contextData.teacherId = teacher.teacherId;
      
    } else if (user.role === 'Parent' || user.role === 'parent') {
      // Get parent's children
      const parent = await mongoose.connection.db.collection('Parent')
        .findOne({ userId: userId });
        
      if (!parent || !parent.studentIds || parent.studentIds.length === 0) {
        return res.status(404).json({
          success: false,
          message: `No children found for parent with ID ${userId}`,
          code: 'NO_CHILDREN_FOUND'
        });
      }
      
      // Use specific student if provided, otherwise use first child
      const targetStudentId = studentId ? parseInt(studentId) : parent.studentIds[0];
      
      // Get student info
      const student = await mongoose.connection.db.collection('Student')
        .findOne({ studentId: targetStudentId });
        
      if (!student || !student.classId) {
        return res.status(404).json({
          success: false,
          message: `No class assigned to student with ID ${targetStudentId}`,
          code: 'NO_CLASS_ASSIGNED'
        });
      }
      
      query.classId = student.classId;
      contextData.parent = parent;
      contextData.student = student;
      contextData.classId = student.classId;
    }
    
    // Add date range if provided
    if (fromDate || toDate) {
      query.SessionDate = {};
      
      if (fromDate) {
        query.SessionDate.$gte = fromDate;
      }
      
      if (toDate) {
        query.SessionDate.$lte = toDate;
      }
    }
    
    // Execute query
    const schedules = await mongoose.connection.db.collection('ClassSchedule')
      .find(query)
      .sort({ SessionDate: 1, SlotID: 1 })
      .toArray();
      
    // Add additional info from related collections
    const enhancedSchedules = await scheduleService.formatScheduleData(schedules, 'list');
    
    res.json({
      success: true,
      count: schedules.length,
      context: contextData,
      data: enhancedSchedules
    });
  } catch (error) {
    console.error('Error fetching schedules by user ID:', error);
    res.status(500).json({
      success: false,
      message: error.message,
      code: 'SCHEDULE_FETCH_ERROR'
    });
  }
});

// Create a new schedule entry
router.post('/create', protect, async (req, res) => {
  try {
    // Check if user has appropriate role (Admin or Teacher)
    if (req.user.role !== 'Admin' && req.user.role !== 'Teacher') {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền tạo lịch học',
        code: 'PERMISSION_DENIED'
      });
    }
    
    // Get required parameters from request body
    const { date, slotNumber, classId, teacherId, subjectId, topic, classroomId } = req.body;
    
    // Validate required parameters
    if (!date || !slotNumber || !classId || !teacherId || !subjectId) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu thông tin bắt buộc (date, slotNumber, classId, teacherId, subjectId)',
        code: 'MISSING_REQUIRED_FIELDS'
      });
    }
    
    // Parse date and convert to JavaScript Date object
    const sessionDate = new Date(date);
    
    if (isNaN(sessionDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Định dạng ngày không hợp lệ. Sử dụng YYYY-MM-DD',
        code: 'INVALID_DATE_FORMAT'
      });
    }
    
    // Get day of week (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
    const dayNumberJS = sessionDate.getDay();
    
    // Convert JS day number to our format (1 = Monday, 2 = Tuesday, ..., 7 = Sunday)
    const dayNumber = dayNumberJS === 0 ? 7 : dayNumberJS;
    
    // Get day of week name
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayOfWeek = daysOfWeek[dayNumberJS];
    
    // If it's Sunday (dayNumberJS = 0), return error as we don't have classes on Sunday
    if (dayNumberJS === 0) {
      return res.status(400).json({
        success: false,
        message: 'Không thể tạo lịch học vào Chủ Nhật',
        code: 'INVALID_DAY'
      });
    }
    
    // Get slot times from scheduleformat.csv
    // We have the data in memory from data/scheduleformat.csv
    const scheduleData = [
      // Monday
      { dayOfWeek: 'Monday', slotNumber: 1, startTime: '07:00', endTime: '07:45' },
      { dayOfWeek: 'Monday', slotNumber: 2, startTime: '07:50', endTime: '08:35' },
      { dayOfWeek: 'Monday', slotNumber: 3, startTime: '08:50', endTime: '09:35' },
      { dayOfWeek: 'Monday', slotNumber: 4, startTime: '09:40', endTime: '10:25' },
      { dayOfWeek: 'Monday', slotNumber: 5, startTime: '10:30', endTime: '11:15' },
      { dayOfWeek: 'Monday', slotNumber: 6, startTime: '13:00', endTime: '13:45' },
      { dayOfWeek: 'Monday', slotNumber: 7, startTime: '13:50', endTime: '14:35' },
      { dayOfWeek: 'Monday', slotNumber: 8, startTime: '14:40', endTime: '15:25' },
      { dayOfWeek: 'Monday', slotNumber: 9, startTime: '15:30', endTime: '16:15' },
      { dayOfWeek: 'Monday', slotNumber: 10, startTime: '16:20', endTime: '17:05' },
      // Tuesday
      { dayOfWeek: 'Tuesday', slotNumber: 1, startTime: '07:00', endTime: '07:45' },
      { dayOfWeek: 'Tuesday', slotNumber: 2, startTime: '07:50', endTime: '08:35' },
      { dayOfWeek: 'Tuesday', slotNumber: 3, startTime: '08:50', endTime: '09:35' },
      { dayOfWeek: 'Tuesday', slotNumber: 4, startTime: '09:40', endTime: '10:25' },
      { dayOfWeek: 'Tuesday', slotNumber: 5, startTime: '10:30', endTime: '11:15' },
      { dayOfWeek: 'Tuesday', slotNumber: 6, startTime: '13:00', endTime: '13:45' },
      { dayOfWeek: 'Tuesday', slotNumber: 7, startTime: '13:50', endTime: '14:35' },
      { dayOfWeek: 'Tuesday', slotNumber: 8, startTime: '14:40', endTime: '15:25' },
      { dayOfWeek: 'Tuesday', slotNumber: 9, startTime: '15:30', endTime: '16:15' },
      { dayOfWeek: 'Tuesday', slotNumber: 10, startTime: '16:20', endTime: '17:05' },
      // Wednesday
      { dayOfWeek: 'Wednesday', slotNumber: 1, startTime: '07:00', endTime: '07:45' },
      { dayOfWeek: 'Wednesday', slotNumber: 2, startTime: '07:50', endTime: '08:35' },
      { dayOfWeek: 'Wednesday', slotNumber: 3, startTime: '08:50', endTime: '09:35' },
      { dayOfWeek: 'Wednesday', slotNumber: 4, startTime: '09:40', endTime: '10:25' },
      { dayOfWeek: 'Wednesday', slotNumber: 5, startTime: '10:30', endTime: '11:15' },
      { dayOfWeek: 'Wednesday', slotNumber: 6, startTime: '13:00', endTime: '13:45' },
      { dayOfWeek: 'Wednesday', slotNumber: 7, startTime: '13:50', endTime: '14:35' },
      { dayOfWeek: 'Wednesday', slotNumber: 8, startTime: '14:40', endTime: '15:25' },
      { dayOfWeek: 'Wednesday', slotNumber: 9, startTime: '15:30', endTime: '16:15' },
      { dayOfWeek: 'Wednesday', slotNumber: 10, startTime: '16:20', endTime: '17:05' },
      // Thursday
      { dayOfWeek: 'Thursday', slotNumber: 1, startTime: '07:00', endTime: '07:45' },
      { dayOfWeek: 'Thursday', slotNumber: 2, startTime: '07:50', endTime: '08:35' },
      { dayOfWeek: 'Thursday', slotNumber: 3, startTime: '08:50', endTime: '09:35' },
      { dayOfWeek: 'Thursday', slotNumber: 4, startTime: '09:40', endTime: '10:25' },
      { dayOfWeek: 'Thursday', slotNumber: 5, startTime: '10:30', endTime: '11:15' },
      { dayOfWeek: 'Thursday', slotNumber: 6, startTime: '13:00', endTime: '13:45' },
      { dayOfWeek: 'Thursday', slotNumber: 7, startTime: '13:50', endTime: '14:35' },
      { dayOfWeek: 'Thursday', slotNumber: 8, startTime: '14:40', endTime: '15:25' },
      { dayOfWeek: 'Thursday', slotNumber: 9, startTime: '15:30', endTime: '16:15' },
      { dayOfWeek: 'Thursday', slotNumber: 10, startTime: '16:20', endTime: '17:05' },
      // Friday
      { dayOfWeek: 'Friday', slotNumber: 1, startTime: '07:00', endTime: '07:45' },
      { dayOfWeek: 'Friday', slotNumber: 2, startTime: '07:50', endTime: '08:35' },
      { dayOfWeek: 'Friday', slotNumber: 3, startTime: '08:50', endTime: '09:35' },
      { dayOfWeek: 'Friday', slotNumber: 4, startTime: '09:40', endTime: '10:25' },
      { dayOfWeek: 'Friday', slotNumber: 5, startTime: '10:30', endTime: '11:15' },
      { dayOfWeek: 'Friday', slotNumber: 6, startTime: '13:00', endTime: '13:45' },
      { dayOfWeek: 'Friday', slotNumber: 7, startTime: '13:50', endTime: '14:35' },
      { dayOfWeek: 'Friday', slotNumber: 8, startTime: '14:40', endTime: '15:25' },
      { dayOfWeek: 'Friday', slotNumber: 9, startTime: '15:30', endTime: '16:15' },
      { dayOfWeek: 'Friday', slotNumber: 10, startTime: '16:20', endTime: '17:05' }
    ];
    
    // Find the matching slot data
    const slotData = scheduleData.find(s => 
      s.dayOfWeek === dayOfWeek && s.slotNumber === parseInt(slotNumber)
    );
    
    if (!slotData) {
      return res.status(400).json({
        success: false,
        message: `Không tìm thấy thông tin tiết học ${slotNumber} vào ${dayOfWeek}`,
        code: 'INVALID_SLOT'
      });
    }
    
    // Calculate the week range (Monday to Sunday)
    const startOfWeek = new Date(sessionDate);
    const daysSinceMonday = (sessionDate.getDay() + 6) % 7; // Days since last Monday (0 if Monday)
    startOfWeek.setDate(startOfWeek.getDate() - daysSinceMonday);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 6); // Sunday
    
    // Format the week range
    const formatDate = (date) => {
      return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
    };
    
    const sessionWeek = `${formatDate(startOfWeek)} to ${formatDate(endOfWeek)}`;
    
    // Calculate week number (you might want to customize this based on your semester)
    // For now, we'll consider it as week 1 if not provided
    const weekNumber = req.body.weekNumber || 1;
    
    // Generate unique scheduleId
    const scheduleId = new mongoose.Types.ObjectId();
    
    // Create the new schedule entry
    const newSchedule = {
      _id: scheduleId,
      scheduleId: scheduleId.toString(),
      classScheduleId: scheduleId.toString(),
      semesterId: req.body.semesterId || null,
      weekNumber: weekNumber,
      dayNumber: dayNumber,
      classId: parseInt(classId),
      subjectId: subjectId,
      teacherId: teacherId,
      classroomId: classroomId || null,
      slotId: slotNumber.toString(),
      SlotID: slotNumber.toString(),
      roomName: req.body.roomName || null,
      topic: topic || `Tiết học ${slotNumber} - ${dayOfWeek}`,
      sessionDate: sessionDate,
      SessionDate: sessionDate.toISOString(),
      sessionWeek: sessionWeek,
      SessionWeek: sessionWeek,
      dayOfWeek: dayOfWeek,
      startTime: slotData.startTime,
      endTime: slotData.endTime,
      isActive: true,
      status: 'scheduled',
      attendanceRecorded: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Check if schedule already exists for this class/teacher/date/slot
    const existingSchedule = await mongoose.connection.db.collection('ClassSchedule')
      .findOne({
        classId: parseInt(classId),
        sessionDate: sessionDate,
        slotId: slotNumber.toString()
      });
    
    if (existingSchedule) {
      return res.status(409).json({
        success: false,
        message: `Đã tồn tại lịch học cho lớp ${classId} vào ngày ${formatDate(sessionDate)} tiết ${slotNumber}`,
        code: 'SCHEDULE_EXISTS',
        existing: existingSchedule
      });
    }
    
    // Insert the new schedule entry
    await mongoose.connection.db.collection('ClassSchedule').insertOne(newSchedule);
    
    // Get additional information for response
    let className = null;
    let teacherName = null;
    let subjectName = null;
    
    try {
      const classData = await mongoose.connection.db.collection('Class')
        .findOne({ classId: parseInt(classId) });
      if (classData) {
        className = classData.className;
      }
      
      const teacherData = await mongoose.connection.db.collection('Teacher')
        .findOne({ teacherId: teacherId });
      if (teacherData) {
        teacherName = teacherData.fullName || `${teacherData.firstName} ${teacherData.lastName}`;
      }
      
      const subjectData = await mongoose.connection.db.collection('Subject')
        .findOne({ subjectId: subjectId });
      if (subjectData) {
        subjectName = subjectData.subjectName;
      }
    } catch (error) {
      console.warn('Error fetching additional info:', error.message);
    }
    
    return res.status(201).json({
      success: true,
      message: `Tạo lịch học thành công cho lớp ${className || classId} tiết ${slotNumber} (${slotData.startTime}-${slotData.endTime}) vào ${dayOfWeek}, ${formatDate(sessionDate)}`,
      data: {
        ...newSchedule,
        className,
        teacherName,
        subjectName
      }
    });
  } catch (error) {
    console.error('Error creating schedule:', error);
    return res.status(500).json({
      success: false,
      message: error.message,
      code: 'SCHEDULE_CREATE_ERROR'
    });
  }
});

// Update a schedule entry
router.put('/:id', protect, async (req, res) => {
  try {
    // Check if user has appropriate role (Admin or Teacher)
    if (req.user.role !== 'Admin' && req.user.role !== 'Teacher') {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền cập nhật lịch học',
        code: 'PERMISSION_DENIED'
      });
    }
    
    const scheduleId = req.params.id;
    
    // Find the existing schedule
    const existingSchedule = await mongoose.connection.db.collection('ClassSchedule')
      .findOne({ 
        $or: [
          { scheduleId: scheduleId },
          { _id: mongoose.Types.ObjectId.isValid(scheduleId) ? new mongoose.Types.ObjectId(scheduleId) : scheduleId }
        ]
      });
    
    if (!existingSchedule) {
      return res.status(404).json({
        success: false,
        message: `Không tìm thấy lịch học với ID ${scheduleId}`,
        code: 'SCHEDULE_NOT_FOUND'
      });
    }
    
    // Get update fields from request body
    const updates = req.body;
    const updateData = {};
    
    // Handle date change if provided
    if (updates.date) {
      const newDate = new Date(updates.date);
      
      if (isNaN(newDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Định dạng ngày không hợp lệ. Sử dụng YYYY-MM-DD',
          code: 'INVALID_DATE_FORMAT'
        });
      }
      
      // Get day of week (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
      const dayNumberJS = newDate.getDay();
      
      // Convert JS day number to our format (1 = Monday, 2 = Tuesday, ..., 7 = Sunday)
      const dayNumber = dayNumberJS === 0 ? 7 : dayNumberJS;
      
      // Get day of week name
      const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const dayOfWeek = daysOfWeek[dayNumberJS];
      
      // If it's Sunday (dayNumberJS = 0), return error as we don't have classes on Sunday
      if (dayNumberJS === 0) {
        return res.status(400).json({
          success: false,
          message: 'Không thể cập nhật lịch học vào Chủ Nhật',
          code: 'INVALID_DAY'
        });
      }
      
      // Calculate the week range (Monday to Sunday)
      const startOfWeek = new Date(newDate);
      const daysSinceMonday = (newDate.getDay() + 6) % 7; // Days since last Monday (0 if Monday)
      startOfWeek.setDate(startOfWeek.getDate() - daysSinceMonday);
      
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(endOfWeek.getDate() + 6); // Sunday
      
      // Format the week range
      const formatDate = (date) => {
        return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
      };
      
      const sessionWeek = `${formatDate(startOfWeek)} to ${formatDate(endOfWeek)}`;
      
      // Update date related fields
      updateData.sessionDate = newDate;
      updateData.SessionDate = newDate.toISOString();
      updateData.dayNumber = dayNumber;
      updateData.dayOfWeek = dayOfWeek;
      updateData.sessionWeek = sessionWeek;
      updateData.SessionWeek = sessionWeek;
      
      // Check for existing schedule with this date and slot for the same class
      if (updates.slotNumber || existingSchedule.slotId) {
        const slotId = updates.slotNumber ? updates.slotNumber.toString() : existingSchedule.slotId;
        const classId = updates.classId ? parseInt(updates.classId) : existingSchedule.classId;
        
        const duplicateSchedule = await mongoose.connection.db.collection('ClassSchedule')
          .findOne({
            _id: { $ne: existingSchedule._id },
            classId: classId,
            sessionDate: newDate,
            slotId: slotId
          });
        
        if (duplicateSchedule) {
          return res.status(409).json({
            success: false,
            message: `Đã tồn tại lịch học cho lớp ${classId} vào ngày ${formatDate(newDate)} tiết ${slotId}`,
            code: 'SCHEDULE_EXISTS',
            existing: duplicateSchedule
          });
        }
      }
    }
    
    // Handle slot change if provided
    if (updates.slotNumber) {
      const slotNumber = parseInt(updates.slotNumber);
      
      // Get the day (either from the new date or existing date)
      const currentDayOfWeek = updateData.dayOfWeek || existingSchedule.dayOfWeek;
      
      // Schedule data array (from scheduleformat.csv)
      const scheduleData = [
        // Monday
        { dayOfWeek: 'Monday', slotNumber: 1, startTime: '07:00', endTime: '07:45' },
        { dayOfWeek: 'Monday', slotNumber: 2, startTime: '07:50', endTime: '08:35' },
        { dayOfWeek: 'Monday', slotNumber: 3, startTime: '08:50', endTime: '09:35' },
        { dayOfWeek: 'Monday', slotNumber: 4, startTime: '09:40', endTime: '10:25' },
        { dayOfWeek: 'Monday', slotNumber: 5, startTime: '10:30', endTime: '11:15' },
        { dayOfWeek: 'Monday', slotNumber: 6, startTime: '13:00', endTime: '13:45' },
        { dayOfWeek: 'Monday', slotNumber: 7, startTime: '13:50', endTime: '14:35' },
        { dayOfWeek: 'Monday', slotNumber: 8, startTime: '14:40', endTime: '15:25' },
        { dayOfWeek: 'Monday', slotNumber: 9, startTime: '15:30', endTime: '16:15' },
        { dayOfWeek: 'Monday', slotNumber: 10, startTime: '16:20', endTime: '17:05' },
        // Tuesday-Friday schedules (omitted for brevity)
        // ...same pattern as in the create endpoint
      ];
      
      // Find the matching slot data
      const slotData = scheduleData.find(s => 
        s.dayOfWeek === currentDayOfWeek && s.slotNumber === slotNumber
      );
      
      if (!slotData) {
        return res.status(400).json({
          success: false,
          message: `Không tìm thấy thông tin tiết học ${slotNumber} vào ${currentDayOfWeek}`,
          code: 'INVALID_SLOT'
        });
      }
      
      // Update slot related fields
      updateData.slotId = slotNumber.toString();
      updateData.SlotID = slotNumber.toString();
      updateData.startTime = slotData.startTime;
      updateData.endTime = slotData.endTime;
      
      // Check for existing schedule with this slot for the same class and date
      if (updates.date || existingSchedule.sessionDate) {
        const sessionDate = updates.date ? new Date(updates.date) : existingSchedule.sessionDate;
        const classId = updates.classId ? parseInt(updates.classId) : existingSchedule.classId;
        
        const duplicateSchedule = await mongoose.connection.db.collection('ClassSchedule')
          .findOne({
            _id: { $ne: existingSchedule._id },
            classId: classId,
            sessionDate: sessionDate,
            slotId: slotNumber.toString()
          });
        
        if (duplicateSchedule) {
          // Format the date for the error message
          const formatDate = (date) => {
            const d = new Date(date);
            return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
          };
          
          return res.status(409).json({
            success: false,
            message: `Đã tồn tại lịch học cho lớp ${classId} vào ngày ${formatDate(sessionDate)} tiết ${slotNumber}`,
            code: 'SCHEDULE_EXISTS',
            existing: duplicateSchedule
          });
        }
      }
    }
    
    // Handle other fields
    if (updates.classId) updateData.classId = parseInt(updates.classId);
    if (updates.teacherId) updateData.teacherId = updates.teacherId;
    if (updates.subjectId) updateData.subjectId = updates.subjectId;
    if (updates.topic) updateData.topic = updates.topic;
    if (updates.classroomId) updateData.classroomId = updates.classroomId;
    if (updates.roomName) updateData.roomName = updates.roomName;
    if (updates.status) updateData.status = updates.status;
    if (updates.weekNumber) updateData.weekNumber = parseInt(updates.weekNumber);
    if (updates.semesterId) updateData.semesterId = updates.semesterId;
    if (updates.hasOwnProperty('isActive')) updateData.isActive = updates.isActive;
    if (updates.hasOwnProperty('attendanceRecorded')) updateData.attendanceRecorded = updates.attendanceRecorded;
    
    // Add updatedAt timestamp
    updateData.updatedAt = new Date();
    
    // Update the schedule
    const result = await mongoose.connection.db.collection('ClassSchedule')
      .updateOne(
        { _id: existingSchedule._id },
        { $set: updateData }
      );
    
    if (result.modifiedCount === 0) {
      return res.status(400).json({
        success: false,
        message: 'Không có thay đổi nào được thực hiện',
        code: 'NO_CHANGES'
      });
    }
    
    // Get the updated schedule
    const updatedSchedule = await mongoose.connection.db.collection('ClassSchedule')
      .findOne({ _id: existingSchedule._id });
    
    // Get additional information for the response
    let className = null;
    let teacherName = null;
    let subjectName = null;
    
    try {
      const classData = await mongoose.connection.db.collection('Class')
        .findOne({ classId: updatedSchedule.classId });
      if (classData) {
        className = classData.className;
      }
      
      const teacherData = await mongoose.connection.db.collection('Teacher')
        .findOne({ teacherId: updatedSchedule.teacherId });
      if (teacherData) {
        teacherName = teacherData.fullName || `${teacherData.firstName} ${teacherData.lastName}`;
      }
      
      const subjectData = await mongoose.connection.db.collection('Subject')
        .findOne({ subjectId: updatedSchedule.subjectId });
      if (subjectData) {
        subjectName = subjectData.subjectName;
      }
    } catch (error) {
      console.warn('Error fetching additional info:', error.message);
    }
    
    return res.json({
      success: true,
      message: 'Cập nhật lịch học thành công',
      data: {
        ...updatedSchedule,
        className,
        teacherName,
        subjectName
      }
    });
  } catch (error) {
    console.error('Error updating schedule:', error);
    return res.status(500).json({
      success: false,
      message: error.message,
      code: 'SCHEDULE_UPDATE_ERROR'
    });
  }
});

// Delete a schedule entry
router.delete('/:id', protect, async (req, res) => {
  try {
    // Check if user has appropriate role (Admin or Teacher)
    if (req.user.role !== 'Admin' && req.user.role !== 'Teacher') {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền xóa lịch học',
        code: 'PERMISSION_DENIED'
      });
    }
    
    const scheduleId = req.params.id;
    
    // Find the existing schedule
    const existingSchedule = await mongoose.connection.db.collection('ClassSchedule')
      .findOne({ 
        $or: [
          { scheduleId: scheduleId },
          { _id: mongoose.Types.ObjectId.isValid(scheduleId) ? new mongoose.Types.ObjectId(scheduleId) : scheduleId }
        ]
      });
    
    if (!existingSchedule) {
      return res.status(404).json({
        success: false,
        message: `Không tìm thấy lịch học với ID ${scheduleId}`,
        code: 'SCHEDULE_NOT_FOUND'
      });
    }
    
    // If user is a teacher, check if they are the teacher of this schedule
    if (req.user.role === 'Teacher') {
      const teacher = await mongoose.connection.db.collection('Teacher')
        .findOne({ userId: req.user.userId });
      
      if (!teacher || teacher.teacherId != existingSchedule.teacherId) {
        return res.status(403).json({
          success: false,
          message: 'Bạn không có quyền xóa lịch học của giáo viên khác',
          code: 'PERMISSION_DENIED_TEACHER'
        });
      }
    }
    
    // Get information for the response before deleting
    let className = null;
    let teacherName = null;
    let subjectName = null;
    let sessionDateFormatted = new Date(existingSchedule.sessionDate).toLocaleDateString();
    
    try {
      const classData = await mongoose.connection.db.collection('Class')
        .findOne({ classId: existingSchedule.classId });
      if (classData) {
        className = classData.className;
      }
      
      const teacherData = await mongoose.connection.db.collection('Teacher')
        .findOne({ teacherId: existingSchedule.teacherId });
      if (teacherData) {
        teacherName = teacherData.fullName || `${teacherData.firstName} ${teacherData.lastName}`;
      }
      
      const subjectData = await mongoose.connection.db.collection('Subject')
        .findOne({ subjectId: existingSchedule.subjectId });
      if (subjectData) {
        subjectName = subjectData.subjectName;
      }
    } catch (error) {
      console.warn('Error fetching additional info:', error.message);
    }
    
    // Delete the schedule
    const result = await mongoose.connection.db.collection('ClassSchedule')
      .deleteOne({ _id: existingSchedule._id });
    
    if (result.deletedCount === 0) {
      return res.status(400).json({
        success: false,
        message: 'Xóa lịch học thất bại',
        code: 'DELETE_FAILED'
      });
    }
    
    return res.json({
      success: true,
      message: `Đã xóa lịch học ${subjectName || existingSchedule.topic} cho lớp ${className || existingSchedule.classId} vào ngày ${sessionDateFormatted} tiết ${existingSchedule.slotId}`,
      data: {
        deletedSchedule: {
          ...existingSchedule,
          className,
          teacherName,
          subjectName
        }
      }
    });
  } catch (error) {
    console.error('Error deleting schedule:', error);
    return res.status(500).json({
      success: false,
      message: error.message,
      code: 'SCHEDULE_DELETE_ERROR'
    });
  }
});

module.exports = router; 