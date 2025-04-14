/**
 * Student Service - Tách biệt logic xử lý của Student
 */

const { models } = require('../database');
const databaseService = require('./databaseService');

/**
 * Lấy danh sách học sinh với phân trang và lọc
 * @param {Object} options - Các option tìm kiếm
 * @returns {Promise<Object>} Danh sách học sinh
 */
exports.getStudents = async (options = {}) => {
  try {
    const { page = 1, limit = 10, sort = { studentId: 1 }, filter = {} } = options;
    
    const skip = (page - 1) * limit;
    const students = await models.Student.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit);
      
    const total = await models.Student.countDocuments(filter);
    
    return {
      success: true,
      data: students,
      count: students.length,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    console.error('Error getting students:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Lấy thông tin chi tiết học sinh theo ID
 * @param {string} studentId - ID của học sinh
 * @param {boolean} includeRelated - Có bao gồm thông tin liên quan không
 * @returns {Promise<Object>} Thông tin học sinh
 */
exports.getStudentById = async (studentId, includeRelated = false) => {
  try {
    const student = await databaseService.findById(models.Student, studentId, 'studentId');
    
    if (!student) {
      return { success: false, error: 'Student not found', code: 'STUDENT_NOT_FOUND' };
    }
    
    if (!includeRelated) {
      return { success: true, data: student };
    }
    
    // Get related information
    const [user, classInfo, batchInfo, parents] = await Promise.all([
      databaseService.findById(models.User, student.userId, 'userId'),
      databaseService.findById(models.Class, student.classId, 'classId'),
      databaseService.findById(models.Batch, student.batchId, 'batchId'),
      student.parentIds && student.parentIds.length 
        ? models.Parent.find({ parentId: { $in: student.parentIds } })
        : []
    ]);
    
    return {
      success: true,
      data: {
        ...student.toObject(),
        user: user ? {
          name: user.name,
          email: user.email,
          role: user.role
        } : null,
        class: classInfo || null,
        batch: batchInfo || null,
        parents: parents || []
      }
    };
  } catch (error) {
    console.error('Error getting student by ID:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Lấy thời khóa biểu của học sinh
 * @param {string} studentId - ID của học sinh
 * @returns {Promise<Object>} Thời khóa biểu của học sinh
 */
exports.getStudentSchedule = async (studentId) => {
  try {
    const student = await databaseService.findById(models.Student, studentId, 'studentId');
    
    if (!student) {
      return { success: false, error: 'Student not found', code: 'STUDENT_NOT_FOUND' };
    }
    
    // Get latest semester for student's batch
    const semester = await models.Semester.findOne({ 
      batchId: student.batchId 
    }).sort({ startDate: -1 });
    
    if (!semester) {
      return { 
        success: false, 
        error: 'No active semester found for this student',
        code: 'NO_ACTIVE_SEMESTER'
      };
    }
    
    // Get student's class schedule
    const schedules = await models.Schedule.find({ 
      semesterId: semester.semesterId,
      classId: student.classId
    }).sort({ dayOfWeek: 1, startTime: 1 });
    
    // Enhance schedule with teacher, subject and classroom information
    const enhancedSchedules = await Promise.all(schedules.map(async (schedule) => {
      const [teacher, subject, classroom] = await Promise.all([
        databaseService.findById(models.Teacher, schedule.teacherId, 'teacherId'),
        databaseService.findById(models.Subject, schedule.subjectId, 'subjectId'),
        databaseService.findById(models.Classroom, schedule.classroomId, 'classroomId')
      ]);
      
      return {
        ...schedule.toObject(),
        teacherName: teacher ? teacher.fullName : 'Unknown Teacher',
        subjectName: subject ? subject.name : 'Unknown Subject',
        classroomNumber: classroom ? classroom.roomNumber : 'Unknown Classroom'
      };
    }));
    
    return {
      success: true,
      data: {
        semester: semester.semesterName,
        schedules: enhancedSchedules
      },
      count: enhancedSchedules.length
    };
  } catch (error) {
    console.error('Error getting student schedule:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Lấy học sinh theo lớp
 * @param {string} classId - ID của lớp
 * @returns {Promise<Object>} Danh sách học sinh
 */
exports.getStudentsByClass = async (classId) => {
  try {
    const students = await models.Student.find({ classId }).sort({ fullName: 1 });
    
    return {
      success: true,
      data: students,
      count: students.length
    };
  } catch (error) {
    console.error('Error getting students by class:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Tạo học sinh mới
 * @param {Object} studentData - Dữ liệu học sinh
 * @returns {Promise<Object>} Học sinh đã tạo
 */
exports.createStudent = async (studentData) => {
  try {
    const student = await databaseService.createDocument(models.Student, studentData);
    
    if (!student) {
      return { success: false, error: 'Failed to create student', code: 'CREATE_FAILED' };
    }
    
    return { success: true, data: student };
  } catch (error) {
    console.error('Error creating student:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Cập nhật thông tin học sinh
 * @param {string} studentId - ID của học sinh
 * @param {Object} updateData - Dữ liệu cập nhật
 * @returns {Promise<Object>} Học sinh đã cập nhật
 */
exports.updateStudent = async (studentId, updateData) => {
  try {
    const student = await databaseService.updateById(
      models.Student, 
      studentId, 
      updateData, 
      'studentId'
    );
    
    if (!student) {
      return { success: false, error: 'Student not found or update failed', code: 'UPDATE_FAILED' };
    }
    
    return { success: true, data: student };
  } catch (error) {
    console.error('Error updating student:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Xóa học sinh
 * @param {string} studentId - ID của học sinh
 * @returns {Promise<Object>} Kết quả xóa
 */
exports.deleteStudent = async (studentId) => {
  try {
    const success = await databaseService.deleteById(models.Student, studentId, 'studentId');
    
    if (!success) {
      return { success: false, error: 'Student not found or delete failed', code: 'DELETE_FAILED' };
    }
    
    return { success: true, message: 'Student deleted successfully' };
  } catch (error) {
    console.error('Error deleting student:', error);
    return { success: false, error: error.message };
  }
}; 