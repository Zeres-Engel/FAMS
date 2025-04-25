/**
 * Attendance Service
 * Handles business logic for attendance-related operations
 */
const mongoose = require('mongoose');
const AttendanceLog = require('../database/models/AttendanceLog');
const ClassSchedule = require('../database/models/ClassSchedule');

/**
 * Get attendance logs with filtering
 * @param {Object} filters - Filter criteria like userId, classId, etc.
 * @param {Object} pagination - Pagination options
 * @returns {Promise<{logs: Array, total: Number, pagination: Object}>}
 */
exports.getAttendanceLogs = async (filters = {}, pagination = { page: 1, limit: 10 }) => {
  try {
    const { 
      userId, 
      classId, 
      subjectId, 
      teacherId,
      date, 
      dateFrom,
      dateTo,
      scheduleId,
      slotId,
      slotNumber,
      status,
      semesterNumber
    } = filters;
    
    const filter = {};
    
    // Apply filters
    if (userId) filter.userId = userId;
    if (classId) filter.classId = parseInt(classId);
    if (subjectId) filter.subjectId = parseInt(subjectId);
    if (teacherId) filter.teacherId = parseInt(teacherId);
    if (scheduleId) filter.scheduleId = parseInt(scheduleId);
    if (status) filter.status = status;
    if (semesterNumber) filter.semesterNumber = parseInt(semesterNumber);
    
    // Find schedules matching criteria
    let scheduleQuery = {};
    
    // Date handling - single date or date range
    if (date) {
      scheduleQuery.sessionDate = new Date(date);
    } else if (dateFrom || dateTo) {
      scheduleQuery.sessionDate = {};
      if (dateFrom) scheduleQuery.sessionDate.$gte = new Date(dateFrom);
      if (dateTo) scheduleQuery.sessionDate.$lte = new Date(dateTo);
    }
    
    // Handle slot filtering
    if (slotId) {
      scheduleQuery.slotId = parseInt(slotId);
    } else if (slotNumber) {
      // Find the corresponding slots with the given slotNumber
      const scheduleFormats = await mongoose.model('ScheduleFormat').find({ 
        slotNumber: parseInt(slotNumber) 
      });
      
      if (scheduleFormats && scheduleFormats.length > 0) {
        const slotIds = scheduleFormats.map(slot => slot.slotId);
        scheduleQuery.slotId = { $in: slotIds };
      } else {
        return { logs: [], total: 0, pagination: { current: 1, pages: 0 } };
      }
    }
    
    let scheduleIds = [];
    
    // If we have any schedule filtering criteria, get matching schedules
    if (Object.keys(scheduleQuery).length > 0) {
      const schedules = await mongoose.model('ClassSchedule').find(scheduleQuery);
      
      if (schedules && schedules.length > 0) {
        scheduleIds = schedules.map(schedule => schedule.scheduleId);
        filter.scheduleId = { $in: scheduleIds };
      } else {
        return { logs: [], total: 0, pagination: { current: 1, pages: 0 } };
      }
    } else if (date || slotNumber) {
      // Handle legacy filtering by date and slotNumber
      if (date) {
        if (slotNumber) {
          // Find schedules matching date and slot
          const schedules = await ClassSchedule.find({
            sessionDate: new Date(date),
            slotNumber: parseInt(slotNumber)
          });
          
          if (schedules && schedules.length > 0) {
            const scheduleIds = schedules.map(schedule => schedule.scheduleId);
            filter.scheduleId = { $in: scheduleIds };
          } else {
            return { logs: [], total: 0, pagination: { current: 1, pages: 0 } };
          }
        } else {
          // Find all schedules for the date
          const schedules = await ClassSchedule.find({
            sessionDate: new Date(date)
          });
          
          if (schedules && schedules.length > 0) {
            const scheduleIds = schedules.map(schedule => schedule.scheduleId);
            filter.scheduleId = { $in: scheduleIds };
          }
        }
      }
    }
    
    // Calculate pagination
    const page = parseInt(pagination.page) || 1;
    const limit = parseInt(pagination.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Get total count
    const total = await AttendanceLog.countDocuments(filter);
    
    // Get logs with pagination and populate schedule details
    const logs = await AttendanceLog.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate({
        path: 'schedule',
        select: 'slotId sessionDate topic',
        populate: {
          path: 'slot',
          select: 'slotNumber dayOfWeek startTime endTime'
        }
      })
      .populate({
        path: 'user',
        select: 'avatar firstName lastName fullName'
      });
      
    // Add schedule details to each attendance log
    const enhancedLogs = logs.map(log => {
      const logObj = log.toObject();
      
      // Add schedule time details if available
      if (logObj.schedule && logObj.schedule.slot) {
        logObj.slotNumber = logObj.schedule.slot.slotNumber;
        logObj.dayOfWeek = logObj.schedule.slot.dayOfWeek;
        logObj.startTime = logObj.schedule.slot.startTime;
        logObj.endTime = logObj.schedule.slot.endTime;
        logObj.sessionDate = logObj.schedule.sessionDate;
        logObj.topic = logObj.schedule.topic;
      }
      
      // Add user avatar if available
      if (logObj.user && logObj.user.avatar) {
        logObj.avatar = logObj.user.avatar;
      }
      
      // Make checkInFace available in the response
      // Note: Since we're already fetching it from the database, we just need to ensure
      // it's included in the response object (it should already be there)
      
      return logObj;
    });
      
    return {
      logs: enhancedLogs,
      total,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    console.error('Error in getAttendanceLogs service:', error);
    throw error;
  }
};

/**
 * Get attendance logs by date range
 * @param {String} dateFrom - Start date in YYYY-MM-DD format
 * @param {String} dateTo - End date in YYYY-MM-DD format
 * @param {Object} additionalFilters - Additional filter criteria
 * @param {Object} pagination - Pagination options
 * @returns {Promise<{logs: Array, total: Number, pagination: Object}>}
 */
exports.getAttendanceLogsByDateRange = async (dateFrom, dateTo, additionalFilters = {}, pagination = { page: 1, limit: 10 }) => {
  try {
    // Prepare filters with date range
    const filters = {
      ...additionalFilters,
      dateFrom,
      dateTo
    };
    
    // Use the common getAttendanceLogs method
    return await exports.getAttendanceLogs(filters, pagination);
  } catch (error) {
    console.error('Error in getAttendanceLogsByDateRange service:', error);
    throw error;
  }
};

/**
 * Update attendance log status
 * @param {Number|String} attendanceId - ID of the attendance log
 * @param {Object} updateData - Data to update (status, note, checkIn, checkInFace)
 * @returns {Promise<Object>} - Updated attendance log
 */
exports.updateAttendanceLog = async (attendanceId, updateData) => {
  try {
    const { status, note, checkIn, checkInFace } = updateData;
    
    // Find attendance log
    const attendanceLog = await AttendanceLog.findOne({
      attendanceId: parseInt(attendanceId)
    });
    
    if (!attendanceLog) {
      throw new Error('Attendance log not found');
    }
    
    // Update fields if provided
    if (status) attendanceLog.status = status;
    if (note !== undefined) attendanceLog.note = note;
    if (checkIn) attendanceLog.checkIn = new Date(checkIn);
    
    // Update checkInFace (path to the image)
    if (checkInFace) attendanceLog.checkInFace = checkInFace;
    
    // Save and return updated log
    await attendanceLog.save();
    
    // Fetch the complete updated log with populated fields
    const updatedLog = await exports.getAttendanceLogById(attendanceId);
    return updatedLog;
  } catch (error) {
    console.error('Error in updateAttendanceLog service:', error);
    throw error;
  }
};

/**
 * Batch update multiple attendance logs
 * @param {Array} updates - Array of updates with attendanceId and update data
 * @returns {Promise<{updated: Array, errors: Array}>} - Results of updates
 */
exports.batchUpdateAttendanceLogs = async (updates) => {
  try {
    if (!updates || !Array.isArray(updates)) {
      throw new Error('Invalid updates format. Expected an array');
    }
    
    const results = [];
    const errors = [];
    
    // Process each update
    for (const update of updates) {
      try {
        const { attendanceId, status, note, checkIn, checkInFace } = update;
        
        if (!attendanceId) {
          errors.push({ attendanceId, error: 'Missing attendanceId' });
          continue;
        }
        
        // Find and update the attendance log
        const attendanceLog = await AttendanceLog.findOne({
          attendanceId: parseInt(attendanceId)
        });
        
        if (!attendanceLog) {
          errors.push({ attendanceId, error: 'Attendance log not found' });
          continue;
        }
        
        // Update fields if provided
        if (status) attendanceLog.status = status;
        if (note !== undefined) attendanceLog.note = note;
        if (checkIn) attendanceLog.checkIn = new Date(checkIn);
        if (checkInFace) attendanceLog.checkInFace = checkInFace;
        
        await attendanceLog.save();
        
        // Get the updated log with populated fields
        const updatedLog = await exports.getAttendanceLogById(attendanceId);
        results.push(updatedLog);
      } catch (err) {
        errors.push({ attendanceId: update.attendanceId, error: err.message });
      }
    }
    
    return { updated: results, errors };
  } catch (error) {
    console.error('Error in batchUpdateAttendanceLogs service:', error);
    throw error;
  }
};

/**
 * Create a new attendance log
 * @param {Object} attendanceData - Data for the new attendance log
 * @returns {Promise<Object>} - Created attendance log
 */
exports.createAttendanceLog = async (attendanceData) => {
  try {
    // Set default status if not provided
    if (!attendanceData.status) {
      attendanceData.status = 'Not Now';
    }
    
    const newAttendanceLog = new AttendanceLog(attendanceData);
    await newAttendanceLog.save();
    return newAttendanceLog;
  } catch (error) {
    console.error('Error in createAttendanceLog service:', error);
    throw error;
  }
};

/**
 * Get attendance logs for a specific user
 * @param {String} userId - User ID
 * @param {Object} filters - Additional filters
 * @param {Object} pagination - Pagination options
 * @returns {Promise<{logs: Array, total: Number, pagination: Object}>}
 */
exports.getUserAttendanceLogs = async (userId, filters = {}, pagination = { page: 1, limit: 10 }) => {
  try {
    // Add userId to filters
    filters.userId = userId;
    
    // Use the common getAttendanceLogs method
    return await exports.getAttendanceLogs(filters, pagination);
  } catch (error) {
    console.error('Error in getUserAttendanceLogs service:', error);
    throw error;
  }
};

/**
 * Get attendance summary for a user
 * @param {String} userId - User ID
 * @param {Object} filters - Filters like semesterNumber, classId
 * @returns {Promise<Object>} - Attendance summary statistics
 */
exports.getUserAttendanceSummary = async (userId, filters = {}) => {
  try {
    const { semesterNumber, classId, subjectId } = filters;
    
    const filter = { userId };
    
    if (semesterNumber) filter.semesterNumber = parseInt(semesterNumber);
    if (classId) filter.classId = parseInt(classId);
    if (subjectId) filter.subjectId = parseInt(subjectId);
    
    // Get all attendance logs for the user with filters
    const logs = await AttendanceLog.find(filter);
    
    // Calculate statistics
    const total = logs.length;
    const present = logs.filter(log => log.status === 'Present').length;
    const late = logs.filter(log => log.status === 'Late').length;
    const absent = logs.filter(log => log.status === 'Absent').length;
    const notNow = logs.filter(log => log.status === 'Not Now').length;
    
    // Calculate percentages
    const presentPercent = total > 0 ? (present / total) * 100 : 0;
    const latePercent = total > 0 ? (late / total) * 100 : 0;
    const absentPercent = total > 0 ? (absent / total) * 100 : 0;
    
    return {
      total,
      present,
      late,
      absent,
      notNow,
      percentages: {
        present: presentPercent.toFixed(2),
        late: latePercent.toFixed(2),
        absent: absentPercent.toFixed(2)
      }
    };
  } catch (error) {
    console.error('Error in getUserAttendanceSummary service:', error);
    throw error;
  }
};

/**
 * Get attendance log by ID
 * @param {Number|String} attendanceId - ID of the attendance log
 * @returns {Promise<Object>} - Attendance log
 */
exports.getAttendanceLogById = async (attendanceId) => {
  try {
    const attendanceLog = await AttendanceLog.findOne({
      attendanceId: parseInt(attendanceId)
    })
    .populate({
      path: 'schedule',
      select: 'slotId sessionDate topic',
      populate: {
        path: 'slot',
        select: 'slotNumber dayOfWeek startTime endTime'
      }
    })
    .populate({
      path: 'user',
      select: 'avatar firstName lastName fullName'
    });
    
    if (!attendanceLog) {
      throw new Error('Attendance log not found');
    }
    
    // Convert to plain object and enhance
    const logObj = attendanceLog.toObject();
    
    // Add schedule time details if available
    if (logObj.schedule && logObj.schedule.slot) {
      logObj.slotNumber = logObj.schedule.slot.slotNumber;
      logObj.dayOfWeek = logObj.schedule.slot.dayOfWeek;
      logObj.startTime = logObj.schedule.slot.startTime;
      logObj.endTime = logObj.schedule.slot.endTime;
      logObj.sessionDate = logObj.schedule.sessionDate;
      logObj.topic = logObj.schedule.topic;
    }
    
    // Add user avatar if available
    if (logObj.user && logObj.user.avatar) {
      logObj.avatar = logObj.user.avatar;
    }
    
    return logObj;
  } catch (error) {
    console.error('Error in getAttendanceLogById service:', error);
    throw error;
  }
};

/**
 * Student check-in
 * @param {Object} checkInData - Data for check-in (userId, scheduleId, status)
 * @returns {Promise<Object>} - Updated or created attendance log
 */
exports.checkInAttendance = async (checkInData) => {
  try {
    const { userId, scheduleId, status, checkInFace } = checkInData;
    
    // Validate required fields
    if (!userId || !scheduleId) {
      throw new Error('userId and scheduleId are required for check-in');
    }
    
    // Set default status if not provided
    const attendanceStatus = status || 'Present';
    
    // Get current time for check-in
    const currentTime = new Date();
    
    // Find existing attendance log
    let attendanceLog = await AttendanceLog.findOne({
      userId,
      scheduleId: parseInt(scheduleId)
    });
    
    // Get the schedule to fill other details
    const schedule = await mongoose.model('ClassSchedule').findOne({
      scheduleId: parseInt(scheduleId)
    }).populate('class').populate('subject').populate('teacher');
    
    if (!schedule) {
      throw new Error('Schedule not found');
    }
    
    // Get user to fill other details
    const user = await mongoose.model('UserAccount').findOne({ userId });
    
    if (!user) {
      throw new Error('User not found');
    }
    
    // Get semester number from the schedule
    const semesterNumber = schedule.semesterId; // Assuming semesterId is the semester number
    
    if (!attendanceLog) {
      // Create new attendance log if not exists
      const newAttendanceData = {
        userId,
        scheduleId: parseInt(scheduleId),
        status: attendanceStatus,
        checkIn: currentTime,
        checkInFace,
        note: `Auto check-in at ${currentTime.toLocaleTimeString()}`,
        semesterNumber,
        userRole: user.role,
        
        // Fill in details from schedule
        teacherId: schedule.teacherId,
        teacherName: schedule.teacher ? schedule.teacher.fullName : '',
        subjectId: schedule.subjectId,
        subjectName: schedule.subject ? schedule.subject.subjectName : '',
        classId: schedule.classId,
        className: schedule.class ? schedule.class.className : '',
        classroomId: schedule.classroomId,
        classroomName: ''
      };
      
      // Add student details if user is a student
      if (user.role === 'student' && user.roleId) {
        const student = await mongoose.model('Student').findOne({ studentId: user.roleId });
        if (student) {
          newAttendanceData.studentId = student.studentId;
          newAttendanceData.studentName = student.fullName;
        }
      }
      
      // Create new attendance log
      attendanceLog = new AttendanceLog(newAttendanceData);
    } else {
      // Update existing attendance log
      attendanceLog.status = attendanceStatus;
      attendanceLog.checkIn = currentTime;
      if (checkInFace) attendanceLog.checkInFace = checkInFace;
      attendanceLog.note = `Updated check-in at ${currentTime.toLocaleTimeString()}`;
    }
    
    // Save attendance log
    await attendanceLog.save();
    
    // Populate and return enhanced log
    const enhancedLog = await exports.getAttendanceLogById(attendanceLog.attendanceId);
    return enhancedLog;
  } catch (error) {
    console.error('Error in checkInAttendance service:', error);
    throw error;
  }
};

/**
 * Process check-in from Jetson Nano device
 * @param {Object} checkInData - Data for check-in from Jetson Nano
 * @returns {Promise<Object>} - Check-in result
 */
exports.processJetsonCheckIn = async (checkInData) => {
  try {
    const { userId, rfidId, checkInTime, classroomId, checkInFace } = checkInData;
    
    // Validate required fields
    if (!userId || !rfidId || !checkInTime || !classroomId) {
      throw new Error('Missing required fields: userId, rfidId, checkInTime, and classroomId are required');
    }
    
    // 1. Verify RFID belongs to the user
    const rfidRecord = await mongoose.model('RFID').findOne({ 
      RFID_ID: rfidId,
      UserID: userId,
      Status: 'Active' 
    });
    
    if (!rfidRecord) {
      return {
        success: false,
        message: 'RFID verification failed. RFID does not match user or is not active.',
        code: 'RFID_VERIFICATION_FAILED'
      };
    }
    
    // 2. Parse check-in time
    const checkInDateTime = new Date(checkInTime);
    if (isNaN(checkInDateTime.getTime())) {
      return {
        success: false,
        message: 'Invalid check-in time format',
        code: 'INVALID_TIME_FORMAT'
      };
    }
    
    // 3. Find applicable schedule for this time and classroom
    // Get current day of week
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayOfWeek = daysOfWeek[checkInDateTime.getDay()];
    
    // Format date to YYYY-MM-DD for session date matching
    const formattedDate = checkInDateTime.toISOString().split('T')[0];
    
    // Calculate time window for finding applicable schedules
    // Starting from 1 hour before check-in time to account for early arrivals
    const oneHourBefore = new Date(checkInDateTime);
    oneHourBefore.setHours(oneHourBefore.getHours() - 1);
    
    // Ending 1 hour after check-in time to account for late arrivals
    const oneHourAfter = new Date(checkInDateTime);
    oneHourAfter.setHours(oneHourAfter.getHours() + 1);
    
    // Find slots that might match this time
    const timeString = checkInDateTime.toTimeString().substring(0, 5); // HH:MM format
    
    // Find all slots for this day of week
    const slots = await mongoose.model('ScheduleFormat').find({
      dayOfWeek: dayOfWeek
    });
    
    if (!slots || slots.length === 0) {
      return {
        success: false,
        message: `No schedule slots found for ${dayOfWeek}`,
        code: 'NO_SLOTS_FOUND'
      };
    }
    
    // Find potential slots where check-in time falls within start and end time or within grace period
    const applicableSlots = slots.filter(slot => {
      // Convert slot times to Date objects for comparison
      const [startHour, startMinute] = slot.startTime.split(':').map(Number);
      const [endHour, endMinute] = slot.endTime.split(':').map(Number);
      
      const slotStartTime = new Date(checkInDateTime);
      slotStartTime.setHours(startHour, startMinute, 0, 0);
      
      const slotEndTime = new Date(checkInDateTime);
      slotEndTime.setHours(endHour, endMinute, 0, 0);
      
      // Add grace period (45 min after slot starts for late arrivals)
      const graceEndTime = new Date(slotStartTime);
      graceEndTime.setMinutes(graceEndTime.getMinutes() + 45);
      
      // Check if check-in time is within start time and grace period
      return checkInDateTime >= slotStartTime && checkInDateTime <= graceEndTime;
    });
    
    if (!applicableSlots || applicableSlots.length === 0) {
      return {
        success: false,
        message: 'No applicable schedule slot found for this check-in time',
        code: 'NO_APPLICABLE_SLOT'
      };
    }
    
    // Get slot IDs from applicable slots
    const slotIds = applicableSlots.map(slot => slot.slotId);
    
    // 4. Find schedules that match the classroom, date, and one of the applicable slots
    const schedules = await mongoose.model('ClassSchedule').find({
      classroomId: parseInt(classroomId),
      sessionDate: { 
        $gte: new Date(formattedDate + 'T00:00:00.000Z'),
        $lte: new Date(formattedDate + 'T23:59:59.999Z')
      },
      slotId: { $in: slotIds }
    }).populate('slot').populate('class').populate('subject').populate('teacher');
    
    if (!schedules || schedules.length === 0) {
      return {
        success: false,
        message: 'No scheduled class found for this classroom, date and time',
        code: 'NO_SCHEDULE_FOUND'
      };
    }
    
    // 5. Check if the user has any schedule among the matched ones
    let userSchedule = null;
    let attendanceStatus = 'Present';
    
    // Get user role
    const user = await mongoose.model('UserAccount').findOne({ userId });
    if (!user) {
      return {
        success: false,
        message: 'User not found',
        code: 'USER_NOT_FOUND'
      };
    }
    
    if (user.role === 'teacher') {
      // For teachers: Find schedules where they are the assigned teacher
      userSchedule = schedules.find(schedule => schedule.teacherId === user.roleId);
    } else if (user.role === 'student') {
      // For students: Check if they belong to the class in any of the schedules
      const student = await mongoose.model('Student').findOne({ studentId: user.roleId });
      if (student) {
        userSchedule = schedules.find(schedule => schedule.classId === student.classId);
      }
    }
    
    if (!userSchedule) {
      return {
        success: false,
        message: 'User is not scheduled for this classroom at this time',
        code: 'USER_NOT_SCHEDULED'
      };
    }
    
    // 6. Determine attendance status based on check-in time
    const slotStartTime = new Date(checkInDateTime);
    const [startHour, startMinute] = userSchedule.slot.startTime.split(':').map(Number);
    slotStartTime.setHours(startHour, startMinute, 0, 0);
    
    // Calculate minutes after class start time
    const minutesLate = (checkInDateTime - slotStartTime) / (1000 * 60);
    
    if (minutesLate > 30) {
      attendanceStatus = 'Absent';
    } else if (minutesLate > 15) {
      attendanceStatus = 'Late';
    }
    
    // 7. Create or update attendance record
    // Find existing attendance log
    let attendanceLog = await AttendanceLog.findOne({
      userId,
      scheduleId: userSchedule.scheduleId
    });
    
    const semesterNumber = userSchedule.semesterId; // Assuming semesterId is the semester number
    
    if (!attendanceLog) {
      // Create new attendance log
      const newAttendanceData = {
        userId,
        scheduleId: userSchedule.scheduleId,
        status: attendanceStatus,
        checkIn: checkInDateTime,
        checkInFace,
        note: `Facial recognition check-in at ${checkInDateTime.toLocaleTimeString()} via Jetson Nano`,
        semesterNumber,
        userRole: user.role,
        
        // Fill in details from schedule
        teacherId: userSchedule.teacherId,
        teacherName: userSchedule.teacher ? userSchedule.teacher.fullName : '',
        subjectId: userSchedule.subjectId,
        subjectName: userSchedule.subject ? userSchedule.subject.subjectName : '',
        classId: userSchedule.classId,
        className: userSchedule.class ? userSchedule.class.className : '',
        classroomId: userSchedule.classroomId,
        classroomName: ''
      };
      
      // Add student details if user is a student
      if (user.role === 'student' && user.roleId) {
        const student = await mongoose.model('Student').findOne({ studentId: user.roleId });
        if (student) {
          newAttendanceData.studentId = student.studentId;
          newAttendanceData.studentName = student.fullName;
        }
      }
      
      attendanceLog = new AttendanceLog(newAttendanceData);
    } else {
      // Only update if the current check-in is earlier than existing one
      // or if the status would be better (Present > Late > Absent)
      const statusPriority = { 'Present': 3, 'Late': 2, 'Absent': 1 };
      const existingPriority = statusPriority[attendanceLog.status] || 0;
      const newPriority = statusPriority[attendanceStatus] || 0;
      
      // Update if:
      // 1. No previous check-in time, or
      // 2. New check-in is earlier, or
      // 3. Same time but better status
      if (!attendanceLog.checkIn || 
          checkInDateTime < attendanceLog.checkIn || 
          (checkInDateTime.getTime() === attendanceLog.checkIn.getTime() && newPriority > existingPriority)) {
        
        attendanceLog.status = attendanceStatus;
        attendanceLog.checkIn = checkInDateTime;
        if (checkInFace) attendanceLog.checkInFace = checkInFace;
        attendanceLog.note = `Updated facial recognition check-in at ${checkInDateTime.toLocaleTimeString()} via Jetson Nano`;
      }
    }
    
    // Save attendance log
    await attendanceLog.save();
    
    // 8. Return success response with complete attendance details
    const enhancedLog = await exports.getAttendanceLogById(attendanceLog.attendanceId);
    
    return {
      success: true,
      message: `Check-in successful. Attendance marked as ${attendanceStatus}`,
      data: enhancedLog,
      details: {
        minutesLate: Math.round(minutesLate),
        scheduledStartTime: userSchedule.slot.startTime,
        scheduledEndTime: userSchedule.slot.endTime
      }
    };
    
  } catch (error) {
    console.error('Error in processJetsonCheckIn service:', error);
    return {
      success: false,
      message: error.message,
      code: 'JETSON_CHECKIN_ERROR'
    };
  }
};

module.exports = exports; 