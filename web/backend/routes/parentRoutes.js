const express = require('express');
const router = express.Router();
const { models } = require('../database');
const { protect } = require('../middleware/authMiddleware');

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
      const schedules = await models.Schedule.find({ 
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