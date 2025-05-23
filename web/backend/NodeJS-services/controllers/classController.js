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

    if (!academicYear) {
      return res.status(400).json({
        success: false,
        error: 'Academic year is required',
        code: 'MISSING_ACADEMIC_YEAR'
      });
    }

    // Check if class name already exists IN THE SAME ACADEMIC YEAR
    const existingClass = await Class.findOne({ className, academicYear });
    if (existingClass) {
      console.log(`Class with name ${className} already exists in academic year ${academicYear}:`, JSON.stringify(existingClass));
      return res.status(400).json({
        success: false,
        error: `Class "${className}" already exists in academic year ${academicYear}`,
        code: 'DUPLICATE_CLASS_IN_ACADEMIC_YEAR'
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

    // Mặc định studentNumber = 0 cho lớp mới
    const classWithStudentNumber = {
      ...newClass.toObject(),
      studentNumber: 0
    };

    console.log(`Created new class:`, JSON.stringify(classWithStudentNumber));

    return res.status(201).json({
      success: true,
      data: classWithStudentNumber,
      message: 'Class created successfully'
    });
  } catch (error) {
    console.error('Error creating class:', error);
    
    // Check for MongoDB duplicate key error (code 11000)
    if (error.code === 11000 && error.keyPattern && 
        error.keyPattern.className && error.keyPattern.academicYear) {
      return res.status(400).json({
        success: false,
        error: `Class with this name already exists in academic year ${req.body.academicYear}`,
        code: 'DUPLICATE_CLASS_IN_ACADEMIC_YEAR'
      });
    }
    
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
      query.homeroomTeacherId = { $regex: homeroomTeacherId, $options: 'i' };
    }
    
    // Filter by academicYear
    if (academicYear && academicYear !== 'none') {
      query.academicYear = academicYear;
    }
    
    console.log("Query filter:", JSON.stringify(query));
    
    // Find classes based on the query
    const classes = await Class.find(query).sort({ classId: 1 });
    console.log(`Found ${classes.length} classes`);
    
    // Get student counts for each class
    const Student = mongoose.model('Student');
    const classesWithStudentCount = await Promise.all(classes.map(async (classItem) => {
      const studentCount = await Student.countDocuments({ classIds: classItem.classId });
      return {
        ...classItem.toObject(),
        studentNumber: studentCount
      };
    }));
    
    // Return the classes with student counts
    return res.status(200).json({
      success: true,
      count: classes.length,
      data: classesWithStudentCount
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
    
    // Get student count for the class
    const Student = mongoose.model('Student');
    const studentCount = await Student.countDocuments({ classIds: classRecord.classId });
    
    // Return the class with student count
    const classWithStudentCount = {
      ...classRecord.toObject(),
      studentNumber: studentCount
    };
    
    return res.status(200).json({
      success: true,
      data: classWithStudentCount
    });
  } catch (error) {
    console.error('Error fetching class by ID:', error);
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
    
    // Get student count for the updated class
    const Student = mongoose.model('Student');
    const studentCount = await Student.countDocuments({ classIds: updatedClass.classId });
    
    // Add student count to the response
    const updatedClassWithStudentCount = {
      ...updatedClass.toObject(),
      studentNumber: studentCount
    };
    
    console.log(`Updated class successfully:`, JSON.stringify(updatedClassWithStudentCount));
    
    return res.status(200).json({
      success: true,
      data: updatedClassWithStudentCount,
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
    
    // Get student count for each class
    const Student = mongoose.model('Student');
    const classesWithStudentCount = await Promise.all(classes.map(async (classItem) => {
      const studentCount = await Student.countDocuments({ classIds: classItem.classId });
      return {
        ...classItem.toObject(),
        studentNumber: studentCount
      };
    }));
    
    return res.status(200).json({
      success: true,
      count: classes.length,
      role,
      data: classesWithStudentCount
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

/**
 * Create a new class and add students to it
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
const createClassWithStudents = async (req, res) => {
  try {
    const { className, grade, homeroomTeacherId, academicYear, studentIds = [], teacherIds = [] } = req.body;
    
    console.log(`Attempting to create class with students:`, JSON.stringify(req.body));
    
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
    
    if (!academicYear) {
      return res.status(400).json({
        success: false,
        error: 'Academic year is required',
        code: 'MISSING_ACADEMIC_YEAR'
      });
    }

    // Check if class name already exists IN THE SAME ACADEMIC YEAR
    const existingClass = await Class.findOne({ className, academicYear });
    if (existingClass) {
      console.log(`Class with name ${className} already exists in academic year ${academicYear}:`, JSON.stringify(existingClass));
      return res.status(400).json({
        success: false,
        error: `Class "${className}" already exists in academic year ${academicYear}`,
        code: 'DUPLICATE_CLASS_IN_ACADEMIC_YEAR'
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
    
    // Create the new class without using transactions
    const newClass = await Class.create({
      className,
      classId,
      homeroomTeacherId,
      grade: Number(grade),
      academicYear,
      isActive: true
    });
    
    console.log(`Created class: ${JSON.stringify(newClass)}`);
    
    // Initialize counters
    let studentsAdded = 0;
    let studentsSkipped = 0;
    let studentsErrors = [];
    
    // Process student IDs if provided
    if (studentIds && studentIds.length > 0) {
      console.log(`Processing ${studentIds.length} students`);
      
      // Get the Student model and add each student to the class
      const Student = mongoose.model('Student');
      
      for (const studentId of studentIds) {
        try {
          // Find the student
          const student = await Student.findOne({ userId: studentId });
          
          if (!student) {
            console.log(`Student with ID ${studentId} not found`);
            studentsErrors.push({ id: studentId, error: 'Student not found' });
            studentsSkipped++;
            continue;
          }
          
          // Update the student's classIds array
          if (!student.classIds) {
            student.classIds = [];
          }
          
          // Add the classId if it's not already in the array
          if (!student.classIds.includes(classId)) {
            student.classIds.push(classId);
            await student.save();
            studentsAdded++;
            console.log(`Added student ${studentId} to class ${classId}`);
          } else {
            console.log(`Student ${studentId} already in class ${classId}`);
            studentsSkipped++;
          }
        } catch (studentError) {
          console.error(`Error adding student ${studentId}:`, studentError);
          studentsErrors.push({ id: studentId, error: studentError.message });
          studentsSkipped++;
        }
      }
    }
    
    // Return the result
    return res.status(201).json({
      success: true,
      data: {
        class: {
          ...newClass.toObject(),
          studentNumber: studentsAdded
        },
        studentsAdded,
        studentsSkipped,
        studentsErrors: studentsErrors.length > 0 ? studentsErrors : undefined
      },
      message: 'Class created successfully'
    });
  } catch (error) {
    console.error('Error creating class with students:', error);
    
    // Check for MongoDB duplicate key error (code 11000)
    if (error.code === 11000 && error.keyPattern && 
        error.keyPattern.className && error.keyPattern.academicYear) {
      return res.status(400).json({
        success: false,
        error: `Class with this name already exists in academic year ${req.body.academicYear}`,
        code: 'DUPLICATE_CLASS_IN_ACADEMIC_YEAR'
      });
    }
    
    return res.status(500).json({
      success: false,
      error: error.message || 'An error occurred while creating the class with students',
      code: 'SERVER_ERROR'
    });
  }
};

/**
 * Add students to a class
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
const addStudentsToClass = async (req, res) => {
  try {
    const { classId } = req.params;
    const { studentIds } = req.body;
    
    if (!classId) {
      return res.status(400).json({
        success: false,
        error: 'Class ID is required',
        code: 'MISSING_CLASS_ID'
      });
    }
    
    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Student IDs array is required',
        code: 'MISSING_STUDENT_IDS'
      });
    }
    
    console.log(`Adding students to class ${classId}:`, JSON.stringify(studentIds));
    
    // Validate class exists
    const classRecord = await Class.findOne({ classId: Number(classId) });
    if (!classRecord) {
      return res.status(404).json({
        success: false,
        error: 'Class not found',
        code: 'CLASS_NOT_FOUND'
      });
    }
    
    // Import model Student
    const Student = require('../database/models/Student');
    
    // Update classIds array for each student
    const updatePromises = studentIds.map(async (userId) => {
      try {
        // Tìm học sinh theo userId
        const student = await Student.findOne({ userId });
        
        if (!student) {
          console.log(`Student with userId ${userId} not found`);
          return {
            userId,
            success: false,
            message: 'Student not found'
          };
        }
        
        // Thêm classId vào mảng classIds của học sinh (nếu chưa có)
        if (!student.classIds) {
          student.classIds = [];
        }
        
        // Kiểm tra nếu học sinh đã có trong lớp này rồi
        if (!student.classIds.includes(Number(classId))) {
          student.classIds.push(Number(classId));
          await student.save();
          
          return {
            userId: student.userId,
            studentId: student.studentId,
            fullName: student.fullName,
            success: true,
            message: 'Added to class'
          };
        } else {
          return {
            userId: student.userId,
            studentId: student.studentId,
            fullName: student.fullName,
            success: true,
            message: 'Already in class'
          };
        }
      } catch (err) {
        console.error(`Error updating student ${userId}:`, err);
        return {
          userId,
          success: false,
          message: err.message
        };
      }
    });
    
    // Đợi tất cả các cập nhật hoàn thành
    const results = await Promise.all(updatePromises);
    
    // Đếm số học sinh được thêm thành công
    const successCount = results.filter(r => r.success).length;
    
    return res.status(200).json({
      success: true,
      message: `Added ${successCount} students to class ${classId}`,
      class: {
        classId: classRecord.classId,
        className: classRecord.className
      },
      results
    });
  } catch (error) {
    console.error('Error adding students to class:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'An error occurred while adding students to class',
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
  getStudentsByClassId,
  createClassWithStudents,
  addStudentsToClass
}; 