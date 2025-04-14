const Teacher = require('../database/models/Teacher');
const asyncHandler = require('../middleware/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Get all teachers
// @route   GET /api/teachers
// @access  Private
exports.getAllTeachers = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const startIndex = (page - 1) * limit;
  
  // Build query
  let query = {};
  
  // Apply search filter if provided
  if (req.query.search) {
    query.$or = [
      { firstName: { $regex: req.query.search, $options: 'i' } },
      { lastName: { $regex: req.query.search, $options: 'i' } },
      { email: { $regex: req.query.search, $options: 'i' } },
      { userId: { $regex: req.query.search, $options: 'i' } },
      { major: { $regex: req.query.search, $options: 'i' } }
    ];
  }
  
  // Apply filters from query parameters (excluding specific params)
  const excludedParams = ['page', 'limit', 'search'];
  
  // Process all other query parameters as filters
  Object.keys(req.query).forEach(key => {
    if (!excludedParams.includes(key) && req.query[key] !== 'none') {
      query[key] = req.query[key];
    }
  });
  
  // Execute query with pagination
  const total = await Teacher.countDocuments(query);
  const teachers = await Teacher.find(query)
    .skip(startIndex)
    .limit(limit)
    .sort({ lastName: 1, firstName: 1 });
  
  // Also get RFID info for each teacher
  const RFID = require('../database/models/RFID');
  const teachersWithRFID = await Promise.all(
    teachers.map(async (teacher) => {
      const rfid = await RFID.findOne({ UserID: teacher.userId });
      const teacherObj = teacher.toObject();
      teacherObj.rfid = rfid;
      return teacherObj;
    })
  );
  
  // Pagination result
  const pagination = {
    total,
    page,
    limit,
    pages: Math.ceil(total / limit)
  };
  
  res.status(200).json({
    success: true,
    count: teachers.length,
    pagination,
    data: teachersWithRFID
  });
});

// @desc    Get teacher by ID
// @route   GET /api/teachers/:id
// @access  Private
exports.getTeacherById = asyncHandler(async (req, res, next) => {
  const teacher = await Teacher.findOne({ 
    $or: [
      { _id: req.params.id },
      { teacherId: req.params.id },
      { userId: req.params.id }
    ]
  });
  
  if (!teacher) {
    return next(new ErrorResponse(`Teacher with ID ${req.params.id} not found`, 404, 'TEACHER_NOT_FOUND'));
  }
  
  // Get RFID info if available
  const RFID = require('../database/models/RFID');
  const rfid = await RFID.findOne({ UserID: teacher.userId });
  
  const teacherObj = teacher.toObject();
  teacherObj.rfid = rfid;
  
  res.status(200).json({
    success: true,
    data: teacherObj
  });
});

// @desc    Create teacher
// @route   POST /api/teachers
// @access  Private (Admin)
exports.createTeacher = asyncHandler(async (req, res, next) => {
  // Extract RFID data if provided
  const { rfid, ...teacherData } = req.body;
  
  // Create the teacher
  const teacher = await Teacher.create(teacherData);
  
  let rfidResult = null;
  
  // If RFID data provided and has RFID_ID, create RFID card
  if (rfid && rfid.RFID_ID) {
    const RFID = require('../database/models/RFID');
    const parseExpiryDate = require('../utils/rfidUtils').parseExpiryDate;
    
    // Check if RFID_ID already exists
    const duplicateRFID = await RFID.findOne({ RFID_ID: rfid.RFID_ID });
    
    if (duplicateRFID) {
      // Still return success for teacher creation, but with a warning about RFID
      return res.status(201).json({ 
        success: true,
        data: teacher,
        warning: `Teacher created successfully, but RFID ID ${rfid.RFID_ID} already exists`,
        code: 'DUPLICATE_RFID'
      });
    }
    
    // Create new RFID
    rfidResult = await RFID.create({
      RFID_ID: rfid.RFID_ID,
      UserID: teacher.userId,
      ExpiryDate: parseExpiryDate(rfid.ExpiryDate)
    });
  }
  
  res.status(201).json({
    success: true,
    data: teacher,
    rfid: rfidResult
  });
});

// @desc    Update teacher
// @route   PUT /api/teachers/:id
// @access  Private (Admin)
exports.updateTeacher = asyncHandler(async (req, res, next) => {
  // Extract RFID data and classIds if provided
  const { rfid, classIds, ...teacherData } = req.body;
  
  // First find the teacher using multiple possible identifiers
  let teacher = await Teacher.findOne({
    $or: [
      { teacherId: req.params.id },
      { userId: req.params.id }
    ]
  });
  
  // Try finding by _id only if the id looks like a valid ObjectId
  if (!teacher && /^[0-9a-fA-F]{24}$/.test(req.params.id)) {
    teacher = await Teacher.findById(req.params.id);
  }
  
  if (!teacher) {
    return next(new ErrorResponse(`Teacher with ID ${req.params.id} not found`, 404, 'TEACHER_NOT_FOUND'));
  }
  
  // Check if major is being updated
  const majorChanged = teacherData.major && teacherData.major !== teacher.major;
  
  // If major changed, find removed subjects
  let removedSubjectIds = [];
  let deletedScheduleIds = [];
  
  if (majorChanged) {
    // Get current major subjects
    const currentMajors = teacher.major.split(',').map(m => m.trim());
    
    // Get new major subjects
    const newMajors = teacherData.major.split(',').map(m => m.trim());
    
    // Find removed subjects (in current but not in new)
    const removedSubjects = currentMajors.filter(subject => !newMajors.includes(subject));
    
    if (removedSubjects.length > 0) {
      // Get subject IDs for the removed subjects
      const Subject = require('../database/models/Subject');
      const subjects = await Subject.find({ name: { $in: removedSubjects } });
      removedSubjectIds = subjects.map(s => s.subjectId);
      
      if (removedSubjectIds.length > 0) {
        // Find and update ClassSchedule entries with this teacher and removed subjects
        const ClassSchedule = require('../database/models/ClassSchedule');
        const schedulesToRemove = await ClassSchedule.find({
          teacherId: teacher.teacherId,
          subjectId: { $in: removedSubjectIds }
        });
        
        // Store the IDs of deleted schedules
        deletedScheduleIds = schedulesToRemove.map(s => s._id);
        
        // Update schedules to remove this teacher
        for (const schedule of schedulesToRemove) {
          schedule.teacherId = null; // Remove teacher from schedule
          await schedule.save();
        }
        
        console.log(`Removed teacher ${teacher.teacherId} from ${schedulesToRemove.length} schedules for subjects: ${removedSubjects.join(', ')}`);
      }
    }
  }
  
  // Handle class changes if classIds provided
  if (classIds) {
    // Get current classes of this teacher from ClassSchedule
    const ClassSchedule = require('../database/models/ClassSchedule');
    const currentSchedules = await ClassSchedule.find({ teacherId: teacher.teacherId });
    const currentClassIds = [...new Set(currentSchedules.map(s => s.classId))];
    
    // Find removed classes (in current but not in new)
    const removedClassIds = currentClassIds.filter(id => !classIds.includes(id));
    
    if (removedClassIds.length > 0) {
      // Find and update ClassSchedule entries with this teacher and removed classes
      const schedulesToUpdate = await ClassSchedule.find({
        teacherId: teacher.teacherId,
        classId: { $in: removedClassIds }
      });
      
      // Add to deletedScheduleIds
      const classScheduleIds = schedulesToUpdate.map(s => s._id);
      deletedScheduleIds = [...deletedScheduleIds, ...classScheduleIds];
      
      // Update schedules to remove this teacher
      for (const schedule of schedulesToUpdate) {
        schedule.teacherId = null; // Remove teacher from schedule
        await schedule.save();
      }
      
      console.log(`Removed teacher ${teacher.teacherId} from ${schedulesToUpdate.length} schedules for classes: ${removedClassIds.join(', ')}`);
    }
  }
  
  // FIX: Use update instead of findByIdAndUpdate to avoid ObjectId casting issues
  const updatedTeacher = await Teacher.findOneAndUpdate(
    { _id: teacher._id }, // We already confirmed this teacher exists
    teacherData,
    { new: true, runValidators: true }
  );
  
  // RFID handling code...
  let rfidResult = null;
  if (rfid) {
    const RFID = require('../database/models/RFID');
    const parseExpiryDate = require('../utils/rfidUtils').parseExpiryDate;
    
    // First check if teacher has an RFID card
    let existingRFID = await RFID.findOne({ UserID: teacher.userId });
    
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
        UserID: teacher.userId,
        ExpiryDate: parseExpiryDate(rfid.ExpiryDate)
      });
    }
  }
  
  res.status(200).json({
    success: true,
    data: updatedTeacher,
    rfid: rfidResult,
    deletedScheduleIds: deletedScheduleIds.length > 0 ? deletedScheduleIds : null
  });
});

// @desc    Delete teacher
// @route   DELETE /api/teachers/:id
// @access  Private (Admin)
exports.deleteTeacher = asyncHandler(async (req, res, next) => {
  const teacher = await Teacher.findOne({
    $or: [
      { _id: req.params.id },
      { teacherId: req.params.id },
      { userId: req.params.id }
    ]
  });
  
  if (!teacher) {
    return next(new ErrorResponse(`Teacher with ID ${req.params.id} not found`, 404, 'TEACHER_NOT_FOUND'));
  }
  
  // Delete teacher's RFID if exists
  const RFID = require('../database/models/RFID');
  const rfid = await RFID.findOne({ UserID: teacher.userId });
  
  if (rfid) {
    await rfid.deleteOne();
  }
  
  // Delete teacher
  await teacher.deleteOne();
  
  res.status(200).json({
    success: true,
    message: 'Teacher deleted successfully',
    rfidDeleted: rfid ? true : false
  });
}); 