const express = require('express');
const router = express.Router();
const { models } = require('../database');
const { protect } = require('../middleware/authMiddleware');

/**
 * Deprecated Routes - Being phased out in favor of User API
 * These routes will be removed in future versions.
 * Please use the User API instead.
 */

// Get all parents
router.get('/', async (req, res) => {
  try {
    const parents = await models.Parent.find().sort({ parentId: 1 });
    res.json({ success: true, count: parents.length, data: parents });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get parent by ID with detailed profile
router.get('/:id', async (req, res) => {
  try {
    const parent = await models.Parent.findOne({ parentId: req.params.id });
    
    if (!parent) {
      return res.status(404).json({ success: false, error: 'Parent not found' });
    }
    
    // Get user data
    const user = await models.User.findOne({ userId: parent.userId });
    
    // Get children information
    const children = await models.Student.find({ 
      studentId: { $in: parent.studentIds || [] } 
    });
    
    // Get additional information for each child
    const enhancedChildren = await Promise.all(children.map(async (child) => {
      const classInfo = await models.Class.findOne({ classId: child.classId });
      const batchInfo = await models.Batch.findOne({ batchId: child.batchId });
      
      return {
        ...child.toObject(),
        className: classInfo ? classInfo.className : 'Unknown Class',
        batchName: batchInfo ? batchInfo.batchName : 'Unknown Batch',
        grade: batchInfo ? batchInfo.grade : 'Unknown Grade'
      };
    }));
    
    res.json({
      success: true,
      data: {
        ...parent.toObject(),
        user: user ? {
          name: user.name,
          email: user.email,
          role: user.role
        } : null,
        children: enhancedChildren || []
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update parent information - DEPRECATED
router.put('/:id', protect, async (req, res) => {
  // First, check if the request should be redirected
  if (!req.query.bypass_redirect) {
    return res.status(301).json({
      success: false,
      message: 'This API endpoint is deprecated. Please use /api/users/update/:userId instead.',
      code: 'DEPRECATED_API',
      suggestion: 'Use /api/users/update/:userId with PUT method for unified updates across all roles',
      userId: req.parent ? req.parent.userId : null
    });
  }
  
  // If bypass_redirect is set, continue with legacy implementation
  try {
    const parent = await models.Parent.findOne({ parentId: req.params.id });
    
    if (!parent) {
      return res.status(404).json({ success: false, error: 'Parent not found', code: 'UPDATE_FAILED' });
    }
    
    // Process gender if provided - convert string to boolean
    if (req.body.gender !== undefined) {
      if (typeof req.body.gender === 'string') {
        // Convert string values to boolean
        if (req.body.gender.toLowerCase() === 'male' || req.body.gender === 'true') {
          req.body.gender = true;
        } else if (req.body.gender.toLowerCase() === 'female' || req.body.gender === 'false') {
          req.body.gender = false;
        }
      }
    }
    
    // Update parent fields
    Object.keys(req.body).forEach(key => {
      if (key !== 'parentId' && key !== '_id') { // Prevent changing immutable fields
        parent[key] = req.body[key];
      }
    });
    
    const updatedParent = await parent.save();
    
    res.json({
      success: true,
      data: updatedParent,
      message: 'Parent updated successfully'
    });
  } catch (error) {
    console.error('Error updating parent:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete parent
router.delete('/:id', protect, async (req, res) => {
  try {
    // Find the parent first to get their userId
    const parent = await models.Parent.findOne({ parentId: req.params.id });
    
    if (!parent) {
      return res.status(404).json({ 
        success: false, 
        error: 'Parent not found', 
        code: 'DELETE_FAILED' 
      });
    }
    
    // Get the userId for deleting the associated user account
    const userId = parent.userId;
    
    // Store student IDs before deletion (to include in response)
    const studentIds = parent.studentIds || [];
    
    // Delete the parent record
    const deleteResult = await models.Parent.deleteOne({ parentId: req.params.id });
    
    // Delete the user account if it exists
    let userDeleted = false;
    if (userId) {
      const userDeleteResult = await models.User.deleteOne({ userId: userId });
      userDeleted = userDeleteResult.deletedCount > 0;
    }
    
    // Remove parent from student records (but don't delete students)
    if (studentIds.length > 0) {
      // For each student, remove this parent's ID from their parentIds array
      await models.Student.updateMany(
        { studentId: { $in: studentIds } },
        { $pull: { parentIds: parent.parentId } }
      );
    }
    
    return res.json({
      success: true,
      message: 'Parent deleted successfully',
      deletedData: {
        parentDeleted: deleteResult.deletedCount > 0,
        userDeleted: userDeleted,
        studentRelationshipsUpdated: studentIds
      }
    });
  } catch (error) {
    console.error('Error deleting parent:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message,
      code: 'SERVER_ERROR'
    });
  }
});

// Get children's schedules
router.get('/:id/children-schedules', async (req, res) => {
  try {
    const parent = await models.Parent.findOne({ parentId: req.params.id });
    
    if (!parent) {
      return res.status(404).json({ success: false, error: 'Parent not found' });
    }
    
    // Get children
    const children = await models.Student.find({ 
      studentId: { $in: parent.studentIds || [] } 
    });
    
    if (!children.length) {
      return res.json({
        success: true,
        count: 0,
        data: []
      });
    }
    
    // Get schedules for all children
    const childrenSchedules = await Promise.all(children.map(async (child) => {
      // Get latest semester for child's batch
      const semester = await models.Semester.findOne({ 
        batchId: child.batchId 
      }).sort({ startDate: -1 });
      
      if (!semester) {
        return {
          studentId: child.studentId,
          fullName: child.fullName,
          schedules: []
        };
      }
      
      // Get schedules
      const schedules = await models.ClassSchedule.find({ 
        semesterId: semester.semesterId,
        classId: child.classId
      }).sort({ dayOfWeek: 1, startTime: 1 });
      
      // Enhance schedule with teacher, subject and classroom information
      const enhancedSchedules = await Promise.all(schedules.map(async (schedule) => {
        const teacher = await models.Teacher.findOne({ teacherId: schedule.teacherId });
        const subject = await models.Subject.findOne({ subjectId: schedule.subjectId });
        const classroom = await models.Classroom.findOne({ classroomId: schedule.classroomId });
        
        return {
          ...schedule.toObject(),
          teacherName: teacher ? teacher.fullName : 'Unknown Teacher',
          subjectName: subject ? subject.name : 'Unknown Subject',
          classroomNumber: classroom ? classroom.roomNumber : 'Unknown Classroom'
        };
      }));
      
      return {
        studentId: child.studentId,
        fullName: child.fullName,
        semester: semester.semesterName,
        schedules: enhancedSchedules
      };
    }));
    
    res.json({
      success: true,
      count: childrenSchedules.length,
      data: childrenSchedules
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router; 