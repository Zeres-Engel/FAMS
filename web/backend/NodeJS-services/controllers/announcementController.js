const mongoose = require('mongoose');
const errorService = require('../services/errorService');

// Lấy tất cả thông báo chung
exports.getAllAnnouncements = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    
    // Đếm tổng số thông báo active
    const total = await mongoose.connection.db.collection('Announcement').countDocuments({ IsActive: true });
    
    // Lấy danh sách thông báo với phân trang
    const announcements = await mongoose.connection.db.collection('Announcement')
      .find({ IsActive: true })
      .sort({ CreatedAt: -1 }) // Mới nhất lên đầu
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .toArray();
    
    // Lấy thông tin người tạo thông báo
    const creatorIds = [...new Set(announcements.map(item => item.UserID))];
    const creators = await mongoose.connection.db.collection('UserAccount')
      .find({ UserID: { $in: creatorIds } })
      .project({ UserID: 1, Avatar: 1 })
      .toArray();
    
    const creatorsMap = new Map(creators.map(creator => [creator.UserID, creator]));
    
    // Thêm thông tin người tạo vào kết quả
    const enhancedAnnouncements = announcements.map(announcement => ({
      ...announcement,
      creator: creatorsMap.get(announcement.UserID) || null
    }));
    
    res.status(200).json({
      success: true,
      data: {
        totalItems: total,
        totalPages: Math.ceil(total / limit),
        currentPage: parseInt(page),
        announcements: enhancedAnnouncements
      }
    });
  } catch (error) {
    errorService.handleError(error, req, res);
  }
};

// Lấy chi tiết một thông báo chung
exports.getAnnouncementById = async (req, res) => {
  try {
    const announcementId = parseInt(req.params.id);
    
    const announcement = await mongoose.connection.db.collection('Announcement').findOne({
      AnnouncementID: announcementId,
      IsActive: true
    });
    
    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thông báo'
      });
    }
    
    // Lấy thông tin người tạo
    const creator = await mongoose.connection.db.collection('UserAccount').findOne(
      { UserID: announcement.UserID },
      { projection: { UserID: 1, Avatar: 1 } }
    );
    
    // Thông tin chi tiết của người tạo dựa vào role (nếu là Teacher hoặc Admin)
    let creatorDetail = null;
    if (creator) {
      const user = await mongoose.connection.db.collection('UserAccount').findOne(
        { UserID: creator.UserID },
        { projection: { Role: 1 } }
      );
      
      if (user && user.Role === 'Teacher') {
        creatorDetail = await mongoose.connection.db.collection('Teacher').findOne(
          { UserID: creator.UserID },
          { projection: { TeacherID: 1, FullName: 1 } }
        );
      } else if (user && user.Role === 'Admin') {
        // Giả sử có bảng Admin hoặc Admin có thông tin trong bảng khác
        creatorDetail = { FullName: 'Admin' }; // Tạm thời như vậy
      }
    }
    
    res.status(200).json({
      success: true,
      data: {
        ...announcement,
        creator: {
          ...creator,
          details: creatorDetail
        }
      }
    });
  } catch (error) {
    errorService.handleError(error, req, res);
  }
};

// Tạo thông báo chung mới
exports.createAnnouncement = async (req, res) => {
  try {
    const { content } = req.body;
    const userId = req.user.userId;
    
    if (!content) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu nội dung thông báo'
      });
    }
    
    // Lấy giá trị AnnouncementID lớn nhất hiện tại
    const maxIdResult = await mongoose.connection.db.collection('Announcement')
      .find()
      .sort({ AnnouncementID: -1 })
      .limit(1)
      .toArray();
      
    const nextId = maxIdResult.length > 0 ? maxIdResult[0].AnnouncementID + 1 : 1;
    
    const newAnnouncement = {
      AnnouncementID: nextId,
      UserID: userId,
      Content: content,
      CreatedAt: new Date(),
      IsActive: true,
      TargetAudience: 'All' // Mặc định là gửi cho tất cả
    };
    
    await mongoose.connection.db.collection('Announcement').insertOne(newAnnouncement);
    
    // Lấy thông tin người tạo
    const creator = await mongoose.connection.db.collection('UserAccount').findOne(
      { UserID: userId },
      { projection: { UserID: 1, Avatar: 1 } }
    );
    
    res.status(201).json({
      success: true,
      message: 'Đã tạo thông báo chung thành công',
      data: {
        ...newAnnouncement,
        creator
      }
    });
  } catch (error) {
    errorService.handleError(error, req, res);
  }
};

// Cập nhật thông báo chung
exports.updateAnnouncement = async (req, res) => {
  try {
    const announcementId = parseInt(req.params.id);
    const { content } = req.body;
    const userId = req.user.userId;
    
    if (!content) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu nội dung thông báo'
      });
    }
    
    const announcement = await mongoose.connection.db.collection('Announcement').findOne({
      AnnouncementID: announcementId,
      IsActive: true
    });
    
    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thông báo'
      });
    }
    
    // Kiểm tra xem người dùng hiện tại có quyền cập nhật thông báo này không
    const user = await mongoose.connection.db.collection('UserAccount').findOne(
      { UserID: userId },
      { projection: { Role: 1 } }
    );
    
    // Chỉ cho phép Admin cập nhật mọi thông báo, hoặc người tạo thông báo (nếu là Teacher)
    if (user.Role !== 'Admin' && announcement.UserID !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền cập nhật thông báo này'
      });
    }
    
    // Cập nhật thông báo
    await mongoose.connection.db.collection('Announcement').updateOne(
      { AnnouncementID: announcementId },
      { $set: { Content: content } }
    );
    
    res.status(200).json({
      success: true,
      message: 'Đã cập nhật thông báo thành công',
      data: {
        ...announcement,
        Content: content
      }
    });
  } catch (error) {
    errorService.handleError(error, req, res);
  }
};

// Xóa thông báo chung
exports.deleteAnnouncement = async (req, res) => {
  try {
    const announcementId = parseInt(req.params.id);
    
    const announcement = await mongoose.connection.db.collection('Announcement').findOne({
      AnnouncementID: announcementId,
      IsActive: true
    });
    
    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thông báo'
      });
    }
    
    // Không xóa mà chỉ đánh dấu là không còn active
    await mongoose.connection.db.collection('Announcement').updateOne(
      { AnnouncementID: announcementId },
      { $set: { IsActive: false } }
    );
    
    res.status(200).json({
      success: true,
      message: 'Đã xóa thông báo thành công'
    });
  } catch (error) {
    errorService.handleError(error, req, res);
  }
};

// Tạo thông báo chung cho tất cả người dùng
exports.createAnnouncementForAllUsers = async (req, res) => {
  try {
    const { content, title } = req.body;
    const userId = req.user.userId;
    
    if (!content) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu nội dung thông báo'
      });
    }
    
    // Lấy giá trị AnnouncementID lớn nhất hiện tại
    const maxIdResult = await mongoose.connection.db.collection('Announcement')
      .find()
      .sort({ AnnouncementID: -1 })
      .limit(1)
      .toArray();
      
    const nextId = maxIdResult.length > 0 ? maxIdResult[0].AnnouncementID + 1 : 1;
    
    const newAnnouncement = {
      AnnouncementID: nextId,
      UserID: userId,
      Title: title || 'Thông báo mới',
      Content: content,
      TargetAudience: 'All',
      CreatedAt: new Date(),
      UpdatedAt: new Date(),
      IsActive: true
    };
    
    await mongoose.connection.db.collection('Announcement').insertOne(newAnnouncement);
    
    res.status(201).json({
      success: true,
      message: 'Đã tạo thông báo cho tất cả người dùng thành công',
      data: newAnnouncement
    });
  } catch (error) {
    errorService.handleError(error, req, res);
  }
};

// Tạo thông báo chung cho tất cả giáo viên
exports.createAnnouncementForTeachers = async (req, res) => {
  try {
    const { content, title } = req.body;
    const userId = req.user.userId;
    
    if (!content) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu nội dung thông báo'
      });
    }
    
    // Lấy giá trị AnnouncementID lớn nhất hiện tại
    const maxIdResult = await mongoose.connection.db.collection('Announcement')
      .find()
      .sort({ AnnouncementID: -1 })
      .limit(1)
      .toArray();
      
    const nextId = maxIdResult.length > 0 ? maxIdResult[0].AnnouncementID + 1 : 1;
    
    const newAnnouncement = {
      AnnouncementID: nextId,
      UserID: userId,
      Title: title || 'Thông báo dành cho giáo viên',
      Content: content,
      TargetAudience: 'Teacher',
      CreatedAt: new Date(),
      UpdatedAt: new Date(),
      IsActive: true
    };
    
    await mongoose.connection.db.collection('Announcement').insertOne(newAnnouncement);
    
    res.status(201).json({
      success: true,
      message: 'Đã tạo thông báo cho tất cả giáo viên thành công',
      data: newAnnouncement
    });
  } catch (error) {
    errorService.handleError(error, req, res);
  }
};

// Tạo thông báo chung cho tất cả học sinh
exports.createAnnouncementForStudents = async (req, res) => {
  try {
    const { content, title } = req.body;
    const userId = req.user.userId;
    
    if (!content) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu nội dung thông báo'
      });
    }
    
    // Lấy giá trị AnnouncementID lớn nhất hiện tại
    const maxIdResult = await mongoose.connection.db.collection('Announcement')
      .find()
      .sort({ AnnouncementID: -1 })
      .limit(1)
      .toArray();
      
    const nextId = maxIdResult.length > 0 ? maxIdResult[0].AnnouncementID + 1 : 1;
    
    const newAnnouncement = {
      AnnouncementID: nextId,
      UserID: userId,
      Title: title || 'Thông báo dành cho học sinh',
      Content: content,
      TargetAudience: 'Student',
      CreatedAt: new Date(),
      UpdatedAt: new Date(),
      IsActive: true
    };
    
    await mongoose.connection.db.collection('Announcement').insertOne(newAnnouncement);
    
    res.status(201).json({
      success: true,
      message: 'Đã tạo thông báo cho tất cả học sinh thành công',
      data: newAnnouncement
    });
  } catch (error) {
    errorService.handleError(error, req, res);
  }
}; 