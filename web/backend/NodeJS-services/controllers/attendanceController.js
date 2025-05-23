const Attendance = require('../database/models/Attendance');
const ClassSession = require('../database/models/ClassSession');
const Student = require('../database/models/Student');
const UserAccount = require('../database/models/UserAccount');
const moment = require('moment');
const ClassSchedule = require('../database/models/ClassSchedule');
const mongoose = require('mongoose');
const AttendanceLog = require('../database/models/AttendanceLog');
const RFID = require('../database/models/RFID');
const User = require('../database/models/User');
const Class = require('../database/models/Class');

/**
 * @desc    Lấy điểm danh theo buổi học
 * @route   GET /api/attendance/:sessionId
 * @access  Private
 */
exports.getAttendanceBySession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    // Kiểm tra phiên học tồn tại
    const session = await ClassSession.findOne({ sessionId: parseInt(sessionId) })
      .populate('class')
      .populate('subject')
      .populate('teacher');
      
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Phiên học không tồn tại'
      });
    }
    
    // Kiểm tra quyền truy cập
    if (req.user.role !== 'Admin' && req.user.role !== 'Teacher') {
      const teacher = await Teacher.findOne({ userId: req.user.userId });
      
      if (!teacher || teacher.teacherId !== session.teacherId) {
        return res.status(403).json({
          success: false,
          message: 'Không có quyền xem điểm danh của phiên học này'
        });
      }
    }
    
    // Lấy danh sách điểm danh
    const attendanceList = await Attendance.find({ sessionId: parseInt(sessionId) })
      .sort({ status: 1 });
      
    // Lấy danh sách học sinh trong lớp
    const studentsInClass = await Student.find({ classId: session.classId });
    
    // Kết hợp thông tin
    const formattedAttendance = [];
    
    for (const student of studentsInClass) {
      const user = await UserAccount.findOne({ userId: student.userId });
      const attendance = attendanceList.find(a => a.userId === student.userId) || {
        status: 'Absent',
        checkIn: null
      };
      
      formattedAttendance.push({
        studentId: student.studentId,
        userId: student.userId,
        fullName: student.fullName,
        status: attendance.status,
        checkIn: attendance.checkIn,
        gender: student.gender
      });
    }
    
    res.json({
      success: true,
      session: {
        id: session.sessionId,
        date: session.sessionDate,
        class: {
          id: session.class.classId,
          name: session.class.className
        },
        subject: {
          id: session.subject.subjectId,
          name: session.subject.subjectName
        },
        teacher: {
          id: session.teacher.teacherId,
          name: session.teacher.fullName
        },
        period: session.period,
        topic: session.topic
      },
      attendance: formattedAttendance
    });
    
  } catch (error) {
    console.error('Lỗi khi lấy dữ liệu điểm danh:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Lấy thông tin điểm danh của học sinh
 * @route   GET /api/attendance/student/:studentId
 * @access  Private
 */
exports.getStudentAttendance = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { startDate, endDate, subjectId } = req.query;
    
    // Kiểm tra học sinh tồn tại
    const student = await Student.findOne({ studentId: parseInt(studentId) });
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Học sinh không tồn tại'
      });
    }
    
    // Kiểm tra quyền truy cập
    if (req.user.role === 'Student' && req.user.userId !== student.userId) {
      return res.status(403).json({
        success: false,
        message: 'Không có quyền xem điểm danh của học sinh khác'
      });
    }
    
    if (req.user.role === 'Parent') {
      // Kiểm tra xem học sinh có phải con của phụ huynh
      const parent = await Parent.findOne({ userId: req.user.userId });
      if (!parent || !parent.studentIds.includes(student._id)) {
        return res.status(403).json({
          success: false,
          message: 'Không có quyền xem điểm danh của học sinh này'
        });
      }
    }
    
    // Xây dựng truy vấn
    let sessionsQuery = {
      classId: student.classId
    };
    
    if (startDate && endDate) {
      sessionsQuery.sessionDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    if (subjectId) {
      sessionsQuery.subjectId = parseInt(subjectId);
    }
    
    // Lấy danh sách phiên học
    const sessions = await ClassSession.find(sessionsQuery)
      .populate('subject')
      .sort({ sessionDate: -1 });
      
    // Lấy thông tin điểm danh
    const attendanceData = [];
    
    for (const session of sessions) {
      const attendance = await Attendance.findOne({
        sessionId: session.sessionId,
        userId: student.userId
      });
      
      attendanceData.push({
        session: {
          id: session.sessionId,
          date: session.sessionDate,
          subject: {
            id: session.subject.subjectId,
            name: session.subject.subjectName
          },
          period: session.period,
          topic: session.topic
        },
        status: attendance ? attendance.status : 'Absent',
        checkIn: attendance ? attendance.checkIn : null
      });
    }
    
    // Tính toán thống kê
    const statistics = {
      total: attendanceData.length,
      present: attendanceData.filter(item => item.status === 'Present').length,
      late: attendanceData.filter(item => item.status === 'Late').length,
      absent: attendanceData.filter(item => item.status === 'Absent').length,
      percentPresent: attendanceData.length > 0 
        ? Math.round((attendanceData.filter(item => item.status === 'Present').length / attendanceData.length) * 100) 
        : 0
    };
    
    res.json({
      success: true,
      student: {
        id: student.studentId,
        fullName: student.fullName,
        class: student.classId
      },
      statistics,
      attendance: attendanceData
    });
    
  } catch (error) {
    console.error('Lỗi khi lấy dữ liệu điểm danh học sinh:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Lấy điểm danh của lớp theo ngày
 * @route   GET /api/attendance/class/:classId/date/:date
 * @access  Private
 */
exports.getClassAttendanceByDate = async (req, res) => {
  try {
    const { classId, date } = req.params;
    
    if (!date || !moment(date, 'YYYY-MM-DD').isValid()) {
      return res.status(400).json({
        success: false,
        message: 'Định dạng ngày không hợp lệ. Sử dụng YYYY-MM-DD'
      });
    }
    
    // Kiểm tra lớp tồn tại
    const classInfo = await Class.findOne({ classId: parseInt(classId) });
    if (!classInfo) {
      return res.status(404).json({
        success: false,
        message: 'Lớp học không tồn tại'
      });
    }
    
    // Kiểm tra quyền truy cập
    if (req.user.role === 'Teacher') {
      const teacher = await Teacher.findOne({ userId: req.user.userId });
      if (!teacher) {
        return res.status(403).json({
          success: false,
          message: 'Không có quyền xem điểm danh'
        });
      }
      
      // Kiểm tra xem giáo viên có dạy lớp này hoặc là GVCN
      const isHomeroomTeacher = classInfo.homeroomTeacherId === teacher.teacherId;
      const teachesClass = await ClassSchedule.findOne({
        classId: parseInt(classId),
        teacherId: teacher.teacherId
      });
      
      if (!isHomeroomTeacher && !teachesClass) {
        return res.status(403).json({
          success: false,
          message: 'Không có quyền xem điểm danh của lớp này'
        });
      }
    }
    
    // Tìm các phiên học của lớp trong ngày
    const sessionDate = new Date(date);
    sessionDate.setHours(0, 0, 0, 0);
    
    const nextDay = new Date(sessionDate);
    nextDay.setDate(nextDay.getDate() + 1);
    
    const sessions = await ClassSession.find({
      classId: parseInt(classId),
      sessionDate: {
        $gte: sessionDate,
        $lt: nextDay
      }
    }).populate('subject').populate('teacher').sort({ period: 1 });
    
    // Lấy thông tin học sinh trong lớp
    const students = await Student.find({ classId: parseInt(classId) }).sort({ fullName: 1 });
    
    // Lấy dữ liệu điểm danh
    const attendanceData = [];
    
    for (const session of sessions) {
      const sessionAttendance = await Attendance.find({ sessionId: session.sessionId });
      
      const studentsAttendance = students.map(student => {
        const attendance = sessionAttendance.find(a => a.userId === student.userId);
        return {
          studentId: student.studentId,
          userId: student.userId,
          fullName: student.fullName,
          status: attendance ? attendance.status : 'Absent',
          checkIn: attendance ? attendance.checkIn : null
        };
      });
      
      attendanceData.push({
        session: {
          id: session.sessionId,
          period: session.period,
          subject: {
            id: session.subject.subjectId,
            name: session.subject.subjectName
          },
          teacher: {
            id: session.teacher.teacherId,
            name: session.teacher.fullName
          },
          topic: session.topic
        },
        attendance: studentsAttendance,
        statistics: {
          total: students.length,
          present: studentsAttendance.filter(s => s.status === 'Present').length,
          late: studentsAttendance.filter(s => s.status === 'Late').length,
          absent: studentsAttendance.filter(s => s.status === 'Absent').length
        }
      });
    }
    
    res.json({
      success: true,
      class: {
        id: classInfo.classId,
        name: classInfo.className
      },
      date: date,
      sessions: attendanceData
    });
    
  } catch (error) {
    console.error('Lỗi khi lấy dữ liệu điểm danh theo lớp và ngày:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Ghi nhận điểm danh
 * @route   POST /api/attendance/:sessionId
 * @access  Private (Teacher, Admin)
 */
exports.recordAttendance = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { attendance } = req.body;
    
    if (!attendance || !Array.isArray(attendance)) {
      return res.status(400).json({
        success: false,
        message: 'Dữ liệu điểm danh không hợp lệ'
      });
    }
    
    // Kiểm tra phiên học tồn tại
    const session = await ClassSession.findOne({ sessionId: parseInt(sessionId) });
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Phiên học không tồn tại'
      });
    }
    
    // Kiểm tra quyền truy cập
    if (req.user.role === 'Teacher') {
      const teacher = await Teacher.findOne({ userId: req.user.userId });
      if (!teacher || teacher.teacherId !== session.teacherId) {
        return res.status(403).json({
          success: false,
          message: 'Không có quyền ghi nhận điểm danh cho phiên học này'
        });
      }
    }
    
    // Xóa điểm danh cũ (nếu có)
    await Attendance.deleteMany({ sessionId: parseInt(sessionId) });
    
    // Ghi nhận điểm danh mới
    const attendanceRecords = [];
    
    for (const record of attendance) {
      if (!record.userId || !['Present', 'Late', 'Absent'].includes(record.status)) {
        continue;
      }
      
      // Tạo bản ghi điểm danh mới
      const newAttendance = new Attendance({
        sessionId: parseInt(sessionId),
        userId: record.userId,
        checkIn: record.status !== 'Absent' ? new Date() : null,
        status: record.status
      });
      
      await newAttendance.save();
      attendanceRecords.push(newAttendance);
    }
    
    res.status(201).json({
      success: true,
      message: 'Ghi nhận điểm danh thành công',
      count: attendanceRecords.length
    });
    
  } catch (error) {
    console.error('Lỗi khi ghi nhận điểm danh:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Record attendance from RFID device (Jetson Nano)
 * @route   POST /api/attendance/record
 * @access  Private
 */
exports.recordAttendance = async (req, res) => {
  try {
    const { 
      rfidId, 
      userId, 
      checkIn,
      timestamp, 
      deviceId, 
      location, 
      classroomId,
      status,
      faceVerified, 
      verificationScore, 
      antiSpoofingResult,
      faceImage
    } = req.body;

    // Validate required data
    if (!rfidId) {
      return res.status(400).json({
        success: false,
        message: 'RFID ID is required',
        code: 'MISSING_RFID'
      });
    }

    // Verify RFID exists
    const rfidRecord = await RFID.findOne({ RFID_ID: rfidId });
    if (!rfidRecord) {
      return res.status(404).json({
        success: false,
        message: `RFID with ID ${rfidId} not found`,
        code: 'RFID_NOT_FOUND'
      });
    }

    // Verify user exists if userId is provided, otherwise get from RFID record
    const targetUserId = userId || rfidRecord.UserID;
    const user = await User.findOne({ userId: targetUserId });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: `User with ID ${targetUserId} not found`,
        code: 'USER_NOT_FOUND'
      });
    }

    // Get current time if checkIn not provided
    const checkInTime = checkIn ? new Date(checkIn) : new Date();
    
    // Use provided status or default to "present"
    const attendanceStatus = status || "present";

    // Create new attendance record
    const attendanceLog = new AttendanceLog({
      userId: user.userId,
      rfidId: rfidId,
      timestamp: timestamp ? new Date(timestamp) : checkInTime,
      checkIn: checkInTime,
      deviceId: deviceId || 'jetson-nano-001',
      location: location || 'Main Entrance',
      classroomId: classroomId || 1, // Default to classroom 1 if not provided
      verificationMethod: faceVerified ? 'rfid+face' : 'rfid',
      verificationScore: verificationScore || 0,
      antiSpoofingResult: antiSpoofingResult || false,
      status: attendanceStatus
    });

    // Save face image if provided
    if (faceImage) {
      // Convert base64 to buffer if needed
      if (typeof faceImage === 'string' && faceImage.startsWith('data:image')) {
        const base64Data = faceImage.split(',')[1];
        attendanceLog.faceImage = Buffer.from(base64Data, 'base64');
      } else if (typeof faceImage === 'string') {
        attendanceLog.faceImage = Buffer.from(faceImage, 'base64');
      } else if (Buffer.isBuffer(faceImage)) {
        attendanceLog.faceImage = faceImage;
      }
    }

    // Save attendance log
    await attendanceLog.save();

    // If user is a student, check for current class schedule
    if (user.role.toLowerCase() === 'student') {
      // Get current day of week and time
      const checkInDate = new Date(checkInTime);
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const currentDay = dayNames[checkInDate.getDay()];
      const currentTime = `${checkInDate.getHours().toString().padStart(2, '0')}:${checkInDate.getMinutes().toString().padStart(2, '0')}`;

      // Get student record to find classId
      const student = await Student.findOne({ studentId: user.studentId });

      if (student && student.classId) {
        // Find class to get schedules
        const classRecord = await Class.findOne({ classId: student.classId });
        
        if (classRecord) {
          // Find active class schedule for this time
          const activeSchedule = await ClassSchedule.findOne({
            classId: student.classId,
            dayOfWeek: currentDay,
            $and: [
              { startTime: { $lte: currentTime } },
              { endTime: { $gte: currentTime } }
            ],
            status: 'scheduled'
          });

          if (activeSchedule) {
            // Update attendance log with class session info
            attendanceLog.classId = student.classId;
            attendanceLog.scheduleId = activeSchedule._id;
            await attendanceLog.save();

            // Log details for debugging
            console.log(`Attendance recorded for class session: ${activeSchedule._id}`);
          }
        }
      }
    }

    // Send response with user details
    return res.status(201).json({
      success: true,
      message: 'Attendance recorded successfully',
      data: {
        attendanceId: attendanceLog._id,
        userId: user.userId,
        userName: user.username || user.userId,
        userRole: user.role,
        checkIn: attendanceLog.checkIn,
        status: attendanceLog.status,
        verificationMethod: attendanceLog.verificationMethod
      },
      code: 'ATTENDANCE_RECORDED'
    });
  } catch (error) {
    console.error('Error recording attendance:', error);
    return res.status(500).json({
      success: false,
      message: 'Error recording attendance',
      error: error.message,
      code: 'ATTENDANCE_ERROR'
    });
  }
};

/**
 * @desc    Get attendance logs
 * @route   GET /api/attendance
 * @access  Private/Admin
 */
exports.getAttendanceLogs = async (req, res) => {
  try {
    // Extract query parameters for filtering
    const { userId, rfidId, fromDate, toDate, status, page = 1, limit = 10 } = req.query;
    
    // Build query based on filters
    const query = {};
    
    if (userId) query.userId = userId;
    if (rfidId) query.rfidId = rfidId;
    if (status) query.status = status;
    
    // Date range filter
    if (fromDate || toDate) {
      query.checkIn = {};
      if (fromDate) query.checkIn.$gte = new Date(fromDate);
      if (toDate) query.checkIn.$lte = new Date(toDate);
    }
    
    // Calculate pagination values
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Get attendance logs with pagination
    const logs = await AttendanceLog.find(query)
      .sort({ checkIn: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate({
        path: 'user', 
        select: 'userId username email role'
      });
    
    // Get total count for pagination
    const total = await AttendanceLog.countDocuments(query);
    
    return res.status(200).json({
      success: true,
      count: logs.length,
      data: logs,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error getting attendance logs:', error);
    return res.status(500).json({
      success: false,
      message: 'Error retrieving attendance logs',
      error: error.message
    });
  }
};

/**
 * @desc    Get attendance by user ID
 * @route   GET /api/attendance/user/:userId
 * @access  Private
 */
exports.getUserAttendance = async (req, res) => {
  try {
    const { userId } = req.params;
    const { fromDate, toDate, status, page = 1, limit = 10 } = req.query;
    
    // Verify user exists
    const user = await User.findOne({ userId });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: `User with ID ${userId} not found`,
        code: 'USER_NOT_FOUND'
      });
    }
    
    // Build query
    const query = { userId };
    
    if (status) query.status = status;
    
    // Date range filter
    if (fromDate || toDate) {
      query.checkIn = {};
      if (fromDate) query.checkIn.$gte = new Date(fromDate);
      if (toDate) query.checkIn.$lte = new Date(toDate);
    }
    
    // Calculate pagination values
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Get attendance logs with pagination
    const logs = await AttendanceLog.find(query)
      .sort({ checkIn: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    // Get total count for pagination
    const total = await AttendanceLog.countDocuments(query);
    
    // Calculate attendance statistics
    const stats = {
      total: total,
      present: await AttendanceLog.countDocuments({ ...query, status: 'present' }),
      late: await AttendanceLog.countDocuments({ ...query, status: 'late' }),
      absent: await AttendanceLog.countDocuments({ ...query, status: 'absent' })
    };
    
    return res.status(200).json({
      success: true,
      count: logs.length,
      data: logs,
      stats: stats,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error getting user attendance:', error);
    return res.status(500).json({
      success: false,
      message: 'Error retrieving user attendance',
      error: error.message
    });
  }
};

/**
 * @desc    Delete attendance log
 * @route   DELETE /api/attendance/:id
 * @access  Private/Admin
 */
exports.deleteAttendanceLog = async (req, res) => {
  try {
    const log = await AttendanceLog.findById(req.params.id);
    
    if (!log) {
      return res.status(404).json({
        success: false,
        message: 'Attendance log not found',
        code: 'LOG_NOT_FOUND'
      });
    }
    
    await log.deleteOne();
    
    return res.status(200).json({
      success: true,
      message: 'Attendance log deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting attendance log:', error);
    return res.status(500).json({
      success: false,
      message: 'Error deleting attendance log',
      error: error.message
    });
  }
}; 