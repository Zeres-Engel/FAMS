const express = require('express');
const router = express.Router();
const { AttendanceLog } = require('../database/models');
const { protect, authorize } = require('../middleware/authMiddleware');

/**
 * @route   GET /api/attendance/test
 * @desc    Test endpoint to check if attendance API is working
 * @access  Public
 */
router.get('/test', async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      message: 'Attendance API is working correctly',
      timestamp: new Date()
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error testing attendance API',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/attendance/user/:userId
 * @desc    Get attendance logs for a specific user with optional filters
 * @access  Private
 * @query   {String} subjectName - Filter by subject name
 * @query   {String} className - Filter by class name
 * @query   {String} teacherName - Filter by teacher name
 * @query   {String} status - Filter by attendance status
 * @query   {String} from - Start date for date range filter (YYYY-MM-DD)
 * @query   {String} to - End date for date range filter (YYYY-MM-DD)
 * @query   {Number} slotNumber - Filter by slot number
 * @query   {Number} page - Page number for pagination
 * @query   {Number} limit - Number of records per page
 */
router.get('/user/:userId', protect, async (req, res) => {
  try {
    const { userId } = req.params;
    const { 
      subjectName, 
      className, 
      teacherName,
      status,
      from,
      to,
      slotNumber,
      page = 1, 
      limit = 10
    } = req.query;

    // Build query filter
    const filter = { userId, isActive: true };
    
    // Add optional filters if provided
    if (subjectName) filter.subjectName = { $regex: subjectName, $options: 'i' };
    if (className) filter.className = { $regex: className, $options: 'i' };
    if (teacherName) filter.teacherName = { $regex: teacherName, $options: 'i' };
    if (status) filter.status = status;
    
    // Add date range filter if provided
    if (from || to) {
      filter.createdAt = {};
      if (from) {
        const fromDate = new Date(from);
        fromDate.setHours(0, 0, 0, 0);
        filter.createdAt.$gte = fromDate;
      }
      if (to) {
        const toDate = new Date(to);
        toDate.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = toDate;
      }
    }

    // Calculate pagination
    const skip = (page - 1) * limit;
    
    // Get ClassSchedule data with slotInfo and UserAccount with avatar
    const { ClassSchedule, UserAccount } = require('../database/models');
    
    // First get attendance logs
    const baseAttendanceLogs = await AttendanceLog.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    // Enhance attendance logs with data from related collections
    const enhancedLogs = await Promise.all(baseAttendanceLogs.map(async (log) => {
      const logObj = log.toObject();
      
      // Get schedule information with slot details
      try {
        const schedule = await ClassSchedule.findOne({ scheduleId: log.scheduleId });
        if (schedule) {
          logObj.slotId = schedule.slotId;
          
          // Get slot information if needed
          if (schedule.slotId) {
            const { ScheduleFormat } = require('../database/models');
            const slotInfo = await ScheduleFormat.findOne({ slotId: schedule.slotId });
            if (slotInfo) {
              logObj.slotNumber = slotInfo.slotNumber;
              logObj.dayOfWeek = slotInfo.dayOfWeek;
              logObj.startTime = slotInfo.startTime;
              logObj.endTime = slotInfo.endTime;
            }
          }
        }
      } catch (err) {
        console.error(`Error getting schedule info for scheduleId ${log.scheduleId}:`, err);
      }
      
      // Get user's avatar
      try {
        const user = await UserAccount.findOne({ userId: log.userId }, 'avatar');
        if (user && user.avatar) {
          logObj.avatar = user.avatar;
        }
      } catch (err) {
        console.error(`Error getting avatar for userId ${log.userId}:`, err);
      }
      
      return logObj;
    }));
    
    // If slotNumber filter is specified, filter the enhanced logs
    let filteredLogs = enhancedLogs;
    if (slotNumber) {
      filteredLogs = enhancedLogs.filter(log => log.slotNumber == slotNumber);
    }
    
    // Get total count for pagination (after any additional filtering)
    const totalQuery = { ...filter };
    if (slotNumber) {
      // For proper pagination count with slotNumber, we need a more complex query
      // This is a simplified version, the actual implementation would require an aggregation
      const scheduleIdsWithSlot = await ClassSchedule.find({})
        .populate({
          path: 'slot',
          match: { slotNumber: slotNumber }
        })
        .then(schedules => schedules
          .filter(s => s.slot)
          .map(s => s.scheduleId));
          
      totalQuery.scheduleId = { $in: scheduleIdsWithSlot };
    }
    
    const total = await AttendanceLog.countDocuments(totalQuery);
    
    return res.status(200).json({
      success: true,
      data: {
        records: filteredLogs,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit)
        }
      },
      message: 'Attendance logs retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching attendance logs:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve attendance logs',
      error: error.message
    });
  }
});

/**
 * @route   PUT /api/attendance/:attendanceId
 * @desc    Update attendance record
 * @access  Private (Teachers/Admin only)
 */
router.put('/:attendanceId', protect, authorize('Teacher', 'Admin'), async (req, res) => {
  try {
    const { attendanceId } = req.params;
    const { status, note, checkIn } = req.body;
    
    // Find and update the attendance record
    const updatedAttendance = await AttendanceLog.findOneAndUpdate(
      { attendanceId: parseInt(attendanceId) },
      { 
        status, 
        note, 
        checkIn,
        updatedAt: new Date() 
      },
      { new: true }
    );
    
    if (!updatedAttendance) {
      return res.status(404).json({
        success: false,
        message: 'Attendance record not found',
        code: 'RECORD_NOT_FOUND'
      });
    }
    
    return res.status(200).json({
      success: true,
      data: updatedAttendance,
      message: 'Attendance record updated successfully'
    });
  } catch (error) {
    console.error('Error updating attendance record:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update attendance record',
      error: error.message
    });
  }
});

/**
 * @route   PUT /api/attendance/batch/update
 * @desc    Update multiple attendance records in one request
 * @access  Private (Teachers/Admin only)
 */
router.put('/batch/update', protect, authorize('Teacher', 'Admin'), async (req, res) => {
  try {
    const { attendanceRecords } = req.body;
    
    if (!attendanceRecords || !Array.isArray(attendanceRecords) || attendanceRecords.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No attendance records provided for update',
        code: 'MISSING_RECORDS'
      });
    }
    
    const updatePromises = attendanceRecords.map(async (record) => {
      const { attendanceId, status, note, checkIn } = record;
      
      if (!attendanceId) {
        return { 
          success: false, 
          message: 'Missing attendanceId',
          record
        };
      }
      
      try {
        const updatedRecord = await AttendanceLog.findOneAndUpdate(
          { attendanceId: parseInt(attendanceId) },
          { 
            ...(status && { status }),
            ...(note !== undefined && { note }),
            ...(checkIn !== undefined && { checkIn }),
            updatedAt: new Date()
          },
          { new: true }
        );
        
        if (!updatedRecord) {
          return { 
            success: false, 
            message: 'Record not found',
            attendanceId
          };
        }
        
        return { 
          success: true,
          data: updatedRecord
        };
      } catch (err) {
        return { 
          success: false, 
          message: err.message,
          attendanceId
        };
      }
    });
    
    const results = await Promise.all(updatePromises);
    
    // Count successful and failed updates
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success);
    
    return res.status(200).json({
      success: true,
      message: `Updated ${successful} attendance records, ${failed.length} failed`,
      successCount: successful,
      failedCount: failed.length,
      failedRecords: failed.length > 0 ? failed : undefined,
      results
    });
  } catch (error) {
    console.error('Error in batch update of attendance records:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update attendance records',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/attendance/class/:classId
 * @desc    Get attendance logs for a specific class
 * @access  Private (Teachers/Admin)
 */
router.get('/class/:classId', protect, async (req, res) => {
  try {
    const { classId } = req.params;
    const { date, subjectId, slotNumber, page = 1, limit = 20 } = req.query;
    
    // Build query filter
    const filter = { 
      classId: parseInt(classId),
      isActive: true 
    };
    
    // Add optional date filter if provided
    if (date) {
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
      
      filter.createdAt = { 
        $gte: startDate, 
        $lte: endDate 
      };
    }
    
    // Add subject filter if provided
    if (subjectId) {
      filter.subjectId = parseInt(subjectId);
    }
    
    // Calculate pagination
    const skip = (page - 1) * limit;
    
    // Get required models
    const { ClassSchedule, UserAccount, ScheduleFormat } = require('../database/models');
    
    // Find records with pagination
    const baseAttendanceLogs = await AttendanceLog.find(filter)
      .sort({ createdAt: -1, userId: 1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    // Enhance attendance logs with data from related collections
    const enhancedLogs = await Promise.all(baseAttendanceLogs.map(async (log) => {
      const logObj = log.toObject();
      
      // Get schedule information with slot details
      try {
        const schedule = await ClassSchedule.findOne({ scheduleId: log.scheduleId });
        if (schedule) {
          logObj.slotId = schedule.slotId;
          
          // Get slot information if needed
          if (schedule.slotId) {
            const slotInfo = await ScheduleFormat.findOne({ slotId: schedule.slotId });
            if (slotInfo) {
              logObj.slotNumber = slotInfo.slotNumber;
              logObj.dayOfWeek = slotInfo.dayOfWeek;
              logObj.startTime = slotInfo.startTime;
              logObj.endTime = slotInfo.endTime;
            }
          }
        }
      } catch (err) {
        console.error(`Error getting schedule info for scheduleId ${log.scheduleId}:`, err);
      }
      
      // Get user's avatar
      try {
        const user = await UserAccount.findOne({ userId: log.userId }, 'avatar');
        if (user && user.avatar) {
          logObj.avatar = user.avatar;
        }
      } catch (err) {
        console.error(`Error getting avatar for userId ${log.userId}:`, err);
      }
      
      return logObj;
    }));
    
    // If slotNumber filter is specified, filter the enhanced logs
    let filteredLogs = enhancedLogs;
    if (slotNumber) {
      filteredLogs = enhancedLogs.filter(log => log.slotNumber == slotNumber);
    }
    
    // Get total count for pagination (considering filters)
    const totalQuery = { ...filter };
    if (slotNumber) {
      // For proper pagination count with slotNumber, we need a more complex query
      const scheduleIdsWithSlot = await ClassSchedule.find({})
        .populate({
          path: 'slot',
          match: { slotNumber: slotNumber }
        })
        .then(schedules => schedules
          .filter(s => s.slot)
          .map(s => s.scheduleId));
          
      totalQuery.scheduleId = { $in: scheduleIdsWithSlot };
    }
    
    const total = await AttendanceLog.countDocuments(totalQuery);
    
    return res.status(200).json({
      success: true,
      data: {
        records: filteredLogs,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit)
        }
      },
      message: 'Class attendance logs retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching class attendance logs:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve class attendance logs',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/attendance
 * @desc    Create a new attendance record
 * @access  Private (Teacher/Admin only)
 */
router.post('/', protect, authorize('Teacher', 'Admin'), async (req, res) => {
  try {
    const {
      scheduleId,
      userId,
      checkIn = null,
      note = '',
      status = 'Not Now',
      teacherId,
      teacherName,
      subjectId,
      subjectName,
      classId,
      className,
      classroomId,
      classroomName,
      userRole,
      studentId,
      studentName,
      semesterNumber
    } = req.body;

    // Validate required fields
    if (!scheduleId || !userId || !userRole) {
      return res.status(400).json({
        success: false,
        message: 'Required fields missing: scheduleId, userId, and userRole are required',
        code: 'MISSING_FIELDS'
      });
    }

    // Check if a record already exists for this schedule and student/teacher
    const existingAttendance = await AttendanceLog.findOne({
      scheduleId,
      userId
    });

    if (existingAttendance) {
      return res.status(400).json({
        success: false,
        message: 'Attendance record already exists for this user and schedule',
        code: 'DUPLICATE_RECORD'
      });
    }

    // Get the next available attendanceId
    const lastAttendance = await AttendanceLog.findOne({})
      .sort({ attendanceId: -1 })
      .limit(1);
    
    const attendanceId = lastAttendance ? lastAttendance.attendanceId + 1 : 1;

    // Create new attendance record
    const newAttendance = await AttendanceLog.create({
      attendanceId,
      scheduleId,
      userId,
      checkIn,
      note,
      status,
      userRole,
      teacherId,
      teacherName,
      subjectId,
      subjectName,
      classId,
      className,
      classroomId,
      classroomName,
      studentId,
      studentName,
      semesterNumber,
      isActive: true
    });

    return res.status(201).json({
      success: true,
      data: newAttendance,
      message: 'Attendance record created successfully'
    });
  } catch (error) {
    console.error('Error creating attendance record:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create attendance record',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/attendance/stats
 * @desc    Get attendance statistics
 * @access  Private
 * @query   {String} classId - Filter by class ID
 * @query   {String} teacherId - Filter by teacher ID
 * @query   {String} startDate - Filter from start date
 * @query   {String} endDate - Filter to end date
 */
router.get('/stats', protect, async (req, res) => {
  try {
    const { classId, teacherId, startDate, endDate } = req.query;
    
    // Build filter query
    const filter = { isActive: true };
    
    if (classId) filter.classId = parseInt(classId);
    if (teacherId) filter.teacherId = parseInt(teacherId);
    
    // Add date range filter if provided
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        filter.createdAt.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = end;
      }
    }
    
    // Run aggregation for student attendance statistics
    const studentStats = await AttendanceLog.aggregate([
      { $match: { ...filter, userRole: 'student' } },
      { $group: {
        _id: '$status',
        count: { $sum: 1 }
      }},
      { $sort: { _id: 1 } }
    ]);
    
    // Get total attendance count
    const total = await AttendanceLog.countDocuments({ ...filter, userRole: 'student' });
    
    // Format the statistics
    const stats = {
      total,
      present: 0,
      late: 0,
      absent: 0,
      notNow: 0,
      percentages: {
        present: 0,
        late: 0,
        absent: 0,
        notNow: 0
      }
    };
    
    // Fill in the counts from the aggregation
    studentStats.forEach(stat => {
      const status = stat._id.toLowerCase();
      if (status === 'present') stats.present = stat.count;
      else if (status === 'late') stats.late = stat.count;
      else if (status === 'absent') stats.absent = stat.count;
      else if (status === 'not now') stats.notNow = stat.count;
    });
    
    // Calculate percentages
    if (total > 0) {
      stats.percentages.present = parseFloat(((stats.present / total) * 100).toFixed(2));
      stats.percentages.late = parseFloat(((stats.late / total) * 100).toFixed(2));
      stats.percentages.absent = parseFloat(((stats.absent / total) * 100).toFixed(2));
      stats.percentages.notNow = parseFloat(((stats.notNow / total) * 100).toFixed(2));
    }
    
    return res.status(200).json({
      success: true,
      data: stats,
      message: 'Attendance statistics retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching attendance statistics:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve attendance statistics',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/attendance/check-in
 * @desc    Standard check-in for attendance
 * @access  Private
 */
router.post('/check-in', protect, async (req, res) => {
  try {
    const { 
      scheduleId, 
      userId, 
      checkInFace, 
      note = '',
      status
    } = req.body;

    // Validate required fields
    if (!scheduleId || !userId) {
      return res.status(400).json({
        success: false,
        message: 'Required fields missing: scheduleId and userId are required',
        code: 'MISSING_FIELDS'
      });
    }

    // Find the existing attendance record, or create a new one
    let attendanceRecord = await AttendanceLog.findOne({ 
      scheduleId, 
      userId,
      isActive: true
    });

    const checkInTime = new Date();

    if (attendanceRecord) {
      // Update existing record
      attendanceRecord.checkIn = checkInTime;
      attendanceRecord.checkInFace = checkInFace;
      if (note) attendanceRecord.note = note;
      if (status) attendanceRecord.status = status;
      attendanceRecord.updatedAt = checkInTime;
      
      await attendanceRecord.save();
    } else {
      // Get schedule information to create a new record
      const { ClassSchedule, UserAccount, Teacher, Subject, Class, Classroom } = require('../database/models');
      
      const schedule = await ClassSchedule.findOne({ scheduleId });
      if (!schedule) {
        return res.status(404).json({
          success: false,
          message: 'Schedule not found',
          code: 'SCHEDULE_NOT_FOUND'
        });
      }
      
      // Get user information to determine role
      const user = await UserAccount.findOne({ userId });
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
          code: 'USER_NOT_FOUND'
        });
      }
      
      // Get teacher info
      const teacher = await Teacher.findOne({ teacherId: schedule.teacherId });
      const teacherInfo = teacher || {};
      
      // Get subject info
      const subject = await Subject.findOne({ subjectId: schedule.subjectId });
      const subjectInfo = subject || {};
      
      // Get class info
      const classInfo = await Class.findOne({ classId: schedule.classId }) || {};
      
      // Get classroom info
      const classroom = await Classroom.findOne({ classroomId: schedule.classroomId });
      const classroomInfo = classroom || {};
      
      // Determine student info if applicable
      let studentId = null;
      let studentName = null;
      
      if (user.role === 'student') {
        const { Student } = require('../database/models');
        const student = await Student.findOne({ userId });
        if (student) {
          studentId = student.studentId;
          studentName = student.fullName;
        }
      }
      
      // Get the next available attendanceId
      const lastAttendance = await AttendanceLog.findOne({})
        .sort({ attendanceId: -1 })
        .limit(1);
        
      const attendanceId = lastAttendance ? lastAttendance.attendanceId + 1 : 1;
      
      // Create new attendance record
      attendanceRecord = await AttendanceLog.create({
        attendanceId,
        scheduleId,
        userId,
        checkIn: checkInTime,
        checkInFace,
        note,
        status: status || 'Present',
        userRole: user.role,
        teacherId: schedule.teacherId,
        teacherName: teacherInfo.fullName,
        subjectId: schedule.subjectId,
        subjectName: subjectInfo.subjectName,
        classId: schedule.classId,
        className: classInfo.className,
        studentId,
        studentName,
        classroomId: schedule.classroomId,
        classroomName: classroomInfo.classroomName,
        semesterNumber: schedule.semesterNumber || 1,
        isActive: true
      });
    }

    return res.status(200).json({
      success: true,
      data: attendanceRecord,
      message: 'Attendance check-in successful'
    });
  } catch (error) {
    console.error('Error during attendance check-in:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to process attendance check-in',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/attendance/auto-check-in
 * @desc    Automatic check-in based on time and classroom
 * @access  Private
 */
router.post('/auto-check-in', protect, async (req, res) => {
  try {
    const { 
      userId, 
      checkInFace,
      checkIn,
      classroomId
    } = req.body;

    // Validate required fields
    if (!userId || !classroomId) {
      return res.status(400).json({
        success: false,
        message: 'Required fields missing: userId and classroomId are required',
        code: 'MISSING_FIELDS'
      });
    }

    // Use provided check-in time or current time
    const checkInTime = checkIn ? new Date(checkIn) : new Date();
    
    // Get required models
    const { 
      ClassSchedule, 
      UserAccount, 
      Teacher, 
      Subject, 
      Class, 
      Classroom,
      ScheduleFormat 
    } = require('../database/models');
    
    // Get the day of week
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayOfWeek = days[checkInTime.getDay()];
    
    // Get current time in HH:MM format
    const currentHour = checkInTime.getHours();
    const currentMinute = checkInTime.getMinutes();
    const currentTimeStr = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
    
    // Find all slots for the current day
    const timeSlots = await ScheduleFormat.find({ 
      dayOfWeek,
      isActive: true
    });
    
    // Find which time slot the current time falls into
    let matchingSlot = null;
    for (const slot of timeSlots) {
      const startTimeParts = slot.startTime.split(':').map(Number);
      const endTimeParts = slot.endTime.split(':').map(Number);
      
      const startTimeMinutes = startTimeParts[0] * 60 + startTimeParts[1];
      const endTimeMinutes = endTimeParts[0] * 60 + endTimeParts[1];
      const currentTimeMinutes = currentHour * 60 + currentMinute;
      
      // Check if current time is within this slot's range (with some buffer)
      // Consider up to 30 minutes before start time
      if (currentTimeMinutes >= (startTimeMinutes - 30) && currentTimeMinutes <= endTimeMinutes) {
        matchingSlot = slot;
        break;
      }
    }
    
    if (!matchingSlot) {
      return res.status(404).json({
        success: false,
        message: 'No active class schedule found for the current time',
        code: 'NO_ACTIVE_SCHEDULE'
      });
    }
    
    // Get user information
    const user = await UserAccount.findOne({ userId });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }
    
    // Find scheduled class for this user, classroom, and time slot
    let scheduleQuery = { 
      slotId: matchingSlot.slotId,
      classroomId: parseInt(classroomId),
      isActive: true
    };
    
    // For students, we need to find the class they belong to
    if (user.role === 'student') {
      const { Student } = require('../database/models');
      const student = await Student.findOne({ userId });
      if (student && student.classId) {
        scheduleQuery.classId = student.classId;
      }
    } 
    // For teachers, find their teaching schedule
    else if (user.role === 'teacher') {
      const teacher = await Teacher.findOne({ userId });
      if (teacher && teacher.teacherId) {
        scheduleQuery.teacherId = teacher.teacherId;
      }
    }
    
    // Find the schedule
    const schedule = await ClassSchedule.findOne(scheduleQuery);
    
    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: `No scheduled class found for user ${userId} in classroom ${classroomId} at this time`,
        code: 'NO_MATCHING_SCHEDULE'
      });
    }
    
    // Check if attendance record already exists
    let attendanceRecord = await AttendanceLog.findOne({ 
      scheduleId: schedule.scheduleId,
      userId,
      isActive: true
    });
    
    // Calculate attendance status based on check-in time
    const startTimeParts = matchingSlot.startTime.split(':').map(Number);
    const endTimeParts = matchingSlot.endTime.split(':').map(Number);
    
    const startTimeMinutes = startTimeParts[0] * 60 + startTimeParts[1];
    const endTimeMinutes = endTimeParts[0] * 60 + endTimeParts[1];
    const currentTimeMinutes = currentHour * 60 + currentMinute;
    
    const periodDuration = endTimeMinutes - startTimeMinutes;
    const minutesLate = currentTimeMinutes - startTimeMinutes;
    
    let status;
    let note = '';
    
    // Determine status based on timing rules
    if (minutesLate <= 5) {
      // Within 5 minutes of start time
      status = 'Present';
      note = 'On time';
    } else if (minutesLate >= 15) {
      // More than 15 minutes late
      status = 'Late';
      note = `${minutesLate} minutes late`;
      
      // If more than half the period has passed, mark as absent
      if (minutesLate > periodDuration / 2) {
        status = 'Absent';
        note = `Missed more than half the class period (${Math.round(minutesLate)} minutes late)`;
      }
    } else {
      // Between 5 and 15 minutes late
      status = 'Present';
      note = 'Slightly late but present';
    }
    
    // Get teacher, subject, class and classroom info
    const teacher = await Teacher.findOne({ teacherId: schedule.teacherId });
    const teacherInfo = teacher || {};
    
    const subject = await Subject.findOne({ subjectId: schedule.subjectId });
    const subjectInfo = subject || {};
    
    const classInfo = await Class.findOne({ classId: schedule.classId }) || {};
    
    const classroom = await Classroom.findOne({ classroomId: schedule.classroomId });
    const classroomInfo = classroom || {};
    
    // Determine student info if applicable
    let studentId = null;
    let studentName = null;
    
    if (user.role === 'student') {
      const { Student } = require('../database/models');
      const student = await Student.findOne({ userId });
      if (student) {
        studentId = student.studentId;
        studentName = student.fullName;
      }
    }
    
    if (attendanceRecord) {
      // Update existing record
      attendanceRecord.checkIn = checkInTime;
      attendanceRecord.checkInFace = checkInFace;
      attendanceRecord.status = status;
      attendanceRecord.note = note;
      attendanceRecord.updatedAt = new Date();
      
      await attendanceRecord.save();
    } else {
      // Get the next available attendanceId
      const lastAttendance = await AttendanceLog.findOne({})
        .sort({ attendanceId: -1 })
        .limit(1);
        
      const attendanceId = lastAttendance ? lastAttendance.attendanceId + 1 : 1;
      
      // Create new attendance record
      attendanceRecord = await AttendanceLog.create({
        attendanceId,
        scheduleId: schedule.scheduleId,
        userId,
        checkIn: checkInTime,
        checkInFace,
        note,
        status,
        userRole: user.role,
        teacherId: schedule.teacherId,
        teacherName: teacherInfo.fullName,
        subjectId: schedule.subjectId,
        subjectName: subjectInfo.subjectName,
        classId: schedule.classId,
        className: classInfo.className,
        studentId,
        studentName,
        classroomId: schedule.classroomId,
        classroomName: classroomInfo.classroomName,
        semesterNumber: schedule.semesterNumber || 1,
        isActive: true
      });
    }
    
    // Add schedule and slot information to the response
    const responseData = attendanceRecord.toObject();
    responseData.schedule = {
      scheduleId: schedule.scheduleId,
      topic: schedule.topic
    };
    responseData.slot = {
      slotId: matchingSlot.slotId,
      slotNumber: matchingSlot.slotNumber,
      dayOfWeek: matchingSlot.dayOfWeek,
      startTime: matchingSlot.startTime,
      endTime: matchingSlot.endTime
    };

    return res.status(200).json({
      success: true,
      data: responseData,
      message: `Automatic attendance registered as ${status}` 
    });
  } catch (error) {
    console.error('Error during automatic attendance check-in:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to process automatic attendance check-in',
      error: error.message
    });
  }
});

module.exports = router; 