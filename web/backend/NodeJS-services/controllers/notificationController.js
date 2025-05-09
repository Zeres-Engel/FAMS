const mongoose = require('mongoose');
const errorService = require('../services/errorService');
const Notification = require('../database/models/Notification');
const UserAccount = require('../database/models/UserAccount');

// Lấy thông báo nhận được của người dùng đăng nhập
exports.getMyNotifications = async (req, res) => {
  try {
    // Thiết lập tham số phân trang
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Lấy các tham số tìm kiếm và lọc từ query
    const category = req.query.category || 'all';
    const search = req.query.search || '';
    
    // Kiểm tra xem có thông tin người dùng đã xác thực không
    if (!req.user || !req.user.userId) {
      return res.status(401).json({
        success: false,
        message: 'Không tìm thấy thông tin người dùng, vui lòng đăng nhập lại',
        code: 'AUTH_REQUIRED'
      });
    }
    
    const userId = req.user.userId;
    console.log("getMyNotifications - User ID:", userId, "Category:", category);
    
    // Xây dựng điều kiện tìm kiếm
    const baseQuery = {
      $or: [
        { ReceiverID: userId, IsActiveReceiver: true },
        { ReceiverID: userId, IsActiveReceiver: { $exists: false }, $or: [{ IsActive: true }, { IsActive: { $exists: false } }] },
        { SenderID: userId, IsActiveSender: true },
        { SenderID: userId, IsActiveSender: { $exists: false }, $or: [{ IsActive: true }, { IsActive: { $exists: false } }] }
      ]
    };
    
    // Thêm điều kiện tìm kiếm theo từ khóa
    if (search) {
      baseQuery.$or = baseQuery.$or.map(condition => ({
        ...condition,
        $or: [
          { Message: { $regex: search, $options: 'i' } },
          { Title: { $regex: search, $options: 'i' } }
        ]
      }));
    }
    
    // Điều kiện lọc theo danh mục
    let filterCondition = {};
    
    switch (category) {
      case 'read':
        filterCondition = { ReceiverID: userId, ReadStatus: true };
        break;
      case 'unread':
        filterCondition = { ReceiverID: userId, ReadStatus: false };
        break;
      case 'archive':
        filterCondition = { ReceiverID: userId, Archived: true };
        break;
      case 'sent':
        filterCondition = { SenderID: userId };
        break;
      case 'all':
      default:
        // Không thêm điều kiện lọc đặc biệt
        break;
    }
    
    const query = { ...baseQuery, ...filterCondition };
    console.log("getMyNotifications - Query:", JSON.stringify(query));
    
    // Thực hiện truy vấn đếm tổng số thông báo
    const totalItems = await Notification.countDocuments(query);
    
    // Thực hiện truy vấn lấy thông báo thoả mãn điều kiện
    const notifications = await Notification.find(query)
      .sort({ SentDate: -1 })
      .skip(skip)
      .limit(limit);

    console.log(`getMyNotifications - Found ${notifications.length} notifications`);
    
    // Đếm số thông báo chưa đọc
    const unreadCount = await Notification.countDocuments({
      ReceiverID: userId,
      ReadStatus: false,
      $or: [
        { IsActiveReceiver: true },
        { IsActiveReceiver: { $exists: false }, $or: [{ IsActive: true }, { IsActive: { $exists: false } }] }
      ]
    });
    
    // Bổ sung thông tin người gửi và người nhận
    const enhancedNotifications = [];
    
    for (const notification of notifications) {
      // Bổ sung thông tin người gửi nếu có
      let sender = null;
      if (notification.SenderID) {
        sender = await UserAccount.findOne({ userId: notification.SenderID });
      }
      
      // Bổ sung thông tin người nhận nếu có
      let receiver = null;
      if (notification.ReceiverID) {
        receiver = await UserAccount.findOne({ userId: notification.ReceiverID });
      }
      
      // Xác định loại thông báo: nhận hoặc gửi
      const type = notification.SenderID === userId ? 'sent' : 'received';
      
      enhancedNotifications.push({
        ...notification.toObject(),
        sender,
        receiver,
        type
      });
    }
    
    // Trả về kết quả thành công
    return res.status(200).json({
      success: true,
      data: {
        notifications: enhancedNotifications,
        unreadCount,
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
        currentPage: page
      }
    });
  } catch (error) {
    console.error("Error in getMyNotifications:", error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi lấy danh sách thông báo',
      code: 'SERVER_ERROR'
    });
  }
};

// Lấy chi tiết một thông báo cụ thể
exports.getNotificationById = async (req, res) => {
  try {
    const notificationIdParam = req.params.id;
    console.log("getNotificationById - Request for ID:", notificationIdParam, "Type:", typeof notificationIdParam);
    
    // Kiểm tra xem có thông tin người dùng đã xác thực không
    if (!req.user || !req.user.userId) {
      return res.status(401).json({
        success: false,
        message: 'Không tìm thấy thông tin người dùng, vui lòng đăng nhập lại',
        code: 'AUTH_REQUIRED'
      });
    }
    
    const userId = req.user.userId;
    
    // Tạo truy vấn cho cả ID dạng số và chuỗi
    const query = { $or: [] };
    
    if (!isNaN(notificationIdParam)) {
      query.$or.push({ NotificationID: parseInt(notificationIdParam) });
      query.$or.push({ NotificationID: notificationIdParam.toString() });
    } else {
      query.$or.push({ NotificationID: notificationIdParam });
    }
    
    console.log("getNotificationById - Query:", JSON.stringify(query));
    
    // Tìm thông báo
    const notification = await Notification.findOne(query);
    
    console.log("getNotificationById - Found:", notification ? "Yes" : "No");
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thông báo'
      });
    }
    
    // Kiểm tra xem người dùng hiện tại có phải là người gửi hoặc người nhận không
    const isSender = notification.SenderID === userId;
    const isReceiver = notification.ReceiverID === userId;
    
    if (!isSender && !isReceiver) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền xem thông báo này'
      });
    }
    
    // Nếu là người nhận và thông báo chưa đọc, tự động cập nhật trạng thái đã đọc
    if (isReceiver && !notification.ReadStatus) {
      await Notification.updateOne(
        query,
        { $set: { ReadStatus: true, UpdatedAt: new Date() } }
      );
    }
    
    // Lấy thông tin người gửi và người nhận để gửi kèm theo thông báo
    let senderInfo = null;
    let receiverInfo = null;
    
    if (notification.SenderID) {
      senderInfo = await UserAccount.findOne({ userId: notification.SenderID });
    }
    
    if (notification.ReceiverID) {
      receiverInfo = await UserAccount.findOne({ userId: notification.ReceiverID });
    }
    
    res.status(200).json({
      success: true,
      data: {
        ...notification.toObject(),
        sender: senderInfo,
        receiver: receiverInfo
      }
    });
  } catch (error) {
    console.error("Error in getNotificationById:", error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi lấy thông tin thông báo',
      code: 'SERVER_ERROR'
    });
  }
};

// Tạo thông báo mới
exports.createNotification = async (req, res) => {
  try {
    const { receiverId, message, title } = req.body;
    
    // Kiểm tra xem có thông tin người dùng đã xác thực không
    if (!req.user || !req.user.userId) {
      return res.status(401).json({
        success: false,
        message: 'Không tìm thấy thông tin người dùng, vui lòng đăng nhập lại',
        code: 'AUTH_REQUIRED'
      });
    }
    
    const senderId = req.user.userId;
    
    if (!receiverId || !message) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu thông tin người nhận hoặc nội dung thông báo',
        code: 'MISSING_FIELDS'
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
        message: 'Không tìm thấy người nhận',
        code: 'RECEIVER_NOT_FOUND'
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
    const notificationIdParam = req.params.id;
    console.log("markAsRead - Received ID:", notificationIdParam, "Type:", typeof notificationIdParam);
    
    // Kiểm tra xem có thông tin người dùng đã xác thực không
    if (!req.user || !req.user.userId) {
      return res.status(401).json({
        success: false,
        message: 'Không tìm thấy thông tin người dùng, vui lòng đăng nhập lại',
        code: 'AUTH_REQUIRED'
      });
    }
    
    const userId = req.user.userId;
    console.log("markAsRead - User ID:", userId);
    
    // Tìm kiếm thông báo với điều kiện linh hoạt hơn
    // Thử nhiều cách khác nhau: số nguyên, chuỗi, và MongoDB ObjectId (nếu có)
    const query = {
      ReceiverID: userId,
      $or: [
        { IsActive: true },
        { IsActive: { $exists: false } }
      ]
    };
    
    // Thêm điều kiện NotificationID phù hợp với cả trường hợp số và chuỗi
    if (!isNaN(notificationIdParam)) {
      query.$or.push({ NotificationID: parseInt(notificationIdParam) });
      query.$or.push({ NotificationID: notificationIdParam.toString() });
    } else {
      query.$or.push({ NotificationID: notificationIdParam });
    }
    
    console.log("markAsRead - Query:", JSON.stringify(query));
    
    const notification = await Notification.findOne(query);
    
    console.log("markAsRead - Found notification:", notification ? "Yes" : "No");
    
    if (!notification) {
      // Thử tìm kiếm chỉ với ID (bỏ qua điều kiện ReceiverID và IsActive)
      const fallbackNotification = await Notification.findOne({ 
        $or: [
          { NotificationID: parseInt(notificationIdParam) },
          { NotificationID: notificationIdParam.toString() }
        ]
      });
      
      console.log("markAsRead - Fallback search:", fallbackNotification ? 
        "Found but doesn't match other criteria" : "Not found at all");
      
      if (fallbackNotification) {
        console.log("markAsRead - Debug info:", {
          id: fallbackNotification.NotificationID,
          receiverId: fallbackNotification.ReceiverID,
          yourId: userId,
          isActive: fallbackNotification.IsActive
        });
      }
      
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thông báo'
      });
    }
    
    // Cập nhật trạng thái đọc
    const updateResult = await Notification.updateOne(
      { 
        $or: [
          { NotificationID: parseInt(notificationIdParam) },
          { NotificationID: notificationIdParam.toString() }
        ]
      },
      { 
        $set: { 
          ReadStatus: true,
          UpdatedAt: new Date()
        } 
      }
    );
    
    console.log("markAsRead - Update result:", updateResult);
    
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
    // Kiểm tra xem có thông tin người dùng đã xác thực không
    if (!req.user || !req.user.userId) {
      return res.status(401).json({
        success: false,
        message: 'Không tìm thấy thông tin người dùng, vui lòng đăng nhập lại',
        code: 'AUTH_REQUIRED'
      });
    }
    
    const userId = req.user.userId;
    
    // Tìm và cập nhật tất cả thông báo chưa đọc của người dùng
    const result = await Notification.updateMany(
      { ReceiverID: userId, ReadStatus: false, IsActive: true },
      { ReadStatus: true, UpdatedAt: new Date() }
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
    
    // Kiểm tra xem có thông tin người dùng đã xác thực không
    if (!req.user || !req.user.userId) {
      return res.status(401).json({
        success: false,
        message: 'Không tìm thấy thông tin người dùng, vui lòng đăng nhập lại',
        code: 'AUTH_REQUIRED'
      });
    }
    
    const userId = req.user.userId;
    
    // Tìm thông báo dựa vào ID
    const notification = await Notification.findOne({
      NotificationID: notificationId
    });
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thông báo'
      });
    }
    
    // Xác định người dùng hiện tại là người gửi hay người nhận
    const isSender = notification.SenderID === userId;
    const isReceiver = notification.ReceiverID === userId;
    
    if (!isSender && !isReceiver) {
      return res.status(403).json({
        success: false,
        message: 'Không có quyền xóa thông báo này'
      });
    }
    
    let updateData = {};
    
    // Cập nhật trạng thái tương ứng
    if (isSender) {
      updateData.IsActiveSender = false;
    }
    
    if (isReceiver) {
      updateData.IsActiveReceiver = false;
    }
    
    // Cập nhật thông báo
    await Notification.updateOne(
      { NotificationID: notificationId },
      { 
        $set: {
          ...updateData,
          UpdatedAt: new Date()
        } 
      }
    );
    
    // Kiểm tra xem cả người gửi và người nhận đều đã xóa thông báo chưa
    // Nếu cả hai đều đã xóa, tiến hành xóa vĩnh viễn thông báo
    if ((isSender && !notification.IsActiveReceiver) || (isReceiver && !notification.IsActiveSender)) {
      // Tiến hành xóa vĩnh viễn thông báo khỏi database
      await Notification.deleteOne({ NotificationID: notificationId });
      console.log(`Đã xóa vĩnh viễn thông báo ${notificationId} khỏi database`);
    }
    
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

// Kiểm tra quyền hạn cho việc gửi thông báo
const checkSendPermission = (userRole, targetRole, res) => {
  if (userRole === 'admin') return true; // Admin có thể gửi cho tất cả
  
  if (userRole === 'teacher') {
    // Giáo viên chỉ có thể gửi cho học sinh, admin hoặc lớp
    if (['student', 'admin', 'class'].includes(targetRole)) return true;
  } 
  
  if (userRole === 'student') {
    // Học sinh chỉ có thể gửi cho giáo viên
    if (targetRole === 'teacher') return true;
  }
  
  // Không có quyền gửi
  if (res) {
    res.status(403).json({
      success: false,
      message: 'Bạn không có quyền gửi thông báo cho đối tượng này',
      code: 'PERMISSION_DENIED'
    });
  }
  
  return false;
};

// Gửi thông báo cho tất cả học sinh
exports.sendNotificationToAllStudents = async (req, res) => {
  try {
    const { message, title } = req.body;
    
    // Kiểm tra xem có thông tin người dùng đã xác thực không
    if (!req.user || !req.user.userId) {
      return res.status(401).json({
        success: false,
        message: 'Không tìm thấy thông tin người dùng, vui lòng đăng nhập lại',
        code: 'AUTH_REQUIRED'
      });
    }
    
    const senderId = req.user.userId;
    const userRole = req.user.role || 'student';
    
    // Kiểm tra quyền gửi cho tất cả học sinh (chỉ admin và giáo viên mới có quyền)
    if (!checkSendPermission(userRole, 'student', res)) return;
    
    if (!message) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu nội dung thông báo'
      });
    }
    
    console.log('Đang lấy danh sách học sinh từ collection Student...');
    
    // Lấy tất cả học sinh từ bảng Student thay vì UserAccount
    const students = await mongoose.connection.db.collection('Student')
      .find({ 
        $or: [
          { isActive: true },
          { IsActive: true }
        ]
      })
      .project({ userId: 1, UserID: 1 })
      .toArray();
    
    // Lấy ID học sinh, xem xét cả hai khả năng về tên trường
    const studentIds = students.map(student => student.userId || student.UserID).filter(id => id);
    
    console.log(`Tìm thấy ${studentIds.length} học sinh từ collection Student`);
    
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
    
    // Kiểm tra xem có thông tin người dùng đã xác thực không
    if (!req.user || !req.user.userId) {
      return res.status(401).json({
        success: false,
        message: 'Không tìm thấy thông tin người dùng, vui lòng đăng nhập lại',
        code: 'AUTH_REQUIRED'
      });
    }
    
    const senderId = req.user.userId;
    const userRole = req.user.role || 'student';
    
    // Kiểm tra quyền gửi cho tất cả giáo viên (chỉ học sinh và admin mới có quyền)
    if (!checkSendPermission(userRole, 'teacher', res)) return;
    
    if (!message) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu nội dung thông báo'
      });
    }
    
    console.log('Đang lấy danh sách giáo viên từ collection Teacher...');
    
    // Lấy tất cả giáo viên từ bảng Teacher thay vì UserAccount
    const teachers = await mongoose.connection.db.collection('Teacher')
      .find({ 
        $or: [
          { isActive: true },
          { IsActive: true }
        ]
      })
      .project({ userId: 1, UserID: 1 })
      .toArray();
    
    // Lấy ID giáo viên, xem xét cả hai khả năng về tên trường
    const teacherIds = teachers.map(teacher => teacher.userId || teacher.UserID).filter(id => id);
    
    console.log(`Tìm thấy ${teacherIds.length} giáo viên từ collection Teacher`);
    
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
    
    // Kiểm tra xem có thông tin người dùng đã xác thực không
    if (!req.user || !req.user.userId) {
      return res.status(401).json({
        success: false,
        message: 'Không tìm thấy thông tin người dùng, vui lòng đăng nhập lại',
        code: 'AUTH_REQUIRED'
      });
    }
    
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
    
    // Kiểm tra xem có thông tin người dùng đã xác thực không
    if (!req.user || !req.user.userId) {
      return res.status(401).json({
        success: false,
        message: 'Không tìm thấy thông tin người dùng, vui lòng đăng nhập lại',
        code: 'AUTH_REQUIRED'
      });
    }
    
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
    
    // Kiểm tra xem có thông tin người dùng đã xác thực không
    if (!req.user || !req.user.userId) {
      return res.status(401).json({
        success: false,
        message: 'Không tìm thấy thông tin người dùng, vui lòng đăng nhập lại',
        code: 'AUTH_REQUIRED'
      });
    }
    
    const senderId = req.user.userId;
    const userRole = req.user.role || 'student';
    
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
    
    // Kiểm tra quyền hạn dựa trên vai trò của người nhận
    const receiverRole = receiverExists.Role || receiverExists.role || 'student';
    if (!checkSendPermission(userRole, receiverRole.toLowerCase(), res)) return;
    
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
    
    console.log(`Đang gửi thông báo cho lớp có classId=${classId}`);
    
    // Kiểm tra xem có thông tin người dùng đã xác thực không
    if (!req.user || !req.user.userId) {
      return res.status(401).json({
        success: false,
        message: 'Không tìm thấy thông tin người dùng, vui lòng đăng nhập lại',
        code: 'AUTH_REQUIRED'
      });
    }
    
    const senderId = req.user.userId;
    const userRole = req.user.role || 'student';
    
    // Kiểm tra quyền gửi cho lớp (chỉ admin và giáo viên mới có quyền)
    if (!checkSendPermission(userRole, 'class', res)) return;
    
    if (!message || !classId) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu nội dung thông báo hoặc classId'
      });
    }

    // Kiểm tra lớp có tồn tại không - sửa từ ClassID thành classId cho đúng với API classes
    console.log(`Đang tìm lớp với classId=${classId}...`);
    const classObj = await mongoose.connection.db.collection('Class').findOne({ classId: parseInt(classId), isActive: true });
    
    if (!classObj) {
      console.log(`Không tìm thấy lớp có classId=${classId}`);
      
      // Thử tìm kiếm bằng cách khác nếu không tìm thấy
      console.log('Đang thử tìm lớp với nhiều cách...');
      
      const altClassSearch = await mongoose.connection.db.collection('Class').findOne({
        $or: [
          { classId: parseInt(classId) },
          { ClassID: parseInt(classId) },
          { _id: classId },
          { id: classId }
        ]
      });
      
      if (altClassSearch) {
        console.log('Đã tìm thấy lớp với cách tìm kiếm thay thế:', altClassSearch);
        // Tiếp tục xử lý với lớp tìm được
        return res.status(200).json({
          success: true,
          message: 'Đã tìm thấy lớp với cách tìm kiếm thay thế, vui lòng kiểm tra lại controller',
          data: altClassSearch
        });
      }
      
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy lớp học'
      });
    }
    
    console.log(`Đã tìm thấy lớp: ${classObj.className || classObj.ClassName || 'Unnamed'}`);
    
    // Lấy danh sách học sinh thuộc lớp này - kiểm tra nhiều khả năng về cấu trúc dữ liệu
    console.log(`Đang tìm học sinh thuộc lớp ${classId}...`);
    const students = await mongoose.connection.db.collection('Student')
      .find({ 
        $or: [
          { classId: parseInt(classId), isActive: true },
          { classIds: parseInt(classId), isActive: true },
          { classIds: { $in: [parseInt(classId)] }, isActive: true },
          { classId: { $in: [parseInt(classId)] }, isActive: true },
          { ClassIDs: parseInt(classId), IsActive: true },
          { ClassIDs: { $in: [parseInt(classId)] }, IsActive: true },
          { ClassID: parseInt(classId), IsActive: true }
        ]
      })
      .project({ userId: 1, UserID: 1 }) // Bao gồm cả userId và UserID
      .toArray();
    
    console.log(`Tìm thấy ${students.length} học sinh thuộc lớp ${classId}`);
    
    // Xử lý để lấy ID học sinh, xem xét cả hai khả năng
    const studentIds = students.map(student => student.userId || student.UserID);
    
    // Phân tích cấu trúc dữ liệu của lớp học để sử dụng trong tương lai
    if (classObj) {
      console.log('Cấu trúc dữ liệu của lớp học:', Object.keys(classObj));
      
      // Lưu thông tin về cấu trúc dữ liệu vào file log hoặc DB để sử dụng sau này
      const classStructure = {
        hasClassId: !!classObj.classId,
        hasClassID: !!classObj.ClassID,
        hasClassName: !!classObj.className,
        hasClassName_uppercase: !!classObj.ClassName,
        isActive_field: classObj.isActive !== undefined ? 'isActive' : 
                       classObj.IsActive !== undefined ? 'IsActive' : 'unknown'
      };
      
      console.log('Kết quả phân tích cấu trúc lớp học:', classStructure);
    }
    
    // Phân tích cấu trúc dữ liệu của học sinh nếu có
    if (students.length > 0) {
      console.log('Cấu trúc dữ liệu của học sinh đầu tiên:', Object.keys(students[0]));
    }
    
    // Thử tìm học sinh từ một API thay thế nếu student API không hoạt động
    if (studentIds.length === 0) {
      try {
        const axios = require('axios');
        console.log('Thử gọi API lấy thông tin lớp để xem học sinh:', `http://fams.io.vn/api-nodejs/classes/${classId}`);
        const classResponse = await axios.get(`http://fams.io.vn/api-nodejs/classes/${classId}`);
        
        if (classResponse.data && classResponse.data.success && classResponse.data.data) {
          console.log('Thông tin lớp:', classResponse.data.data);
          console.log('Cấu trúc dữ liệu lớp từ API:', Object.keys(classResponse.data.data));
          
          // Kiểm tra xem có trường students không
          if (classResponse.data.data.students && classResponse.data.data.students.length > 0) {
            console.log(`Tìm thấy ${classResponse.data.data.students.length} học sinh từ API classes`);
            const altStudentIds = classResponse.data.data.students.map(student => student.userId || student.UserID);
            
            if (altStudentIds.length > 0) {
              // Sử dụng danh sách học sinh này để gửi thông báo
              studentIds.push(...altStudentIds);
              console.log(`Cập nhật danh sách học sinh, có ${studentIds.length} học sinh từ API classes`);
            }
          }
        }
      } catch (altApiError) {
        console.error('Lỗi khi gọi API thay thế:', altApiError);
      }
    }
    
    // Nếu vẫn không tìm thấy học sinh nào sau khi đã thử tất cả các cách
    if (studentIds.length === 0) {
      console.log('Không tìm thấy học sinh nào sau khi đã thử tất cả các cách');
      
      return res.status(200).json({
        success: true,
        message: 'Không có học sinh nào trong lớp này',
        data: {
          classId,
          className: classObj.className || classObj.ClassName || 'Unknown class'
        }
      });
    }
    
    console.log(`Đang gửi thông báo cho ${studentIds.length} học sinh...`);
    const result = await createNotificationBatch(studentIds, senderId, message, { 
      Title: title, 
      ClassID: parseInt(classId),
      ClassName: classObj.className // Sửa từ ClassName thành className
    });
    
    if (!result.success) {
      console.log('Lỗi khi gửi thông báo:', result.message);
      return res.status(400).json({
        success: false,
        message: result.message,
        code: result.code
      });
    }
    
    console.log(`Đã gửi thông báo thành công cho ${result.count} học sinh`);
    return res.status(201).json({
      success: result.success,
      message: result.message,
      data: {
        classId,
        className: classObj.className, // Sửa từ ClassName thành className
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
    const { message, userIds, title } = req.body;
    
    // Kiểm tra xem có thông tin người dùng đã xác thực không
    if (!req.user || !req.user.userId) {
      return res.status(401).json({
        success: false,
        message: 'Không tìm thấy thông tin người dùng, vui lòng đăng nhập lại',
        code: 'AUTH_REQUIRED'
      });
    }
    
    const senderId = req.user.userId;
    const userRole = req.user.role || 'student';
    
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
    
    // Kiểm tra quyền hạn khi gửi cho admin nếu không phải là admin
    if (recipients.includes('admin') && userRole !== 'admin' && userRole !== 'teacher') {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền gửi thông báo cho admin',
        code: 'PERMISSION_DENIED'
      });
    }
    
    // Kiểm tra từng người nhận có tồn tại không và có quyền gửi không
    const receiversInfo = await mongoose.connection.db.collection('UserAccount')
      .find({
        $or: [
          { UserID: { $in: recipients }, IsActive: true },
          { userId: { $in: recipients }, isActive: true }
        ]
      })
      .project({ UserID: 1, Role: 1, userId: 1, role: 1 })
      .toArray();
    
    // Kiểm tra quyền gửi dựa trên vai trò của từng người nhận
    for (const receiver of receiversInfo) {
      const receiverRole = (receiver.Role || receiver.role || '').toLowerCase();
      // Chỉ kiểm tra cho người dùng không phải admin
      if (userRole !== 'admin' && !checkSendPermission(userRole, receiverRole, null)) {
        return res.status(403).json({
          success: false,
          message: `Bạn không có quyền gửi thông báo cho người dùng có vai trò ${receiverRole}`,
          code: 'PERMISSION_DENIED'
        });
      }
    }
    
    // Sử dụng hàm createNotificationBatch để gửi thông báo
    const result = await createNotificationBatch(recipients, senderId, message, { Title: title });
    
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
    
    // Kiểm tra xem có thông tin người dùng đã xác thực không
    if (!req.user || !req.user.userId) {
      return res.status(401).json({
        success: false,
        message: 'Không tìm thấy thông tin người dùng, vui lòng đăng nhập lại',
        code: 'AUTH_REQUIRED'
      });
    }
    
    const userId = req.user.userId;
    
    // Kiểm tra xem thông báo có tồn tại không và thuộc về người dùng không
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

// Lấy thông báo đã gửi của người dùng
exports.getSentNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    
    // Kiểm tra xem có thông tin người dùng đã xác thực không
    if (!req.user || !req.user.userId) {
      return res.status(401).json({
        success: false,
        message: 'Không tìm thấy thông tin người dùng, vui lòng đăng nhập lại',
        code: 'AUTH_REQUIRED'
      });
    }
    
    const userId = req.user.userId;
    
    const query = { 
      SenderID: userId, 
      IsActiveSender: true  // Chỉ hiển thị thông báo mà người gửi chưa xóa
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

// Gửi thông báo cho tất cả người dùng (trừ người gửi)
exports.sendNotificationToAllUsers = async (req, res) => {
  try {
    const { message, title } = req.body;
    
    // Kiểm tra xem có thông tin người dùng đã xác thực không
    if (!req.user || !req.user.userId) {
      return res.status(401).json({
        success: false,
        message: 'Không tìm thấy thông tin người dùng, vui lòng đăng nhập lại',
        code: 'AUTH_REQUIRED'
      });
    }
    
    const senderId = req.user.userId;
    const userRole = req.user.role || 'student';
    
    // Chỉ admin mới có quyền gửi cho tất cả người dùng
    if (userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền gửi thông báo cho tất cả người dùng',
        code: 'PERMISSION_DENIED'
      });
    }
    
    if (!message) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu nội dung thông báo'
      });
    }
    
    console.log('Đang lấy danh sách tất cả người dùng từ collection UserAccount...');
    
    // Lấy tất cả người dùng từ bảng UserAccount, trừ người gửi
    const users = await mongoose.connection.db.collection('UserAccount')
      .find({ 
        $and: [
          { 
            $or: [
              { isActive: true },
              { IsActive: true }
            ]
          },
          {
            $or: [
              { userId: { $ne: senderId } },
              { UserID: { $ne: senderId } }
            ]
          }
        ]
      })
      .project({ userId: 1, UserID: 1 })
      .toArray();
    
    // Lấy ID người dùng, xem xét cả hai khả năng về tên trường
    const userIds = users.map(user => user.userId || user.UserID).filter(id => id);
    
    console.log(`Tìm thấy ${userIds.length} người dùng từ collection UserAccount (không bao gồm người gửi)`);
    
    if (userIds.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'Không có người dùng nào trong hệ thống',
        data: {
          recipientCount: 0,
          recipientType: 'All Users'
        }
      });
    }
    
    const result = await createNotificationBatch(userIds, senderId, message, { Title: title });
    
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
        recipientType: 'All Users'
      }
    });
  } catch (error) {
    console.error("Error in sendNotificationToAllUsers:", error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi gửi thông báo cho tất cả người dùng',
      code: 'SERVER_ERROR'
    });
  }
};

// Lấy thông tin thông báo để gỡ lỗi
exports.debugNotification = async (req, res) => {
  try {
    const notificationIdParam = req.params.id;
    console.log("debugNotification - Request for ID:", notificationIdParam, "Type:", typeof notificationIdParam);
    
    // Kiểm tra quyền admin
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Chỉ admin mới có quyền sử dụng tính năng này',
        code: 'PERMISSION_DENIED'
      });
    }
    
    // Thử tìm kiếm với nhiều kiểu khác nhau
    const results = {
      exactString: null,
      exactNumber: null,
      mongoObjectId: null,
      allNotifications: []
    };
    
    // Tìm kiếm chính xác chuỗi
    results.exactString = await Notification.findOne({ 
      NotificationID: notificationIdParam
    });
    
    // Tìm kiếm chính xác số
    if (!isNaN(notificationIdParam)) {
      results.exactNumber = await Notification.findOne({
        NotificationID: parseInt(notificationIdParam)
      });
    }
    
    // Lấy tất cả thông báo để kiểm tra (giới hạn 20)
    const allNotifications = await Notification.find().limit(20);
    results.allNotifications = allNotifications.map(n => ({
      id: n.NotificationID,
      idType: typeof n.NotificationID,
      sender: n.SenderID,
      receiver: n.ReceiverID,
      readStatus: n.ReadStatus,
      isActive: n.IsActive,
      isActiveSender: n.IsActiveSender,
      isActiveReceiver: n.IsActiveReceiver,
      createdAt: n.CreatedAt
    }));
    
    // Trả về kết quả để phân tích
    res.status(200).json({
      success: true,
      data: results,
      metadata: {
        requestId: notificationIdParam,
        requestIdType: typeof notificationIdParam,
        totalNotifications: results.allNotifications.length
      }
    });
  } catch (error) {
    console.error("Error in debugNotification:", error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi tìm kiếm thông báo để gỡ lỗi',
      code: 'SERVER_ERROR'
    });
  }
}; 