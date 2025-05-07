const mongoose = require('mongoose');
const errorService = require('../services/errorService');
const Notification = require('../database/models/Notification');
const UserAccount = require('../database/models/UserAccount');

// Lấy tất cả thông báo của người dùng hiện tại
exports.getMyNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 10, unreadOnly = false, archived = false, category = 'all' } = req.query;
    
    // Set default userId for testing when auth is disabled
    const userId = req.user?.userId || 'admin';
    
    const query = { 
      ReceiverID: userId, 
      IsActive: true 
    };
    
    // Lọc theo danh mục
    if (category === 'unread') {
      query.ReadStatus = false;
    } else if (category === 'read') {
      query.ReadStatus = true;
    } else if (category === 'archive') {
      query.Archived = true;
    } else if (category === 'all') {
      // Nếu là all và không yêu cầu xem archived, loại bỏ các thông báo đã lưu trữ
      if (archived === 'false' || !archived) {
        query.Archived = false;
      }
    }
    
    // Thêm điều kiện chỉ lấy những thông báo chưa đọc nếu unreadOnly = true
    if (unreadOnly === 'true') {
      query.ReadStatus = false;
    }

    // Đếm tổng số thông báo thỏa mãn
    const total = await Notification.countDocuments(query);
    
    // Lấy danh sách thông báo với phân trang
    const notifications = await Notification
      .find(query)
      .sort({ SentDate: -1 }) // Sắp xếp theo thời gian gửi, mới nhất lên đầu
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    
    // Lấy thông tin người gửi
    const senderIds = [...new Set(notifications.map(notif => notif.SenderID))];
    const senders = await UserAccount
      .find({ userId: { $in: senderIds } })
      .select('userId avatar');
    
    const sendersMap = new Map(senders.map(sender => [sender.userId, sender]));
    
    // Thêm thông tin người gửi vào kết quả
    const enhancedNotifications = notifications.map(notif => ({
      ...notif.toObject(),
      sender: sendersMap.get(notif.SenderID) || null
    }));

    res.status(200).json({
      success: true,
      data: {
        totalItems: total,
        totalPages: Math.ceil(total / limit),
        currentPage: parseInt(page),
        notifications: enhancedNotifications,
        unreadCount: await Notification.countDocuments({ ReceiverID: userId, ReadStatus: false, IsActive: true })
      }
    });
  } catch (error) {
    console.error("Error in getMyNotifications:", error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi lấy thông báo',
      code: 'SERVER_ERROR'
    });
  }
};

// Lấy chi tiết một thông báo
exports.getNotificationById = async (req, res) => {
  try {
    const notificationId = parseInt(req.params.id);
    
    // Set default userId for testing when auth is disabled
    const userId = req.user?.userId || 'admin';
    
    const notification = await Notification.findOne({
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
    const sender = await UserAccount.findOne(
      { userId: notification.SenderID }
    ).select('userId avatar');
    
    res.status(200).json({
      success: true,
      data: {
        ...notification.toObject(),
        sender
      }
    });
  } catch (error) {
    console.error("Error in getNotificationById:", error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi lấy chi tiết thông báo',
      code: 'SERVER_ERROR'
    });
  }
};

// Tạo thông báo mới
exports.createNotification = async (req, res) => {
  try {
    const { receiverId, message } = req.body;
    
    // Set default senderId for testing when auth is disabled
    const senderId = req.user?.userId || 'admin';
    
    if (!receiverId || !message) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu thông tin người nhận hoặc nội dung thông báo'
      });
    }
    
    // Kiểm tra người nhận có tồn tại không
    const receiverExists = await UserAccount.findOne({
      userId: receiverId,
      isActive: true
    });
    
    if (!receiverExists) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người nhận'
      });
    }
    
    // Lấy ID tiếp theo
    const nextId = await getNextNotificationId();
    
    const newNotification = new Notification({
      NotificationID: nextId,
      SenderID: senderId,
      ReceiverID: receiverId,
      Message: message,
      SentDate: new Date(),
      ReadStatus: false,
      CreatedAt: new Date(),
      UpdatedAt: new Date(),
      IsActive: true
    });
    
    await newNotification.save();
    
    res.status(201).json({
      success: true,
      message: 'Đã tạo thông báo thành công',
      data: newNotification
    });
  } catch (error) {
    console.error("Error in createNotification:", error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi tạo thông báo mới',
      code: 'SERVER_ERROR'
    });
  }
};

// Đánh dấu thông báo đã đọc
exports.markAsRead = async (req, res) => {
  try {
    const notificationId = parseInt(req.params.id);
    
    // Set default userId for testing when auth is disabled
    const userId = req.user?.userId || 'admin';
    
    const notification = await Notification.findOne({
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
    await Notification.updateOne(
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
    console.error("Error in markAsRead:", error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi đánh dấu thông báo đã đọc',
      code: 'SERVER_ERROR'
    });
  }
};

// Đánh dấu tất cả thông báo đã đọc
exports.markAllAsRead = async (req, res) => {
  try {
    // Set default userId for testing when auth is disabled
    const userId = req.user?.userId || 'admin';
    
    const result = await Notification.updateMany(
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
    console.error("Error in markAllAsRead:", error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi đánh dấu tất cả thông báo đã đọc',
      code: 'SERVER_ERROR'
    });
  }
};

// Xóa thông báo
exports.deleteNotification = async (req, res) => {
  try {
    const notificationId = parseInt(req.params.id);
    
    // Set default userId for testing when auth is disabled
    const userId = req.user?.userId || 'admin';
    
    const notification = await Notification.findOne({
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
    await Notification.updateOne(
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
      message: 'Đã xóa thông báo thành công'
    });
  } catch (error) {
    console.error("Error in deleteNotification:", error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi xóa thông báo',
      code: 'SERVER_ERROR'
    });
  }
};

// Hàm trợ giúp lấy ID tiếp theo
async function getNextNotificationId() {
  const maxIdResult = await Notification.findOne().sort({ NotificationID: -1 });
  return maxIdResult ? maxIdResult.NotificationID + 1 : 1;
}

// Hàm tạo nhiều thông báo cùng lúc
async function createNotificationBatch(receiverIds, senderId, message, additionalData = {}) {
  try {
    // Kiểm tra receiver ids có hợp lệ không
    const receivers = await UserAccount.find({
      userId: { $in: receiverIds },
      isActive: true
    });
    
    if (!receivers.length) {
      return { 
        success: false, 
        message: 'Không tìm thấy người nhận',
        code: 'RECEIVER_NOT_FOUND'
      };
    }
    
    const validReceiverIds = receivers.map(r => r.userId);
    
    // Lấy ID tiếp theo
    let nextId = await getNextNotificationId();
    
    // Tạo mảng các đối tượng thông báo cần thêm
    const notifications = validReceiverIds.map(receiverId => {
      return {
        NotificationID: nextId++,
        SenderID: senderId,
        ReceiverID: receiverId,
        Message: message,
        SentDate: new Date(),
        ReadStatus: false,
        CreatedAt: new Date(),
        UpdatedAt: new Date(),
        IsActive: true,
        ...additionalData
      };
    });
    
    // Thêm hàng loạt vào cơ sở dữ liệu
    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }
    
    return {
      success: true,
      count: notifications.length,
      message: `Đã tạo ${notifications.length} thông báo`
    };
  } catch (error) {
    console.error('Lỗi khi tạo thông báo hàng loạt:', error);
    return {
      success: false,
      message: error.message || 'Lỗi khi tạo thông báo hàng loạt',
      code: 'BATCH_NOTIFICATION_ERROR'
    };
  }
}

// Xuất các hàm trợ giúp
exports.createNotificationBatch = createNotificationBatch;

// Gửi thông báo cho tất cả học sinh
exports.sendNotificationToAllStudents = async (req, res) => {
  try {
    const { message, title } = req.body;
    const senderId = req.user?.userId || 'admin';
    
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
    
    if (studentIds.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'Không có học sinh nào trong hệ thống',
        data: {
          recipientCount: 0,
          recipientType: 'Students'
        }
      });
    }
    
    const result = await createNotificationBatch(studentIds, senderId, message, { Title: title });
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message,
        code: result.code
      });
    }
    
    return res.status(201).json({
      success: result.success,
      message: result.message,
      data: {
        recipientCount: result.count,
        recipientType: 'Students'
      }
    });
  } catch (error) {
    console.error("Error in sendNotificationToAllStudents:", error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi gửi thông báo cho tất cả học sinh',
      code: 'SERVER_ERROR'
    });
  }
};

// Gửi thông báo cho tất cả giáo viên
exports.sendNotificationToAllTeachers = async (req, res) => {
  try {
    const { message, title } = req.body;
    const senderId = req.user?.userId || 'admin';
    
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
    
    if (teacherIds.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'Không có giáo viên nào trong hệ thống',
        data: {
          recipientCount: 0,
          recipientType: 'Teachers'
        }
      });
    }
    
    const result = await createNotificationBatch(teacherIds, senderId, message, { Title: title });
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message,
        code: result.code
      });
    }
    
    return res.status(201).json({
      success: result.success,
      message: result.message,
      data: {
        recipientCount: result.count,
        recipientType: 'Teachers'
      }
    });
  } catch (error) {
    console.error("Error in sendNotificationToAllTeachers:", error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi gửi thông báo cho tất cả giáo viên',
      code: 'SERVER_ERROR'
    });
  }
};

// Gửi thông báo cho tất cả admin
exports.sendNotificationToAllAdmins = async (req, res) => {
  try {
    const { message, title } = req.body;
    const senderId = req.user?.userId || 'admin';
    
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
    
    if (adminIds.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'Không có admin nào trong hệ thống',
        data: {
          recipientCount: 0,
          recipientType: 'Admins'
        }
      });
    }
    
    const result = await createNotificationBatch(adminIds, senderId, message, { Title: title });
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message,
        code: result.code
      });
    }
    
    return res.status(201).json({
      success: result.success,
      message: result.message,
      data: {
        recipientCount: result.count,
        recipientType: 'Admins'
      }
    });
  } catch (error) {
    console.error("Error in sendNotificationToAllAdmins:", error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi gửi thông báo cho tất cả quản trị viên',
      code: 'SERVER_ERROR'
    });
  }
};

// Gửi thông báo cho tất cả phụ huynh
exports.sendNotificationToAllParents = async (req, res) => {
  try {
    const { message, title } = req.body;
    const senderId = req.user?.userId || 'admin';
    
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
    
    if (parentIds.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'Không có phụ huynh nào trong hệ thống',
        data: {
          recipientCount: 0,
          recipientType: 'Parents'
        }
      });
    }
    
    const result = await createNotificationBatch(parentIds, senderId, message, { Title: title });
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message,
        code: result.code
      });
    }
    
    return res.status(201).json({
      success: result.success,
      message: result.message,
      data: {
        recipientCount: result.count,
        recipientType: 'Parents'
      }
    });
  } catch (error) {
    console.error("Error in sendNotificationToAllParents:", error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi gửi thông báo cho tất cả phụ huynh',
      code: 'SERVER_ERROR'
    });
  }
};

// Gửi thông báo cho một người dùng cụ thể
exports.sendNotificationToUser = async (req, res) => {
  try {
    const { message, title, userId } = req.body;
    const senderId = req.user?.userId || 'admin';
    
    if (!message || !userId) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu nội dung thông báo hoặc userId'
      });
    }
    
    // Kiểm tra người nhận có tồn tại không - Sửa lại trường "UserID" thành "userId" để phù hợp với schema
    const receiverExists = await mongoose.connection.db.collection('UserAccount').findOne({
      $or: [
        { UserID: userId, IsActive: true },  // MongoDB collection style
        { userId: userId, isActive: true }   // Mongoose schema style
      ]
    });
    
    if (!receiverExists) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng',
        code: 'USER_NOT_FOUND'
      });
    }
    
    const result = await createNotificationBatch([userId], senderId, message, { Title: title });
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message,
        code: result.code
      });
    }
    
    return res.status(201).json({
      success: true,
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
    console.error("Error in sendNotificationToUser:", error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi gửi thông báo cho người dùng',
      code: 'SERVER_ERROR'
    });
  }
};

// Gửi thông báo cho tất cả học sinh của một lớp cụ thể
exports.sendNotificationToClassStudents = async (req, res) => {
  try {
    const { message, title, classId } = req.body;
    const senderId = req.user?.userId || 'admin';
    
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
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message,
        code: result.code
      });
    }
    
    return res.status(201).json({
      success: result.success,
      message: result.message,
      data: {
        classId,
        className: classObj.ClassName,
        studentCount: result.count
      }
    });
  } catch (error) {
    console.error("Error in sendNotificationToClassStudents:", error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi gửi thông báo cho học sinh của lớp',
      code: 'SERVER_ERROR'
    });
  }
};

// Gửi thông báo đến nhiều người dùng (API đơn giản hóa)
exports.sendNotificationToMultipleUsers = async (req, res) => {
  try {
    const { message, userIds } = req.body;
    
    // Set default senderId for testing when auth is disabled
    const senderId = req.user?.userId || 'admin';
    
    if (!message) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu nội dung thông báo'
      });
    }
    
    // Nếu không có userIds, mặc định gửi cho admin
    const recipients = Array.isArray(userIds) && userIds.length > 0 
      ? userIds 
      : ['admin'];
    
    // Sử dụng hàm createNotificationBatch để gửi thông báo
    const result = await createNotificationBatch(recipients, senderId, message);
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message,
        code: result.code
      });
    }
    
    return res.status(201).json({
      success: true,
      message: `Đã gửi thông báo thành công đến ${result.count} người nhận`,
      data: {
        recipients,
        count: result.count,
        notification: {
          message
        }
      }
    });
  } catch (error) {
    console.error("Error in sendNotificationToMultipleUsers:", error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi gửi thông báo cho nhiều người dùng',
      code: 'SERVER_ERROR'
    });
  }
};

// Lưu trữ và bỏ lưu trữ thông báo
exports.toggleArchiveNotification = async (req, res) => {
  try {
    const notificationId = parseInt(req.params.id);
    const { archived } = req.body;
    
    // Kiểm tra xem archived có phải là boolean
    if (typeof archived !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'Trường archived phải là true hoặc false'
      });
    }
    
    // Set default userId for testing when auth is disabled
    const userId = req.user?.userId || 'admin';
    
    const notification = await Notification.findOne({
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
    
    // Cập nhật trạng thái lưu trữ
    await Notification.updateOne(
      { NotificationID: notificationId },
      { 
        $set: { 
          Archived: archived,
          UpdatedAt: new Date()
        } 
      }
    );
    
    res.status(200).json({
      success: true,
      message: archived ? 'Đã lưu trữ thông báo thành công' : 'Đã bỏ lưu trữ thông báo thành công'
    });
  } catch (error) {
    console.error("Error in toggleArchiveNotification:", error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi lưu trữ thông báo',
      code: 'SERVER_ERROR'
    });
  }
};

// Lấy thông báo đã gửi của người dùng hiện tại
exports.getSentNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    
    // Set default userId for testing when auth is disabled
    const userId = req.user?.userId || 'admin';
    
    const query = { 
      SenderID: userId, 
      IsActive: true 
    };
    
    // Đếm tổng số thông báo thỏa mãn
    const total = await Notification.countDocuments(query);
    
    // Lấy danh sách thông báo với phân trang
    const notifications = await Notification
      .find(query)
      .sort({ SentDate: -1 }) // Sắp xếp theo thời gian gửi, mới nhất lên đầu
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    
    // Lấy thông tin người nhận
    const receiverIds = [...new Set(notifications.map(notif => notif.ReceiverID))];
    const receivers = await UserAccount
      .find({ userId: { $in: receiverIds } })
      .select('userId FullName avatar');
    
    const receiversMap = new Map(receivers.map(receiver => [receiver.userId, receiver]));
    
    // Thêm thông tin người nhận vào kết quả
    const enhancedNotifications = notifications.map(notif => ({
      ...notif.toObject(),
      receiver: receiversMap.get(notif.ReceiverID) || null
    }));

    res.status(200).json({
      success: true,
      data: {
        totalItems: total,
        totalPages: Math.ceil(total / limit),
        currentPage: parseInt(page),
        notifications: enhancedNotifications
      }
    });
  } catch (error) {
    console.error("Error in getSentNotifications:", error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi lấy thông báo đã gửi',
      code: 'SERVER_ERROR'
    });
  }
}; 