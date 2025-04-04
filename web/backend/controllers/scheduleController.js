const Schedule = require('../database/models/Schedule');
const User = require('../database/models/User');
const Student = require('../database/models/Student');
const Teacher = require('../database/models/Teacher');
const Class = require('../database/models/Class');
const Subject = require('../database/models/Subject');
const Classroom = require('../database/models/Classroom');
const Semester = require('../database/models/Semester');
const moment = require('moment');

// Helper function to get classId based on user role and userId
const getClassIdForUser = async (user) => {
  if (!user) return null;
  
  if (user.role === 'Student') {
    const student = await Student.findOne({ userId: user.userId });
    return student ? student.classId : null;
  } else if (user.role === 'Teacher') {
    // For teachers, we'll handle this differently in the main functions
    return null;
  }
  return null;
};

/**
 * @desc    Format schedule data for API responses
 * @param   {Array} schedules - Raw schedule data from database
 * @param   {String} format - Format type (daily, weekly, etc.)
 * @returns {Object} Formatted schedule data
 */
const formatScheduleData = (schedules, format = 'weekly') => {
  if (format === 'daily') {
    return schedules.map(slot => ({
      id: slot.scheduleId,
      period: slot.period,
      subject: slot.subject ? {
        id: slot.subject.subjectId,
        name: slot.subject.subjectName,
        type: slot.subject.subjectType
      } : null,
      teacher: slot.teacher ? {
        id: slot.teacher.teacherId,
        name: slot.teacher.fullName
      } : null,
      classroom: slot.classroom ? {
        id: slot.classroom.classroomId,
        room: slot.classroom.roomNumber,
        building: slot.classroom.building
      } : null,
      startTime: slot.startTime,
      endTime: slot.endTime,
      isFreeTime: slot.isFreeTime
    }));
  } else {
    // Weekly format organized by day
    const formattedSchedule = {
      Monday: [],
      Tuesday: [],
      Wednesday: [],
      Thursday: [],
      Friday: [],
      Saturday: [],
      Sunday: []
    };
    
    schedules.forEach(slot => {
      formattedSchedule[slot.dayOfWeek].push({
        id: slot.scheduleId,
        period: slot.period,
        subject: slot.subject ? {
          id: slot.subject.subjectId,
          name: slot.subject.subjectName,
          type: slot.subject.subjectType
        } : null,
        teacher: slot.teacher ? {
          id: slot.teacher.teacherId,
          name: slot.teacher.fullName
        } : null,
        classroom: slot.classroom ? {
          id: slot.classroom.classroomId,
          room: slot.classroom.roomNumber,
          building: slot.classroom.building
        } : null,
        startTime: slot.startTime,
        endTime: slot.endTime,
        isFreeTime: slot.isFreeTime
      });
    });
    
    // Sort each day's schedule by period
    Object.keys(formattedSchedule).forEach(day => {
      formattedSchedule[day].sort((a, b) => a.period - b.period);
    });
    
    return formattedSchedule;
  }
};

// @desc    Get weekly schedule
// @route   GET /api/schedules/weekly
// @route   GET /api/schedules/user/:userId/weekly
// @route   GET /api/schedules/class/:classId/weekly
// @access  Private
exports.getWeeklySchedule = async (req, res) => {
  try {
    let classId = null;
    let teacherId = null;
    let currentWeek = null;
    let semesterId = null;
    
    // Get current semester if not specified
    if (req.query.semesterId) {
      semesterId = parseInt(req.query.semesterId);
    } else {
      const currentDate = new Date();
      const currentSemester = await Semester.findOne({
        startDate: { $lte: currentDate },
        endDate: { $gte: currentDate }
      });
      
      if (currentSemester) {
        semesterId = currentSemester.semesterId;
      } else {
        // If no current semester, get the latest one
        const latestSemester = await Semester.findOne().sort({ endDate: -1 });
        semesterId = latestSemester ? latestSemester.semesterId : null;
      }
    }
    
    // Check if specific userId is provided
    if (req.params.userId && req.params.userId !== req.user.userId) {
      // Only admins can view other users' schedules
      if (req.user.role !== 'Admin') {
        return res.status(403).json({
          success: false,
          message: 'Không có quyền xem thời khóa biểu của người dùng khác'
        });
      }
      
      const targetUser = await User.findOne({ userId: req.params.userId });
      if (!targetUser) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy người dùng'
        });
      }
      
      if (targetUser.role === 'Teacher') {
        const teacher = await Teacher.findOne({ userId: targetUser.userId });
        teacherId = teacher ? teacher.teacherId : null;
      } else {
        classId = await getClassIdForUser(targetUser);
      }
    } 
    // Check if specific classId is provided
    else if (req.params.classId) {
      classId = parseInt(req.params.classId);
      
      // Verify class exists
      const classExists = await Class.findOne({ classId });
      if (!classExists) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy lớp học'
        });
      }
    } 
    // Use current user
    else {
      // For teachers, get their teacherId
      if (req.user.role === 'Teacher') {
        const teacher = await Teacher.findOne({ userId: req.user.userId });
        teacherId = teacher ? teacher.teacherId : null;
      } 
      // For students, get their classId
      else if (req.user.role === 'Student') {
        classId = await getClassIdForUser(req.user);
      }
      // For parents, get their children's classes
      else if (req.user.role === 'Parent') {
        const parent = await Parent.findOne({ userId: req.user.userId });
        if (parent && parent.studentIds && parent.studentIds.length > 0) {
          // If studentId is specified in query, use that
          if (req.query.studentId) {
            const student = await Student.findOne({ 
              studentId: parseInt(req.query.studentId),
              _id: { $in: parent.studentIds }
            });
            classId = student ? student.classId : null;
          } else {
            // Otherwise use the first student
            const student = await Student.findOne({ 
              _id: { $in: parent.studentIds }
            });
            classId = student ? student.classId : null;
          }
        }
      }
    }
    
    let query = {};
    
    if (semesterId) {
      query.semesterId = semesterId;
    }
    
    if (classId) {
      query.classId = classId;
    } else if (teacherId) {
      query.teacherId = teacherId;
    } else if (req.user.role === 'Admin') {
      // Admins can see all schedules if no specific filters
      // But we should at least filter by semester or class to avoid returning everything
      if (!semesterId && !req.query.showAll) {
        return res.status(400).json({
          success: false,
          message: 'Vui lòng chỉ định học kỳ hoặc lớp học để xem thời khóa biểu'
        });
      }
    } else {
      return res.status(400).json({
        success: false,
        message: 'Không thể xác định ngữ cảnh thời khóa biểu'
      });
    }
    
    // Execute query with populate
    const schedules = await Schedule.find(query)
      .populate('class')
      .populate('subject')
      .populate('teacher')
      .populate('classroom')
      .populate('semester')
      .sort({ dayOfWeek: 1, period: 1 });
    
    // Format the schedule data
    const formattedSchedule = formatScheduleData(schedules, 'weekly');
    
    // Get context information
    let contextInfo = {};
    
    if (classId) {
      const classInfo = await Class.findOne({ classId }).populate('batch').populate('homeroomTeacher');
      if (classInfo) {
        contextInfo.class = {
          id: classInfo.classId,
          name: classInfo.className,
          batch: classInfo.batch ? {
            id: classInfo.batch.batchId,
            name: classInfo.batch.batchName
          } : null,
          homeroomTeacher: classInfo.homeroomTeacher ? {
            id: classInfo.homeroomTeacher.teacherId,
            name: classInfo.homeroomTeacher.fullName
          } : null
        };
      }
    } else if (teacherId) {
      const teacherInfo = await Teacher.findOne({ teacherId });
      if (teacherInfo) {
        contextInfo.teacher = {
          id: teacherInfo.teacherId,
          name: teacherInfo.fullName
        };
      }
    }
    
    if (semesterId) {
      const semesterInfo = await Semester.findOne({ semesterId });
      if (semesterInfo) {
        contextInfo.semester = {
          id: semesterInfo.semesterId,
          name: semesterInfo.name,
          startDate: semesterInfo.startDate,
          endDate: semesterInfo.endDate
        };
      }
    }
    
    res.json({
      success: true,
      context: contextInfo,
      data: formattedSchedule
    });
    
  } catch (error) {
    console.error('Lỗi khi lấy thời khóa biểu theo tuần:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get daily schedule
// @route   GET /api/schedules/daily/:date
// @access  Private
exports.getDailySchedule = async (req, res) => {
  try {
    const date = req.params.date ? moment(req.params.date) : moment();
    
    if (!date.isValid()) {
      return res.status(400).json({
        success: false,
        message: 'Định dạng ngày không hợp lệ. Sử dụng YYYY-MM-DD'
      });
    }
    
    // Get day of week from date
    const dayOfWeek = date.format('dddd');
    
    let classId = null;
    let teacherId = null;
    let semesterId = null;
    
    // Get current semester if not specified
    if (req.query.semesterId) {
      semesterId = parseInt(req.query.semesterId);
    } else {
      const currentDate = new Date();
      const currentSemester = await Semester.findOne({
        startDate: { $lte: currentDate },
        endDate: { $gte: currentDate }
      });
      
      if (currentSemester) {
        semesterId = currentSemester.semesterId;
      } else {
        // If no current semester, get the latest one
        const latestSemester = await Semester.findOne().sort({ endDate: -1 });
        semesterId = latestSemester ? latestSemester.semesterId : null;
      }
    }
    
    // For teachers, get their teacherId
    if (req.user.role === 'Teacher') {
      const teacher = await Teacher.findOne({ userId: req.user.userId });
      teacherId = teacher ? teacher.teacherId : null;
    } 
    // For students, get their classId
    else if (req.user.role === 'Student') {
      classId = await getClassIdForUser(req.user);
    }
    // For parents, get their children's classes
    else if (req.user.role === 'Parent') {
      const parent = await Parent.findOne({ userId: req.user.userId });
      if (parent && parent.studentIds && parent.studentIds.length > 0) {
        // If studentId is specified in query, use that
        if (req.query.studentId) {
          const student = await Student.findOne({ 
            studentId: parseInt(req.query.studentId),
            _id: { $in: parent.studentIds }
          });
          classId = student ? student.classId : null;
        } else {
          // Otherwise use the first student
          const student = await Student.findOne({ 
            _id: { $in: parent.studentIds }
          });
          classId = student ? student.classId : null;
        }
      }
    }
    
    let query = {
      dayOfWeek: dayOfWeek
    };
    
    if (semesterId) {
      query.semesterId = semesterId;
    }
    
    if (classId) {
      query.classId = classId;
    } else if (teacherId) {
      query.teacherId = teacherId;
    } else if (req.user.role === 'Admin') {
      // Admins need at least one filter
      if (!req.query.classId && !req.query.teacherId && !req.query.showAll) {
        return res.status(400).json({
          success: false,
          message: 'Vui lòng chỉ định lớp học hoặc giáo viên để xem thời khóa biểu'
        });
      }
      
      if (req.query.classId) {
        query.classId = parseInt(req.query.classId);
      }
      
      if (req.query.teacherId) {
        query.teacherId = parseInt(req.query.teacherId);
      }
    } else {
      return res.status(400).json({
        success: false,
        message: 'Không thể xác định ngữ cảnh thời khóa biểu'
      });
    }
    
    const schedules = await Schedule.find(query)
      .populate('class')
      .populate('subject')
      .populate('teacher')
      .populate('classroom')
      .populate('semester')
      .sort({ period: 1 });
    
    const formattedSchedule = formatScheduleData(schedules, 'daily');
    
    // Get context information
    let contextInfo = {};
    
    if (classId) {
      const classInfo = await Class.findOne({ classId }).populate('batch').populate('homeroomTeacher');
      if (classInfo) {
        contextInfo.class = {
          id: classInfo.classId,
          name: classInfo.className,
          batch: classInfo.batch ? {
            id: classInfo.batch.batchId,
            name: classInfo.batch.batchName
          } : null,
          homeroomTeacher: classInfo.homeroomTeacher ? {
            id: classInfo.homeroomTeacher.teacherId,
            name: classInfo.homeroomTeacher.fullName
          } : null
        };
      }
    } else if (teacherId) {
      const teacherInfo = await Teacher.findOne({ teacherId });
      if (teacherInfo) {
        contextInfo.teacher = {
          id: teacherInfo.teacherId,
          name: teacherInfo.fullName
        };
      }
    }
    
    if (semesterId) {
      const semesterInfo = await Semester.findOne({ semesterId });
      if (semesterInfo) {
        contextInfo.semester = {
          id: semesterInfo.semesterId,
          name: semesterInfo.name,
          startDate: semesterInfo.startDate,
          endDate: semesterInfo.endDate
        };
      }
    }
    
    res.json({
      success: true,
      date: date.format('YYYY-MM-DD'),
      dayOfWeek: dayOfWeek,
      context: contextInfo,
      data: formattedSchedule
    });
    
  } catch (error) {
    console.error('Lỗi khi lấy thời khóa biểu theo ngày:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get semester schedule
// @route   GET /api/schedules/semester/:semesterId
// @access  Private
exports.getSemesterSchedule = async (req, res) => {
  try {
    const { semesterId } = req.params;
    
    if (!semesterId) {
      return res.status(400).json({
        success: false,
        message: 'Cần có ID học kỳ'
      });
    }
    
    // Verify semester exists
    const semesterInfo = await Semester.findOne({ semesterId: parseInt(semesterId) });
    if (!semesterInfo) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy học kỳ'
      });
    }
    
    let classId = null;
    let teacherId = null;
    
    // For teachers, get their teacherId
    if (req.user.role === 'Teacher') {
      const teacher = await Teacher.findOne({ userId: req.user.userId });
      teacherId = teacher ? teacher.teacherId : null;
    } 
    // For students, get their classId
    else if (req.user.role === 'Student') {
      classId = await getClassIdForUser(req.user);
    }
    // For parents, get their children's classes
    else if (req.user.role === 'Parent') {
      const parent = await Parent.findOne({ userId: req.user.userId });
      if (parent && parent.studentIds && parent.studentIds.length > 0) {
        // If studentId is specified in query, use that
        if (req.query.studentId) {
          const student = await Student.findOne({ 
            studentId: parseInt(req.query.studentId),
            _id: { $in: parent.studentIds }
          });
          classId = student ? student.classId : null;
        } else {
          // Otherwise use the first student
          const student = await Student.findOne({ 
            _id: { $in: parent.studentIds }
          });
          classId = student ? student.classId : null;
        }
      }
    }
    
    let query = {
      semesterId: parseInt(semesterId)
    };
    
    // Admin can override with query params
    if (req.user.role === 'Admin') {
      if (req.query.classId) {
        query.classId = parseInt(req.query.classId);
      } else if (req.query.teacherId) {
        query.teacherId = parseInt(req.query.teacherId);
      }
    } else {
      // Non-admin uses their context
      if (classId) {
        query.classId = classId;
      } else if (teacherId) {
        query.teacherId = teacherId;
      } else {
        return res.status(400).json({
          success: false,
          message: 'Không thể xác định ngữ cảnh thời khóa biểu'
        });
      }
    }
    
    const schedules = await Schedule.find(query)
      .populate('class')
      .populate('subject')
      .populate('teacher')
      .populate('classroom')
      .populate('semester')
      .sort({ dayOfWeek: 1, period: 1 });
    
    // Format the schedule data
    const formattedSchedule = formatScheduleData(schedules, 'weekly');
    
    // Get context information
    let contextInfo = {
      semester: {
        id: semesterInfo.semesterId,
        name: semesterInfo.name,
        startDate: semesterInfo.startDate,
        endDate: semesterInfo.endDate
      }
    };
    
    if (query.classId) {
      const classInfo = await Class.findOne({ classId: query.classId }).populate('batch').populate('homeroomTeacher');
      if (classInfo) {
        contextInfo.class = {
          id: classInfo.classId,
          name: classInfo.className,
          batch: classInfo.batch ? {
            id: classInfo.batch.batchId,
            name: classInfo.batch.batchName
          } : null,
          homeroomTeacher: classInfo.homeroomTeacher ? {
            id: classInfo.homeroomTeacher.teacherId,
            name: classInfo.homeroomTeacher.fullName
          } : null
        };
      }
    } else if (query.teacherId) {
      const teacherInfo = await Teacher.findOne({ teacherId: query.teacherId });
      if (teacherInfo) {
        contextInfo.teacher = {
          id: teacherInfo.teacherId,
          name: teacherInfo.fullName
        };
      }
    }
    
    res.json({
      success: true,
      context: contextInfo,
      data: formattedSchedule
    });
    
  } catch (error) {
    console.error('Lỗi khi lấy thời khóa biểu theo học kỳ:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
}; 