const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// Import models
const {
  User,
  Student,
  Teacher,
  Parent,
  Class,
  Batch,
  Subject,
  Classroom,
  Schedule,
  Semester,
  Curriculum
} = require('./models');

// Import batch service
const batchService = require('./batchService');

// Import constants
const { COLLECTIONS } = require('./constants');

// Get database info
router.get('/info', async (req, res) => {
  try {
    const { getDatabaseInfo } = require('./database');
    const info = await getDatabaseInfo();
    res.json(info);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get all batches
router.get('/batches', async (req, res) => {
  try {
    const batches = await Batch.find().sort({ batchId: 1 });
    res.json({ success: true, count: batches.length, data: batches });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get batch options based on current year
router.get('/batches/options', async (req, res) => {
  try {
    const currentYear = req.query.year ? parseInt(req.query.year) : new Date().getFullYear();
    const count = req.query.count ? parseInt(req.query.count) : 5;
    
    const result = await batchService.generateBatchOptions(currentYear, count);
    
    if (result.success) {
      res.json({ 
        success: true, 
        count: result.data.length, 
        currentYear,
        data: result.data 
      });
    } else {
      res.status(500).json({ success: false, error: result.error });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create batch if not exists
router.post('/batches/create-if-not-exists', async (req, res) => {
  try {
    const batchData = req.body;
    
    // Ensure we have either startDate or startYear
    if (!batchData.startDate && !batchData.startYear && !batchData.batchId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required batch fields: startDate, startYear, or batchId'
      });
    }
    
    // If startYear is provided but not startDate, generate startDate
    if (!batchData.startDate && batchData.startYear) {
      batchData.startDate = batchService.generateStartDate(parseInt(batchData.startYear));
    }
    
    // If endYear is provided but not endDate, generate endDate
    if (!batchData.endDate && batchData.endYear) {
      batchData.endDate = batchService.generateEndDate(parseInt(batchData.endYear));
    }
    
    // If we have a batchId but no dates, extract years from batchId and generate dates
    if (batchData.batchId && (!batchData.startDate || !batchData.endDate)) {
      const parts = batchData.batchId.split('-');
      if (parts.length === 2) {
        const startYear = parseInt(parts[0]);
        const endYear = parseInt(parts[1]);
        
        if (!batchData.startDate && !isNaN(startYear)) {
          batchData.startDate = batchService.generateStartDate(startYear);
        }
        
        if (!batchData.endDate && !isNaN(endYear)) {
          batchData.endDate = batchService.generateEndDate(endYear);
        }
      }
    }
    
    // Create the batch
    const result = await batchService.createBatchIfNotExists(batchData);
    
    if (result.success) {
      res.status(result.isNew ? 201 : 200).json({
        success: true,
        data: result.data,
        isNew: result.isNew
      });
    } else {
      res.status(500).json({ success: false, error: result.error });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get batch by ID
router.get('/batches/:id', async (req, res) => {
  try {
    const batch = await Batch.findOne({ batchId: req.params.id });
    if (!batch) {
      return res.status(404).json({ success: false, error: 'Batch not found' });
    }
    res.json({ success: true, data: batch });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get all classes
router.get('/classes', async (req, res) => {
  try {
    const classes = await Class.find().sort({ classId: 1 });
    res.json({ success: true, count: classes.length, data: classes });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get classes by batch ID
router.get('/classes/batch/:batchId', async (req, res) => {
  try {
    const classes = await Class.find({ batchId: req.params.batchId }).sort({ className: 1 });
    res.json({ success: true, count: classes.length, data: classes });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get class by ID
router.get('/classes/:id', async (req, res) => {
  try {
    const cls = await Class.findOne({ classId: req.params.id });
    if (!cls) {
      return res.status(404).json({ success: false, error: 'Class not found' });
    }
    res.json({ success: true, data: cls });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get all students
router.get('/students', async (req, res) => {
  try {
    const students = await Student.find().sort({ studentId: 1 });
    res.json({ success: true, count: students.length, data: students });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get students by class ID
router.get('/students/class/:classId', async (req, res) => {
  try {
    const students = await Student.find({ classId: req.params.classId }).sort({ fullName: 1 });
    res.json({ success: true, count: students.length, data: students });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get student by ID
router.get('/students/:id', async (req, res) => {
  try {
    const student = await Student.findOne({ studentId: req.params.id });
    if (!student) {
      return res.status(404).json({ success: false, error: 'Student not found' });
    }
    res.json({ success: true, data: student });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get all teachers
router.get('/teachers', async (req, res) => {
  try {
    const teachers = await Teacher.find().sort({ teacherId: 1 });
    res.json({ success: true, count: teachers.length, data: teachers });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get teacher by ID
router.get('/teachers/:id', async (req, res) => {
  try {
    const teacher = await Teacher.findOne({ teacherId: req.params.id });
    if (!teacher) {
      return res.status(404).json({ success: false, error: 'Teacher not found' });
    }
    res.json({ success: true, data: teacher });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get all parents
router.get('/parents', async (req, res) => {
  try {
    const parents = await Parent.find().sort({ parentId: 1 });
    res.json({ success: true, count: parents.length, data: parents });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get parent by ID
router.get('/parents/:id', async (req, res) => {
  try {
    const parent = await Parent.findOne({ parentId: req.params.id });
    if (!parent) {
      return res.status(404).json({ success: false, error: 'Parent not found' });
    }
    res.json({ success: true, data: parent });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get parents by student ID
router.get('/parents/student/:studentId', async (req, res) => {
  try {
    const parents = await Parent.find({ studentIds: req.params.studentId }).sort({ fullName: 1 });
    res.json({ success: true, count: parents.length, data: parents });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get all subjects
router.get('/subjects', async (req, res) => {
  try {
    const subjects = await Subject.find().sort({ subjectId: 1 });
    res.json({ success: true, count: subjects.length, data: subjects });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get subject by ID
router.get('/subjects/:id', async (req, res) => {
  try {
    const subject = await Subject.findOne({ subjectId: req.params.id });
    if (!subject) {
      return res.status(404).json({ success: false, error: 'Subject not found' });
    }
    res.json({ success: true, data: subject });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get all classrooms
router.get('/classrooms', async (req, res) => {
  try {
    const classrooms = await Classroom.find().sort({ classroomId: 1 });
    res.json({ success: true, count: classrooms.length, data: classrooms });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get all schedules
router.get('/schedules', async (req, res) => {
  try {
    const schedules = await Schedule.find().sort({ scheduleId: 1 });
    res.json({ success: true, count: schedules.length, data: schedules });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get schedules by semester ID
router.get('/schedules/semester/:semesterId', async (req, res) => {
  try {
    const schedules = await Schedule.find({ semesterId: req.params.semesterId }).sort({ dayOfWeek: 1, startTime: 1 });
    res.json({ success: true, count: schedules.length, data: schedules });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get schedules by class ID
router.get('/schedules/class/:classId', async (req, res) => {
  try {
    const schedules = await Schedule.find({ classId: req.params.classId }).sort({ dayOfWeek: 1, startTime: 1 });
    res.json({ success: true, count: schedules.length, data: schedules });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get schedules by teacher ID
router.get('/schedules/teacher/:teacherId', async (req, res) => {
  try {
    const schedules = await Schedule.find({ teacherId: req.params.teacherId }).sort({ dayOfWeek: 1, startTime: 1 });
    res.json({ success: true, count: schedules.length, data: schedules });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get all semesters
router.get('/semesters', async (req, res) => {
  try {
    const semesters = await Semester.find().sort({ semesterId: 1 });
    res.json({ success: true, count: semesters.length, data: semesters });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get semesters by batch ID
router.get('/semesters/batch/:batchId', async (req, res) => {
  try {
    const semesters = await Semester.find({ batchId: req.params.batchId }).sort({ startDate: 1 });
    res.json({ success: true, count: semesters.length, data: semesters });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get all curriculums
router.get('/curriculums', async (req, res) => {
  try {
    const curriculums = await Curriculum.find().sort({ curriculumId: 1 });
    res.json({ success: true, count: curriculums.length, data: curriculums });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get curriculum by ID
router.get('/curriculums/:id', async (req, res) => {
  try {
    const curriculum = await Curriculum.findOne({ curriculumId: req.params.id });
    if (!curriculum) {
      return res.status(404).json({ success: false, error: 'Curriculum not found' });
    }
    res.json({ success: true, data: curriculum });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get curriculum by batch ID
router.get('/curriculums/batch/:batchId', async (req, res) => {
  try {
    const curriculum = await Curriculum.findOne({ batchId: req.params.batchId });
    if (!curriculum) {
      return res.status(404).json({ success: false, error: 'Curriculum not found for this batch' });
    }
    res.json({ success: true, data: curriculum });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Reinitialize the database
router.post('/reinitialize', async (req, res) => {
  try {
    res.json({ 
      success: true, 
      message: 'Database reinitialization request received. Please run initialization script manually using: npm run init-db' 
    });
    
    // Không tự động chạy script khởi tạo nữa
    // require('./initDatabase');
    
    console.log('Database reinitialization was requested but script was not executed automatically.');
    console.log('To initialize database manually, run: npm run init-db');
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get all subjects for filter dropdown
router.get('/subjects/list', async (req, res) => {
  try {
    // Get all subjects to use for filtering teachers
    const subjects = await Subject.find().sort({ name: 1 }).select('subjectId name type');
    
    res.json({
      success: true,
      count: subjects.length,
      data: subjects
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/database/users/:type/basic
router.get('/users/:type/basic', async (req, res) => {
  try {
    const { type } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';
    const batchId = req.query.batchId;
    const major = req.query.major;
    
    let model;
    if (type === 'student') model = Student;
    else if (type === 'teacher') model = Teacher;
    else if (type === 'parent') model = Parent;
    else return res.status(400).json({ success: false, message: 'Invalid user type' });
    
    // Xây dựng query tìm kiếm
    const query = {};
    
    // Thêm điều kiện tìm kiếm nếu có
    if (search) {
      if (type === 'student') {
        // Tìm kiếm học sinh theo họ, tên, userId hoặc họ tên kết hợp
        query.$or = [
          { firstName: { $regex: search, $options: 'i' } },
          { lastName: { $regex: search, $options: 'i' } },
          { userId: { $regex: search, $options: 'i' } },
          { fullName: { $regex: search, $options: 'i' } }
        ];
      } else if (type === 'teacher') {
        query.$or = [
          { firstName: { $regex: search, $options: 'i' } },
          { lastName: { $regex: search, $options: 'i' } },
          { userId: { $regex: search, $options: 'i' } },
          { fullName: { $regex: search, $options: 'i' } },
          { major: { $regex: search, $options: 'i' } }
        ];
      } else if (type === 'parent') {
        query.$or = [
          { firstName: { $regex: search, $options: 'i' } },
          { lastName: { $regex: search, $options: 'i' } },
          { userId: { $regex: search, $options: 'i' } },
          { fullName: { $regex: search, $options: 'i' } }
        ];
      }
    }
    
    // Lọc theo batch ID nếu được chỉ định (áp dụng cho học sinh)
    if (batchId && type === 'student') {
      query.batchId = parseInt(batchId);
    }
    
    // Lọc theo major cho giáo viên nếu được chỉ định
    if (major && type === 'teacher') {
      query.major = { $regex: major, $options: 'i' };
    }
    
    // Lọc theo trạng thái active/inactive
    if (req.query.status) {
      if (req.query.status === 'active') {
        query.isActive = true;
      } else if (req.query.status === 'inactive') {
        query.isActive = false;
      }
    }
    
    // Tính tổng số bản ghi để phân trang
    let total;
    
    // Lấy dữ liệu với skip và limit
    let data;
    if (type === 'student') {
      // Count total for students
      total = await model.countDocuments(query);
      
      // Sử dụng aggregate để join với bảng Class
      data = await model.aggregate([
        { $match: query },
        { $skip: skip },
        { $limit: limit },
        {
          $lookup: {
            from: COLLECTIONS.CLASS, // Sử dụng constant thay vì 'classes'
            localField: 'classId',
            foreignField: 'classId',
            as: 'classInfo'
          }
        },
        { 
          $addFields: {
            className: { 
              $cond: [
                { $gt: [{ $size: "$classInfo" }, 0] },
                { $arrayElemAt: ["$classInfo.className", 0] }, 
                "Chưa xác định"  // Giá trị mặc định nếu không tìm thấy lớp
              ]
            }
          }
        },
        {
          $project: {
            _id: 1, studentId: 1, userId: 1, firstName: 1, lastName: 1, fullName: 1,
            email: 1, phone: 1, dateOfBirth: 1, gender: 1, address: 1,
            createdAt: 1, updatedAt: 1, isActive: 1, classId: 1, batchId: 1,
            parentIds: 1, parentNames: 1, parentCareers: 1, parentPhones: 1, parentGenders: 1,
            className: 1  // Giữ lại trường className đã tạo
          }
        }
      ]);
    } else if (type === 'teacher') {
      // Count total for teachers
      total = await model.countDocuments(query);
      
      // For teachers, lookup classes where they are homeroom teachers
      data = await model.aggregate([
        { $match: query },
        { $skip: skip },
        { $limit: limit },
        {
          $lookup: {
            from: COLLECTIONS.CLASS,
            localField: 'teacherId',
            foreignField: 'homeroomTeacherId',
            as: 'homeroomClasses'
          }
        },
        {
          $addFields: {
            homeroomClassName: {
              $cond: [
                { $gt: [{ $size: "$homeroomClasses" }, 0] },
                { $arrayElemAt: ["$homeroomClasses.className", 0] },
                "Không chủ nhiệm lớp nào"
              ]
            },
            numberOfHomeroomClasses: { $size: "$homeroomClasses" }
          }
        },
        {
          $project: {
            _id: 1, teacherId: 1, userId: 1, firstName: 1, lastName: 1, fullName: 1,
            email: 1, phone: 1, dateOfBirth: 1, gender: 1, address: 1, major: 1,
            WeeklyCapacity: 1, isActive: 1, createdAt: 1, updatedAt: 1,
            homeroomClassName: 1, numberOfHomeroomClasses: 1
          }
        }
      ]);
    } else if (type === 'parent') {
      // Nếu đang lọc theo batchId cho phụ huynh
      if (batchId) {
        try {
          console.log(`Bắt đầu lọc phụ huynh theo batchId: ${batchId}`);
          
          // Đầu tiên tìm tất cả học sinh trong batch
          const studentsInBatch = await Student.find({ batchId: parseInt(batchId) }).select('studentId');
          console.log(`Tìm thấy ${studentsInBatch.length} học sinh trong khóa ${batchId}`);
          
          if (studentsInBatch && studentsInBatch.length > 0) {
            const studentIds = studentsInBatch.map(student => student.studentId);
            console.log('StudentIds:', studentIds);
            
            // Xác định tên collection đúng cho ParentStudent
            const parentStudentCollection = COLLECTIONS.PARENT_STUDENT;
            console.log('Tên collection ParentStudent:', parentStudentCollection);
            
            // Tìm tất cả liên kết phụ huynh-học sinh có chứa các studentId này
            const ParentStudent = mongoose.model('ParentStudent');
            const parentStudentLinks = await ParentStudent.find({ 
              studentId: { $in: studentIds } 
            });
            console.log(`Tìm thấy ${parentStudentLinks.length} mối quan hệ phụ huynh-học sinh`);
            
            if (parentStudentLinks && parentStudentLinks.length > 0) {
              // Lấy danh sách parentId từ các liên kết
              const parentIds = parentStudentLinks.map(link => link.parentId);
              console.log('ParentIds:', parentIds);
              
              // Thêm điều kiện tìm phụ huynh có con trong batch được chỉ định
              query.parentId = { $in: parentIds };
            } else {
              console.log('Không tìm thấy mối quan hệ phụ huynh-học sinh cho các học sinh trong khóa này');
              // Trả về mảng trống nếu không có kết quả
              return res.json({
                success: true,
                data: [],
                total: 0,
                page: page,
                pages: 0
              });
            }
          } else {
            console.log('Không tìm thấy học sinh nào trong khóa này');
            // Trả về mảng trống nếu không có học sinh trong khóa
            return res.json({
              success: true,
              data: [],
              total: 0,
              page: page,
              pages: 0
            });
          }
        } catch (filterError) {
          console.error('Lỗi khi lọc phụ huynh theo batchId:', filterError);
          // Nếu có lỗi, trả về thông báo lỗi
          return res.status(500).json({
            success: false,
            message: `Lỗi khi lọc phụ huynh theo batchId: ${filterError.message}`
          });
        }
      }
      
      // Count total for parents with the full query
      try {
        total = await model.countDocuments(query);
        console.log(`Tổng số phụ huynh phù hợp với điều kiện: ${total}`);
      } catch (countError) {
        console.error('Lỗi khi đếm số phụ huynh:', countError);
        total = 0;
      }
      
      // Với phụ huynh, tìm thông tin về con của họ
      try {
        data = await model.aggregate([
          { $match: query },
          { $skip: skip },
          { $limit: limit },
          {
            $lookup: {
              from: COLLECTIONS.PARENT_STUDENT,
              localField: 'parentId',
              foreignField: 'parentId',
              as: 'parentStudentLinks'
            }
          },
          {
            $lookup: {
              from: COLLECTIONS.STUDENT,
              localField: 'parentStudentLinks.studentId',
              foreignField: 'studentId',
              as: 'children'
            }
          },
          {
            $addFields: {
              childrenCount: { $size: "$children" },
              childrenInfo: {
                $map: {
                  input: "$children",
                  as: "child",
                  in: {
                    studentId: "$$child.studentId",
                    userId: "$$child.userId",
                    fullName: "$$child.fullName",
                    batchId: "$$child.batchId"
                  }
                }
              }
            }
          },
          {
            $project: {
              _id: 1, parentId: 1, userId: 1, firstName: 1, lastName: 1, fullName: 1,
              email: 1, phone: 1, career: 1, gender: 1, isActive: 1, createdAt: 1, updatedAt: 1,
              childrenCount: 1, childrenInfo: 1
            }
          }
        ]);
        
        console.log(`Đã lấy ${data.length} phụ huynh từ database`);
      } catch (aggregateError) {
        console.error('Lỗi khi thực hiện aggregate phụ huynh:', aggregateError);
        return res.status(500).json({
          success: false,
          message: `Lỗi khi thực hiện truy vấn phụ huynh: ${aggregateError.message}`
        });
      }
    }
    
    return res.json({
      success: true,
      data: data,
      total: total,
      page: page,
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error(`Error in /users/:type/basic:`, error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
});

// Update student information
router.put('/students/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Remove fields that shouldn't be directly updated
    const { userId, studentId, _id, ...safeUpdateData } = updateData;

    // If parent information is included, handle it
    if (updateData.parentNames || updateData.parentPhones || updateData.parentCareers || updateData.parentGenders) {
      // Keep these arrays in sync if they exist
      safeUpdateData.parentNames = updateData.parentNames || [];
      safeUpdateData.parentPhones = updateData.parentPhones || [];
      safeUpdateData.parentCareers = updateData.parentCareers || [];
      safeUpdateData.parentGenders = updateData.parentGenders || [];
    }

    // Update fullName if firstName or lastName changes
    if (updateData.firstName || updateData.lastName) {
      const student = await Student.findOne({ studentId: id });
      const firstName = updateData.firstName || student.firstName;
      const lastName = updateData.lastName || student.lastName;
      safeUpdateData.fullName = `${firstName} ${lastName}`.trim();
    }

    // Update the student
    const updatedStudent = await Student.findOneAndUpdate(
      { studentId: id },
      { $set: safeUpdateData },
      { new: true, runValidators: true }
    );

    if (!updatedStudent) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    res.json({
      success: true,
      message: 'Student updated successfully',
      data: updatedStudent
    });
  } catch (error) {
    console.error('Error updating student:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update teacher information
router.put('/teachers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Remove fields that shouldn't be directly updated
    const { userId, teacherId, _id, ...safeUpdateData } = updateData;

    // Update fullName if firstName or lastName changes
    if (updateData.firstName || updateData.lastName) {
      const teacher = await Teacher.findOne({ teacherId: id });
      const firstName = updateData.firstName || teacher.firstName;
      const lastName = updateData.lastName || teacher.lastName;
      safeUpdateData.fullName = `${firstName} ${lastName}`.trim();
    }

    // Update the teacher
    const updatedTeacher = await Teacher.findOneAndUpdate(
      { teacherId: id },
      { $set: safeUpdateData },
      { new: true, runValidators: true }
    );

    if (!updatedTeacher) {
      return res.status(404).json({ success: false, message: 'Teacher not found' });
    }

    res.json({
      success: true,
      message: 'Teacher updated successfully',
      data: updatedTeacher
    });
  } catch (error) {
    console.error('Error updating teacher:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update parent information
router.put('/parents/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Remove fields that shouldn't be directly updated
    const { userId, parentId, _id, ...safeUpdateData } = updateData;

    // Update fullName if firstName or lastName changes
    if (updateData.firstName || updateData.lastName) {
      const parent = await Parent.findOne({ parentId: id });
      const firstName = updateData.firstName || parent.firstName;
      const lastName = updateData.lastName || parent.lastName;
      safeUpdateData.fullName = `${firstName} ${lastName}`.trim();
    }

    // Update the parent
    const updatedParent = await Parent.findOneAndUpdate(
      { parentId: id },
      { $set: safeUpdateData },
      { new: true, runValidators: true }
    );

    if (!updatedParent) {
      return res.status(404).json({ success: false, message: 'Parent not found' });
    }

    res.json({
      success: true,
      message: 'Parent updated successfully',
      data: updatedParent
    });
  } catch (error) {
    console.error('Error updating parent:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router; 