const mongoose = require('mongoose');
const Semester = require('../database/models/Semester');
const ClassSchedule = require('../database/models/Schedule');
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
 * Format dữ liệu thời khóa biểu trả về
 * @param {Array} schedules - Dữ liệu thời khóa biểu gốc
 * @param {String} format - Định dạng (daily, weekly, semester)
 * @returns {Object} Dữ liệu đã được format
 */
const formatScheduleData = async (schedules, format = 'daily') => {
  try {
    console.log(`Bắt đầu format dữ liệu ${schedules ? schedules.length : 0} lịch học theo định dạng '${format}'`);
    
    if (!schedules || schedules.length === 0) {
      console.log('Không có dữ liệu lịch học để format');
      return format === 'weekly' ? { Monday: [], Tuesday: [], Wednesday: [], Thursday: [], Friday: [], Saturday: [], Sunday: [] } : [];
    }
    
    // Chuẩn hóa dữ liệu input trước khi xử lý
    const normalizedSchedules = schedules.map(schedule => {
      // Đảm bảo các trường cần thiết tồn tại
      const normalized = {
        ...schedule,
        scheduleId: schedule.scheduleId || schedule.id || 0,
        id: schedule.id || schedule.scheduleId || 0,
        SlotID: schedule.SlotID || schedule.slotId || schedule.period || 0,
        period: schedule.period || schedule.SlotID || schedule.slotId || 0,
        subjectId: schedule.subjectId || null,
        teacherId: schedule.teacherId || null,
        classroomId: schedule.classroomId || null,
        startTime: schedule.startTime || "00:00",
        endTime: schedule.endTime || "00:00",
        SessionDate: schedule.SessionDate || schedule.sessionDate || "",
        sessionDate: schedule.sessionDate || schedule.SessionDate || "",
        dayOfWeek: schedule.dayOfWeek || "Unknown"
      };
      
      // Log chi tiết cho debugging
      console.log(`Đã chuẩn hóa lịch học ID ${normalized.id}, tiết ${normalized.period}, subject ${normalized.subjectId}`);
      
      return normalized;
    });
    
    console.log(`Đã chuẩn hóa ${normalizedSchedules.length} lịch học`);
    
    const db = mongoose.connection.db;
    
    // Lấy thông tin các môn học, giáo viên, phòng học
    const subjectIds = [...new Set(normalizedSchedules.filter(s => s.subjectId).map(s => s.subjectId))]; 
    const teacherIds = [...new Set(normalizedSchedules.filter(s => s.teacherId).map(s => s.teacherId))];
    const classroomIds = [...new Set(normalizedSchedules.filter(s => s.classroomId).map(s => s.classroomId))];
    
    console.log(`Cần lấy thông tin của ${subjectIds.length} môn học, ${teacherIds.length} giáo viên, ${classroomIds.length} phòng học`);
    
    // Truy vấn để lấy thông tin chi tiết
    const subjects = subjectIds.length > 0 
      ? await db.collection('Subject').find({ subjectId: { $in: subjectIds } }).toArray()
      : [];
    
    const teachers = teacherIds.length > 0
      ? await db.collection('Teacher').find({ teacherId: { $in: teacherIds } }).toArray()
      : [];
    
    const classrooms = classroomIds.length > 0
      ? await db.collection('Classroom').find({ classroomId: { $in: classroomIds } }).toArray()
      : [];
    
    console.log(`Đã lấy được ${subjects.length}/${subjectIds.length} môn học, ${teachers.length}/${teacherIds.length} giáo viên, ${classrooms.length}/${classroomIds.length} phòng học`);
    
    // Tạo map để tra cứu nhanh
    const subjectMap = Object.fromEntries(subjects.map(s => [s.subjectId, s]));
    const teacherMap = Object.fromEntries(teachers.map(t => [t.teacherId, t]));
    const classroomMap = Object.fromEntries(classrooms.map(c => [c.classroomId, c]));
    
    let result;
    
    if (format === 'daily') {
      result = normalizedSchedules.map(slot => {
        const formattedItem = {
          id: slot.scheduleId || slot.id || 0,
          period: slot.SlotID || slot.period || 0,
          subject: slot.subjectId && subjectMap[slot.subjectId] ? {
            id: slot.subjectId,
            name: subjectMap[slot.subjectId].name || subjectMap[slot.subjectId].SubjectName || `Môn học ${slot.subjectId}`,
            type: subjectMap[slot.subjectId].type || subjectMap[slot.subjectId].SubjectType || 'Không xác định'
          } : { id: 0, name: 'Không xác định', type: 'Không xác định' },
          teacher: slot.teacherId && teacherMap[slot.teacherId] ? {
            id: slot.teacherId,
            name: teacherMap[slot.teacherId].fullName || teacherMap[slot.teacherId].FullName || `Giáo viên ${slot.teacherId}`
          } : { id: 0, name: 'Không xác định' },
          classroom: slot.classroomId && classroomMap[slot.classroomId] ? {
            id: slot.classroomId,
            room: classroomMap[slot.classroomId].RoomNumber || classroomMap[slot.classroomId].roomNumber || `${slot.classroomId}`,
            building: classroomMap[slot.classroomId].Building || classroomMap[slot.classroomId].building || 'Không xác định'
          } : { id: 0, room: 'Không xác định', building: 'Không xác định' },
          startTime: slot.startTime || "00:00",
          endTime: slot.endTime || "00:00",
          sessionDate: slot.SessionDate || slot.sessionDate || "",
          dayOfWeek: slot.dayOfWeek || "Unknown"
        };
        return formattedItem;
      });
      
      // Kiểm tra và in log các phần tử đã được format
      result.forEach((item, idx) => {
        if (!item.startTime || !item.endTime) {
          console.warn(`Cảnh báo: Item ${idx + 1} thiếu thông tin giờ học: ${JSON.stringify(item)}`);
        }
      });
      
      console.log(`Đã format thành công ${result.length} lịch học theo ngày`);
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
      
      normalizedSchedules.forEach(slot => {
        if (!slot.dayOfWeek) {
          console.warn(`Bỏ qua lịch không có thông tin ngày trong tuần:`, slot);
          return;
        }
        
        const dayOfWeek = slot.dayOfWeek;
        if (!weekSchedule[dayOfWeek]) {
          weekSchedule[dayOfWeek] = [];
        }
        
        weekSchedule[dayOfWeek].push({
          id: slot.scheduleId || slot.id || 0,
          period: slot.SlotID || slot.period || 0,
          subject: slot.subjectId && subjectMap[slot.subjectId] ? {
            id: slot.subjectId,
            name: subjectMap[slot.subjectId].name || subjectMap[slot.subjectId].SubjectName || `Môn học ${slot.subjectId}`,
            type: subjectMap[slot.subjectId].type || subjectMap[slot.subjectId].SubjectType || 'Không xác định'
          } : { id: 0, name: 'Không xác định', type: 'Không xác định' },
          teacher: slot.teacherId && teacherMap[slot.teacherId] ? {
            id: slot.teacherId,
            name: teacherMap[slot.teacherId].fullName || teacherMap[slot.teacherId].FullName || `Giáo viên ${slot.teacherId}`
          } : { id: 0, name: 'Không xác định' },
          classroom: slot.classroomId && classroomMap[slot.classroomId] ? {
            id: slot.classroomId,
            room: classroomMap[slot.classroomId].RoomNumber || classroomMap[slot.classroomId].roomNumber || `${slot.classroomId}`,
            building: classroomMap[slot.classroomId].Building || classroomMap[slot.classroomId].building || 'Không xác định'
          } : { id: 0, room: 'Không xác định', building: 'Không xác định' },
          startTime: slot.startTime || "00:00",
          endTime: slot.endTime || "00:00",
          sessionDate: slot.SessionDate || slot.sessionDate || ""
        });
      });
      
      // Sắp xếp các tiết học theo thứ tự
      Object.keys(weekSchedule).forEach(day => {
        weekSchedule[day].sort((a, b) => a.period - b.period);
      });
      
      // Log số lượng lịch học theo từng ngày
      Object.keys(weekSchedule).forEach(day => {
        console.log(`${day}: ${weekSchedule[day].length} lịch học`);
      });
      
      result = weekSchedule;
    } else if (format === 'semester') {
      // Nhóm theo tuần
      const semesterSchedule = {};
      
      normalizedSchedules.forEach(slot => {
        if (!slot.WeekNumber) {
          console.warn(`Bỏ qua lịch không có thông tin tuần:`, slot);
          return;
        }
        
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
        
        if (!slot.dayOfWeek) {
          console.warn(`Bỏ qua lịch không có thông tin ngày trong tuần:`, slot);
          return;
        }
        
        semesterSchedule[week][slot.dayOfWeek].push({
          id: slot.scheduleId || slot.id || 0,
          period: slot.SlotID || slot.period || 0,
          subject: slot.subjectId && subjectMap[slot.subjectId] ? {
            id: slot.subjectId,
            name: subjectMap[slot.subjectId].name || subjectMap[slot.subjectId].SubjectName || `Môn học ${slot.subjectId}`,
            type: subjectMap[slot.subjectId].type || subjectMap[slot.subjectId].SubjectType || 'Không xác định'
          } : { id: 0, name: 'Không xác định', type: 'Không xác định' },
          teacher: slot.teacherId && teacherMap[slot.teacherId] ? {
            id: slot.teacherId,
            name: teacherMap[slot.teacherId].fullName || teacherMap[slot.teacherId].FullName || `Giáo viên ${slot.teacherId}`
          } : { id: 0, name: 'Không xác định' },
          classroom: slot.classroomId && classroomMap[slot.classroomId] ? {
            id: slot.classroomId,
            room: classroomMap[slot.classroomId].RoomNumber || classroomMap[slot.classroomId].roomNumber || `${slot.classroomId}`,
            building: classroomMap[slot.classroomId].Building || classroomMap[slot.classroomId].building || 'Không xác định'
          } : { id: 0, room: 'Không xác định', building: 'Không xác định' },
          startTime: slot.startTime || "00:00",
          endTime: slot.endTime || "00:00",
          sessionDate: slot.SessionDate || slot.sessionDate || ""
        });
      });
      
      // Sắp xếp các tiết học theo thứ tự trong mỗi ngày
      Object.keys(semesterSchedule).forEach(week => {
        Object.keys(semesterSchedule[week]).forEach(day => {
          semesterSchedule[week][day].sort((a, b) => a.period - b.period);
        });
      });
      
      // Log số lượng tuần
      console.log(`Đã format thành công ${Object.keys(semesterSchedule).length} tuần trong học kỳ`);
      
      result = semesterSchedule;
    } else {
      result = normalizedSchedules;
    }
    
    console.log(`Hoàn tất format dữ liệu lịch học theo định dạng '${format}'`);
    return result;
  } catch (error) {
    console.error('Lỗi khi format dữ liệu lịch học:', error);
    return format === 'weekly' ? { Monday: [], Tuesday: [], Wednesday: [], Thursday: [], Friday: [], Saturday: [], Sunday: [] } : [];
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