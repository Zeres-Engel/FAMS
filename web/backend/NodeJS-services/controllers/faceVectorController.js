const mongoose = require('mongoose');
const FaceVector = require('../database/models/FaceVector');
const UserAccount = require('../database/models/UserAccount');
const Student = require('../database/models/Student');
const Teacher = require('../database/models/Teacher');

/**
 * Lấy danh sách người dùng với điểm vector khuôn mặt
 */
exports.getAllUserVectors = async (req, res) => {
  try {
    // Tìm tất cả các vector mặt đang active
    const faceVectors = await FaceVector.find({ isActive: true })
      .select('userId category score')
      .populate('user', 'userId email role avatar');

    // Nhóm dữ liệu theo userId
    const userScores = {};
    
    // Lấy tất cả teacherId và studentId để tra cứu nhanh
    const teachers = await Teacher.find({}, 'userId fullName');
    const students = await Student.find({}, 'userId fullName');
    
    // Tạo bảng ánh xạ từ userId sang fullName
    const teacherMap = {};
    const studentMap = {};
    
    teachers.forEach(teacher => {
      teacherMap[teacher.userId] = teacher.fullName;
    });
    
    students.forEach(student => {
      studentMap[student.userId] = student.fullName;
    });
    
    for (const vector of faceVectors) {
      const userId = vector.userId;
      const category = vector.category;
      const score = vector.score;
      const user = vector.user;
      
      if (!userScores[userId]) {
        // Xác định fullName dựa trên role
        let fullName = '';
        if (user?.role === 'teacher' && teacherMap[userId]) {
          fullName = teacherMap[userId];
        } else if (user?.role === 'student' && studentMap[userId]) {
          fullName = studentMap[userId];
        } else {
          // Fallback: nếu không tìm thấy trong bảng, sử dụng email hoặc userId
          fullName = user?.email?.split('@')[0] || userId;
        }
        
        userScores[userId] = {
          userId,
          fullName,
          role: user?.role || 'unknown',
          avatar: user?.avatar || null,
          front: 0,
          left: 0,
          right: 0,
          down: 0,
          up: 0
        };
      }
      
      // Cập nhật điểm cho loại vector tương ứng
      if (category && score !== undefined) {
        userScores[userId][category] = score;
      }
    }
    
    // Chuyển đổi thành mảng để trả về
    const result = Object.values(userScores);
    
    return res.status(200).json({
      success: true,
      count: result.length,
      data: result
    });
  } catch (error) {
    console.error('Error fetching user face vector scores:', error);
    return res.status(500).json({
      success: false,
      message: 'Không thể lấy dữ liệu điểm vector mặt',
      error: error.message
    });
  }
};

/**
 * Lấy thông tin vector khuôn mặt của một người dùng
 */
exports.getUserVectorById = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('Finding user with userId:', id);
    
    // Tìm tất cả vector mặt của userId
    const faceVectors = await FaceVector.find({ userId: id, isActive: true })
      .select('userId category score')
      .populate('user', 'userId email role avatar');
    
    if (!faceVectors || faceVectors.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Không tìm thấy vector khuôn mặt cho người dùng ${id}`
      });
    }
    
    // Lấy thông tin người dùng từ vector đầu tiên
    const user = faceVectors[0].user;
    
    // Tìm kiếm fullName dựa trên role
    let fullName = '';
    if (user?.role === 'teacher') {
      const teacher = await Teacher.findOne({ userId: id });
      fullName = teacher?.fullName || '';
    } else if (user?.role === 'student') {
      const student = await Student.findOne({ userId: id });
      fullName = student?.fullName || '';
    }
    
    // Nếu không tìm thấy trong bảng, sử dụng email hoặc userId
    if (!fullName) {
      fullName = user?.email?.split('@')[0] || id;
    }
    
    // Tạo đối tượng kết quả
    const result = {
      userId: id,
      fullName,
      role: user?.role || 'unknown',
      avatar: user?.avatar || null,
      front: 0,
      left: 0,
      right: 0,
      down: 0,
      up: 0
    };
    
    // Cập nhật điểm cho từng loại vector
    faceVectors.forEach(vector => {
      if (vector.category && vector.score !== undefined) {
        result[vector.category] = vector.score;
      }
    });
    
    return res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error(`Error fetching face vector scores for user ${req.params.id}:`, error);
    return res.status(500).json({
      success: false,
      message: 'Không thể lấy dữ liệu điểm vector mặt',
      error: error.message
    });
  }
};

/**
 * Cập nhật score hoặc vector cho người dùng
 */
exports.updateUserVector = async (req, res) => {
  try {
    const { id } = req.params;
    const { category, score, vector } = req.body;
    
    if (!category) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu thông tin category (front, left, right, up, down)'
      });
    }
    
    if (!['front', 'left', 'right', 'up', 'down'].includes(category)) {
      return res.status(400).json({
        success: false,
        message: 'Category không hợp lệ. Phải là một trong: front, left, right, up, down'
      });
    }
    
    // Tìm vector mặt cần cập nhật
    let faceVector = await FaceVector.findOne({ 
      userId: id, 
      category: category,
      isActive: true 
    });
    
    if (!faceVector) {
      return res.status(404).json({
        success: false,
        message: `Không tìm thấy vector khuôn mặt ${category} cho người dùng ${id}`
      });
    }
    
    // Cập nhật thông tin
    if (score !== undefined) {
      faceVector.score = score;
    }
    
    if (vector) {
      faceVector.vector = vector;
    }
    
    await faceVector.save();
    
    return res.status(200).json({
      success: true,
      message: `Đã cập nhật vector khuôn mặt ${category} cho người dùng ${id}`,
      data: {
        userId: id,
        category: faceVector.category,
        score: faceVector.score,
        updatedAt: faceVector.updatedAt
      }
    });
  } catch (error) {
    console.error(`Error updating face vector for user ${req.params.id}:`, error);
    return res.status(500).json({
      success: false,
      message: 'Không thể cập nhật vector khuôn mặt',
      error: error.message
    });
  }
}; 