const express = require('express');
const { 
  getWeeklySchedule, 
  getDailySchedule, 
  getSemesterSchedule,
  getCurrentSemester,
  getAllSemesters,
  getCurrentWeekRange,
  getScheduleByWeekRange,
  createSchedule
} = require('../controllers/scheduleController');
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
    // Since we're not requiring authentication, provide a helpful error
    return res.status(400).json({
      success: false,
      message: 'This endpoint has been modified. Please use specific endpoints like /class/:classId or /user/:userId instead.',
      code: 'ENDPOINT_MODIFIED'
    });
    
    // The original implementation relied on auth which we've removed
    /* Original code removed for clarity */
  } catch (error) {
    console.error('Error in /me endpoint:', error);
    return res.status(500).json({
      success: false,
      message: error.message,
      code: 'SERVER_ERROR'
    });
  }
});

// Student endpoint - also needs to be modified since it relied on authentication
router.get('/student', async (req, res) => {
  try {
    // Since we're not requiring authentication, provide a helpful error
    return res.status(400).json({
      success: false,
      message: 'This endpoint has been modified. Please provide a studentId parameter like /student?studentId=123',
      code: 'ENDPOINT_MODIFIED'
    });
    
    // Original implementation relied on auth which we've removed
  } catch (error) {
    console.error('Error in /student endpoint:', error);
    return res.status(500).json({
      success: false,
      message: error.message,
      code: 'SERVER_ERROR'
    });
  }
});

// Endpoint to update SessionWeek field for all schedules
router.post('/update-session-weeks', async (req, res) => {
  try {
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

// Endpoint to check and fix SessionWeek field for a specific week
router.post('/check-week/:weekRange', async (req, res) => {
  try {
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
router.get('/all', async (req, res) => {
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
    
    // User ID filter
    if (userId) {
      // First need to determine if this is a student or teacher
      const userData = await mongoose.connection.db.collection('UserAccount')
        .findOne({ userId: userId });
      
      if (!userData) {
        return res.status(404).json({
          success: false,
          message: `User with ID ${userId} not found`,
          code: 'USER_NOT_FOUND'
        });
      }
      
      // Handle based on user role
      if (userData.role === 'student' || userData.role === 'Student') {
        // Get student's class
        const studentData = await mongoose.connection.db.collection('Student')
          .findOne({ userId: userId });
          
        if (studentData && studentData.classId) {
          query.classId = studentData.classId;
        } else {
          return res.status(404).json({
            success: false,
            message: `No class assigned to student with ID ${userId}`,
            code: 'NO_CLASS_ASSIGNED'
          });
        }
      } else if (userData.role === 'teacher' || userData.role === 'Teacher') {
        // Get teacher's ID
        const teacherData = await mongoose.connection.db.collection('Teacher')
          .findOne({ userId: userId });
          
        if (teacherData && teacherData.teacherId) {
          query.teacherId = teacherData.teacherId;
        } else {
          return res.status(404).json({
            success: false,
            message: `No teacher data found for user ID ${userId}`,
            code: 'NO_TEACHER_DATA'
          });
        }
      }
    }
    
    // Class ID filter
    if (classId) {
      query.classId = parseInt(classId);
    }
    
    // Teacher ID filter
    if (teacherId) {
      query.teacherId = parseInt(teacherId);
    }
    
    // Subject ID filter
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
      count: enhancedSchedules.length,
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
router.get('/class/:className', async (req, res) => {
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
router.get('/user/:userId', async (req, res) => {
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
      let teacherInfo = await mongoose.connection.db.collection('Teacher')
        .findOne({ teacherId: parseInt(teacherId) });
        
      if (!teacherInfo || !teacherInfo.teacherId) {
        return res.status(404).json({
          success: false,
          message: `No teacherId found for user with ID ${userId}`,
          code: 'NO_TEACHER_FOUND'
        });
      }
      
      query.teacherId = teacherInfo.teacherId;
      contextData.teacher = teacherInfo;
      contextData.teacherId = teacherInfo.teacherId;
      
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

// Route to create a new schedule (all roles allowed, no authentication)
router.post('/', createSchedule);

// GET /api/schedules/slot-details/:slotId - Get slot details
router.get('/slot-details/:slotId', async (req, res) => {
  try {
    const slotId = parseInt(req.params.slotId);
    
    if (isNaN(slotId)) {
      return res.status(400).json({
        success: false,
        message: 'SlotId không hợp lệ',
        code: 'INVALID_SLOT_ID'
      });
    }
    
    const slotInfo = await mongoose.connection.db.collection('ScheduleFormat')
      .findOne({ slotNumber: slotId });
    
    if (!slotInfo) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thông tin slot',
        code: 'SLOT_NOT_FOUND'
      });
    }
    
    return res.status(200).json({
      success: true,
      data: slotInfo
    });
  } catch (error) {
    console.error('Lỗi khi lấy thông tin slot:', error);
    return res.status(500).json({
      success: false,
      message: error.message,
      code: 'SERVER_ERROR'
    });
  }
});

// GET /api/schedules/teachers-by-subject/:subjectId - Get teachers by subject
router.get('/teachers-by-subject/:subjectId', async (req, res) => {
  try {
    const subjectId = parseInt(req.params.subjectId);
    
    if (isNaN(subjectId)) {
      return res.status(400).json({
        success: false,
        message: 'SubjectId không hợp lệ',
        code: 'INVALID_SUBJECT_ID'
      });
    }
    
    // Lấy thông tin môn học
    const subject = await mongoose.connection.db.collection('Subject')
      .findOne({ subjectId: subjectId });
    
    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy môn học',
        code: 'SUBJECT_NOT_FOUND'
      });
    }
    
    // Lấy tất cả giáo viên thay vì lọc theo major
    const allTeachers = await mongoose.connection.db.collection('Teacher')
      .find({})
      .project({ teacherId: 1, userId: 1, fullName: 1, major: 1, _id: 0 })
      .toArray();
    
    return res.status(200).json({
      success: true,
      count: allTeachers.length,
      data: allTeachers
    });
  } catch (error) {
    console.error('Lỗi khi lấy danh sách giáo viên theo môn học:', error);
    return res.status(500).json({
      success: false,
      message: error.message,
      code: 'SERVER_ERROR'
    });
  }
});

// Update an existing schedule
router.put('/:scheduleId', async (req, res) => {
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
      isActive,
      customStartTime,
      customEndTime
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
    if (customStartTime !== undefined) updateData.customStartTime = customStartTime;
    if (customEndTime !== undefined) updateData.customEndTime = customEndTime;
    
    // Validate slotId exists in ScheduleFormat
    if (slotId !== undefined) {
      const scheduleFormat = await mongoose.connection.db.collection('ScheduleFormat')
        .findOne({ slotId: parseInt(slotId) });
        
      if (!scheduleFormat) {
        return res.status(404).json({
          success: false,
          message: `Slot with ID ${slotId} not found in ScheduleFormat`,
          code: 'SLOT_NOT_FOUND'
        });
      }
    }
    
    // If custom time and day are provided but slotId is not, try to find matching slot or create new one
    if (customStartTime && customEndTime && req.body.dayOfWeek && slotId === undefined) {
      // Check if a slot with these parameters already exists
      const existingSlot = await mongoose.connection.db.collection('ScheduleFormat')
        .findOne({ 
          startTime: customStartTime, 
          endTime: customEndTime,
          dayOfWeek: req.body.dayOfWeek
        });
      
      if (existingSlot) {
        // Use existing slot
        updateData.slotId = existingSlot.slotId;
      } else {
        // Create a new slot
        // First, find max slotId to generate next one
        const maxSlotResult = await mongoose.connection.db.collection('ScheduleFormat')
          .find()
          .sort({ slotId: -1 })
          .limit(1)
          .toArray();
        
        const nextSlotId = maxSlotResult.length > 0 ? maxSlotResult[0].slotId + 1 : 1;
        const nextSlotNumber = maxSlotResult.length > 0 ? maxSlotResult[0].slotNumber + 1 : 1;
        
        const newSlot = {
          slotId: nextSlotId,
          slotNumber: nextSlotNumber,
          slotName: `Slot ${nextSlotNumber}`,
          dayOfWeek: req.body.dayOfWeek,
          startTime: customStartTime,
          endTime: customEndTime,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        // Insert new slot
        await mongoose.connection.db.collection('ScheduleFormat').insertOne(newSlot);
        console.log(`Created new slot with ID ${nextSlotId}`);
        
        // Use the new slot ID
        updateData.slotId = nextSlotId;
      }
    }
      
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
/**
 * API Xóa lịch thời khóa biểu và attendance logs
 * 
 * Cải tiến:
 * 1. Kiểm tra tồn tại trước khi xóa
 * 2. Xóa bản ghi lịch học từ ClassSchedule
 * 3. Xóa tất cả bản ghi attendance logs liên quan
 * 4. Trả về thông tin chi tiết về số bản ghi đã xóa
 */
router.delete('/:scheduleId', async (req, res) => {
  try {
    const { scheduleId } = req.params;
    const scheduleIdInt = parseInt(scheduleId);

    // Check if the schedule exists
    const existingSchedule = await mongoose.connection.db.collection('ClassSchedule')
      .findOne({ scheduleId: scheduleIdInt });
    
    if (!existingSchedule) {
      return res.status(404).json({
        success: false,
        message: `Lịch học với ID ${scheduleId} không tồn tại`,
        code: 'SCHEDULE_NOT_FOUND'
      });
    }
    
    // Ghi log tiến trình
    console.log(`Đang xóa lịch học ID ${scheduleId} và các attendance logs liên quan...`);
    
    // 1. Find and delete all attendance logs associated with this schedule
    const attendanceResult = await mongoose.connection.db.collection('AttendanceLog')
      .deleteMany({ scheduleId: scheduleIdInt });
      
    console.log(`Đã xóa ${attendanceResult.deletedCount} attendance logs cho lịch học ID ${scheduleId}`);
    
    // 2. Delete the schedule itself
    const scheduleResult = await mongoose.connection.db.collection('ClassSchedule')
      .deleteOne({ scheduleId: scheduleIdInt });
    
    if (scheduleResult.deletedCount === 0) {
      return res.status(400).json({
        success: false,
        message: 'Không thể xóa lịch học',
        code: 'DELETE_FAILED'
      });
    }
    
    // Trả về thông tin chi tiết về việc xóa
    res.json({
      success: true,
      message: `Đã xóa thành công lịch học ID ${scheduleId}`,
      data: {
        scheduleDeleted: true,
        attendanceLogsDeleted: attendanceResult.deletedCount,
      },
      code: 'SCHEDULE_DELETED'
    });
  } catch (error) {
    console.error('Lỗi khi xóa lịch học:', error);
    res.status(500).json({
      success: false,
      message: error.message,
      code: 'SCHEDULE_DELETE_ERROR'
    });
  }
});

module.exports = router; 