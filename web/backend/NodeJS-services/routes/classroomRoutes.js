const express = require('express');
const router = express.Router();
const Classroom = require('../database/models/Classroom');
const { protect, authorize } = require('../middleware/authMiddleware');
const errorService = require('../services/errorService');

/**
 * @route   GET /api/classrooms/debug
 * @desc    Get all classrooms without filtering isActive
 * @access  Public
 */
router.get('/debug', async (req, res) => {
  try {
    // Find all classrooms without any filtering
    const allClassrooms = await Classroom.find({});
    
    // Get connection info from mongoose
    const dbInfo = {
      collection: Classroom.collection.name,
      modelName: Classroom.modelName,
      collectionExists: Classroom.collection ? true : false,
      documentCount: await Classroom.countDocuments({})
    };
    
    return res.status(200).json({
      success: true,
      data: allClassrooms,
      dbInfo: dbInfo,
      code: 'DEBUG_CLASSROOMS_SUCCESS'
    });
  } catch (error) {
    console.error('Error in debug route:', error);
    return errorService.handleError(res, error, 'DEBUG_CLASSROOMS_ERROR');
  }
});

/**
 * @route   GET /api/classrooms
 * @desc    Get all classrooms with filtering
 * @access  Public
 */
router.get('/', async (req, res) => {
  try {
    const {
      classroomId,
      classroomName,
      roomNumber,
      roomName,
      building,
      location,
      capacity,
      limit = 10,
      page = 1
    } = req.query;

    // Build filter object - Sửa lại để không lọc theo isActive
    const filter = {};
    
    if (classroomId) filter.classroomId = classroomId;
    if (classroomName) filter.classroomName = { $regex: classroomName, $options: 'i' };
    if (roomNumber) filter.roomNumber = { $regex: roomNumber, $options: 'i' };
    if (roomName) filter.roomName = { $regex: roomName, $options: 'i' };
    if (building) filter.building = { $regex: building, $options: 'i' };
    if (location) filter.location = { $regex: location, $options: 'i' };
    if (capacity) filter.capacity = capacity;

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Get classrooms with pagination
    const classrooms = await Classroom.find(filter)
      .sort({ classroomId: 1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    // Get total count for pagination
    const total = await Classroom.countDocuments(filter);
    
    return res.status(200).json({
      success: true,
      data: classrooms,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      },
      code: 'GET_CLASSROOMS_SUCCESS'
    });
  } catch (error) {
    console.error('Error getting classrooms:', error);
    return errorService.handleError(res, error, 'GET_CLASSROOMS_ERROR');
  }
});

/**
 * @route   GET /api/classrooms/:id
 * @desc    Get a classroom by ID
 * @access  Public
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    let classroom;
    
    // Check if id is ObjectId or classroomId (number)
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      classroom = await Classroom.findById(id);
    } else {
      classroom = await Classroom.findOne({ classroomId: id });
    }
    
    if (!classroom) {
      return res.status(404).json({
        success: false,
        message: 'Classroom not found',
        code: 'CLASSROOM_NOT_FOUND'
      });
    }
    
    return res.status(200).json({
      success: true,
      data: classroom,
      code: 'GET_CLASSROOM_SUCCESS'
    });
  } catch (error) {
    console.error('Error getting classroom:', error);
    return errorService.handleError(res, error, 'GET_CLASSROOM_ERROR');
  }
});

/**
 * @route   POST /api/classrooms
 * @desc    Create a new classroom
 * @access  Admin
 */
router.post('/', protect, authorize('Admin'), async (req, res) => {
  try {
    const {
      classroomName,
      roomNumber,
      roomName,
      building,
      location,
      capacity
    } = req.body;
    
    // Find the highest classroomId to auto-increment
    const highestClassroom = await Classroom.findOne({})
      .sort({ classroomId: -1 });
    
    const nextClassroomId = highestClassroom ? highestClassroom.classroomId + 1 : 1;
    
    const classroom = new Classroom({
      classroomId: nextClassroomId,
      classroomName,
      roomNumber,
      roomName,
      building,
      location,
      capacity
    });
    
    await classroom.save();
    
    return res.status(201).json({
      success: true,
      data: classroom,
      code: 'CREATE_CLASSROOM_SUCCESS'
    });
  } catch (error) {
    console.error('Error creating classroom:', error);
    return errorService.handleError(res, error, 'CREATE_CLASSROOM_ERROR');
  }
});

/**
 * @route   PUT /api/classrooms/:id
 * @desc    Update a classroom
 * @access  Admin
 */
router.put('/:id', protect, authorize('Admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const {
      classroomName,
      roomNumber,
      roomName,
      building,
      location,
      capacity
    } = req.body;
    
    let classroom;
    
    // Check if id is ObjectId or classroomId (number)
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      classroom = await Classroom.findById(id);
    } else {
      classroom = await Classroom.findOne({ classroomId: id });
    }
    
    if (!classroom) {
      return res.status(404).json({
        success: false,
        message: 'Classroom not found',
        code: 'CLASSROOM_NOT_FOUND'
      });
    }
    
    // Update fields
    if (classroomName) classroom.classroomName = classroomName;
    if (roomNumber) classroom.roomNumber = roomNumber;
    if (roomName !== undefined) classroom.roomName = roomName;
    if (building !== undefined) classroom.building = building;
    if (location !== undefined) classroom.location = location;
    if (capacity !== undefined) classroom.capacity = capacity;
    
    await classroom.save();
    
    return res.status(200).json({
      success: true,
      data: classroom,
      code: 'UPDATE_CLASSROOM_SUCCESS'
    });
  } catch (error) {
    console.error('Error updating classroom:', error);
    return errorService.handleError(res, error, 'UPDATE_CLASSROOM_ERROR');
  }
});

/**
 * @route   DELETE /api/classrooms/:id
 * @desc    Delete a classroom (soft delete)
 * @access  Admin
 */
router.delete('/:id', protect, authorize('Admin'), async (req, res) => {
  try {
    const { id } = req.params;
    
    let classroom;
    
    // Check if id is ObjectId or classroomId (number)
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      classroom = await Classroom.findById(id);
    } else {
      classroom = await Classroom.findOne({ classroomId: id });
    }
    
    if (!classroom) {
      return res.status(404).json({
        success: false,
        message: 'Classroom not found',
        code: 'CLASSROOM_NOT_FOUND'
      });
    }
    
    // Soft delete
    classroom.isActive = false;
    await classroom.save();
    
    return res.status(200).json({
      success: true,
      message: 'Classroom deleted successfully',
      code: 'DELETE_CLASSROOM_SUCCESS'
    });
  } catch (error) {
    console.error('Error deleting classroom:', error);
    return errorService.handleError(res, error, 'DELETE_CLASSROOM_ERROR');
  }
});

/**
 * @route   POST /api/classrooms/seed
 * @desc    Seed sample classroom data
 * @access  Public (Chỉ dùng cho development)
 */
router.post('/seed', async (req, res) => {
  try {
    // Xóa dữ liệu hiện tại (nếu cần)
    if (req.query.clear === 'true') {
      await Classroom.deleteMany({});
    }
    
    // Tạo dữ liệu mẫu
    const sampleClassrooms = [
      {
        classroomId: 1,
        classroomName: "Room 101, Building A",
        roomNumber: "101",
        building: "A",
        roomName: "101A",
        capacity: 40,
        location: "Building A"
      },
      {
        classroomId: 2,
        classroomName: "Room 102, Building A",
        roomNumber: "102",
        building: "A",
        roomName: "102A",
        capacity: 35,
        location: "Building A"
      },
      {
        classroomId: 3,
        classroomName: "Room 201, Building B",
        roomNumber: "201",
        building: "B",
        roomName: "201B",
        capacity: 50,
        location: "Building B"
      },
      {
        classroomId: 4,
        classroomName: "Room 202, Building B",
        roomNumber: "202",
        building: "B",
        roomName: "202B",
        capacity: 45,
        location: "Building B" 
      },
      {
        classroomId: 5,
        classroomName: "Computer Lab 1",
        roomNumber: "301",
        building: "C",
        roomName: "Lab1",
        capacity: 30,
        location: "Building C, 3rd Floor"
      }
    ];
    
    // Lưu dữ liệu vào database
    const classrooms = await Classroom.insertMany(sampleClassrooms);
    
    return res.status(201).json({
      success: true,
      message: `${classrooms.length} phòng học đã được tạo`,
      data: classrooms,
      code: 'SEED_CLASSROOMS_SUCCESS'
    });
  } catch (error) {
    console.error('Error seeding classrooms:', error);
    return errorService.handleError(res, error, 'SEED_CLASSROOMS_ERROR');
  }
});

module.exports = router; 