const Attendance = require('../database/models/Attendance');
const ClassSession = require('../database/models/ClassSession');
const Student = require('../database/models/Student');
const User = require('../database/models/User');
const moment = require('moment');

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
      const user = await User.findOne({ userId: student.userId });
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
      const teachesClass = await Schedule.findOne({ 
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