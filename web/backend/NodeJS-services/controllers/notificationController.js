const mongoose = require('mongoose');
const errorService = require('../services/errorService');

// Lấy tất cả thông báo của người dùng hiện tại
exports.getMyNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 10, unreadOnly = false } = req.query;
    const userId = req.user.userId;
    
    const query = { 
      ReceiverID: userId, 
      IsActive: true 
    };
    
    // Thêm điều kiện chỉ lấy những thông báo chưa đọc nếu unreadOnly = true
    if (unreadOnly === 'true') {
      query.ReadStatus = false;
    }

    // Đếm tổng số thông báo thỏa mãn
    const total = await mongoose.connection.db.collection('Notification').countDocuments(query);
    
    // Lấy danh sách thông báo với phân trang
    const notifications = await mongoose.connection.db.collection('Notification')
      .find(query)
      .sort({ SentDate: -1 }) // Sắp xếp theo thời gian gửi, mới nhất lên đầu
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .toArray();
    
    // Lấy thông tin người gửi
    const senderIds = [...new Set(notifications.map(notif => notif.SenderID))];
    const senders = await mongoose.connection.db.collection('UserAccount')
      .find({ UserID: { $in: senderIds } })
      .project({ UserID: 1, Avatar: 1 })
      .toArray();
    
    const sendersMap = new Map(senders.map(sender => [sender.UserID, sender]));
    
    // Thêm thông tin người gửi vào kết quả
    const enhancedNotifications = notifications.map(notif => ({
      ...notif,
      sender: sendersMap.get(notif.SenderID) || null
    }));

    res.status(200).json({
      success: true,
      data: {
        totalItems: total,
        totalPages: Math.ceil(total / limit),
        currentPage: parseInt(page),
        notifications: enhancedNotifications,
        unreadCount: await mongoose.connection.db.collection('Notification')
          .countDocuments({ ReceiverID: userId, ReadStatus: false, IsActive: true })
      }
    });
  } catch (error) {
    errorService.handleError(error, req, res);
  }
};

// Lấy chi tiết một thông báo
exports.getNotificationById = async (req, res) => {
  try {
    const notificationId = parseInt(req.params.id);
    const userId = req.user.userId;
    
    const notification = await mongoose.connection.db.collection('Notification').findOne({
      NotificationID: notificationId,
      ReceiverID: userId,
      IsActive: true
    });
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thông báo'
      });
    }
    
    // Lấy thông tin người gửi
    const sender = await mongoose.connection.db.collection('UserAccount').findOne(
      { UserID: notification.SenderID },
      { projection: { UserID: 1, Avatar: 1 } }
    );
    
    res.status(200).json({
      success: true,
      data: {
        ...notification,
        sender
      }
    });
  } catch (error) {
    errorService.handleError(error, req, res);
  }
};

// Tạo thông báo mới
exports.createNotification = async (req, res) => {
  try {
    const { receiverId, message } = req.body;
    const senderId = req.user.userId;
    
    if (!receiverId || !message) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu thông tin người nhận hoặc nội dung thông báo'
      });
    }
    
    // Kiểm tra người nhận có tồn tại không
    const receiverExists = await mongoose.connection.db.collection('UserAccount').findOne({
      UserID: receiverId,
      IsActive: true
    });
    
    if (!receiverExists) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người nhận'
      });
    }
    
    // Lấy giá trị NotificationID lớn nhất hiện tại
    const maxIdResult = await mongoose.connection.db.collection('Notification')
      .find()
      .sort({ NotificationID: -1 })
      .limit(1)
      .toArray();
      
    const nextId = maxIdResult.length > 0 ? maxIdResult[0].NotificationID + 1 : 1;
    
    const newNotification = {
      NotificationID: nextId,
      SenderID: senderId,
      ReceiverID: receiverId,
      Message: message,
      SentDate: new Date(),
      ReadStatus: false,
      CreatedAt: new Date(),
      UpdatedAt: new Date(),
      IsActive: true
    };
    
    await mongoose.connection.db.collection('Notification').insertOne(newNotification);
    
    res.status(201).json({
      success: true,
      message: 'Đã tạo thông báo thành công',
      data: newNotification
    });
  } catch (error) {
    errorService.handleError(error, req, res);
  }
};

// Đánh dấu thông báo đã đọc
exports.markAsRead = async (req, res) => {
  try {
    const notificationId = parseInt(req.params.id);
    const userId = req.user.userId;
    
    const notification = await mongoose.connection.db.collection('Notification').findOne({
      NotificationID: notificationId,
      ReceiverID: userId,
      IsActive: true
    });
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thông báo'
      });
    }
    
    // Cập nhật trạng thái đọc
    await mongoose.connection.db.collection('Notification').updateOne(
      { NotificationID: notificationId },
      { 
        $set: { 
          ReadStatus: true,
          UpdatedAt: new Date()
        } 
      }
    );
    
    res.status(200).json({
      success: true,
      message: 'Đã đánh dấu thông báo là đã đọc'
    });
  } catch (error) {
    errorService.handleError(error, req, res);
  }
};

// Đánh dấu tất cả thông báo đã đọc
exports.markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const result = await mongoose.connection.db.collection('Notification').updateMany(
      { 
        ReceiverID: userId,
        ReadStatus: false,
        IsActive: true
      },
      { 
        $set: { 
          ReadStatus: true,
          UpdatedAt: new Date()
        } 
      }
    );
    
    res.status(200).json({
      success: true,
      message: `Đã đánh dấu ${result.modifiedCount} thông báo là đã đọc`
    });
  } catch (error) {
    errorService.handleError(error, req, res);
  }
};

// Xóa thông báo
exports.deleteNotification = async (req, res) => {
  try {
    const notificationId = parseInt(req.params.id);
    const userId = req.user.userId;
    
    const notification = await mongoose.connection.db.collection('Notification').findOne({
      NotificationID: notificationId,
      ReceiverID: userId,
      IsActive: true
    });
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thông báo'
      });
    }
    
    // Không xóa mà chỉ đánh dấu là không còn active
    await mongoose.connection.db.collection('Notification').updateOne(
      { NotificationID: notificationId },
      { 
        $set: { 
          IsActive: false,
          UpdatedAt: new Date()
        } 
      }
    );
    
    res.status(200).json({
      success: true,
      message: 'Đã xóa thông báo'
    });
  } catch (error) {
    errorService.handleError(error, req, res);
  }
};

// Hàm hỗ trợ để lấy ID lớn nhất và tạo ID mới
async function getNextNotificationId() {
  const maxIdResult = await mongoose.connection.db.collection('Notification')
    .find()
    .sort({ NotificationID: -1 })
    .limit(1)
    .toArray();
    
  return maxIdResult.length > 0 ? maxIdResult[0].NotificationID + 1 : 1;
}

// Hàm hỗ trợ để tạo thông báo
async function createNotificationBatch(receiverIds, senderId, message, additionalData = {}) {
  if (!receiverIds || receiverIds.length === 0) {
    return { success: false, message: 'Không có người nhận' };
  }
  
  let nextId = await getNextNotificationId();
  const notifications = [];
  const now = new Date();
  
  for (const receiverId of receiverIds) {
    notifications.push({
      NotificationID: nextId++,
      SenderID: senderId,
      ReceiverID: receiverId,
      Message: message,
      SentDate: now,
      ReadStatus: false,
      CreatedAt: now,
      UpdatedAt: now,
      IsActive: true,
      ...additionalData
    });
  }
  
  if (notifications.length > 0) {
    await mongoose.connection.db.collection('Notification').insertMany(notifications);
  }
  
  return { 
    success: true, 
    count: notifications.length,
    message: `Đã tạo ${notifications.length} thông báo thành công`
  };
}

// Gửi thông báo cho tất cả học sinh
exports.sendNotificationToAllStudents = async (req, res) => {
  try {
    const { message, title } = req.body;
    const senderId = req.user.userId;
    
    if (!message) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu nội dung thông báo'
      });
    }
    
    // Lấy tất cả học sinh từ bảng UserAccount
    const students = await mongoose.connection.db.collection('UserAccount')
      .find({ Role: 'Student', IsActive: true })
      .project({ UserID: 1 })
      .toArray();
    
    const studentIds = students.map(student => student.UserID);
    
    const result = await createNotificationBatch(studentIds, senderId, message, { Title: title });
    
    res.status(201).json({
      success: result.success,
      message: result.message,
      data: {
        recipientCount: result.count,
        recipientType: 'Students'
      }
    });
  } catch (error) {
    errorService.handleError(error, req, res);
  }
};

// Gửi thông báo cho tất cả giáo viên
exports.sendNotificationToAllTeachers = async (req, res) => {
  try {
    const { message, title } = req.body;
    const senderId = req.user.userId;
    
    if (!message) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu nội dung thông báo'
      });
    }
    
    // Lấy tất cả giáo viên từ bảng UserAccount
    const teachers = await mongoose.connection.db.collection('UserAccount')
      .find({ Role: 'Teacher', IsActive: true })
      .project({ UserID: 1 })
      .toArray();
    
    const teacherIds = teachers.map(teacher => teacher.UserID);
    
    const result = await createNotificationBatch(teacherIds, senderId, message, { Title: title });
    
    res.status(201).json({
      success: result.success,
      message: result.message,
      data: {
        recipientCount: result.count,
        recipientType: 'Teachers'
      }
    });
  } catch (error) {
    errorService.handleError(error, req, res);
  }
};

// Gửi thông báo cho tất cả admin
exports.sendNotificationToAllAdmins = async (req, res) => {
  try {
    const { message, title } = req.body;
    const senderId = req.user.userId;
    
    if (!message) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu nội dung thông báo'
      });
    }
    
    // Lấy tất cả admin từ bảng UserAccount
    const admins = await mongoose.connection.db.collection('UserAccount')
      .find({ Role: 'Admin', IsActive: true })
      .project({ UserID: 1 })
      .toArray();
    
    const adminIds = admins.map(admin => admin.UserID);
    
    const result = await createNotificationBatch(adminIds, senderId, message, { Title: title });
    
    res.status(201).json({
      success: result.success,
      message: result.message,
      data: {
        recipientCount: result.count,
        recipientType: 'Admins'
      }
    });
  } catch (error) {
    errorService.handleError(error, req, res);
  }
};

// Gửi thông báo cho tất cả phụ huynh
exports.sendNotificationToAllParents = async (req, res) => {
  try {
    const { message, title } = req.body;
    const senderId = req.user.userId;
    
    if (!message) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu nội dung thông báo'
      });
    }
    
    // Lấy tất cả phụ huynh từ bảng UserAccount
    const parents = await mongoose.connection.db.collection('UserAccount')
      .find({ Role: 'Parent', IsActive: true })
      .project({ UserID: 1 })
      .toArray();
    
    const parentIds = parents.map(parent => parent.UserID);
    
    const result = await createNotificationBatch(parentIds, senderId, message, { Title: title });
    
    res.status(201).json({
      success: result.success,
      message: result.message,
      data: {
        recipientCount: result.count,
        recipientType: 'Parents'
      }
    });
  } catch (error) {
    errorService.handleError(error, req, res);
  }
};

// Gửi thông báo cho một userId cụ thể
exports.sendNotificationToUser = async (req, res) => {
  try {
    const { message, title, userId } = req.body;
    const senderId = req.user.userId;
    
    if (!message || !userId) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu nội dung thông báo hoặc userId'
      });
    }
    
    // Kiểm tra người nhận có tồn tại không
    const receiverExists = await mongoose.connection.db.collection('UserAccount').findOne({
      UserID: userId,
      IsActive: true
    });
    
    if (!receiverExists) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người nhận'
      });
    }
    
    const result = await createNotificationBatch([userId], senderId, message, { Title: title });
    
    res.status(201).json({
      success: result.success,
      message: 'Đã gửi thông báo thành công',
      data: {
        recipient: userId,
        notification: {
          message,
          title: title || 'Thông báo mới'
        }
      }
    });
  } catch (error) {
    errorService.handleError(error, req, res);
  }
};

// Gửi thông báo cho tất cả học sinh của một lớp cụ thể
exports.sendNotificationToClassStudents = async (req, res) => {
  try {
    const { message, title, classId } = req.body;
    const senderId = req.user.userId;
    
    if (!message || !classId) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu nội dung thông báo hoặc classId'
      });
    }

    // Kiểm tra lớp có tồn tại không
    const classObj = await mongoose.connection.db.collection('Class').findOne({ ClassID: parseInt(classId), IsActive: true });
    
    if (!classObj) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy lớp học'
      });
    }
    
    // Lấy danh sách học sinh thuộc lớp này
    const students = await mongoose.connection.db.collection('Student')
      .find({ 
        ClassIDs: parseInt(classId), 
        IsActive: true 
      })
      .project({ UserID: 1 })
      .toArray();
    
    const studentIds = students.map(student => student.UserID);
    
    if (studentIds.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'Không có học sinh nào trong lớp này',
        data: {
          classId,
          className: classObj.ClassName
        }
      });
    }
    
    const result = await createNotificationBatch(studentIds, senderId, message, { 
      Title: title, 
      ClassID: parseInt(classId),
      ClassName: classObj.ClassName 
    });
    
    res.status(201).json({
      success: result.success,
      message: result.message,
      data: {
        classId,
        className: classObj.ClassName,
        studentCount: result.count
      }
    });
  } catch (error) {
    errorService.handleError(error, req, res);
  }
}; 