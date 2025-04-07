const mongoose = require('mongoose');
const Semester = require('../database/models/Semester');
const ClassSchedule = require('../database/models/Schedule');
const moment = require('moment');

/**
 * Lấy học kỳ hiện tại hoặc học kỳ được chỉ định
 * @param {Number} semesterId - ID học kỳ (tùy chọn)
 * @returns {Object} Học kỳ
 */
const getSemester = async (semesterId = null) => {
  if (semesterId) {
    return await Semester.findOne({ semesterId: parseInt(semesterId) });
  }
  
  const currentDate = new Date();
  const currentSemester = await Semester.findOne({
    StartDate: { $lte: currentDate },
    EndDate: { $gte: currentDate }
  });
  
  if (currentSemester) {
    return currentSemester;
  }
  
  // Nếu không có học kỳ hiện tại, lấy học kỳ gần nhất
  return await Semester.findOne().sort({ EndDate: -1 });
};

/**
 * Lấy số tuần của một ngày trong học kỳ
 * @param {Date} date - Ngày cần kiểm tra
 * @param {Object} semester - Thông tin học kỳ
 * @returns {Number} Số tuần
 */
const getWeekNumberInSemester = (date, semester) => {
  const startDate = moment(semester.StartDate);
  const targetDate = moment(date);
  return Math.ceil(targetDate.diff(startDate, 'days') / 7) + 1;
};

/**
 * Tính ngày bắt đầu của tuần trong học kỳ
 * @param {Number} weekNumber - Số tuần trong học kỳ
 * @param {Object} semester - Thông tin học kỳ
 * @returns {Date} Ngày bắt đầu tuần
 */
const getStartDateOfWeek = (weekNumber, semester) => {
  return moment(semester.StartDate).add((weekNumber - 1) * 7, 'days').toDate();
};

/**
 * Lấy thời khóa biểu theo ngày
 * @param {Date} date - Ngày cần lấy thời khóa biểu
 * @param {Number} userId - ID người dùng (tùy chọn)
 * @param {Number} classId - ID lớp học (tùy chọn)
 * @param {Number} teacherId - ID giáo viên (tùy chọn)
 * @returns {Array} Thời khóa biểu theo ngày
 */
const getDailySchedule = async (date, userId = null, classId = null, teacherId = null) => {
  // Lấy học kỳ hiện tại
  const semester = await getSemester();
  if (!semester) {
    throw new Error('Không tìm thấy học kỳ phù hợp');
  }
  
  // Xác định ngày trong tuần
  const dayOfWeek = moment(date).format('dddd');
  
  // Xác định tuần trong học kỳ
  const weekNumber = getWeekNumberInSemester(date, semester);
  
  // Chuyển đổi ngày thành chuỗi định dạng YYYY-MM-DD để so sánh với SessionDate
  const formattedDate = moment(date).format('YYYY-MM-DD');
  
  // Query cơ bản
  const query = {
    WeekNumber: weekNumber,
    dayOfWeek: dayOfWeek,
    SessionDate: formattedDate
  };
  
  // Thêm điều kiện lọc theo lớp/giáo viên
  if (classId) {
    query.classId = parseInt(classId);
  }
  
  if (teacherId) {
    query.teacherId = parseInt(teacherId);
  }
  
  console.log('Daily schedule query:', JSON.stringify(query));
  
  // Lấy thời khóa biểu và populate thông tin liên quan
  return await ClassSchedule.find(query)
    .populate('class')
    .populate('subject')
    .populate('teacher')
    .populate('classroom')
    .sort({ SlotID: 1 });
};

/**
 * Lấy thời khóa biểu theo tuần
 * @param {Number} weekNumber - Số tuần trong học kỳ
 * @param {Number} semesterId - ID học kỳ (tùy chọn)
 * @param {Number} classId - ID lớp học (tùy chọn)
 * @param {Number} teacherId - ID giáo viên (tùy chọn)
 * @returns {Object} Thời khóa biểu theo tuần
 */
const getWeeklySchedule = async (weekNumber, semesterId = null, classId = null, teacherId = null) => {
  // Lấy học kỳ
  const semester = await getSemester(semesterId);
  if (!semester) {
    throw new Error('Không tìm thấy học kỳ phù hợp');
  }
  
  // Nếu không chỉ định tuần cụ thể, tính tuần hiện tại
  if (!weekNumber) {
    const currentDate = new Date();
    weekNumber = getWeekNumberInSemester(currentDate, semester);
  }
  
  // Query cơ bản
  const query = {
    WeekNumber: parseInt(weekNumber)
  };
  
  // Thêm điều kiện lọc theo học kỳ nếu có
  if (semester.semesterId) {
    query.semesterId = semester.semesterId;
  }
  
  // Thêm điều kiện lọc theo lớp/giáo viên
  if (classId) {
    query.classId = parseInt(classId);
  }
  
  if (teacherId) {
    query.teacherId = parseInt(teacherId);
  }
  
  console.log('Weekly schedule query:', JSON.stringify(query));
  
  // Lấy thời khóa biểu và populate thông tin liên quan
  return await ClassSchedule.find(query)
    .populate('class')
    .populate('subject')
    .populate('teacher')
    .populate('classroom')
    .sort({ dayOfWeek: 1, SlotID: 1 });
};

/**
 * Lấy thời khóa biểu theo học kỳ
 * @param {Number} semesterId - ID học kỳ
 * @param {Number} classId - ID lớp học (tùy chọn)
 * @param {Number} teacherId - ID giáo viên (tùy chọn)
 * @returns {Array} Thời khóa biểu theo học kỳ
 */
const getSemesterSchedule = async (semesterId, classId = null, teacherId = null) => {
  // Xác nhận học kỳ tồn tại
  const semester = await getSemester(semesterId);
  if (!semester) {
    throw new Error('Không tìm thấy học kỳ');
  }
  
  // Query cơ bản
  const query = {};
  
  // Thêm điều kiện lọc theo học kỳ nếu có
  if (semester.semesterId) {
    query.semesterId = semester.semesterId;
  }
  
  // Thêm điều kiện lọc theo lớp/giáo viên
  if (classId) {
    query.classId = parseInt(classId);
  }
  
  if (teacherId) {
    query.teacherId = parseInt(teacherId);
  }
  
  console.log('Semester schedule query:', JSON.stringify(query));
  
  // Lấy thời khóa biểu và populate thông tin liên quan
  return await ClassSchedule.find(query)
    .populate('class')
    .populate('subject')
    .populate('teacher')
    .populate('classroom')
    .sort({ WeekNumber: 1, dayOfWeek: 1, SlotID: 1 });
};

/**
 * Format dữ liệu thời khóa biểu trả về
 * @param {Array} schedules - Dữ liệu thời khóa biểu gốc
 * @param {String} format - Định dạng (daily, weekly, semester)
 * @returns {Object} Dữ liệu đã được format
 */
const formatScheduleData = (schedules, format = 'daily') => {
  if (format === 'daily') {
    return schedules.map(slot => ({
      id: slot.scheduleId,
      period: slot.SlotID,
      subject: slot.subject ? {
        id: slot.subject.subjectId,
        name: slot.subject.name,
        type: slot.subject.type
      } : null,
      teacher: slot.teacher ? {
        id: slot.teacher.teacherId,
        name: slot.teacher.fullName
      } : null,
      classroom: slot.classroom ? {
        id: slot.classroom.classroomId,
        room: slot.classroom.RoomNumber,
        building: slot.classroom.Building
      } : null,
      startTime: slot.startTime,
      endTime: slot.endTime,
      sessionDate: slot.SessionDate
    }));
  } else if (format === 'weekly') {
    // Format theo ngày trong tuần
    const weekSchedule = {
      Monday: [],
      Tuesday: [],
      Wednesday: [],
      Thursday: [],
      Friday: [],
      Saturday: [],
      Sunday: []
    };
    
    schedules.forEach(slot => {
      weekSchedule[slot.dayOfWeek].push({
        id: slot.scheduleId,
        period: slot.SlotID,
        subject: slot.subject ? {
          id: slot.subject.subjectId,
          name: slot.subject.name,
          type: slot.subject.type
        } : null,
        teacher: slot.teacher ? {
          id: slot.teacher.teacherId,
          name: slot.teacher.fullName
        } : null,
        classroom: slot.classroom ? {
          id: slot.classroom.classroomId,
          room: slot.classroom.RoomNumber,
          building: slot.classroom.Building
        } : null,
        startTime: slot.startTime,
        endTime: slot.endTime,
        sessionDate: slot.SessionDate
      });
    });
    
    // Sắp xếp các tiết học theo thứ tự
    Object.keys(weekSchedule).forEach(day => {
      weekSchedule[day].sort((a, b) => a.period - b.period);
    });
    
    return weekSchedule;
  } else if (format === 'semester') {
    // Nhóm theo tuần
    const semesterSchedule = {};
    
    schedules.forEach(slot => {
      const week = slot.WeekNumber.toString();
      if (!semesterSchedule[week]) {
        semesterSchedule[week] = {
          Monday: [],
          Tuesday: [],
          Wednesday: [],
          Thursday: [],
          Friday: [],
          Saturday: [],
          Sunday: []
        };
      }
      
      semesterSchedule[week][slot.dayOfWeek].push({
        id: slot.scheduleId,
        period: slot.SlotID,
        subject: slot.subject ? {
          id: slot.subject.subjectId,
          name: slot.subject.name,
          type: slot.subject.type
        } : null,
        teacher: slot.teacher ? {
          id: slot.teacher.teacherId,
          name: slot.teacher.fullName
        } : null,
        classroom: slot.classroom ? {
          id: slot.classroom.classroomId,
          room: slot.classroom.RoomNumber,
          building: slot.classroom.Building
        } : null,
        startTime: slot.startTime,
        endTime: slot.endTime,
        sessionDate: slot.SessionDate
      });
    });
    
    // Sắp xếp các tiết học theo thứ tự trong mỗi ngày
    Object.keys(semesterSchedule).forEach(week => {
      Object.keys(semesterSchedule[week]).forEach(day => {
        semesterSchedule[week][day].sort((a, b) => a.period - b.period);
      });
    });
    
    return semesterSchedule;
  }
};

module.exports = {
  getSemester,
  getWeekNumberInSemester,
  getStartDateOfWeek,
  getDailySchedule,
  getWeeklySchedule,
  getSemesterSchedule,
  formatScheduleData
}; 