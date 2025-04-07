const User = require('../database/models/User');
const Student = require('../database/models/Student');
const Teacher = require('../database/models/Teacher');
const Class = require('../database/models/Class');
const Parent = require('../database/models/Parent');
const scheduleService = require('../services/scheduleService');

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
    const formattedSchedule = scheduleService.formatScheduleData(schedules, 'weekly');
    
    // Add metadata
    const semester = await scheduleService.getSemester(semesterId);
    const startDate = weekNumber ? 
      scheduleService.getStartDateOfWeek(weekNumber, semester) : 
      new Date();
    
    res.json({
      success: true,
      data: formattedSchedule,
      meta: {
        weekNumber: weekNumber || scheduleService.getWeekNumberInSemester(startDate, semester),
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
    console.log('User in request:', req.user);
    
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
    
    // Format the schedule
    const formattedSchedule = scheduleService.formatScheduleData(schedules, 'daily');
    
    // Get semester information
    const semester = await scheduleService.getSemester();
    const weekNumber = scheduleService.getWeekNumberInSemester(date, semester);
    
    res.json({
      success: true,
      data: formattedSchedule,
      meta: {
        date: date.toISOString().split('T')[0],
        dayOfWeek: date.toLocaleString('en-US', { weekday: 'long' }),
        weekNumber,
        semesterName: semester ? semester.SemesterName : null,
        semesterId: semester ? semester.semesterId : null,
        classId,
        teacherId
      }
    });
  } catch (error) {
    console.error('Error in getDailySchedule:', error);
    res.status(500).json({
      success: false,
      message: error.message,
      code: 'SCHEDULE_ERROR'
    });
  }
};

// @desc    Get schedule for an entire semester
// @route   GET /api/schedules/semester/:semesterId
// @access  Private
exports.getSemesterSchedule = async (req, res) => {
  try {
    console.log('User in request:', req.user);
    
    let classId = null;
    let teacherId = null;
    
    // Get semesterId from params
    const semesterId = req.params.semesterId;
    
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
    
    // Get the semester schedule
    console.log('Fetching semester schedule with params:', { semesterId, classId, teacherId });
    const schedules = await scheduleService.getSemesterSchedule(
      semesterId,
      classId,
      teacherId
    );
    
    // Format the schedule
    const formattedSchedule = scheduleService.formatScheduleData(schedules, 'semester');
    
    // Get semester information
    const semester = await scheduleService.getSemester(semesterId);
    
    res.json({
      success: true,
      data: formattedSchedule,
      meta: {
        semesterName: semester ? semester.SemesterName : null,
        semesterId: semester ? semester.semesterId : null,
        startDate: semester ? semester.StartDate : null,
        endDate: semester ? semester.EndDate : null,
        classId,
        teacherId
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

// @desc    Get information about current semester
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
    
    res.json({
      success: true,
      data: {
        semesterId: semester.semesterId,
        semesterName: semester.SemesterName,
        startDate: semester.StartDate,
        endDate: semester.EndDate,
        curriculumId: semester.CurriculumID,
        batchId: semester.BatchID
      }
    });
  } catch (error) {
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