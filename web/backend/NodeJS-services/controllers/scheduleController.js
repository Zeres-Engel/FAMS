const UserAccount = require('../database/models/UserAccount');
const Student = require('../database/models/Student');
const Teacher = require('../database/models/Teacher');
const Class = require('../database/models/Class');
const Parent = require('../database/models/Parent');
const scheduleService = require('../services/scheduleService');
const mongoose = require('mongoose');

// Helper function to get classId based on user role and userId
const getClassIdForUser = async (user) => {
  if (!user) return null;
  
  if (user.role === 'Student') {
    const student = await Student.findOne({ userId: user.userId });
    console.log('Found student:', student);
    return student ? student.classId : null;
  } else if (user.role === 'Teacher') {
    // For teachers, we'll handle this differently in the main functions
    return null;
  } else if (user.role === 'Parent') {
    // Parents might have multiple children/classes, handled in main functions
    return null;
  }
  return null;
};

// Helper to get teacherId for a user
const getTeacherIdForUser = async (user) => {
  if (!user || user.role !== 'Teacher') return null;
  const teacher = await Teacher.findOne({ userId: user.userId });
  return teacher ? teacher.teacherId : null;
};

// @desc    Get weekly schedule
// @route   GET /api/schedules/weekly
// @route   GET /api/schedules/user/:userId/weekly
// @route   GET /api/schedules/class/:classId/weekly
// @access  Private
exports.getWeeklySchedule = async (req, res) => {
  try {
    console.log('User in request:', req.user);
    
    let classId = null;
    let teacherId = null;
    let weekNumber = req.query.week ? parseInt(req.query.week) : null;
    let semesterId = req.query.semesterId ? req.query.semesterId : null;
    
    // Check if specific userId is provided
    if (req.params.userId && req.params.userId !== req.user.userId) {
      // Only admins can view other users' schedules
      if (req.user.role !== 'Admin') {
        return res.status(403).json({
          success: false,
          message: 'Không có quyền xem thời khóa biểu của người dùng khác'
        });
      }
      
      const targetUser = await UserAccount.findOne({ userId: req.params.userId });
      if (!targetUser) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy người dùng'
        });
      }
      
      if (targetUser.role === 'Teacher') {
        const teacher = await Teacher.findOne({ userId: targetUser.userId });
        teacherId = teacher ? teacher.teacherId : null;
      } else if (targetUser.role === 'Student') {
        const student = await Student.findOne({ userId: targetUser.userId });
        classId = student ? student.classId : null;
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
      console.log('Using current user for schedule lookup', req.user.role);
      // For teachers, get their teacherId
      if (req.user.role === 'Teacher') {
        teacherId = await getTeacherIdForUser(req.user);
        console.log('Teacher ID:', teacherId);
      } 
      // For students, get their classId
      else if (req.user.role === 'Student') {
        const student = await Student.findOne({ userId: req.user.userId });
        classId = student ? student.classId : null;
        console.log('Student class ID:', classId);
      }
      // For parents, get their children's classes
      else if (req.user.role === 'Parent') {
        const parent = await Parent.findOne({ userId: req.user.userId });
        if (parent && parent.studentIds && parent.studentIds.length > 0) {
          // If studentId is specified in query, use that
          if (req.query.studentId) {
            const student = await Student.findOne({ 
              studentId: parseInt(req.query.studentId),
              parentIds: { $in: [parent.parentId] }
            });
            classId = student ? student.classId : null;
          } else {
            // Otherwise use the first student
            const student = await Student.findOne({ 
              parentIds: { $in: [parent.parentId] }
            });
            classId = student ? student.classId : null;
          }
          console.log('Parent\'s student class ID:', classId);
        }
      }
    }
    
    // If no classId or teacherId was found, return empty data for non-admin users
    if (!classId && !teacherId && req.user.role !== 'Admin') {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy lớp học hoặc giáo viên',
        code: 'NO_SCHEDULE_DATA'
      });
    }
    
    // Get the weekly schedule
    console.log('Fetching weekly schedule with params:', { weekNumber, semesterId, classId, teacherId });
    const schedules = await scheduleService.getWeeklySchedule(
      weekNumber,
      semesterId,
      classId, 
      teacherId
    );
    
    // Format the response
    const formattedSchedule = await scheduleService.formatScheduleData(schedules, 'weekly');
    
    // Add metadata
    const semester = await scheduleService.getSemester(semesterId);
    const startDate = weekNumber && semester ? 
      scheduleService.getStartDateOfWeek(weekNumber, semester) : 
      new Date();
    
    res.json({
      success: true,
      data: formattedSchedule,
      meta: {
        weekNumber: weekNumber || (semester ? scheduleService.getWeekNumberInSemester(startDate, semester) : null),
        semesterName: semester ? semester.SemesterName : null,
        semesterId: semester ? semester.semesterId : null,
        startDate,
        classId,
        teacherId
      }
    });
  } catch (error) {
    console.error('Error in getWeeklySchedule:', error);
    res.status(500).json({
      success: false,
      message: error.message,
      code: 'SCHEDULE_ERROR'
    });
  }
};

// @desc    Get daily schedule for a specific date
// @route   GET /api/schedules/daily/:date
// @access  Private
exports.getDailySchedule = async (req, res) => {
  try {
    console.log(`Đang xử lý yêu cầu lịch học từ user ${req.user.name} (${req.user.userId})`);
    
    let classId = null;
    let teacherId = null;
    
    // Parse date from params
    const dateParam = req.params.date;
    let date;
    
    if (dateParam === 'today') {
      date = new Date();
    } else if (dateParam === 'tomorrow') {
      date = new Date();
      date.setDate(date.getDate() + 1);
    } else {
      // Try to parse the date in format YYYY-MM-DD
      date = new Date(dateParam);
      if (isNaN(date.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Định dạng ngày không hợp lệ. Sử dụng YYYY-MM-DD hoặc "today"/"tomorrow"'
        });
      }
    }
    
    console.log(`Tìm lịch học cho ngày ${date.toISOString().split('T')[0]}`);
    
    // For teachers, get their teacherId
    if (req.user.role === 'Teacher') {
      teacherId = await getTeacherIdForUser(req.user);
      console.log('Teacher ID:', teacherId);
    } 
    // For students, get their classId
    else if (req.user.role === 'Student') {
      const student = await Student.findOne({ userId: req.user.userId });
      classId = student ? student.classId : null;
      console.log('Student class ID:', classId);
    }
    // For parents, get their children's classes
    else if (req.user.role === 'Parent') {
      const parent = await Parent.findOne({ userId: req.user.userId });
      if (parent && parent.studentIds && parent.studentIds.length > 0) {
        if (req.query.studentId) {
          const student = await Student.findOne({ 
            studentId: parseInt(req.query.studentId),
            parentIds: { $in: [parent.parentId] }
          });
          classId = student ? student.classId : null;
        } else {
          const student = await Student.findOne({ 
            parentIds: { $in: [parent.parentId] }
          });
          classId = student ? student.classId : null;
        }
        console.log('Parent\'s student class ID:', classId);
      }
    }
    // For admins, use query parameters
    else if (req.user.role === 'Admin') {
      if (req.query.teacherId) {
        teacherId = parseInt(req.query.teacherId);
      } else if (req.query.classId) {
        classId = parseInt(req.query.classId);
      }
      console.log('Admin query params:', { teacherId, classId });
    }
    
    // If no classId or teacherId was found, return empty data for non-admin users
    if (!classId && !teacherId && req.user.role !== 'Admin') {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy lớp học hoặc giáo viên',
        code: 'NO_SCHEDULE_DATA'
      });
    }
    
    // Get the daily schedule
    console.log('Fetching daily schedule with params:', { date, classId, teacherId });
    const schedules = await scheduleService.getDailySchedule(
      date, 
      null, 
      classId, 
      teacherId
    );
    
    console.log(`Tìm thấy ${schedules.length} lịch học cho ngày ${date.toISOString().split('T')[0]}`);
    
    // Standardize the dayOfWeek field if missing
    schedules.forEach(schedule => {
      if (!schedule.dayOfWeek) {
        const sessionDate = new Date(schedule.SessionDate || schedule.sessionDate);
        schedule.dayOfWeek = sessionDate.toLocaleString('en-US', { weekday: 'long' });
        console.log(`Bổ sung thông tin ngày trong tuần (${schedule.dayOfWeek}) cho lịch học ${schedule.scheduleId}`);
      }
    });
    
    // Format the schedule
    const formattedSchedule = await scheduleService.formatScheduleData(schedules, 'daily');
    
    // In chi tiết từng item để debug
    console.log('Chi tiết lịch học đã format:');
    formattedSchedule.forEach((item, index) => {
      console.log(`Item ${index + 1}:`, JSON.stringify(item));
    });
    
    // Get semester information
    const semester = await scheduleService.getSemester();
    const weekNumber = semester ? scheduleService.getWeekNumberInSemester(date, semester) : null;
    
    // Normalize response to ensure all required fields exist
    const finalSchedule = formattedSchedule.map(item => ({
      ...item,
      id: item.id || item.scheduleId || 0,
      period: item.period || item.SlotID || 0,
      subject: item.subject || { id: 0, name: 'Không xác định', type: 'Không xác định' },
      teacher: item.teacher || { id: 0, name: 'Không xác định' },
      classroom: item.classroom || { id: 0, room: 'Không xác định', building: 'Không xác định' },
      startTime: item.startTime || '00:00',
      endTime: item.endTime || '00:00',
      sessionDate: item.sessionDate || date.toISOString().split('T')[0]
    }));
    
    console.log(`Trả về ${finalSchedule.length} lịch học cho frontend`);
    
    // Cấu trúc phản hồi theo đúng format frontend mong đợi
    const response = {
      success: true,
      data: finalSchedule,
      meta: {
        date: date.toISOString().split('T')[0],
        dayOfWeek: date.toLocaleString('en-US', { weekday: 'long' }),
        weekNumber,
        semesterName: semester ? semester.SemesterName : null,
        semesterId: semester ? semester.semesterId : null,
        classId,
        teacherId
      }
    };
    
    res.json(response);
  } catch (error) {
    console.error('Error in getDailySchedule:', error);
    res.status(500).json({
      success: false,
      message: error.message,
      code: 'SCHEDULE_ERROR'
    });
  }
};

// @desc    Get schedule for a semester
// @route   GET /api/schedules/semester/:semesterId
// @access  Private
exports.getSemesterSchedule = async (req, res) => {
  try {
    console.log(`Yêu cầu lịch học cho học kỳ: ${req.params.semesterId}`);
    
    const { semesterId } = req.params;
    let classId = null;
    let teacherId = null;
    
    // For teachers, get their schedules
    if (req.user.role === 'Teacher') {
      teacherId = await getTeacherIdForUser(req.user);
      console.log('Teacher ID:', teacherId);
    } 
    // For students, get their class schedules
    else if (req.user.role === 'Student') {
      const student = await Student.findOne({ userId: req.user.userId });
      classId = student ? student.classId : null;
      console.log('Student class ID:', classId);
    }
    // For parents, get their children's schedules
    else if (req.user.role === 'Parent') {
      const parent = await Parent.findOne({ userId: req.user.userId });
      if (parent && parent.studentIds && parent.studentIds.length > 0) {
        if (req.query.studentId) {
          const student = await Student.findOne({ 
            studentId: parseInt(req.query.studentId),
            parentIds: { $in: [parent.parentId] }
          });
          classId = student ? student.classId : null;
        } else {
          const student = await Student.findOne({ 
            parentIds: { $in: [parent.parentId] }
          });
          classId = student ? student.classId : null;
        }
        console.log('Parent\'s student class ID:', classId);
      }
    }
    // For admins, use query parameters
    else if (req.user.role === 'Admin') {
      if (req.query.teacherId) {
        teacherId = parseInt(req.query.teacherId);
      } else if (req.query.classId) {
        classId = parseInt(req.query.classId);
      }
    }
    
    // Request schedule from service
    const schedules = await scheduleService.getSemesterSchedule(
      semesterId,
      classId,
      teacherId
    );
    
    // Format for response if needed
    const formattedSchedules = await scheduleService.formatScheduleData(schedules, 'semester');
    
    // Get semester info for response
    const semester = await scheduleService.getSemester(semesterId);
    
    res.json({
      success: true,
      message: `Tìm thấy ${schedules.length} lịch học cho học kỳ`,
      data: {
        semester: semester ? {
          semesterId: semester.semesterId,
          semesterName: semester.SemesterName || semester.name || 'Học kỳ',
          startDate: semester.StartDate || semester.startDate,
          endDate: semester.EndDate || semester.endDate
        } : null,
        schedules: formattedSchedules,
        metadata: {
          classId,
          teacherId
        }
      }
    });
  } catch (error) {
    console.error('Error in getSemesterSchedule:', error);
    res.status(500).json({
      success: false,
      message: error.message,
      code: 'SCHEDULE_ERROR'
    });
  }
};

// @desc    Get current semester
// @route   GET /api/schedules/semester/current
// @access  Private
exports.getCurrentSemester = async (req, res) => {
  try {
    const semester = await scheduleService.getSemester();
    
    if (!semester) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy học kỳ hiện tại',
        code: 'SEMESTER_NOT_FOUND'
      });
    }
    
    console.log(`Tìm lịch học cho học kỳ hiện tại: ${semester.semesterId}`);
    
    // Truy vấn trực tiếp các buổi học của học kỳ từ SemesterSchedule
    let schedules = await mongoose.connection.db.collection('SemesterSchedule')
      .find({ semesterId: semester.semesterId })
      .toArray();
    
    // Nếu không tìm thấy trong SemesterSchedule, thử tìm trong ClassSchedule
    if (schedules.length === 0) {
      console.log('Không tìm thấy lịch học trong SemesterSchedule, thử tìm trong ClassSchedule...');
      schedules = await mongoose.connection.db.collection('ClassSchedule')
        .find({ semesterId: semester.semesterId })
        .toArray();
      
      console.log(`Tìm thấy ${schedules.length} lịch học trong ClassSchedule cho học kỳ hiện tại`);
    } else {
      console.log(`Tìm thấy ${schedules.length} lịch học trong SemesterSchedule cho học kỳ hiện tại`);
    }
    
    // Format dữ liệu trả về
    const formattedSchedules = await scheduleService.formatScheduleData(schedules, 'weekly');
    
    return res.json({
      success: true,
      message: `Tìm thấy học kỳ hiện tại: ${semester.SemesterName || 'Học kỳ hiện tại'}`,
      data: {
        semester: {
          semesterId: semester.semesterId,
          semesterName: semester.SemesterName || semester.name,
          startDate: semester.StartDate || semester.startDate,
          endDate: semester.EndDate || semester.endDate
        },
        schedules: formattedSchedules
      }
    });
  } catch (error) {
    console.error('Error in getCurrentSemester:', error);
    res.status(500).json({
      success: false,
      message: error.message,
      code: 'SEMESTER_ERROR'
    });
  }
};

// @desc    Get all semesters
// @route   GET /api/schedules/semesters
// @access  Private
exports.getAllSemesters = async (req, res) => {
  try {
    const semesters = await Semester.find();
    
    res.json({
      success: true,
      data: semesters.map(semester => ({
        semesterId: semester.semesterId,
        semesterName: semester.SemesterName,
        startDate: semester.StartDate,
        endDate: semester.EndDate,
        curriculumId: semester.CurriculumID,
        batchId: semester.BatchID
      }))
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      code: 'SEMESTER_ERROR'
    });
  }
};

// @desc    Get schedule by session week range (e.g., "2024-08-26 to 2024-09-01")
// @route   GET /api/schedules/week-range/:weekRange
// @access  Private
exports.getScheduleByWeekRange = async (req, res) => {
  try {
    console.log(`Đang xử lý yêu cầu lịch học theo tuần từ user ${req.user.name} (${req.user.userId})`);
    
    let classId = null;
    let teacherId = null;
    
    // Get week range from params
    const weekRange = req.params.weekRange;
    
    console.log(`Tìm lịch học cho tuần ${weekRange}`);
    
    // Parse the week range
    const { startDate, endDate } = scheduleService.parseWeekRange(weekRange);
    
    // Validate the week range
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Định dạng tuần không hợp lệ. Sử dụng định dạng "YYYY-MM-DD to YYYY-MM-DD"'
      });
    }
    
    // Get classId or teacherId based on user role
    if (req.user.role === 'Student') {
      const Student = mongoose.model('Student');
      const student = await Student.findOne({ userId: req.user.userId });
      
      if (student && student.classId) {
        classId = student.classId;
        console.log(`StudentID: ${student.studentId}, ClassID: ${classId}`);
      }
    } else if (req.user.role === 'Teacher') {
      const Teacher = mongoose.model('Teacher');
      const teacher = await Teacher.findOne({ userId: req.user.userId });
      
      if (teacher && teacher.teacherId) {
        teacherId = teacher.teacherId;
        console.log(`Teacher ID: ${teacherId}`);
      }
    } else if (req.user.role === 'Admin') {
      // Admin can query with specific parameters
      if (req.query.classId) {
        classId = parseInt(req.query.classId);
      }
      
      if (req.query.teacherId) {
        teacherId = parseInt(req.query.teacherId);
      }
    }
    
    // Handle specific parameters for Parent role or Admin override
    if (req.query.classId) {
      classId = parseInt(req.query.classId);
    }
    
    if (req.query.teacherId) {
      teacherId = parseInt(req.query.teacherId);
    }
    
    // For parent, check if they have access to the requested student's class
    if (req.user.role === 'Parent' && req.query.studentId) {
      const Parent = mongoose.model('Parent');
      const Student = mongoose.model('Student');
      
      const parent = await Parent.findOne({ userId: req.user.userId });
      
      if (parent && parent.studentIds && parent.studentIds.includes(parseInt(req.query.studentId))) {
        const student = await Student.findOne({ studentId: parseInt(req.query.studentId) });
        
        if (student && student.classId) {
          classId = student.classId;
        }
      }
    }
    
    // Get the schedules for the specified week range
    const schedules = await scheduleService.getScheduleBySessionWeek(
      weekRange,
      classId, 
      teacherId
    );
    
    console.log(`Lấy được ${schedules.length} lịch học từ database`);
    
    // Format the response
    const formattedSchedule = await scheduleService.formatScheduleData(schedules, 'weekly');
    
    console.log(`Đã format ${formattedSchedule.length} lịch học`);
    
    // Add user info
    let userInfo = null;
    if (req.user.role === 'Student') {
      const Student = mongoose.model('Student');
      const student = await Student.findOne({ userId: req.user.userId });
      if (student) {
        userInfo = {
          fullName: student.fullName,
          classId: student.classId
        };
      }
    } else if (req.user.role === 'Teacher') {
      const Teacher = mongoose.model('Teacher');
      const teacher = await Teacher.findOne({ userId: req.user.userId });
      if (teacher) {
        userInfo = {
          fullName: teacher.fullName,
          major: teacher.major
        };
      }
    }
    
    // Prepare the response with clear structure
    const responseData = {
      success: true,
      data: {
        schedules: formattedSchedule,
        weekRange,
        startDate: startDate.toISOString().slice(0, 10),
        endDate: endDate.toISOString().slice(0, 10),
        user: userInfo,
        role: req.user.role
      }
    };
    
    // Log the structure for debugging
    console.log(`Trả về response với ${formattedSchedule.length} lịch học`);
    console.log(`Cấu trúc dữ liệu: schedules (Array), weekRange, startDate, endDate, user, role`);
    
    res.json(responseData);
  } catch (error) {
    console.error('Error in getScheduleByWeekRange:', error);
    res.status(500).json({
      success: false,
      message: error.message,
      code: 'SCHEDULE_ERROR'
    });
  }
};

// @desc    Get current week range for easy reference
// @route   GET /api/schedules/current-week
// @access  Private
exports.getCurrentWeekRange = async (req, res) => {
  try {
    const today = new Date();
    const startOfWeek = scheduleService.getStartOfWeek(today);
    const weekRange = scheduleService.getWeekRangeString(startOfWeek);
    
    res.json({
      success: true,
      data: {
        currentDate: today,
        weekRange,
        weekStart: startOfWeek,
        weekEnd: new Date(startOfWeek.getTime() + 6 * 24 * 60 * 60 * 1000)
      }
    });
  } catch (error) {
    console.error('Error in getCurrentWeekRange:', error);
    res.status(500).json({
      success: false,
      message: error.message,
      code: 'SCHEDULE_ERROR'
    });
  }
}; 