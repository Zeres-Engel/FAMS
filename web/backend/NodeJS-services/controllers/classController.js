const { Class, Teacher } = require('../database/models');
const mongoose = require('mongoose');

/**
 * Create a new class
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
const createClass = async (req, res) => {
  try {
    const { className, homeroomTeacherId, grade, academicYear } = req.body;
    
    console.log(`Attempting to create class with data:`, JSON.stringify(req.body));

    // Validate required fields
    if (!className) {
      return res.status(400).json({
        success: false,
        error: 'Class name is required',
        code: 'MISSING_CLASSNAME'
      });
    }

    if (!grade) {
      return res.status(400).json({
        success: false,
        error: 'Grade is required',
        code: 'MISSING_GRADE'
      });
    }

    // Check if class name already exists
    const existingClass = await Class.findOne({ className });
    if (existingClass) {
      console.log(`Class with name ${className} already exists:`, JSON.stringify(existingClass));
      return res.status(400).json({
        success: false,
        error: 'Class name already exists',
        code: 'DUPLICATE_CLASSNAME'
      });
    }

    // If teacherId is provided, validate it exists and not already a homeroom teacher
    if (homeroomTeacherId) {
      const teacher = await Teacher.findOne({ userId: homeroomTeacherId });
      if (!teacher) {
        console.log(`Teacher with ID ${homeroomTeacherId} not found`);
        return res.status(400).json({
          success: false,
          error: 'Teacher ID does not exist',
          code: 'INVALID_TEACHER_ID'
        });
      }
      
      // Check if teacher is already a homeroom teacher of another class
      const existingHomeroom = await Class.findOne({ homeroomTeacherId });
      if (existingHomeroom) {
        console.log(`Teacher ${homeroomTeacherId} is already homeroom for class:`, JSON.stringify(existingHomeroom));
        return res.status(400).json({
          success: false,
          error: 'This teacher is already a homeroom teacher for another class',
          code: 'TEACHER_ALREADY_HOMEROOM'
        });
      }
    }

    // Generate a new classId (auto-increment)
    const lastClass = await Class.findOne().sort({ classId: -1 });
    const classId = lastClass ? lastClass.classId + 1 : 1;
    console.log(`Generated new classId: ${classId}`);

    // Create the new class with explicit grade independent of className
    const newClass = await Class.create({
      className,
      classId,
      homeroomTeacherId,
      grade: Number(grade), // Ensure grade is stored as a number
      academicYear,
      isActive: true
    });

    console.log(`Created new class:`, JSON.stringify(newClass));

    return res.status(201).json({
      success: true,
      data: newClass,
      message: 'Class created successfully'
    });
  } catch (error) {
    console.error('Error creating class:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'An error occurred while creating the class',
      code: 'SERVER_ERROR'
    });
  }
};

/**
 * Get all classes with optional filtering
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
const getAllClasses = async (req, res) => {
  try {
    // Extract query parameters
    const { grade, batchId, search, homeroomTeacherId, className, academicYear } = req.query;
    
    console.log(`Getting all classes with filters:`, JSON.stringify(req.query));
    
    // Build query filter
    let query = {};
    
    // Filter by grade directly
    if (grade && grade !== 'none') {
      query.grade = Number(grade);
    }
    
    // Filter by className directly (exact match or partial match)
    if (className && className !== 'none') {
      query.className = { $regex: className, $options: 'i' };
    }
    
    // Filter by search term
    if (search && search !== 'none') {
      if (!query.className) {
        query.className = { $regex: search, $options: 'i' };
      } else {
        // If className filter already exists, use $and
        query.$and = [
          { className: query.className },
          { className: { $regex: search, $options: 'i' } }
        ];
        delete query.className;
      }
    }
    
    // Filter by batch ID
    if (batchId && batchId !== 'none') {
      query.batchId = Number(batchId);
    }
    
    // Filter by homeroom teacher ID
    if (homeroomTeacherId && homeroomTeacherId !== 'none') {
      query.homeroomTeacherId = homeroomTeacherId;
    }
    
    // Filter by academicYear
    if (academicYear && academicYear !== 'none') {
      query.academicYear = academicYear;
    }
    
    console.log("Query filter:", JSON.stringify(query));
    
    // Find classes based on the query
    const classes = await Class.find(query).sort({ classId: 1 });
    console.log(`Found ${classes.length} classes`);
    
    // Return the classes directly without modifying the grade field
    return res.status(200).json({
      success: true,
      count: classes.length,
      data: classes
    });
  } catch (error) {
    console.error('Error fetching classes:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'An error occurred while fetching classes',
      code: 'SERVER_ERROR'
    });
  }
};

/**
 * Get class by ID or className
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
const getClassById = async (req, res) => {
  try {
    const idParam = req.params.id;
    let classRecord;
    
    console.log(`Getting class with ID parameter: ${idParam}`);
    
    // Check if the parameter is a number or a string
    if (!isNaN(idParam)) {
      // If it's a number, search by classId
      const classId = parseInt(idParam);
      console.log(`Searching for class with classId: ${classId}`);
      classRecord = await Class.findOne({ classId });
    } else {
      // If it's not a number, search by className
      console.log(`Searching for class with className: ${idParam}`);
      classRecord = await Class.findOne({ className: idParam });
    }
    
    if (!classRecord) {
      console.log(`Class not found with ID parameter: ${idParam}`);
      return res.status(404).json({
        success: false,
        error: 'Class not found',
        code: 'CLASS_NOT_FOUND'
      });
    }
    
    console.log(`Found class:`, JSON.stringify(classRecord));
    
    return res.status(200).json({
      success: true,
      data: classRecord
    });
  } catch (error) {
    console.error('Error fetching class:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'An error occurred while fetching the class',
      code: 'SERVER_ERROR'
    });
  }
};

/**
 * Update a class by ID or className
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
const updateClass = async (req, res) => {
  try {
    const idParam = req.params.id;
    const { className, homeroomTeacherId, grade, academicYear } = req.body;
    
    // Log update attempt for debugging
    console.log(`Attempting to update class with ID parameter: ${idParam}`);
    console.log(`Update data:`, JSON.stringify(req.body));
    console.log(`Grade type:`, typeof grade, `Value:`, grade);
    
    // Find the class by ID or className
    let classRecord;
    let query = {};
    
    // Check if the parameter is a number or a string
    if (!isNaN(idParam)) {
      // If it's a number, search by classId
      const classId = parseInt(idParam);
      query = { classId };
      console.log(`Searching for class with ID: ${classId}`);
      classRecord = await Class.findOne(query);
    } else {
      // If it's not a number, search by className
      query = { className: idParam };
      console.log(`Searching for class with className: ${idParam}`);
      classRecord = await Class.findOne(query);
    }
    
    if (!classRecord) {
      console.log(`Class not found with query:`, JSON.stringify(query));
      return res.status(404).json({
        success: false,
        error: 'Class not found',
        code: 'CLASS_NOT_FOUND'
      });
    }
    
    console.log(`Found class:`, JSON.stringify(classRecord));
    
    // Check if updated class name already exists (if changing class name)
    if (className && className !== classRecord.className) {
      const existingClass = await Class.findOne({ className });
      if (existingClass && existingClass.classId !== classRecord.classId) {
        return res.status(400).json({
          success: false,
          error: 'Class name already exists',
          code: 'DUPLICATE_CLASSNAME'
        });
      }
    }
    
    // If teacherId is provided, validate it exists
    if (homeroomTeacherId && homeroomTeacherId !== classRecord.homeroomTeacherId) {
      // Check if teacher exists
      const teacher = await Teacher.findOne({ userId: homeroomTeacherId });
      if (!teacher) {
        return res.status(400).json({
          success: false,
          error: 'Teacher ID does not exist',
          code: 'INVALID_TEACHER_ID'
        });
      }
      
      // Check if teacher is already a homeroom teacher for another class
      const existingHomeroom = await Class.findOne({ 
        homeroomTeacherId, 
        classId: { $ne: classRecord.classId } 
      });
      
      if (existingHomeroom) {
        return res.status(400).json({
          success: false,
          error: 'This teacher is already a homeroom teacher for another class',
          code: 'TEACHER_ALREADY_HOMEROOM'
        });
      }
    }
    
    // Prepare update data
    const updateData = {};
    if (className) updateData.className = className;
    if (homeroomTeacherId) updateData.homeroomTeacherId = homeroomTeacherId;
    
    // Handle grade update - always convert to Number to ensure proper update
    if (grade !== undefined) {
      updateData.grade = Number(grade);
      console.log(`Setting grade to:`, updateData.grade, `(type: ${typeof updateData.grade})`);
    }
    
    if (academicYear) updateData.academicYear = academicYear;
    
    console.log(`Final update data:`, JSON.stringify(updateData));
    
    // Force update directly using MongoDB's collection to bypass potential schema validation
    const db = mongoose.connection.db;
    const ClassCollection = db.collection('Class');
    
    const updateResult = await ClassCollection.updateOne(
      { classId: classRecord.classId },
      { $set: updateData }
    );
    
    console.log(`Raw update result:`, JSON.stringify(updateResult));
    
    if (updateResult.modifiedCount === 0) {
      console.log(`Warning: No modifications made to class ${classRecord.classId}`);
    }
    
    // Get the updated class
    const updatedClass = await Class.findOne({ classId: classRecord.classId });
    
    console.log(`Updated class:`, JSON.stringify(updatedClass));
    
    return res.status(200).json({
      success: true,
      data: updatedClass,
      message: 'Class updated successfully'
    });
  } catch (error) {
    console.error('Error updating class:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'An error occurred while updating the class',
      code: 'SERVER_ERROR'
    });
  }
};

/**
 * Delete a class by ID or className with cascade deletion
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
const deleteClass = async (req, res) => {
  try {
    const idParam = req.params.id;
    let classRecord;
    
    console.log(`Attempting to delete class with ID parameter: ${idParam}`);
    
    // Check if the parameter is a number or a string
    if (!isNaN(idParam)) {
      // If it's a number, find by classId
      const classId = parseInt(idParam);
      console.log(`Searching for class with classId: ${classId}`);
      classRecord = await Class.findOne({ classId });
    } else {
      // If it's not a number, find by className
      console.log(`Searching for class with className: ${idParam}`);
      classRecord = await Class.findOne({ className: idParam });
    }
    
    if (!classRecord) {
      console.log(`Class not found with ID parameter: ${idParam}`);
      return res.status(404).json({
        success: false,
        error: 'Class not found',
        code: 'CLASS_NOT_FOUND'
      });
    }
    
    const classId = classRecord.classId;
    const className = classRecord.className;
    
    console.log(`Deleting class ${className} (ID: ${classId}) with cascade effects`);
    
    // Use direct access to collections for optimized operations
    const db = mongoose.connection.db;
    
    // 1. Update all students in this class (set classId to null)
    const Student = require('../database/models/Student');
    const studentsUpdateResult = await Student.updateMany(
      { classId },
      { $unset: { classId: "" } }
    );
    
    console.log(`Updated ${studentsUpdateResult.modifiedCount} students (removed from class)`);
    
    // 2. Delete all class schedules for this class
    const ClassScheduleCollection = db.collection('ClassSchedule');
    const schedulesDeleteResult = await ClassScheduleCollection.deleteMany({ 
      classId: Number(classId) 
    });
    
    console.log(`Deleted ${schedulesDeleteResult.deletedCount} class schedules`);
    
    // 3. Delete all attendance logs related to this class
    const AttendanceLogCollection = db.collection('AttendanceLog');
    const attendanceDeleteResult = await AttendanceLogCollection.deleteMany({
      classId: Number(classId)
    });
    
    console.log(`Deleted ${attendanceDeleteResult.deletedCount} attendance logs`);
    
    // 4. Check for other related data that might need cascade deletion
    // (Add more cascade deletion logic here if needed)
    
    // 5. Finally delete the class itself - using direct collection access for consistency
    const ClassCollection = db.collection('Class');
    const deleteResult = await ClassCollection.deleteOne({ classId: Number(classId) });
    
    console.log(`Class deletion result:`, JSON.stringify(deleteResult));
    
    if (deleteResult.deletedCount === 0) {
      console.log(`Warning: Class document not deleted, may have been removed earlier`);
      return res.status(404).json({
        success: false,
        error: 'Class could not be deleted',
        code: 'CLASS_DELETE_FAILED'
      });
    }
    
    return res.status(200).json({
      success: true,
      message: 'Class deleted successfully with cascade effects',
      details: {
        className,
        classId,
        studentsUpdated: studentsUpdateResult.modifiedCount,
        schedulesDeleted: schedulesDeleteResult.deletedCount,
        attendanceLogsDeleted: attendanceDeleteResult.deletedCount,
        classDeleted: deleteResult.deletedCount === 1
      }
    });
  } catch (error) {
    console.error('Error deleting class:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'An error occurred while deleting the class',
      code: 'SERVER_ERROR'
    });
  }
};

/**
 * Get classes by userId - for both students and teachers
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
const getClassesByUserId = async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required',
        code: 'MISSING_USER_ID'
      });
    }
    
    console.log(`Getting classes for user ID: ${userId}`);
    
    // Find user's classes as a student
    const student = await mongoose.model('Student').findOne({ userId });
    
    // Find user's classes as a teacher (both homeroom and teaching classes)
    const teacher = await mongoose.model('Teacher').findOne({ userId });
    
    let classes = [];
    let role = null;
    
    if (student) {
      // User is a student, get their classes
      role = 'student';
      const studentClasses = await Class.find({ 
        classId: { $in: student.classIds } 
      });
      classes = [...studentClasses];
    }
    
    if (teacher) {
      // User is a teacher, get classes where they are homeroom teacher
      role = role ? 'both' : 'teacher';
      
      // Get classes where the teacher is homeroom teacher
      const homeroomClasses = await Class.find({ 
        homeroomTeacherId: userId 
      });
      
      // Get classes where the teacher teaches (from schedules)
      const scheduleModel = mongoose.model('ClassSchedule');
      const teachingSchedules = await scheduleModel.find({ 
        teacherId: teacher.teacherId 
      }).distinct('classId');
      
      const teachingClasses = await Class.find({
        classId: { $in: teachingSchedules }
      });
      
      // Add to classes array, avoiding duplicates
      const existingClassIds = new Set(classes.map(c => c.classId));
      
      [...homeroomClasses, ...teachingClasses].forEach(cls => {
        if (!existingClassIds.has(cls.classId)) {
          classes.push(cls);
          existingClassIds.add(cls.classId);
        }
      });
    }
    
    if (!student && !teacher) {
      return res.status(404).json({
        success: false,
        error: 'No student or teacher found with this user ID',
        code: 'USER_NOT_FOUND'
      });
    }
    
    return res.status(200).json({
      success: true,
      count: classes.length,
      role,
      data: classes
    });
  } catch (error) {
    console.error('Error fetching classes by user ID:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'An error occurred while fetching classes',
      code: 'SERVER_ERROR'
    });
  }
};

/**
 * Get all students in a class by classId
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
const getStudentsByClassId = async (req, res) => {
  try {
    const { classId } = req.params;
    
    if (!classId) {
      return res.status(400).json({
        success: false,
        error: 'Class ID is required',
        code: 'MISSING_CLASS_ID'
      });
    }
    
    console.log(`Getting students for class ID: ${classId}`);
    
    // Validate class exists
    const classRecord = await Class.findOne({ classId: Number(classId) });
    if (!classRecord) {
      return res.status(404).json({
        success: false,
        error: 'Class not found',
        code: 'CLASS_NOT_FOUND'
      });
    }
    
    // Find all students in this class
    const Student = mongoose.model('Student');
    const students = await Student.find({ 
      classIds: Number(classId) 
    }).populate('user');
    
    // Format the response with only required fields
    const formattedStudents = students.map(student => {
      return {
        id: student.userId,
        fullName: student.fullName,
        avatar: student.user ? student.user.avatar : null,
        email: student.user ? student.user.email : null,
        phone: student.phone,
        role: 'student'
      };
    });
    
    // Retrieve teacher information if homeroomTeacherId exists
    let homeroomTeacher = null;
    if (classRecord.homeroomTeacherId) {
      const Teacher = mongoose.model('Teacher');
      homeroomTeacher = await Teacher.findOne({ userId: classRecord.homeroomTeacherId }).populate('user');
    }
    
    // Include full class information in the response
    const classInfo = {
      _id: classRecord._id,
      className: classRecord.className,
      grade: classRecord.grade,
      homeroomTeacherId: classRecord.homeroomTeacherId,
      academicYear: classRecord.academicYear,
      createdAt: classRecord.createdAt,
      isActive: classRecord.isActive,
      classId: classRecord.classId,
      // Add teacher name if available
      homeroomTeacherName: homeroomTeacher ? homeroomTeacher.fullName : null
    };
    
    return res.status(200).json({
      success: true,
      count: formattedStudents.length,
      classInfo: classInfo,
      data: formattedStudents
    });
  } catch (error) {
    console.error('Error fetching students by class ID:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'An error occurred while fetching students',
      code: 'SERVER_ERROR'
    });
  }
};

module.exports = {
  createClass,
  getAllClasses,
  getClassById,
  updateClass,
  deleteClass,
  getClassesByUserId,
  getStudentsByClassId
}; 