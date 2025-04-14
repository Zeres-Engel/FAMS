const { Class, Teacher } = require('../database/models');

/**
 * Create a new class
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
const createClass = async (req, res) => {
  try {
    const { className, homeroomTeacherId } = req.body;

    // Validate required fields
    if (!className) {
      return res.status(400).json({
        success: false,
        error: 'Class name is required',
        code: 'MISSING_CLASSNAME'
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
      homeroomTeacherId
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
    const { grade, batchId, search, homeroomTeacherId } = req.query;
    
    // Build query filter
    let query = {};
    
    // Filter by grade - extract from className (e.g., "10A1" has grade "10")
    if (grade && grade !== 'none') {
      // Create a regex pattern to match className that starts with the specified grade
      const gradePattern = `^${grade}`;
      if (search && search !== 'none') {
        // If both grade and search are provided, use $and with two separate regex conditions
        query.$and = [
          { className: { $regex: gradePattern, $options: 'i' } },
          { className: { $regex: search, $options: 'i' } }
        ];
      } else {
        // Just grade filter
        query.className = { $regex: gradePattern, $options: 'i' };
      }
    } else if (search && search !== 'none') {
      // Just search filter
      query.className = { $regex: search, $options: 'i' };
    }
    
    // Filter by batch ID
    if (batchId && batchId !== 'none') {
      query.batchId = Number(batchId);
    }
    
    // Filter by homeroom teacher ID
    if (homeroomTeacherId && homeroomTeacherId !== 'none') {
      query.homeroomTeacherId = homeroomTeacherId;
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
 * Get class by ID
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
const getClassById = async (req, res) => {
  try {
    const classId = req.params.id;
    const classRecord = await Class.findOne({ classId });
    
    if (!classRecord) {
      return res.status(404).json({
        success: false,
        error: 'Class not found',
        code: 'CLASS_NOT_FOUND'
      });
    }
    
    const classObj = classRecord.toObject();
    // Extract grade from className (e.g., from "10A1" extract "10")
    const gradeMatch = classRecord.className.match(/^(\d+)/);
    classObj.grade = gradeMatch ? gradeMatch[1] : 'Unknown';
    
    return res.status(200).json({
      success: true,
      data: classObj
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
 * Update a class by ID
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
const updateClass = async (req, res) => {
  try {
    const classId = req.params.id;
    const { className, homeroomTeacherId, batchId } = req.body;
    
    // Find the class by ID
    const classRecord = await Class.findOne({ classId });
    
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
      if (existingClass && existingClass.classId !== parseInt(classId)) {
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
    if (batchId) updateData.batchId = batchId;
    
    // Update the class
    const updatedClass = await Class.findOneAndUpdate(
      { classId }, 
      updateData, 
      { new: true }
    );
    
    // Extract grade from className
    const updatedClassObj = updatedClass.toObject();
    const gradeMatch = updatedClass.className.match(/^(\d+)/);
    updatedClassObj.grade = gradeMatch ? gradeMatch[1] : 'Unknown';
    
    return res.status(200).json({
      success: true,
      data: updatedClassObj,
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
 * Delete a class by ID
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
const deleteClass = async (req, res) => {
  try {
    const classId = req.params.id;
    
    // Find and delete the class
    const deletedClass = await Class.findOneAndDelete({ classId });
    
    if (!deletedClass) {
      return res.status(404).json({
        success: false,
        error: 'Class not found',
        code: 'CLASS_NOT_FOUND'
      });
    }
    
    return res.status(200).json({
      success: true,
      message: 'Class deleted successfully'
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