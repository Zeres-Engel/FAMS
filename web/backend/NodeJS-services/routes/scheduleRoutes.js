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

// Create a new schedule
router.post('/', protect, async (req, res) => {
  try {
    const { 
      semesterId,
      semesterNumber,
      classId, 
      subjectId,
      teacherId, 
      teacherUserId, 
      classroomId, 
      slotId,
      topic,
      sessionDate,
      isActive = true
    } = req.body;
    
    // Resolve teacherId if teacherUserId is provided instead
    let resolvedTeacherId = teacherId;
    
    if (!resolvedTeacherId && teacherUserId) {
      // Find the teacher by userId
      const teacher = await mongoose.connection.db.collection('Teacher')
        .findOne({ userId: teacherUserId });
      
      if (!teacher) {
        return res.status(404).json({
          success: false,
          message: `Teacher with userId ${teacherUserId} not found`,
          code: 'TEACHER_NOT_FOUND'
        });
      }
      
      resolvedTeacherId = teacher.teacherId;
    }

    // Validate required fields
    if (!semesterId || !classId || !subjectId || !resolvedTeacherId || !classroomId || !slotId || !sessionDate) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
        code: 'MISSING_FIELDS'
      });
    }

    // Parse the session date
    const parsedSessionDate = new Date(sessionDate);
    if (isNaN(parsedSessionDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format',
        code: 'INVALID_DATE'
      });
    }

    // Get the next available scheduleId
    const latestSchedule = await mongoose.connection.db.collection('ClassSchedule')
      .find({})
      .sort({ scheduleId: -1 })
      .limit(1)
      .toArray();

    const nextScheduleId = latestSchedule.length > 0 ? latestSchedule[0].scheduleId + 1 : 1;

    // Calculate the session week
    const startOfWeek = scheduleService.getStartOfWeek(parsedSessionDate);
    const sessionWeek = scheduleService.getWeekRangeString(startOfWeek);

    // Get the day of week
    const dayOfWeek = scheduleService.getDayOfWeekFromDate(parsedSessionDate);

    // Create new schedule document
    const newSchedule = {
      scheduleId: nextScheduleId,
      semesterId: parseInt(semesterId),
      semesterNumber: parseInt(semesterNumber || 1),
      classId: parseInt(classId),
      subjectId: parseInt(subjectId),
      teacherId: parseInt(resolvedTeacherId),
      classroomId: parseInt(classroomId),
      slotId: parseInt(slotId),
      topic: topic || `Unnamed Topic`,
      sessionDate: parsedSessionDate,
      sessionWeek: sessionWeek,
      dayOfWeek: dayOfWeek,
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: isActive
    };

    // Insert the new schedule
    const result = await mongoose.connection.db.collection('ClassSchedule').insertOne(newSchedule);

    // Get slot time information
    const slot = await mongoose.connection.db.collection('ScheduleFormat')
      .findOne({ slotId: parseInt(slotId) });

    // Add slot time info if available
    if (slot) {
      newSchedule.startTime = slot.startTime;
      newSchedule.endTime = slot.endTime;
    }
    
    // Get teacher details including userId and fullName
    const teacher = await mongoose.connection.db.collection('Teacher')
      .findOne({ teacherId: parseInt(resolvedTeacherId) });
    
    if (teacher) {
      newSchedule.teacherUserId = teacher.userId;
      newSchedule.teacherName = teacher.fullName;
    }

    res.status(201).json({
      success: true,
      message: 'Schedule created successfully',
      data: newSchedule,
      code: 'SCHEDULE_CREATED'
    });
  } catch (error) {
    console.error('Error creating schedule:', error);
    res.status(500).json({
      success: false,
      message: error.message,
      code: 'SCHEDULE_CREATE_ERROR'
    });
  }
});

// Update an existing schedule
router.put('/:scheduleId', protect, async (req, res) => {
  try {
    const { scheduleId } = req.params;
    const {
      semesterId,
      semesterNumber,
      classId,
      subjectId,
      teacherId,
      teacherUserId,
      classroomId,
      slotId,
      topic,
      sessionDate,
      isActive
    } = req.body;
    
    // Find the existing schedule
    const existingSchedule = await mongoose.connection.db.collection('ClassSchedule')
      .findOne({ scheduleId: parseInt(scheduleId) });
    
    if (!existingSchedule) {
      return res.status(404).json({
        success: false,
        message: `Schedule with ID ${scheduleId} not found`,
        code: 'SCHEDULE_NOT_FOUND'
      });
    }
    
    // Build update document
    const updateData = {
      updatedAt: new Date()
    };
    
    // Resolve teacherId if teacherUserId is provided
    let resolvedTeacherId = teacherId;
    if (!resolvedTeacherId && teacherUserId) {
      // Find the teacher by userId
      const teacher = await mongoose.connection.db.collection('Teacher')
        .findOne({ userId: teacherUserId });
        
      if (!teacher) {
        return res.status(404).json({
          success: false,
          message: `Teacher with userId ${teacherUserId} not found`,
          code: 'TEACHER_NOT_FOUND'
        });
      }
      
      resolvedTeacherId = teacher.teacherId;
    }
    
    // Only update fields that are provided
    if (semesterId !== undefined) updateData.semesterId = parseInt(semesterId);
    if (semesterNumber !== undefined) updateData.semesterNumber = parseInt(semesterNumber);
    if (classId !== undefined) updateData.classId = parseInt(classId);
    if (subjectId !== undefined) updateData.subjectId = parseInt(subjectId);
    if (resolvedTeacherId !== undefined) updateData.teacherId = parseInt(resolvedTeacherId);
    if (classroomId !== undefined) updateData.classroomId = parseInt(classroomId);
    if (slotId !== undefined) updateData.slotId = parseInt(slotId);
    if (topic !== undefined) updateData.topic = topic;
    if (isActive !== undefined) updateData.isActive = isActive;
      
    // If session date is provided, update sessionDate and calculate sessionWeek
    if (sessionDate) {
      const parsedSessionDate = new Date(sessionDate);
      if (isNaN(parsedSessionDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Invalid date format',
          code: 'INVALID_DATE'
        });
      }
      
      updateData.sessionDate = parsedSessionDate;
      
      // Recalculate the session week and day of week
      const startOfWeek = scheduleService.getStartOfWeek(parsedSessionDate);
      updateData.sessionWeek = scheduleService.getWeekRangeString(startOfWeek);
      updateData.dayOfWeek = scheduleService.getDayOfWeekFromDate(parsedSessionDate);
    }
    
    // Update the schedule
    const result = await mongoose.connection.db.collection('ClassSchedule').updateOne(
      { scheduleId: parseInt(scheduleId) },
        { $set: updateData }
      );
    
    if (result.modifiedCount === 0) {
      return res.status(400).json({
        success: false,
        message: 'No changes made to the schedule',
        code: 'NO_CHANGES'
      });
    }
    
    // Get the updated schedule
    const updatedSchedule = await mongoose.connection.db.collection('ClassSchedule')
      .findOne({ scheduleId: parseInt(scheduleId) });
    
    // Format the schedule with additional info
    const formattedSchedule = await scheduleService.formatScheduleData([updatedSchedule], 'list');

    res.json({
      success: true,
      message: 'Schedule updated successfully',
      data: formattedSchedule[0],
      code: 'SCHEDULE_UPDATED'
    });
  } catch (error) {
    console.error('Error updating schedule:', error);
    res.status(500).json({
      success: false,
      message: error.message,
      code: 'SCHEDULE_UPDATE_ERROR'
    });
  }
});

// Delete a schedule
router.delete('/:scheduleId', protect, async (req, res) => {
  try {
    const { scheduleId } = req.params;

    // Check if the schedule exists
    const existingSchedule = await mongoose.connection.db.collection('ClassSchedule')
      .findOne({ scheduleId: parseInt(scheduleId) });
    
    if (!existingSchedule) {
      return res.status(404).json({
        success: false,
        message: `Schedule with ID ${scheduleId} not found`,
        code: 'SCHEDULE_NOT_FOUND'
      });
    }
    
    // Option 1: Hard delete - completely remove the schedule
    const result = await mongoose.connection.db.collection('ClassSchedule')
      .deleteOne({ scheduleId: parseInt(scheduleId) });

    // Option 2: Soft delete - just mark as inactive (uncomment if preferred)
    // const result = await mongoose.connection.db.collection('ClassSchedule')
    //   .updateOne(
    //     { scheduleId: parseInt(scheduleId) },
    //     { $set: { isActive: false, updatedAt: new Date() } }
    //   );
    
    if (result.deletedCount === 0) {
      return res.status(400).json({
        success: false,
        message: 'Failed to delete schedule',
        code: 'DELETE_FAILED'
      });
    }
    
    res.json({
      success: true,
      message: `Schedule with ID ${scheduleId} deleted successfully`,
      code: 'SCHEDULE_DELETED'
    });
  } catch (error) {
    console.error('Error deleting schedule:', error);
    res.status(500).json({
      success: false,
      message: error.message,
      code: 'SCHEDULE_DELETE_ERROR'
    });
  }
});

module.exports = router; 