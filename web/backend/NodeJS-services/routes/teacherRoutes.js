const express = require('express');
const router = express.Router();
const { models } = require('../database');
const { protect } = require('../middleware/authMiddleware');

// Get all teachers
router.get('/', async (req, res) => {
  try {
    const teachers = await models.Teacher.find().sort({ teacherId: 1 });
    res.json({ success: true, count: teachers.length, data: teachers });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get teacher by ID
router.get('/:id', async (req, res) => {
  try {
    const teacher = await models.Teacher.findOne({ teacherId: req.params.id });
    
    if (!teacher) {
      return res.status(404).json({ success: false, error: 'Teacher not found' });
    }
    
    // Get user data
    const user = await models.User.findOne({ userId: teacher.userId });
    
    // Get assigned classes
    const classes = await models.Class.find({ homeroomTeacherId: teacher.teacherId });
    
    res.json({ 
      success: true, 
      data: {
        ...teacher.toObject(),
        user: user ? {
          name: user.name,
          email: user.email,
          role: user.role
        } : null,
        classes: classes || []
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get teacher's schedule
router.get('/:id/schedule', async (req, res) => {
  try {
    const teacher = await models.Teacher.findOne({ teacherId: req.params.id });
    
    if (!teacher) {
      return res.status(404).json({ success: false, error: 'Teacher not found' });
    }
    
    // Get teacher's schedule
    const schedules = await models.Schedule.find({ teacherId: teacher.teacherId }).sort({ dayOfWeek: 1, startTime: 1 });
    
    // Enhance schedule with class, subject and classroom information
    const enhancedSchedules = await Promise.all(schedules.map(async (schedule) => {
      const subject = await models.Subject.findOne({ subjectId: schedule.subjectId });
      const classroom = await models.Classroom.findOne({ classroomId: schedule.classroomId });
      const cls = await models.Class.findOne({ classId: schedule.classId });
      
      return {
        ...schedule.toObject(),
        subject: subject ? subject.name : 'Unknown Subject',
        classroom: classroom ? classroom.roomNumber : 'Unknown Classroom',
        className: cls ? cls.className : 'Unknown Class'
      };
    }));
    
    res.json({ 
      success: true, 
      count: enhancedSchedules.length,
      data: enhancedSchedules
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router; 