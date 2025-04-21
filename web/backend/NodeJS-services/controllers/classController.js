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
      return res.status(400).json({
        success: false,
        error: 'Class name already exists',
        code: 'DUPLICATE_CLASSNAME'
      });
    }

    // If teacherId is provided, validate it exists
    if (homeroomTeacherId) {
      const teacher = await Teacher.findOne({ userId: homeroomTeacherId });
      if (!teacher) {
        return res.status(400).json({
          success: false,
          error: 'Teacher ID does not exist',
          code: 'INVALID_TEACHER_ID'
        });
      }
    }

    // Generate a new classId (auto-increment)
    const lastClass = await Class.findOne().sort({ classId: -1 });
    const classId = lastClass ? lastClass.classId + 1 : 1;

    // Create the new class
    const newClass = await Class.create({
      className,
      classId,
      homeroomTeacherId,
      grade,
      academicYear
    });

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
    
    // Build query filter
    let query = {};
    
    // Filter by grade - extract from className (e.g., "10A1" has grade "10")
    if (grade && grade !== 'none') {
      // Create a regex pattern to match className that starts with the specified grade
      const gradePattern = `^${grade}`;
      query.className = { $regex: gradePattern, $options: 'i' };
    }
    
    // Filter by className directly (exact match or partial match)
    if (className && className !== 'none') {
      if (query.className) {
        // If className regex already exists (from grade filter), use $and
        query.$and = [
          { className: query.className },
          { className: { $regex: className, $options: 'i' } }
        ];
        delete query.className; // Remove the original as it's now in $and
      } else {
        query.className = { $regex: className, $options: 'i' };
      }
    }
    
    // Filter by search term
    if (search && search !== 'none') {
      if (query.$and) {
        // Add to existing $and
        query.$and.push({ className: { $regex: search, $options: 'i' } });
      } else if (query.className) {
        // If className regex already exists, use $and
        query.$and = [
          { className: query.className },
          { className: { $regex: search, $options: 'i' } }
        ];
        delete query.className; // Remove the original as it's now in $and
      } else {
        // Just search filter
        query.className = { $regex: search, $options: 'i' };
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
    
    // Add grade information to each class
    const classesWithGrade = classes.map(cls => {
      const classObj = cls.toObject();
      // Extract grade from className (e.g., from "10A1" extract "10")
      const gradeMatch = cls.className.match(/^(\d+)/);
      classObj.grade = gradeMatch ? gradeMatch[1] : 'Unknown';
      return classObj;
    });
    
    return res.status(200).json({
      success: true,
      count: classes.length,
      data: classesWithGrade
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
    
    // Check if the parameter is a number or a string
    if (!isNaN(idParam)) {
      // If it's a number, search by classId
      const classId = parseInt(idParam);
      classRecord = await Class.findOne({ classId });
    } else {
      // If it's not a number, search by className
      classRecord = await Class.findOne({ className: idParam });
    }
    
    if (!classRecord) {
      return res.status(404).json({
        success: false,
        error: 'Class not found',
        code: 'CLASS_NOT_FOUND'
      });
    }
    
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
    
    // Find the class by ID or className
    let classRecord;
    let query = {};
    
    // Check if the parameter is a number or a string
    if (!isNaN(idParam)) {
      // If it's a number, search by classId
      const classId = parseInt(idParam);
      query = { classId };
      classRecord = await Class.findOne(query);
    } else {
      // If it's not a number, search by className
      query = { className: idParam };
      classRecord = await Class.findOne(query);
    }
    
    if (!classRecord) {
      return res.status(404).json({
        success: false,
        error: 'Class not found',
        code: 'CLASS_NOT_FOUND'
      });
    }
    
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
      const teacher = await Teacher.findOne({ userId: homeroomTeacherId });
      if (!teacher) {
        return res.status(400).json({
          success: false,
          error: 'Teacher ID does not exist',
          code: 'INVALID_TEACHER_ID'
        });
      }
    }
    
    // Prepare update data
    const updateData = {};
    if (className) updateData.className = className;
    if (homeroomTeacherId) updateData.homeroomTeacherId = homeroomTeacherId;
    if (grade) updateData.grade = grade;
    if (academicYear) updateData.academicYear = academicYear;
    
    // Update the class
    const updatedClass = await Class.findOneAndUpdate(
      query, 
      updateData, 
      { new: true }
    );
    
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
    
    // Check if the parameter is a number or a string
    if (!isNaN(idParam)) {
      // If it's a number, find by classId
      const classId = parseInt(idParam);
      classRecord = await Class.findOne({ classId });
    } else {
      // If it's not a number, find by className
      classRecord = await Class.findOne({ className: idParam });
    }
    
    if (!classRecord) {
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
    
    // 3. Finally delete the class itself
    const deleteResult = await Class.deleteOne({ classId });
    
    return res.status(200).json({
      success: true,
      message: 'Class deleted successfully with cascade effects',
      details: {
        className,
        classId,
        studentsUpdated: studentsUpdateResult.modifiedCount,
        schedulesDeleted: schedulesDeleteResult.deletedCount,
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

module.exports = {
  createClass,
  getAllClasses,
  getClassById,
  updateClass,
  deleteClass
}; 