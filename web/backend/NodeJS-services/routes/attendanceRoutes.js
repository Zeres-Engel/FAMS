const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/auth');
const AttendanceLog = require('../database/models/AttendanceLog');
const ClassSchedule = require('../database/models/ClassSchedule');
const attendanceService = require('../services/attendanceService');
const mongoose = require('mongoose');

/**
 * @route   GET /api/attendance
 * @desc    Get attendance logs with filters
 * @access  Private
 */
router.get('/', isAuthenticated, async (req, res) => {
  try {
    const {
      userId,
      classId,
      date,
      dateFrom,
      dateTo,
      slotNumber,
      slotId,
      subjectId,
      status,
      teacherName,
      semesterNumber,
      page = 1,
      limit = 10
    } = req.query;

    // Prepare filters
    const filters = {
      userId,
      classId,
      date,
      dateFrom,
      dateTo,
      slotNumber,
      slotId,
      subjectId,
      status,
      semesterNumber
    };

    // Add teacher name filter if provided
    if (teacherName) {
      filters.teacherName = teacherName;
    }

    // Get attendance logs
    const { logs, total, pagination } = await attendanceService.getAttendanceLogs(
      filters,
      { page, limit }
    );

    // Send response
    res.status(200).json({
      success: true,
      count: logs.length,
      total,
      pagination,
      data: logs
    });
  } catch (error) {
    console.error('Error fetching attendance logs:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching attendance logs',
      error: error.message,
      code: 'ATTENDANCE_FETCH_ERROR'
    });
  }
});

/**
 * @route   POST /api/attendance
 * @desc    Create a new attendance log
 * @access  Private
 */
router.post('/', isAuthenticated, async (req, res) => {
  try {
    // Create new attendance log
    const newAttendanceLog = await attendanceService.createAttendanceLog(req.body);
    
    res.status(201).json({
      success: true,
      message: 'Attendance log created successfully',
      data: newAttendanceLog
    });
  } catch (error) {
    console.error('Error creating attendance log:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating attendance log',
      error: error.message,
      code: 'ATTENDANCE_CREATE_ERROR'
    });
  }
});

/**
 * @route   POST /api/attendance/batch-update
 * @desc    Batch update attendance records
 * @access  Public
 */
router.post('/batch-update', async (req, res) => {
  try {
    const { attendanceUpdates } = req.body;

    // Batch update attendance logs
    const { updated, errors } = await attendanceService.batchUpdateAttendanceLogs(attendanceUpdates);

    res.status(200).json({
      success: true,
      message: `Processed ${updated.length} updates with ${errors.length} errors`,
      data: {
        updated,
        errors
      }
    });
  } catch (error) {
    console.error('Error batch updating attendance logs:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while batch updating attendance logs',
      error: error.message,
      code: 'ATTENDANCE_BATCH_UPDATE_ERROR'
    });
  }
});

/**
 * @route   GET /api/attendance/date-range/:dateFrom/:dateTo
 * @desc    Get attendance logs for a date range
 * @access  Private
 */
router.get('/date-range/:dateFrom/:dateTo', isAuthenticated, async (req, res) => {
  try {
    const { dateFrom, dateTo } = req.params;
    const {
      userId,
      classId,
      slotNumber,
      slotId,
      subjectId,
      status,
      teacherName,
      semesterNumber,
      page = 1,
      limit = 10
    } = req.query;

    // Validate date format
    if (!isValidDate(dateFrom) || !isValidDate(dateTo)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format. Expected YYYY-MM-DD',
        code: 'INVALID_DATE_FORMAT'
      });
    }

    // Prepare additional filters
    const additionalFilters = {
      userId,
      classId,
      slotNumber,
      slotId,
      subjectId,
      status,
      semesterNumber
    };

    // Add teacher name filter if provided
    if (teacherName) {
      additionalFilters.teacherName = teacherName;
    }

    // Get attendance logs for the date range
    const { logs, total, pagination } = await attendanceService.getAttendanceLogsByDateRange(
      dateFrom,
      dateTo,
      additionalFilters,
      { page, limit }
    );

    // Send response
    res.status(200).json({
      success: true,
      count: logs.length,
      total,
      pagination,
      data: logs
    });
  } catch (error) {
    console.error('Error fetching attendance logs for date range:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching attendance logs for date range',
      error: error.message,
      code: 'DATE_RANGE_ATTENDANCE_FETCH_ERROR'
    });
  }
});

/**
 * @route   GET /api/attendance/user/:userId
 * @desc    Get attendance logs for a specific user
 * @access  Private
 */
router.get('/user/:userId', isAuthenticated, async (req, res) => {
  try {
    const {
      classId,
      date,
      dateFrom,
      dateTo,
      slotNumber,
      slotId,
      subjectId,
      status,
      page = 1,
      limit = 10
    } = req.query;

    // Prepare filters
    const filters = {
      classId,
      date,
      dateFrom,
      dateTo,
      slotNumber,
      slotId,
      subjectId,
      status
    };

    // Get user's attendance logs
    const { logs, total, pagination } = await attendanceService.getUserAttendanceLogs(
      req.params.userId,
      filters,
      { page, limit }
    );

    // Send response
    res.status(200).json({
      success: true,
      count: logs.length,
      total,
      pagination,
      data: logs
    });
  } catch (error) {
    console.error('Error fetching user attendance logs:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching user attendance logs',
      error: error.message,
      code: 'USER_ATTENDANCE_FETCH_ERROR'
    });
  }
});

/**
 * @route   GET /api/attendance/summary/:userId
 * @desc    Get attendance summary for a user
 * @access  Private
 */
router.get('/summary/:userId', isAuthenticated, async (req, res) => {
  try {
    const { semesterNumber, classId, subjectId } = req.query;

    // Get user's attendance summary
    const summary = await attendanceService.getUserAttendanceSummary(
      req.params.userId,
      { semesterNumber, classId, subjectId }
    );

    // Send response
    res.status(200).json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error('Error fetching user attendance summary:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching user attendance summary',
      error: error.message,
      code: 'USER_ATTENDANCE_SUMMARY_ERROR'
    });
  }
});

/**
 * @route   GET /api/attendance/:id
 * @desc    Get attendance log by ID
 * @access  Private
 */
router.get('/:id', isAuthenticated, async (req, res) => {
  try {
    // Find attendance log by ID using service
    const attendanceLog = await attendanceService.getAttendanceLogById(req.params.id);

    res.status(200).json({
      success: true,
      data: attendanceLog
    });
  } catch (error) {
    console.error('Error fetching attendance log:', error);
    
    if (error.message === 'Attendance log not found') {
      return res.status(404).json({
        success: false,
        message: 'Attendance log not found',
        code: 'ATTENDANCE_NOT_FOUND'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error while fetching attendance log',
      error: error.message,
      code: 'ATTENDANCE_FETCH_ERROR'
    });
  }
});

/**
 * @route   GET /api/attendance/class/:classId/date/:date/slot/:slotNumber
 * @desc    Get attendance logs for a specific class, date and slot
 * @access  Private
 */
router.get('/class/:classId/date/:date/slot/:slotNumber', isAuthenticated, async (req, res) => {
  try {
    const { classId, date, slotNumber } = req.params;
    const { subjectId, status, teacherName, userId, slotId } = req.query;
    
    // Prepare filters
    const filters = {
      classId,
      date,
      slotNumber,
      slotId,
      status
    };
    
    // Add optional filters if provided
    if (subjectId) filters.subjectId = subjectId;
    if (teacherName) filters.teacherName = teacherName;
    if (userId) filters.userId = userId;
    
    // Get attendance logs for class and schedule
    const { logs, total, pagination } = await attendanceService.getAttendanceLogs(
      filters,
      { page: 1, limit: 100 } // Higher limit as we usually want all attendance for a class
    );
    
    // Send response
    res.status(200).json({
      success: true,
      count: logs.length,
      total,
      data: logs
    });
  } catch (error) {
    console.error('Error fetching class attendance logs:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching class attendance logs',
      error: error.message,
      code: 'CLASS_ATTENDANCE_FETCH_ERROR'
    });
  }
});

/**
 * @route   GET /api/attendance/class/:classId/slot/:slotId
 * @desc    Get attendance logs for a specific class and slot
 * @access  Private
 */
router.get('/class/:classId/slot/:slotId', isAuthenticated, async (req, res) => {
  try {
    const { classId, slotId } = req.params;
    const { 
      date, 
      dateFrom, 
      dateTo, 
      subjectId, 
      status, 
      teacherName, 
      userId 
    } = req.query;
    
    // Prepare filters
    const filters = {
      classId,
      slotId,
      status
    };
    
    // Add date filters if provided
    if (date) {
      filters.date = date;
    } else if (dateFrom && dateTo) {
      filters.dateFrom = dateFrom;
      filters.dateTo = dateTo;
    }
    
    // Add optional filters if provided
    if (subjectId) filters.subjectId = subjectId;
    if (teacherName) filters.teacherName = teacherName;
    if (userId) filters.userId = userId;
    
    // Get attendance logs
    const { logs, total, pagination } = await attendanceService.getAttendanceLogs(
      filters,
      { page: 1, limit: 100 } // Higher limit as we usually want all attendance for a class
    );
    
    // Send response
    res.status(200).json({
      success: true,
      count: logs.length,
      total,
      data: logs
    });
  } catch (error) {
    console.error('Error fetching class attendance logs by slot:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching class attendance logs by slot',
      error: error.message,
      code: 'CLASS_SLOT_ATTENDANCE_FETCH_ERROR'
    });
  }
});

/**
 * @route   PUT /api/attendance/class/:classId/date/:date/slot/:slotNumber
 * @desc    Update attendance status for a specific class, date and slot
 * @access  Private
 */
router.put('/class/:classId/date/:date/slot/:slotNumber', isAuthenticated, async (req, res) => {
  try {
    const { classId, date, slotNumber } = req.params;
    const { subjectId, userId, status, note, slotId, checkInFace } = req.body;
    
    // Find attendance logs that match the criteria
    const filters = { classId: parseInt(classId) };
    
    // Add more filters if provided
    if (userId) filters.userId = userId;
    if (subjectId) filters.subjectId = parseInt(subjectId);
    
    // Get attendance logs that match slot and date
    let scheduleQuery = {
      sessionDate: new Date(date)
    };
    
    if (slotId) {
      scheduleQuery.slotId = parseInt(slotId);
    } else if (slotNumber) {
      // Find schedules with the given slotNumber
      const scheduleFormats = await mongoose.model('ScheduleFormat').find({ 
        slotNumber: parseInt(slotNumber) 
      });
      
      if (scheduleFormats && scheduleFormats.length > 0) {
        const slotIds = scheduleFormats.map(slot => slot.slotId);
        scheduleQuery.slotId = { $in: slotIds };
      } else {
        return res.status(404).json({
          success: false,
          message: 'No schedule format found for this slot number',
          code: 'SLOT_NOT_FOUND'
        });
      }
    }
    
    const schedules = await ClassSchedule.find(scheduleQuery);
    
    if (!schedules || schedules.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No schedule found for this date and slot',
        code: 'SCHEDULE_NOT_FOUND'
      });
    }
    
    const scheduleIds = schedules.map(s => s.scheduleId);
    filters.scheduleId = { $in: scheduleIds };
    
    // Find attendance logs
    const attendanceLogs = await AttendanceLog.find(filters);
    
    if (!attendanceLogs || attendanceLogs.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No attendance logs found for this criteria',
        code: 'ATTENDANCE_LOGS_NOT_FOUND'
      });
    }
    
    // Update attendance logs
    const updates = attendanceLogs.map(log => ({
      attendanceId: log.attendanceId,
      status: status || log.status,
      note: note !== undefined ? note : log.note,
      checkInFace: checkInFace || log.checkInFace
    }));
    
    // Batch update attendance logs
    const { updated, errors } = await attendanceService.batchUpdateAttendanceLogs(updates);
    
    res.status(200).json({
      success: true,
      message: `Updated ${updated.length} attendance logs with ${errors.length} errors`,
      data: {
        updated,
        errors
      }
    });
  } catch (error) {
    console.error('Error updating class attendance logs:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating class attendance logs',
      error: error.message,
      code: 'CLASS_ATTENDANCE_UPDATE_ERROR'
    });
  }
});

/**
 * @route   PUT /api/attendance/check-in
 * @desc    Unified API for all attendance methods (teacher & Jetson Nano)
 * @access  Public
 */
router.put('/check-in', async (req, res) => {
  try {
    const {
      userId,
      scheduleId,
      deviceId,
      status,
      checkIn,
      checkInFace,
      faceVectorList
    } = req.body;
    
    // Validate userId là bắt buộc cho mọi phương thức check-in
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'userId is required',
        code: 'MISSING_USER_ID'
      });
    }
    
    // Gọi smartCheckIn để phân luồng xử lý dựa vào tham số đầu vào
    const result = await attendanceService.smartCheckIn({
      userId,
      scheduleId,
      deviceId,
      status,
      checkIn,
      checkInFace,
      faceVectorList
    });
    
    // Nếu có lỗi, trả về thông báo lỗi
    if (!result.success) {
      return res.status(400).json(result);
    }
    
    // Trả về kết quả thành công
    return res.status(200).json(result);
  } catch (error) {
    console.error('[ERROR] Error processing attendance check-in:', error);
    res.status(500).json({
      success: false,
      message: 'Server error processing attendance check-in',
      error: error.message,
      code: 'CHECKIN_ERROR'
    });
  }
});

/**
 * @route   GET /api/attendance/schedule/:scheduleId
 * @desc    Get attendance logs for a specific schedule
 * @access  Public
 */
router.get('/schedule/:scheduleId', async (req, res) => {
  try {
    const { scheduleId } = req.params;
    const { page = 1, limit = 100 } = req.query;

    // Validate scheduleId
    if (!scheduleId || isNaN(parseInt(scheduleId))) {
      return res.status(400).json({
        success: false,
        message: 'Invalid schedule ID provided',
        code: 'INVALID_SCHEDULE_ID'
      });
    }

    // Prepare filters
    const filters = {
      scheduleId: parseInt(scheduleId)
    };
    
    // Get attendance logs for the schedule
    const { logs, total, pagination } = await attendanceService.getAttendanceLogs(
      filters,
      { page: parseInt(page), limit: parseInt(limit) }
    );
    
    // Send response
    res.status(200).json({
      success: true,
      count: logs.length,
      total,
      pagination,
      data: logs
    });
  } catch (error) {
    console.error('Error fetching attendance logs for schedule:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching attendance logs for schedule',
      error: error.message,
      code: 'SCHEDULE_ATTENDANCE_FETCH_ERROR'
    });
  }
});

/**
 * Helper function to validate date format
 * @param {string} dateString - Date string in YYYY-MM-DD format
 * @returns {boolean} - Whether the date is valid
 */
function isValidDate(dateString) {
  if (!dateString) return false;
  
  // Check if the date follows the YYYY-MM-DD format
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateString)) return false;
  
  // Check if the date is valid
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date);
}

module.exports = router; 