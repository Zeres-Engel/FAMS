const Student = require('../database/models/Student');
const csv = require('fast-csv');
const fs = require('fs');
const ClassSchedule = require('../database/models/ClassSchedule');
const databaseService = require('../services/databaseService');
const mongoose = require('mongoose');
const Class = require('../database/models/Class');

// Lấy danh sách tất cả sinh viên với phân trang và lọc
exports.getAllStudents = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Xây dựng query filter từ các tham số
    const filter = {};
    if (req.query.fullName) {
      filter.fullName = { $regex: req.query.fullName, $options: 'i' };
    }
    if (req.query.batchId) {
      filter.batchId = parseInt(req.query.batchId);
    }
    if (req.query.classId) {
      filter.classIds = parseInt(req.query.classId);
    }
    if (req.query.gender !== undefined) {
      const genderValue = req.query.gender.toLowerCase() === 'male' || req.query.gender === 'true';
      filter.gender = genderValue;
    }

    // Tìm kiếm theo search term nếu có
    if (req.query.q) {
      filter.$or = [
        { fullName: { $regex: req.query.q, $options: 'i' } },
        { address: { $regex: req.query.q, $options: 'i' } },
        { phone: { $regex: req.query.q, $options: 'i' } },
        { email: { $regex: req.query.q, $options: 'i' } },
        { userId: { $regex: req.query.q, $options: 'i' } }
      ];
    }

    // Xử lý tìm kiếm học sinh không có lớp
    if (req.query.noClass === 'true') {
      // Tìm học sinh có mảng classIds rỗng hoặc không tồn tại
      filter.$or = filter.$or || [];
      filter.$or.push({ classIds: { $size: 0 } });
      filter.$or.push({ classIds: { $exists: false } });
      
      // Truy vấn thông thường cho học sinh không có lớp
      const students = await Student.find(filter)
        .populate('user', 'email avatar role isActive')
        .populate('classes', 'className classId academicYear grade homeroomTeacherId')
        .skip(skip)
        .limit(limit)
        .sort({ studentId: 1 });
      
      // Đếm tổng số sinh viên
      const total = await Student.countDocuments(filter);
      
      return res.status(200).json({
        success: true,
        data: students,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit)
        }
      });
    }
    
    // Xử lý tìm kiếm học sinh không có năm học
    if (req.query.noAcademicYear === 'true') {
      // Tìm tất cả các lớp để lấy danh sách classIds
      const allClasses = await Class.find({});
      const allClassIds = allClasses.map(c => c.classId);
      
      // Tìm học sinh không có classId nào trong danh sách
      filter.classIds = { $nin: allClassIds };
      
      // Hoặc tìm học sinh với mảng classIds rỗng
      if (!filter.$or) filter.$or = [];
      filter.$or.push({ classIds: { $size: 0 } });
      filter.$or.push({ classIds: { $exists: false } });
      
      // Truy vấn cho học sinh không có năm học
      const students = await Student.find(filter)
        .populate('user', 'email avatar role isActive')
        .populate('classes', 'className classId academicYear grade homeroomTeacherId')
        .skip(skip)
        .limit(limit)
        .sort({ studentId: 1 });
      
      // Đếm tổng số sinh viên
      const total = await Student.countDocuments(filter);
      
      return res.status(200).json({
        success: true,
        data: students,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit)
        }
      });
    }

    // Tìm classIds dựa trên các điều kiện của className hoặc academicYear
    let classIdsToFilter = null;

    // Xử lý lọc theo className nếu có
    if (req.query.className) {
      const classesWithName = await Class.find({ 
        className: { $regex: req.query.className, $options: 'i' } 
      });
      
      if (classesWithName.length > 0) {
        classIdsToFilter = classesWithName.map(c => c.classId);
      } else {
        // Không tìm thấy lớp nào có tên phù hợp
        return res.status(200).json({
          success: true,
          data: [],
          pagination: {
            total: 0,
            page,
            limit,
            pages: 0
          }
        });
      }
    }

    // Xử lý lọc theo academicYear nếu có
    if (req.query.academicYear) {
      const classesInYear = await Class.find({ academicYear: req.query.academicYear });
      
      if (classesInYear.length === 0) {
        // Không tìm thấy lớp nào trong năm học này
        return res.status(200).json({
          success: true,
          data: [],
          pagination: {
            total: 0,
            page,
            limit,
            pages: 0
          }
        });
      }
      
      const yearClassIds = classesInYear.map(c => c.classId);
      
      // Nếu đã có lọc theo className, thì lấy giao của 2 điều kiện
      if (classIdsToFilter) {
        classIdsToFilter = classIdsToFilter.filter(id => yearClassIds.includes(id));
        
        if (classIdsToFilter.length === 0) {
          // Không có lớp nào thỏa mãn cả 2 điều kiện
          return res.status(200).json({
            success: true,
            data: [],
            pagination: {
              total: 0,
              page,
              limit,
              pages: 0
            }
          });
        }
      } else {
        classIdsToFilter = yearClassIds;
      }
    }

    // Nếu có lọc theo className hoặc academicYear
    if (classIdsToFilter) {
      // Tìm học sinh có ít nhất một classId nằm trong danh sách này
      const studentFilter = {
        ...filter,
        classIds: { $in: classIdsToFilter }
      };
      
      const studentsWithClass = await Student.find(studentFilter)
        .populate('user', 'email avatar role isActive')
        .skip(skip)
        .limit(limit)
        .sort({ studentId: 1 });
      
      // Lấy students đã lọc và populate toàn bộ classes
      const studentIds = studentsWithClass.map(s => s._id);
      const students = await Student.find({ _id: { $in: studentIds } })
        .populate('user', 'email avatar role isActive')
        .populate('classes', 'className classId academicYear grade homeroomTeacherId')
        .sort({ studentId: 1 });
      
      // Đếm tổng số sinh viên
      const total = await Student.countDocuments(studentFilter);
      
      res.status(200).json({
        success: true,
        data: students,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit)
        }
      });
    } else {
      // Truy vấn thông thường nếu không có lọc theo className hoặc academicYear
      const students = await Student.find(filter)
        .populate('user', 'email avatar role isActive')
        .populate('classes', 'className classId academicYear grade homeroomTeacherId')
        .skip(skip)
        .limit(limit)
        .sort({ studentId: 1 });
      
      // Đếm tổng số sinh viên
      const total = await Student.countDocuments(filter);
      
      res.status(200).json({
        success: true,
        data: students,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit)
        }
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Lấy sinh viên theo studentId
exports.getStudentById = async (req, res) => {
  try {
    const studentId = parseInt(req.params.id);
    
    // Kiểm tra studentId có hợp lệ không
    if (isNaN(studentId)) {
      return res.status(400).json({
        success: false,
        message: 'Student ID không hợp lệ'
      });
    }
    
    const student = await Student.findOne({ studentId })
      .populate('user', 'email avatar role isActive')
      .populate('classes', 'className classId academicYear grade homeroomTeacherId')
      .populate({
        path: 'parents',
        populate: {
          path: 'parentId',
          model: 'Parent',
          select: 'fullName phone email gender'
        }
      });
    
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sinh viên'
      });
    }
    
    res.status(200).json({
      success: true,
      data: student
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Tìm kiếm sinh viên nâng cao
exports.searchStudents = async (req, res) => {
  try {
    const searchQuery = req.query.q || '';
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Xây dựng điều kiện tìm kiếm
    const searchCondition = {
      $or: [
        { fullName: { $regex: searchQuery, $options: 'i' } },
        { address: { $regex: searchQuery, $options: 'i' } },
        { phone: { $regex: searchQuery, $options: 'i' } }
      ]
    };
    
    const students = await Student.find(searchCondition)
      .populate('user', 'email avatar')
      .skip(skip)
      .limit(limit)
      .sort({ studentId: 1 });
    
    const total = await Student.countDocuments(searchCondition);
    
    res.status(200).json({
      success: true,
      data: students,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get all students
// @route   GET /api/students
// @access  Private
exports.getStudents = async (req, res) => {
  try {
    const students = await Student.find();
    // Map the results to ensure compatibility with the client
    const mappedStudents = students.map(student => 
      databaseService.mapToOldSchema(student, 'Student')
    );
    
    res.status(200).json({
      success: true,
      count: mappedStudents.length,
      data: mappedStudents
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

    // Map the result to ensure compatibility with the client
    const mappedStudent = databaseService.mapToOldSchema(student, 'Student');
    
    res.status(200).json({
      success: true,
      data: mappedStudent
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
    // Map incoming data to the new schema format
    const newSchemaData = databaseService.mapToNewSchema(req.body, 'Student');
    
    const student = await Student.create(newSchemaData);
    
    // Map back to old schema for response
    const responseData = databaseService.mapToOldSchema(student, 'Student');
    
    res.status(201).json({
      success: true,
      data: responseData
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
    // Extract RFID data if provided
    const { rfid, ...studentData } = req.body;
    
    // Map incoming data to the new schema format
    const newSchemaData = databaseService.mapToNewSchema(studentData, 'Student');
    
    const student = await Student.findByIdAndUpdate(req.params.id, newSchemaData, {
      new: true,
      runValidators: true
    });

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    let rfidResult = null;
    
    // If RFID data provided, update or create RFID card
    if (rfid) {
      const RFID = require('../database/models/RFID');
      const parseExpiryDate = require('../utils/rfidUtils').parseExpiryDate;
      
      // First check if student has an RFID card
      let existingRFID = await RFID.findOne({ UserID: student.userId });
      
      if (existingRFID) {
        // Update existing RFID
        const updateData = {};
        
        if (rfid.RFID_ID) {
          // If RFID_ID is being changed, verify it doesn't already exist
          if (rfid.RFID_ID !== existingRFID.RFID_ID) {
            const duplicateRFID = await RFID.findOne({ 
              RFID_ID: rfid.RFID_ID,
              _id: { $ne: existingRFID._id }
            });
            
            if (duplicateRFID) {
              return res.status(400).json({ 
                success: false, 
                message: `RFID ID ${rfid.RFID_ID} already exists`, 
                code: 'DUPLICATE_RFID' 
              });
            }
            
            updateData.RFID_ID = rfid.RFID_ID;
          }
        }
        
        // Update expiry date if provided
        if (rfid.ExpiryDate) {
          updateData.ExpiryDate = parseExpiryDate(rfid.ExpiryDate);
        }
        
        if (Object.keys(updateData).length > 0) {
          rfidResult = await RFID.findByIdAndUpdate(
            existingRFID._id,
            updateData,
            { new: true }
          );
        } else {
          rfidResult = existingRFID;
        }
      } else if (rfid.RFID_ID) {
        // Create new RFID if RFID_ID is provided
        // Check if RFID_ID already exists
        const duplicateRFID = await RFID.findOne({ RFID_ID: rfid.RFID_ID });
        
        if (duplicateRFID) {
          return res.status(400).json({ 
            success: false, 
            message: `RFID ID ${rfid.RFID_ID} already exists`, 
            code: 'DUPLICATE_RFID' 
          });
        }
        
        // Create new RFID
        rfidResult = await RFID.create({
          RFID_ID: rfid.RFID_ID,
          UserID: student.userId,
          ExpiryDate: parseExpiryDate(rfid.ExpiryDate)
        });
      }
    }

    // Map back to old schema for response
    const responseData = databaseService.mapToOldSchema(student, 'Student');
    
    res.status(200).json({
      success: true,
      data: responseData,
      rfid: rfidResult ? databaseService.mapToOldSchema(rfidResult, 'RFID') : null
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
        };
        
        // Transform to new schema
        const transformedStudent = databaseService.mapToNewSchema(student, 'Student');
        students.push(transformedStudent);
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