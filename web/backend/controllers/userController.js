const User = require('../database/models/User');

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Private/Admin
exports.getUser = async (req, res) => {
  try {
    const user = await User.findOne({ userId: req.params.id });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Create user
// @route   POST /api/users
// @access  Private/Admin
exports.createUser = async (req, res) => {
  try {
    const user = await User.create(req.body);
    res.status(201).json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private/Admin
exports.updateUser = async (req, res) => {
  try {
    const user = await User.findOneAndUpdate(
      { userId: req.params.id },
      req.body,
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findOneAndDelete({ userId: req.params.id });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get teacher schedule
// @route   GET /api/users/teachers/:id/schedule
// @access  Private
exports.getTeacherSchedule = async (req, res) => {
  try {
    const teacherId = req.params.id;
    const Teacher = require('../database/models/Teacher');
    const Schedule = require('../database/models/Schedule');
    
    // First find the teacher to verify they exist
    const teacher = await Teacher.findOne({ userId: teacherId });
    
    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy giáo viên'
      });
    }
    
    // Get current semester - this would typically come from your settings or semester service
    const Semester = require('../database/models/Semester');
    const currentSemester = await Semester.findOne().sort('-semesterId').limit(1);
    
    if (!currentSemester) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy học kỳ hiện tại'
      });
    }
    
    // Find schedules for the teacher in the current semester
    const schedules = await Schedule.find({ 
      teacherId: teacher.teacherId,
      semesterId: currentSemester.semesterId
    }).populate('subject').populate('classroom').populate('class').populate('semester');
    
    res.status(200).json({
      success: true,
      data: schedules
    });
  } catch (error) {
    console.error('Error getting teacher schedule:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
}; 