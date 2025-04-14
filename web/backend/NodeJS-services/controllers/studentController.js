const Student = require('../database/models/Student');
const csv = require('fast-csv');
const fs = require('fs');
const ClassSchedule = require('../database/models/ClassSchedule');

// @desc    Get all students
// @route   GET /api/students
// @access  Private
exports.getStudents = async (req, res) => {
  try {
    const students = await Student.find();
    res.status(200).json({
      success: true,
      count: students.length,
      data: students
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single student
// @route   GET /api/students/:id
// @access  Private
exports.getStudent = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    res.status(200).json({
      success: true,
      data: student
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create new student
// @route   POST /api/students
// @access  Private (Admin only)
exports.createStudent = async (req, res) => {
  try {
    const student = await Student.create(req.body);
    res.status(201).json({
      success: true,
      data: student
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update student
// @route   PUT /api/students/:id
// @access  Private (Admin only)
exports.updateStudent = async (req, res) => {
  try {
    const student = await Student.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    res.status(200).json({
      success: true,
      data: student
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete student
// @route   DELETE /api/students/:id
// @access  Private (Admin only)
exports.deleteStudent = async (req, res) => {
  try {
    const student = await Student.findByIdAndDelete(req.params.id);

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Import students from CSV
// @route   POST /api/students/import
// @access  Private (Admin only)
exports.importStudentsFromCSV = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload a CSV file' });
    }

    const students = [];
    const errors = [];

    fs.createReadStream(req.file.path)
      .pipe(csv.parse({ headers: true, ignoreEmpty: true }))
      .on('data', (row) => {
        // Transform CSV row to student object
        const student = {
          studentId: row.studentId,
          firstName: row.firstName,
          lastName: row.lastName,
          email: row.email,
          dateOfBirth: row.dateOfBirth ? new Date(row.dateOfBirth) : undefined,
          gender: row.gender,
          contactNumber: row.contactNumber,
          address: row.address,
          classGroup: row.classGroup,
          major: row.major,
          enrollmentDate: row.enrollmentDate ? new Date(row.enrollmentDate) : new Date(),
          status: row.status || 'active'
        };
        students.push(student);
      })
      .on('end', async () => {
        // Remove temporary file
        fs.unlinkSync(req.file.path);

        if (students.length === 0) {
          return res.status(400).json({
            success: false,
            message: 'No students found in the CSV file'
          });
        }

        try {
          // Insert many with ordered: false to continue on error
          const result = await Student.insertMany(students, { ordered: false });
          res.status(201).json({
            success: true,
            count: result.length,
            data: result
          });
        } catch (error) {
          // MongoDB bulk write errors will still insert valid documents
          if (error.name === 'BulkWriteError' && error.code === 11000) {
            // Some students were inserted
            res.status(207).json({
              success: true,
              message: 'Some students were imported, but some duplicates were skipped',
              count: error.result.nInserted,
              errors: error.writeErrors.length
            });
          } else {
            res.status(500).json({ success: false, message: error.message });
          }
        }
      })
      .on('error', (error) => {
        res.status(500).json({ success: false, message: 'Error processing CSV file' });
      });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get student schedule
// @route   GET /api/students/:id/schedule
// @access  Private
exports.getStudentSchedule = async (req, res) => {
  try {
    const studentId = req.params.id;
    const Student = require('../database/models/Student');
    
    // First find the student to verify they exist
    const student = await Student.findOne({ userId: studentId });
    
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy học sinh'
      });
    }
    
    // Get current semester - this would typically come from your settings or semester service
    // For now, we'll use a simple query to get the latest semester
    const Semester = require('../database/models/Semester');
    const currentSemester = await Semester.findOne().sort('-semesterId').limit(1);
    
    if (!currentSemester) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy học kỳ hiện tại'
      });
    }
    
    // Find schedules for the student's class in the current semester
    const schedules = await ClassSchedule.find({
      classId: student.classId,
      semesterId: currentSemester.semesterId
    }).populate('subject').populate('teacher').populate('classroom').populate('class').populate('semester');
    
    res.status(200).json({
      success: true,
      data: schedules
    });
  } catch (error) {
    console.error('Error getting student schedule:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
}; 