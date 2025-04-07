const mongoose = require('mongoose');

/**
 * Get schedule for a student by userId
 * @param {string} userId 
 * @returns {Promise<Object>} Student and schedules data
 */
exports.getStudentSchedule = async (userId) => {
  // 1. Find student record using the userId
  const student = await mongoose.connection.db.collection('Student')
    .findOne({ userId: userId });
    
  if (!student) {
    const error = new Error('Student record not found');
    error.code = 'STUDENT_NOT_FOUND';
    error.statusCode = 404;
    throw error;
  }
  
  // 2. Get the classId from the student record
  const classId = student.classId;
  
  if (!classId) {
    const error = new Error('Student has no assigned class');
    error.code = 'NO_CLASS_ASSIGNED';
    error.statusCode = 404;
    throw error;
  }
  
  // 3. Query the ClassSchedule using the classId
  const schedules = await mongoose.connection.db.collection('ClassSchedule')
    .find({ classId: classId })
    .toArray();
  
  return {
    student: {
      studentId: student.studentId,
      fullName: student.fullName,
      classId: student.classId,
      userId: student.userId
    },
    schedules
  };
};

/**
 * Get teaching schedule for teacher by userId
 * @param {string} userId 
 * @returns {Promise<Object>} Teacher and schedules data
 */
exports.getTeacherSchedule = async (userId) => {
  // 1. Find teacher record
  const teacher = await mongoose.connection.db.collection('Teacher')
    .findOne({ userId: userId });
    
  if (!teacher) {
    const error = new Error('Teacher record not found');
    error.code = 'TEACHER_NOT_FOUND';
    error.statusCode = 404;
    throw error;
  }
  
  const teacherId = teacher.teacherId;
  
  // 2. Get schedules where teacher teaches
  const schedules = await mongoose.connection.db.collection('ClassSchedule')
    .find({ teacherId: teacherId })
    .toArray();
  
  return {
    teacher: {
      teacherId: teacher.teacherId,
      fullName: teacher.fullName,
      userId: teacher.userId,
      major: teacher.major,
      weeklyCapacity: teacher.weeklyCapacity
    },
    schedules
  };
};

/**
 * Get student schedule for parent
 * @param {string} userId 
 * @param {number|null} specificStudentId 
 * @returns {Promise<Object>} Parent, student and schedules data
 */
exports.getParentChildSchedule = async (userId, specificStudentId = null) => {
  // 1. Find parent record
  const parent = await mongoose.connection.db.collection('Parent')
    .findOne({ userId: userId });
    
  if (!parent) {
    const error = new Error('Parent record not found');
    error.code = 'PARENT_NOT_FOUND';
    error.statusCode = 404;
    throw error;
  }
  
  // 2. Get list of student IDs associated with this parent
  const studentIds = parent.studentIds || [];
  
  if (studentIds.length === 0) {
    const error = new Error('Parent has no linked students');
    error.code = 'NO_STUDENTS_LINKED';
    error.statusCode = 404;
    throw error;
  }
  
  // 3. Determine which student to use
  let targetStudentId = specificStudentId ? parseInt(specificStudentId) : studentIds[0];
  
  // 4. Verify that the requested student belongs to this parent
  if (specificStudentId && !studentIds.includes(parseInt(specificStudentId))) {
    const error = new Error('Parent is not authorized to view this student\'s schedule');
    error.code = 'UNAUTHORIZED_STUDENT_ACCESS';
    error.statusCode = 403;
    throw error;
  }
  
  // 5. Get student details
  const student = await mongoose.connection.db.collection('Student')
    .findOne({ studentId: targetStudentId });
    
  if (!student) {
    const error = new Error('Student record not found');
    error.code = 'STUDENT_NOT_FOUND';
    error.statusCode = 404;
    throw error;
  }
  
  const classId = student.classId;
  
  if (!classId) {
    const error = new Error('Student has no assigned class');
    error.code = 'NO_CLASS_ASSIGNED';
    error.statusCode = 404;
    throw error;
  }
  
  // 6. Get schedules for the class
  const schedules = await mongoose.connection.db.collection('ClassSchedule')
    .find({ classId: classId })
    .toArray();
  
  return {
    parent: {
      parentId: parent.parentId,
      fullName: parent.fullName,
      userId: parent.userId
    },
    student: {
      studentId: student.studentId,
      fullName: student.fullName,
      classId: student.classId
    },
    allStudentIds: studentIds,
    schedules
  };
};

/**
 * Get schedules by class ID
 * @param {number} classId 
 * @returns {Promise<Array>} Schedules
 */
exports.getSchedulesByClassId = async (classId) => {
  const schedules = await mongoose.connection.db.collection('ClassSchedule')
    .find({ classId: parseInt(classId) })
    .toArray();
  
  return schedules;
};

/**
 * Get schedules by teacher ID
 * @param {number} teacherId 
 * @returns {Promise<Array>} Schedules
 */
exports.getSchedulesByTeacherId = async (teacherId) => {
  const schedules = await mongoose.connection.db.collection('ClassSchedule')
    .find({ teacherId: parseInt(teacherId) })
    .toArray();
  
  return schedules;
};

/**
 * Get current semester info
 * @returns {Promise<Object>} Semester info or null
 */
exports.getCurrentSemesterInfo = async () => {
  try {
    const currentSemester = await mongoose.connection.db.collection('Semester')
      .findOne({ 
        startDate: { $lte: new Date() }, 
        endDate: { $gte: new Date() }
      });
    
    if (!currentSemester) return null;
    
    return {
      semesterId: currentSemester.semesterId,
      semesterName: currentSemester.semesterName,
      startDate: currentSemester.startDate,
      endDate: currentSemester.endDate
    };
  } catch (error) {
    console.warn('Error getting semester info:', error.message);
    return null;
  }
}; 