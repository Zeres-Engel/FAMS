const mongoose = require('mongoose');
const Semester = require('../database/models/Semester');
const ClassSchedule = require('../database/models/ClassSchedule');
const moment = require('moment');

/**
 * Lấy học kỳ hiện tại hoặc học kỳ được chỉ định
 * @param {String|Number} semesterId - ID học kỳ (tùy chọn)
 * @returns {Object} Học kỳ
 */
const getSemester = async (semesterId = null) => {
  try {
    // Connection for direct queries
    const db = mongoose.connection.db;
    
    // First, try to query directly without model to bypass schema validation
    if (semesterId) {
      console.log(`Tìm học kỳ với ID: ${semesterId}`);
      
      // Try both Semester and semesters collections
      let semesterDoc = null;
      
      // Try collection "Semester" 
      try {
        semesterDoc = await db.collection('Semester').findOne({ semesterId: semesterId });
        if (semesterDoc) {
          console.log('Tìm thấy học kỳ trong collection Semester');
          return semesterDoc;
        }
      } catch (err) {
        console.warn('Lỗi khi tìm học kỳ trong collection Semester:', err.message);
      }
      
      // If not found, try collection "semesters"
      try {
        semesterDoc = await db.collection('semesters').findOne({ semesterId: semesterId });
        if (semesterDoc) {
          console.log('Tìm thấy học kỳ trong collection semesters');
          return semesterDoc;
        }
      } catch (err) {
        console.warn('Lỗi khi tìm học kỳ trong collection semesters:', err.message);
      }
      
      // If still not found, try using _id directly (in case semesterId is an ObjectId string)
      try {
        if (mongoose.Types.ObjectId.isValid(semesterId)) {
          const objId = new mongoose.Types.ObjectId(semesterId);
          semesterDoc = await db.collection('Semester').findOne({ _id: objId });
          if (!semesterDoc) {
            semesterDoc = await db.collection('semesters').findOne({ _id: objId });
          }
          if (semesterDoc) {
            console.log('Tìm thấy học kỳ bằng _id');
            return semesterDoc;
          }
        }
      } catch (err) {
        console.warn('Lỗi khi tìm học kỳ bằng _id:', err.message);
      }
      
      // If still not found, try collection "ClassSchedule" to extract semester info
      try {
        const schedule = await db.collection('ClassSchedule').findOne({ semesterId: semesterId });
        if (schedule) {
          console.log('Trích xuất thông tin học kỳ từ lịch học');
          // Extract dates from schedules with this semesterId
          const schedules = await db.collection('ClassSchedule')
            .find({ semesterId: semesterId })
            .toArray();
          
          if (schedules && schedules.length > 0) {
            // Get first and last dates
            const dates = schedules.map(s => new Date(s.SessionDate));
            const startDate = new Date(Math.min(...dates));
            const endDate = new Date(Math.max(...dates));
            
            // Create a synthetic semester object
            return {
              semesterId: semesterId,
              SemesterName: `Học kỳ (${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()})`,
              StartDate: startDate,
              EndDate: endDate,
              _synthetic: true  // Mark as synthetic
            };
          }
        }
      } catch (err) {
        console.warn('Lỗi khi trích xuất thông tin học kỳ từ lịch học:', err.message);
      }
      
      console.warn(`Không tìm thấy học kỳ với ID ${semesterId}`);
    }
    
    // Try to find current semester
    const currentDate = new Date();
    console.log(`Tìm học kỳ hiện tại cho ngày ${currentDate.toISOString()}`);
    
    // Try in both collections
    let currentSemester = null;
    
    // First try in Semester collection
    try {
      currentSemester = await db.collection('Semester').findOne({
        $or: [
          { startDate: { $lte: currentDate }, endDate: { $gte: currentDate } },
          { StartDate: { $lte: currentDate }, EndDate: { $gte: currentDate } }
        ]
      });
      
      if (currentSemester) {
        console.log('Tìm thấy học kỳ hiện tại trong collection Semester');
        return currentSemester;
      }
    } catch (err) {
      console.warn('Lỗi khi tìm học kỳ hiện tại trong collection Semester:', err.message);
    }
    
    // If not found, try in semesters collection
    try {
      currentSemester = await db.collection('semesters').findOne({
        $or: [
          { startDate: { $lte: currentDate }, endDate: { $gte: currentDate } },
          { StartDate: { $lte: currentDate }, EndDate: { $gte: currentDate } }
        ]
      });
      
      if (currentSemester) {
        console.log('Tìm thấy học kỳ hiện tại trong collection semesters');
        return currentSemester;
      }
    } catch (err) {
      console.warn('Lỗi khi tìm học kỳ hiện tại trong collection semesters:', err.message);
    }
    
    // If still not found, extract from the most recent schedule
    try {
      const schedules = await db.collection('ClassSchedule')
        .find({})
        .sort({ SessionDate: -1 })
        .limit(100)
        .toArray();
      
      if (schedules && schedules.length > 0) {
        // Group by semesterId
        const semesterGroups = {};
        schedules.forEach(s => {
          if (!semesterGroups[s.semesterId]) {
            semesterGroups[s.semesterId] = [];
          }
          semesterGroups[s.semesterId].push(new Date(s.SessionDate));
        });
        
        // Find the semester with the most recent dates
        let bestSemesterId = null;
        let latestDate = new Date(0);
        
        for (const [sid, dates] of Object.entries(semesterGroups)) {
          const maxDate = new Date(Math.max(...dates));
          if (maxDate > latestDate) {
            latestDate = maxDate;
            bestSemesterId = sid;
          }
        }
        
        if (bestSemesterId) {
          const bestDates = semesterGroups[bestSemesterId];
          const startDate = new Date(Math.min(...bestDates));
          const endDate = new Date(Math.max(...bestDates));
          
          console.log(`Tạo học kỳ tổng hợp từ lịch học với ID ${bestSemesterId}`);
          
          return {
            semesterId: bestSemesterId,
            SemesterName: `Học kỳ (${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()})`,
            StartDate: startDate,
            EndDate: endDate,
            _synthetic: true  // Mark as synthetic
          };
        }
      }
    } catch (err) {
      console.warn('Lỗi khi trích xuất thông tin học kỳ từ lịch học gần đây:', err.message);
    }
    
    // If all attempts failed, return null
    console.warn('Không tìm thấy thông tin học kỳ nào');
    return null;
    
  } catch (error) {
    console.error('Lỗi nghiêm trọng trong getSemester:', error);
    return null;
  }
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
  try {
    console.log(`Tìm lịch học cho ngày: ${date.toISOString()}`);
    
    // Truy vấn trực tiếp vào collection ClassSchedule
    const db = mongoose.connection.db;
    
    // Chuyển đổi ngày thành chuỗi định dạng YYYY-MM-DD để so sánh với SessionDate
    const formattedDate = moment(date).format('YYYY-MM-DD');
    
    // Query cơ bản
    const query = {
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
    
    // Lấy thời khóa biểu trực tiếp từ collection
    const schedules = await db.collection('SemesterSchedule')
      .find(query)
      .sort({ SlotID: 1 })
      .toArray();
    
    console.log(`Tìm thấy ${schedules.length} lịch học trong SemesterSchedule cho ngày ${formattedDate}`);
    
    let finalSchedules = schedules;
    
    // Nếu không tìm thấy trong SemesterSchedule, thử tìm trong ClassSchedule
    if (schedules.length === 0) {
      console.log('Thử tìm trong collection ClassSchedule...');
      const altSchedules = await db.collection('ClassSchedule')
        .find(query)
        .sort({ SlotID: 1 })
        .toArray();
      
      if (altSchedules.length > 0) {
        console.log(`Tìm thấy ${altSchedules.length} lịch học trong collection ClassSchedule`);
        
        // In ra chi tiết từng record để debug
        console.log('Chi tiết các lịch học tìm thấy:');
        altSchedules.forEach((schedule, idx) => {
          console.log(`Record ${idx + 1}:`, {
            scheduleId: schedule.scheduleId,
            classId: schedule.classId,
            teacherId: schedule.teacherId,
            subjectId: schedule.subjectId,
            SlotID: schedule.SlotID,
            startTime: schedule.startTime,
            endTime: schedule.endTime,
            dayOfWeek: schedule.dayOfWeek,
            SessionDate: schedule.SessionDate
          });
        });
        
        // Kiểm tra và chuẩn hóa thông tin ngày trong tuần
        const dayOfWeek = date.toLocaleString('en-US', { weekday: 'long' });
        altSchedules.forEach(schedule => {
          if (!schedule.dayOfWeek) {
            console.log(`Bổ sung thông tin ngày trong tuần (${dayOfWeek}) cho lịch học ${schedule.scheduleId}`);
            schedule.dayOfWeek = dayOfWeek;
          }
        });
        
        finalSchedules = altSchedules;
      }
    } else {
      // In ra chi tiết từng record để debug
      console.log('Chi tiết các lịch học tìm thấy trong SemesterSchedule:');
      schedules.forEach((schedule, idx) => {
        console.log(`Record ${idx + 1}:`, {
          scheduleId: schedule.scheduleId,
          classId: schedule.classId,
          teacherId: schedule.teacherId,
          subjectId: schedule.subjectId,
          SlotID: schedule.SlotID,
          startTime: schedule.startTime,
          endTime: schedule.endTime,
          dayOfWeek: schedule.dayOfWeek,
          SessionDate: schedule.SessionDate
        });
      });
      
      // Kiểm tra và chuẩn hóa thông tin ngày trong tuần
      const dayOfWeek = date.toLocaleString('en-US', { weekday: 'long' });
      schedules.forEach(schedule => {
        if (!schedule.dayOfWeek) {
          console.log(`Bổ sung thông tin ngày trong tuần (${dayOfWeek}) cho lịch học ${schedule.scheduleId}`);
          schedule.dayOfWeek = dayOfWeek;
        }
      });
    }
    
    // Kiểm tra các trường bắt buộc
    finalSchedules.forEach((schedule, idx) => {
      // Đảm bảo các trường bắt buộc tồn tại
      if (!schedule.startTime || !schedule.endTime) {
        console.warn(`Lịch học ${schedule.scheduleId} thiếu thông tin giờ học!`);
        
        // Tìm thông tin slot nếu có
        if (schedule.SlotID) {
          db.collection('Slot').findOne({ 
            SlotNumber: schedule.SlotID,
            DayOfWeek: schedule.dayOfWeek 
          }).then(slot => {
            if (slot) {
              console.log(`Đã tìm thấy thông tin slot ${schedule.SlotID}: ${slot.StartTime}-${slot.EndTime}`);
              schedule.startTime = slot.StartTime;
              schedule.endTime = slot.EndTime;
            }
          }).catch(err => {
            console.error('Lỗi khi tìm thông tin slot:', err);
          });
        }
        
        // Gán giá trị mặc định nếu không có
        schedule.startTime = schedule.startTime || "00:00";
        schedule.endTime = schedule.endTime || "00:00";
      }
    });
    
    console.log(`Tổng cộng: ${finalSchedules.length} lịch học sẽ được trả về.`);
    return finalSchedules;
  } catch (error) {
    console.error('Lỗi trong getDailySchedule:', error);
    throw error;
  }
};

/**
 * Lấy thời khóa biểu theo tuần
 * @param {Number} weekNumber - Số tuần trong học kỳ
 * @param {String|Number} semesterId - ID học kỳ (tùy chọn)
 * @param {Number} classId - ID lớp học (tùy chọn)
 * @param {Number} teacherId - ID giáo viên (tùy chọn)
 * @returns {Object} Thời khóa biểu theo tuần
 */
const getWeeklySchedule = async (weekNumber, semesterId = null, classId = null, teacherId = null) => {
  try {
    console.log(`Tìm lịch học tuần ${weekNumber || 'hiện tại'} ${semesterId ? `của học kỳ ${semesterId}` : ''}`);
    
    // Truy vấn trực tiếp vào collection ClassSchedule
    const db = mongoose.connection.db;
    
    // Nếu không chỉ định tuần, tìm tuần hiện tại dựa vào học kỳ
    if (!weekNumber) {
      const semester = await getSemester(semesterId);
      if (semester) {
        const today = new Date();
        weekNumber = getWeekNumberInSemester(today, semester);
        console.log(`Xác định tuần hiện tại: ${weekNumber} (dựa vào ngày ${today.toISOString()})`);
      } else {
        console.log('Không xác định được tuần hiện tại do không tìm thấy học kỳ');
      }
    }
    
    // Query cơ bản
    const query = {};
    
    if (weekNumber) {
      query.WeekNumber = parseInt(weekNumber);
    }
    
    // Thêm điều kiện lọc theo học kỳ nếu có
    if (semesterId) {
      query.semesterId = semesterId;
    }
    
    // Thêm điều kiện lọc theo lớp/giáo viên
    if (classId) {
      query.classId = parseInt(classId);
    }
    
    if (teacherId) {
      query.teacherId = parseInt(teacherId);
    }
    
    console.log('Weekly schedule query:', JSON.stringify(query));
    
    // Lấy thời khóa biểu trực tiếp từ collection
    const schedules = await db.collection('SemesterSchedule')
      .find(query)
      .sort({ dayOfWeek: 1, SlotID: 1 })
      .toArray();
    
    console.log(`Tìm thấy ${schedules.length} lịch học cho tuần ${weekNumber || 'hiện tại'}`);
    
    if (schedules.length === 0 && query.WeekNumber) {
      // Thử tìm lại không giới hạn tuần cụ thể
      console.log('Thử tìm lại lịch học không giới hạn tuần cụ thể...');
      const alternativeQuery = {...query};
      delete alternativeQuery.WeekNumber;
      
      const alternativeSchedules = await db.collection('SemesterSchedule')
        .find(alternativeQuery)
        .sort({ dayOfWeek: 1, SlotID: 1 })
        .toArray();
      
      console.log(`Tìm thấy ${alternativeSchedules.length} lịch học không giới hạn tuần`);
      if (alternativeSchedules.length > 0) {
        return alternativeSchedules;
      }
    }
    
    // Thử tìm trong collection khác nếu không tìm thấy
    if (schedules.length === 0) {
      console.log('Thử tìm trong collection ClassSchedule...');
      const altSchedules = await db.collection('ClassSchedule')
        .find(query)
        .sort({ dayOfWeek: 1, SlotID: 1 })
        .toArray();
      
      if (altSchedules.length > 0) {
        console.log(`Tìm thấy ${altSchedules.length} lịch học trong collection ClassSchedule`);
        return altSchedules;
      }
    }
    
    return schedules;
  } catch (error) {
    console.error('Lỗi trong getWeeklySchedule:', error);
    throw error;
  }
};

/**
 * Lấy thời khóa biểu theo học kỳ
 * @param {String|Number} semesterId - ID học kỳ
 * @param {Number} classId - ID lớp học (tùy chọn)
 * @param {Number} teacherId - ID giáo viên (tùy chọn)
 * @returns {Array} Thời khóa biểu theo học kỳ
 */
const getSemesterSchedule = async (semesterId, classId = null, teacherId = null) => {
  try {
    console.log(`Tìm lịch học cho học kỳ: ${semesterId}`);
    
    // Truy vấn trực tiếp vào collection ClassSchedule
    const db = mongoose.connection.db;
    
    // Query cơ bản
    const query = {};
    
    // Thêm điều kiện lọc theo học kỳ nếu có
    if (semesterId) {
      query.semesterId = semesterId;
    }
    
    // Thêm điều kiện lọc theo lớp/giáo viên
    if (classId) {
      query.classId = parseInt(classId);
    }
    
    if (teacherId) {
      query.teacherId = parseInt(teacherId);
    }
    
    console.log('Semester schedule query:', JSON.stringify(query));
    
    // Lấy thời khóa biểu trực tiếp từ collection
    const schedules = await db.collection('SemesterSchedule')
      .find(query)
      .sort({ WeekNumber: 1, dayOfWeek: 1, SlotID: 1 })
      .toArray();
    
    console.log(`Tìm thấy ${schedules.length} lịch học cho học kỳ ${semesterId}`);
    
    // Nếu không tìm thấy trong SemesterSchedule, thử tìm trong ClassSchedule
    if (schedules.length === 0) {
      console.log('Thử tìm trong collection ClassSchedule...');
      const altSchedules = await db.collection('ClassSchedule')
        .find(query)
        .sort({ WeekNumber: 1, dayOfWeek: 1, SlotID: 1 })
        .toArray();
      
      if (altSchedules.length > 0) {
        console.log(`Tìm thấy ${altSchedules.length} lịch học trong collection ClassSchedule`);
        return altSchedules;
      }
    }
    
    return schedules;
  } catch (error) {
    console.error('Lỗi trong getSemesterSchedule:', error);
    throw error;
  }
};

/**
 * Lấy tên thứ trong tuần từ một ngày cụ thể
 * @param {String|Date} dateStr - Chuỗi ngày hoặc đối tượng Date
 * @returns {String} Tên thứ (Monday, Tuesday, ...)
 */
const getDayOfWeekFromDate = (dateStr) => {
  try {
    if (!dateStr) return 'Unknown';
    
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return 'Unknown';
    
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[date.getDay()];
  } catch (error) {
    console.error('Error in getDayOfWeekFromDate:', error);
    return 'Unknown';
  }
};

/**
 * Format dữ liệu lịch học cho frontend
 * @param {Array} schedules - Mảng lịch học
 * @param {String} format - Định dạng (daily, weekly, semester)
 * @returns {Array} Lịch học đã được format
 */
const formatScheduleData = async (schedules, format = 'daily') => {
  try {
    console.log(`Bắt đầu format dữ liệu ${schedules.length} lịch học theo định dạng '${format}'`);
    
    if (!schedules || schedules.length === 0) {
      console.log('Không có lịch học nào để format');
      return [];
    }
    
    // Lấy thông tin bổ sung (môn học, giáo viên, phòng học)
    const subjectIds = [...new Set(schedules.map(s => s.subjectId).filter(Boolean))];
    const teacherIds = [...new Set(schedules.map(s => s.teacherId).filter(Boolean))];
    const classroomIds = [...new Set(schedules.map(s => s.classroomId).filter(Boolean))];
    
    console.log(`Cần lấy thông tin của ${subjectIds.length} môn học, ${teacherIds.length} giáo viên, ${classroomIds.length} phòng học`);
    
    // Query subjects
    const subjects = subjectIds.length > 0 ? 
      await mongoose.connection.db.collection('Subject').find({ subjectId: { $in: subjectIds } }).toArray() : 
      [];
    
    // Query teachers
    const teachers = teacherIds.length > 0 ? 
      await mongoose.connection.db.collection('Teacher').find({ teacherId: { $in: teacherIds } }).toArray() : 
      [];
    
    // Query classrooms
    const classrooms = classroomIds.length > 0 ? 
      await mongoose.connection.db.collection('Classroom').find({ classroomId: { $in: classroomIds } }).toArray() : 
      [];
    
    console.log(`Đã lấy được ${subjects.length}/${subjectIds.length} môn học, ${teachers.length}/${teacherIds.length} giáo viên, ${classrooms.length}/${classroomIds.length} phòng học`);
    
    // Map entities by ID for easier lookup
    const subjectMap = new Map(subjects.map(s => [s.subjectId, s]));
    const teacherMap = new Map(teachers.map(t => [t.teacherId, t]));
    const classroomMap = new Map(classrooms.map(c => [c.classroomId, c]));
    
    // Format each schedule
    const formattedSchedules = schedules.map(schedule => {
      try {
        // Normalize field names (camelCase và PascalCase)
        const normalizedSchedule = {
          scheduleId: schedule.scheduleId || schedule._id,
          semesterId: schedule.semesterId,
          classId: schedule.classId,
          subjectId: schedule.subjectId,
          teacherId: schedule.teacherId,
          classroomId: schedule.classroomId,
          weekNumber: schedule.WeekNumber || schedule.weekNumber,
          dayNumber: schedule.DayNumber || schedule.dayNumber,
          sessionDate: schedule.SessionDate || schedule.sessionDate,
          sessionWeek: schedule.SessionWeek || schedule.sessionWeek,
          slotId: schedule.SlotID || schedule.slotId,
          dayOfWeek: schedule.dayOfWeek || getDayOfWeekFromDate(schedule.SessionDate || schedule.sessionDate),
          startTime: schedule.startTime,
          endTime: schedule.endTime,
          topic: schedule.Topic || schedule.topic || 'Chưa cập nhật'
        };
        
        // Add subject info
        const subject = subjectMap.get(normalizedSchedule.subjectId);
        if (subject) {
          normalizedSchedule.subjectName = subject.name || subject.subjectName;
        } else {
          normalizedSchedule.subjectName = `Môn học ${normalizedSchedule.subjectId}`;
        }
        
        // Add teacher info
        const teacher = teacherMap.get(normalizedSchedule.teacherId);
        if (teacher) {
          normalizedSchedule.teacherName = teacher.fullName;
        } else {
          normalizedSchedule.teacherName = `Giáo viên ${normalizedSchedule.teacherId}`;
        }
        
        // Add classroom info
        const classroom = classroomMap.get(normalizedSchedule.classroomId);
        if (classroom) {
          normalizedSchedule.classroomNumber = classroom.roomNumber;
        } else {
          normalizedSchedule.classroomNumber = `Phòng ${normalizedSchedule.classroomId}`;
        }
        
        console.log(`Đã chuẩn hóa lịch học ID ${normalizedSchedule.scheduleId}, tiết ${normalizedSchedule.slotId}, subject ${normalizedSchedule.subjectId}`);
        
        return normalizedSchedule;
      } catch (err) {
        console.error(`Lỗi khi format lịch học:`, err);
        return schedule; // Trả về schedule gốc nếu có lỗi
      }
    });
    
    // Group by day of week if needed
    if (format === 'weekly') {
      const dayGroups = {};
      const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      
      daysOfWeek.forEach(day => {
        const schedulesForDay = formattedSchedules.filter(s => s.dayOfWeek === day);
        dayGroups[day] = schedulesForDay;
        console.log(`${day}: ${schedulesForDay.length} lịch học`);
      });
    }
    
    console.log(`Đã chuẩn hóa ${formattedSchedules.length} lịch học`);
    console.log(`Hoàn tất format dữ liệu lịch học theo định dạng '${format}'`);
    
    // Ensure all schedules have consistent field names
    formattedSchedules.forEach(schedule => {
      // Make sure SessionWeek is set (camelCase and PascalCase for compatibility)
      if (schedule.sessionWeek && !schedule.SessionWeek) {
        schedule.SessionWeek = schedule.sessionWeek;
      } else if (schedule.SessionWeek && !schedule.sessionWeek) {
        schedule.sessionWeek = schedule.SessionWeek;
      }
      
      // Make sure slotId/SlotID is set
      if (schedule.slotId && !schedule.SlotID) {
        schedule.SlotID = schedule.slotId;
      } else if (schedule.SlotID && !schedule.slotId) {
        schedule.slotId = schedule.SlotID;
      }
      
      // Make sure sessionDate/SessionDate is set
      if (schedule.sessionDate && !schedule.SessionDate) {
        schedule.SessionDate = schedule.sessionDate;
      } else if (schedule.SessionDate && !schedule.sessionDate) {
        schedule.sessionDate = schedule.SessionDate;
      }
    });
    
    return formattedSchedules;
  } catch (error) {
    console.error('Lỗi trong formatScheduleData:', error);
    return schedules; // Trả về schedules gốc nếu có lỗi
  }
};

/**
 * Lấy thời khóa biểu theo tuần (dựa vào trường SessionWeek)
 * @param {String} weekRange - Chuỗi biểu diễn tuần (ví dụ: "2024-08-26 to 2024-09-01")
 * @param {Number} classId - ID lớp học (tùy chọn)
 * @param {Number} teacherId - ID giáo viên (tùy chọn)
 * @returns {Array} Thời khóa biểu theo tuần
 */
const getScheduleBySessionWeek = async (weekRange, classId = null, teacherId = null) => {
  try {
    console.log(`Tìm lịch học cho tuần: ${weekRange}`);
    
    // Truy vấn trực tiếp vào collection ClassSchedule
    const db = mongoose.connection.db;
    
    // Query cơ bản - sử dụng $or để tìm cả SessionWeek và sessionWeek (hỗ trợ nhiều trường hợp)
    const query = {
      $or: [
        { SessionWeek: weekRange },
        { sessionWeek: weekRange }
      ]
    };
    
    // Thêm điều kiện lọc theo lớp/giáo viên
    if (classId) {
      query.classId = parseInt(classId);
    }
    
    if (teacherId) {
      query.teacherId = parseInt(teacherId);
    }
    
    console.log('SessionWeek schedule query:', JSON.stringify(query));
    
    // Thực hiện truy vấn
    let schedules = [];
    try {
      schedules = await db.collection('ClassSchedule')
        .find(query)
        .toArray();
      
      console.log(`Tìm thấy ${schedules.length} lịch học cho tuần ${weekRange}`);
      
      // Nếu không tìm thấy kết quả, thử tìm kiếm dựa trên SessionDate trong khoảng thời gian
      if (schedules.length === 0) {
        console.log('Không tìm thấy lịch theo SessionWeek, thử tìm theo SessionDate...');
        
        // Parse weekRange to get start and end dates
        const { startDate, endDate } = parseWeekRange(weekRange);
        
        if (startDate && endDate) {
          const startDateStr = startDate.toISOString().split('T')[0];
          const endDateStr = endDate.toISOString().split('T')[0];
          
          const dateQuery = {
            $or: [
              { 
                SessionDate: { 
                  $gte: startDateStr, 
                  $lte: endDateStr 
                } 
              },
              { 
                sessionDate: { 
                  $gte: startDateStr, 
                  $lte: endDateStr 
                } 
              }
            ]
          };
          
          // Add class or teacher filters if needed
          if (classId) {
            dateQuery.classId = parseInt(classId);
          }
          
          if (teacherId) {
            dateQuery.teacherId = parseInt(teacherId);
          }
          
          console.log('SessionDate range query:', JSON.stringify(dateQuery));
          
          schedules = await db.collection('ClassSchedule')
            .find(dateQuery)
            .toArray();
          
          console.log(`Tìm thấy ${schedules.length} lịch học theo khoảng ngày`);
          
          // Cập nhật trường SessionWeek cho các lịch học tìm được
          await updateSessionWeekField(schedules);
        }
      }
      
      // Đảm bảo tất cả các lịch học đều có trường SessionWeek đúng 
      // (ngay cả khi đã có từ trước)
      if (schedules.length > 0) {
        await updateSessionWeekField(schedules);
      }
      
    } catch (err) {
      console.error('Lỗi khi truy vấn lịch học theo tuần:', err);
    }
    
    return schedules;
  } catch (error) {
    console.error('Lỗi trong getScheduleBySessionWeek:', error);
    return [];
  }
};

/**
 * Cập nhật trường SessionWeek cho các lịch học đã được tìm thấy
 * @param {Array} schedules - Danh sách lịch học cần cập nhật
 */
const updateSessionWeekField = async (schedules) => {
  if (!schedules || schedules.length === 0) return;
  
  const db = mongoose.connection.db;
  let updatedCount = 0;
  
  for (const schedule of schedules) {
    try {
      // Luôn cập nhật SessionWeek, không cần kiểm tra có tồn tại hay không
      // để đảm bảo dữ liệu nhất quán
      const sessionDate = new Date(schedule.SessionDate || schedule.sessionDate);
      if (isNaN(sessionDate.getTime())) continue;
      
      const startOfWeek = getStartOfWeek(sessionDate);
      const weekRange = getWeekRangeString(startOfWeek);
      
      await db.collection('ClassSchedule').updateOne(
        { _id: schedule._id },
        { $set: { SessionWeek: weekRange } }
      );
      
      // Cập nhật trường SessionWeek trong object hiện tại
      schedule.SessionWeek = weekRange;
      updatedCount++;
    } catch (err) {
      console.error(`Lỗi khi cập nhật SessionWeek cho lịch học:`, err);
    }
  }
  
  console.log(`Đã cập nhật SessionWeek cho ${updatedCount} lịch học`);
};

/**
 * Tính chuỗi biểu diễn tuần từ ngày bắt đầu
 * @param {Date} startDate - Ngày bắt đầu tuần (thứ 2)
 * @returns {String} Chuỗi biểu diễn tuần (ví dụ: "2024-08-26 to 2024-09-01")
 */
const getWeekRangeString = (startDate) => {
  const start = moment(startDate).startOf('week').add(1, 'days'); // Thứ 2
  const end = moment(start).add(6, 'days'); // Chủ nhật
  
  return `${start.format('YYYY-MM-DD')} to ${end.format('YYYY-MM-DD')}`;
};

/**
 * Tính ngày bắt đầu tuần từ một ngày bất kỳ (trả về thứ 2)
 * @param {Date} date - Ngày bất kỳ
 * @returns {Date} Ngày thứ 2 của tuần chứa ngày đã cho
 */
const getStartOfWeek = (date) => {
  return moment(date).startOf('week').add(1, 'days').toDate();
};

/**
 * Phân tích chuỗi biểu diễn tuần thành ngày bắt đầu và kết thúc
 * @param {String} weekRange - Chuỗi biểu diễn tuần (ví dụ: "2024-08-26 to 2024-09-01")
 * @returns {Object} Đối tượng chứa ngày bắt đầu và kết thúc
 */
const parseWeekRange = (weekRange) => {
  if (!weekRange || typeof weekRange !== 'string') {
    return { startDate: null, endDate: null };
  }
  
  const parts = weekRange.split(' to ');
  if (parts.length !== 2) {
    return { startDate: null, endDate: null };
  }
  
  const startDate = moment(parts[0]).toDate();
  const endDate = moment(parts[1]).toDate();
  
  return { startDate, endDate };
};

/**
 * Cập nhật trường SessionWeek cho tất cả lịch học dựa trên SessionDate
 * Hữu ích khi cần đồng bộ dữ liệu cũ
 * @returns {Object} Kết quả cập nhật
 */
const updateAllSessionWeeks = async () => {
  try {
    console.log('Bắt đầu cập nhật trường SessionWeek cho tất cả lịch học...');
    
    // Truy vấn trực tiếp vào collection ClassSchedule
    const db = mongoose.connection.db;
    
    // Lấy tất cả lịch học
    const schedules = await db.collection('ClassSchedule')
      .find({})
      .toArray();
    
    console.log(`Tìm thấy ${schedules.length} lịch học cần cập nhật`);
    
    let updatedCount = 0;
    let failedCount = 0;
    
    // Cập nhật từng lịch học
    for (const schedule of schedules) {
      try {
        // Kiểm tra xem có trường SessionDate không
        if (!schedule.SessionDate) {
          console.warn(`Bỏ qua lịch học ID ${schedule._id} vì không có trường SessionDate`);
          failedCount++;
          continue;
        }
        
        // Tính toán SessionWeek từ SessionDate
        const sessionDate = new Date(schedule.SessionDate);
        const startOfWeek = getStartOfWeek(sessionDate);
        const weekRange = getWeekRangeString(startOfWeek);
        
        // Cập nhật trường SessionWeek
        await db.collection('ClassSchedule').updateOne(
          { _id: schedule._id },
          { $set: { SessionWeek: weekRange } }
        );
        
        updatedCount++;
      } catch (err) {
        console.error(`Lỗi khi cập nhật lịch học ID ${schedule._id}:`, err);
        failedCount++;
      }
    }
    
    console.log(`Hoàn tất cập nhật: ${updatedCount} thành công, ${failedCount} thất bại`);
    
    return {
      totalSchedules: schedules.length,
      updatedCount,
      failedCount
    };
  } catch (error) {
    console.error('Lỗi trong updateAllSessionWeeks:', error);
    return {
      error: error.message,
      totalSchedules: 0,
      updatedCount: 0,
      failedCount: 0
    };
  }
};

module.exports = {
  getSemester,
  getWeekNumberInSemester,
  getStartDateOfWeek,
  getDailySchedule,
  getWeeklySchedule,
  getSemesterSchedule,
  formatScheduleData,
  getScheduleBySessionWeek,
  getWeekRangeString,
  getStartOfWeek,
  parseWeekRange,
  updateAllSessionWeeks,
  updateSessionWeekField,
  getDayOfWeekFromDate
}; 