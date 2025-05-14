const mongoose = require('mongoose');
const RFID = require('../database/models/RFID');
const UserAccount = require('../database/models/UserAccount');
const asyncHandler = require('../middleware/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');

/**
 * Parse expiry date from format string
 * @param {string} expiryFormat - Format string like "1y", "2y", "3y" or a valid date string
 * @returns {Date} Calculated expiry date
 */
const parseExpiryDate = (expiryFormat) => {
  // If no expiry format provided, default to 3 years
  if (!expiryFormat) {
    const expiryDate = new Date();
    expiryDate.setFullYear(expiryDate.getFullYear() + 3);
    return expiryDate;
  }

  // Check if the format is like "1y", "2y", "3y"
  const yearMatch = expiryFormat.match(/^(\d+)y$/);
  if (yearMatch) {
    const years = parseInt(yearMatch[1], 10);
    const expiryDate = new Date();
    expiryDate.setFullYear(expiryDate.getFullYear() + years);
    return expiryDate;
  }

  // Otherwise, assume it's a valid date string
  return new Date(expiryFormat);
};

// @desc    Get all RFID cards with pagination
// @route   GET /api/rfid
// @access  Private
exports.getAllRFIDs = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  
  // Build query
  let query = {};
  
  // Apply search filter if provided
  if (req.query.search) {
    query.$or = [
      { RFID_ID: { $regex: req.query.search, $options: 'i' } },
      { UserID: { $regex: req.query.search, $options: 'i' } }
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
  const total = await RFID.countDocuments(query);
  const rfids = await RFID.find(query)
    .populate('user', 'userId username email role')
    .skip(startIndex)
    .limit(limit)
    .sort({ IssueDate: -1 });
  
  // Pagination result
  const pagination = {
    total,
    page,
    limit,
    pages: Math.ceil(total / limit)
  };
  
  res.status(200).json({
    success: true,
    count: rfids.length,
    pagination,
    data: rfids
  });
});

// @desc    Get RFID by ID
// @route   GET /api/rfid/:id
// @access  Private
exports.getRFIDById = asyncHandler(async (req, res, next) => {
  const rfid = await RFID.findOne({ RFID_ID: req.params.id }).populate('user');
  
  if (!rfid) {
    return next(new ErrorResponse(`RFID with ID ${req.params.id} not found`, 404, 'RFID_NOT_FOUND'));
  }
  
  res.status(200).json({
    success: true,
    data: rfid
  });
});

// @desc    Get RFID by User ID
// @route   GET /api/rfid/user/:userId
// @access  Private
exports.getRFIDByUserId = asyncHandler(async (req, res, next) => {
  const rfid = await RFID.findOne({ UserID: req.params.userId }).populate('user');
  
  if (!rfid) {
    return next(new ErrorResponse(`RFID for user ${req.params.userId} not found`, 404, 'RFID_NOT_FOUND'));
  }
  
  res.status(200).json({
    success: true,
    data: rfid
  });
});

// @desc    Create new RFID
// @route   POST /api/rfid
// @access  Private (Admin)
exports.createRFID = asyncHandler(async (req, res, next) => {
  // Validate required fields
  const { RFID_ID, UserID, ExpiryDate } = req.body;
  
  if (!RFID_ID || !UserID) {
    return res.status(400).json({
      success: false,
      message: "RFID_ID and UserID are required fields",
      code: "MISSING_FIELDS"
    });
  }
  
  // Validate the UserID exists
  const user = await UserAccount.findOne({ userId: UserID });
  if (!user) {
    return res.status(400).json({
      success: false,
      message: `User with ID ${UserID} not found`,
      code: "INVALID_USER_ID"
    });
  }
  
  // Check if RFID already exists
  const existingRFID = await RFID.findOne({ RFID_ID });
  if (existingRFID) {
    return res.status(400).json({
      success: false,
      message: `RFID with ID ${RFID_ID} already exists`,
      code: "DUPLICATE_RFID"
    });
  }

  // Check if user already has an RFID card
  const existingUserRFID = await RFID.findOne({ UserID });
  if (existingUserRFID) {
    return res.status(400).json({
      success: false,
      message: `User ${UserID} already has an RFID card: ${existingUserRFID.RFID_ID}`,
      code: "USER_HAS_RFID"
    });
  }
  
  try {
    // Parse expiry date
    const rfidData = {
      RFID_ID,
      UserID,
      ExpiryDate: parseExpiryDate(ExpiryDate),
      IssueDate: new Date(),
      Status: 'Active'
    };
    
    // Create the RFID
    const rfid = await RFID.create(rfidData);
    
    res.status(201).json({
      success: true,
      data: rfid,
      message: 'RFID created successfully'
    });
  } catch (error) {
    console.error('Error creating RFID:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error creating RFID',
      code: 'CREATE_RFID_ERROR'
    });
  }
});

// @desc    Update RFID 
// @route   PUT /api/rfid/:id
// @access  Private (Admin)
exports.updateRFID = asyncHandler(async (req, res, next) => {
  try {
    // Tìm kiếm RFID bằng cả RFID_ID hoặc UserID
    let query = {};
    if (mongoose.isValidObjectId(req.params.id)) {
      query = { _id: req.params.id };
    } else if (req.params.id.startsWith('user-')) {
      // Format: user-{userId}
      const userId = req.params.id.substring(5);
      query = { userId: userId };
    } else {
      // Tìm kiếm theo RFID_ID (cách cũ) hoặc userId
      query = { 
        $or: [
          { RFID_ID: req.params.id },
          { rfidId: req.params.id },
          { userId: req.params.id }
        ]
      };
    }

    let rfid = await RFID.findOne(query);
    
    if (!rfid) {
      return res.status(404).json({
        success: false,
        message: `RFID with ID/UserID ${req.params.id} not found`,
        code: 'RFID_NOT_FOUND'
      });
    }
    
    // If UserID is being updated, validate it exists
    if (req.body.UserID) {
      const user = await UserAccount.findOne({ userId: req.body.UserID });
      if (!user) {
        return res.status(400).json({
          success: false,
          message: `User with ID ${req.body.UserID} not found`,
          code: 'INVALID_USER_ID'
        });
      }
  
      // Check if the new user already has an RFID card (except the current one)
      const existingUserRFID = await RFID.findOne({ 
        UserID: req.body.UserID, 
        _id: { $ne: rfid._id } 
      });
  
      if (existingUserRFID) {
        return res.status(400).json({
          success: false,
          message: `User ${req.body.UserID} already has an RFID card: ${existingUserRFID.RFID_ID}`,
          code: 'USER_HAS_RFID'
        });
      }
    }
  
    // Process expiry date if provided
    const updateData = { ...req.body };
    
    // Xử lý ExpiryDate từ số năm (0, 1, 2, 3)
    if (req.body.ExpiryYears !== undefined) {
      const years = parseInt(req.body.ExpiryYears, 10);
      const issueDate = rfid.IssueDate || rfid.createdAt || new Date();
      
      // Nếu years = 0, ExpiryDate = null (thẻ không hết hạn)
      if (years === 0) {
        updateData.ExpiryDate = null;
      } else {
        // Tính ExpiryDate = IssueDate + số năm
        const expiryDate = new Date(issueDate);
        expiryDate.setFullYear(expiryDate.getFullYear() + years);
        updateData.ExpiryDate = expiryDate;
      }
      
      // Xóa trường ExpiryYears ra khỏi dữ liệu update
      delete updateData.ExpiryYears;
    } else if (req.body.ExpiryDate) {
      updateData.ExpiryDate = parseExpiryDate(req.body.ExpiryDate);
    }
    
    // Update RFID
    rfid = await RFID.findOneAndUpdate(
      query,
      updateData,
      { new: true, runValidators: true }
    );
    
    res.status(200).json({
      success: true,
      data: rfid,
      message: 'RFID updated successfully'
    });
  } catch (error) {
    console.error('Error updating RFID:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating RFID',
      code: 'UPDATE_RFID_ERROR'
    });
  }
});

// @desc    Delete RFID
// @route   DELETE /api/rfid/:id
// @access  Private (Admin)
exports.deleteRFID = asyncHandler(async (req, res, next) => {
  try {
    const rfid = await RFID.findOne({ RFID_ID: req.params.id });
    
    if (!rfid) {
      return res.status(404).json({
        success: false,
        message: `RFID with ID ${req.params.id} not found`,
        code: 'RFID_NOT_FOUND'
      });
    }
    
    await rfid.deleteOne();
    
    res.status(200).json({
      success: true,
      message: 'RFID deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting RFID:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error deleting RFID',
      code: 'DELETE_RFID_ERROR'
    });
  }
});

// @desc    Lấy danh sách thẻ RFID với thông tin người dùng
// @route   GET /api/rfid/users
// @access  Private
exports.getAllRFIDWithUserInfo = asyncHandler(async (req, res, next) => {
  try {
    console.log("==== FETCHING RFID DATA WITH NEW APPROACH ====");
    
    // Truy vấn dữ liệu từ model RFID
    const rfids = await RFID.find({}).lean();
    console.log(`Found ${rfids.length} RFID records`);
    
    // Log mẫu để kiểm tra cấu trúc
    if (rfids.length > 0) {
      console.log("Sample RFID record:", JSON.stringify(rfids[0]));
    }
    
    // Truy vấn mẫu từ các collection khác để kiểm tra
    const userSample = await UserAccount.findOne().lean();
    console.log("Sample UserAccount:", userSample ? JSON.stringify(userSample) : "None");
    
    const rfidArray = [];
    
    // Kiểm tra dữ liệu trong MongoDB Shell
    console.log(`
    // Bạn có thể dùng lệnh này trong MongoDB Shell để xem dữ liệu:
    db.getCollection('rfids').find({}).limit(5);
    db.getCollection('userAccounts').find({}).limit(5);
    `);
    
    // Truy vấn và kết hợp dữ liệu
    for (const rfid of rfids) {
      // Log toàn bộ các trường của bản ghi để debug
      console.log(`RFID record fields: ${Object.keys(rfid).join(', ')}`);
      
      // Kiểm tra trường user hoặc userId
      let userId = null;
      let rfidValue = null;
      
      // Tìm bất kỳ trường nào có thể chứa userId
      Object.keys(rfid).forEach(key => {
        const value = rfid[key];
        if (typeof value === 'string') {
          console.log(`Field ${key} = ${value}`);
          
          // Phát hiện trường RFID
          if ((key === 'rfid' || key === 'rfidId' || key === 'RFID_ID' || key.includes('rfid')) &&
              !rfidValue) {
            rfidValue = value;
            console.log(`Found RFID value: ${rfidValue} in field ${key}`);
          }
          
          // Phát hiện userId
          if ((key === 'userId' || key === 'UserID' || key === 'user' || key.includes('user')) &&
              key !== '_id' && !userId) {
            userId = value;
            console.log(`Found userId: ${userId} in field ${key}`);
          }
        }
      });
      
      // Nếu không tìm thấy các trường, sử dụng giá trị mặc định
      let userInfo = { fullName: 'Unknown User', role: 'unknown' };
      
      // Thử tìm thông tin người dùng nếu có userId
      if (userId) {
        try {
          // Tìm thông tin người dùng trong UserAccount
          const user = await UserAccount.findOne({ userId }).lean();
          
          if (user) {
            userInfo.role = user.role || 'unknown';
            
            // Tìm fullName dựa trên role
            if (user.role === 'teacher') {
              const Teacher = require('../database/models/Teacher');
              const teacher = await Teacher.findOne({ userId }).lean();
              if (teacher && teacher.fullName) {
                userInfo.fullName = teacher.fullName;
              } else if (user.username) {
                userInfo.fullName = user.username;
              }
            } else if (user.role === 'student') {
              const Student = require('../database/models/Student');
              const student = await Student.findOne({ userId }).lean();
              if (student && student.fullName) {
                userInfo.fullName = student.fullName;
              } else if (user.username) {
                userInfo.fullName = user.username;
              }
            } else if (user.username) {
              userInfo.fullName = user.username;
            }
          }
        } catch (error) {
          console.error(`Error finding user info for ${userId}:`, error.message);
        }
      }
      
      rfidArray.push({
        userID: userId || 'unknown',
        fullName: userInfo.fullName,
        role: userInfo.role,
        rfid: rfidValue || 'unknown',
        expireTime: rfid.expireTime || rfid.ExpiryDate || rfid.updatedAt || rfid.createdAt,
        _id: rfid._id,
        id: rfid.id || rfid._id
      });
    }
    
    return res.status(200).json({
      success: true,
      count: rfidArray.length,
      data: rfidArray
    });
    
  } catch (error) {
    console.error('Error in getAllRFIDWithUserInfo:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching RFID data',
      error: error.message || error
    });
  }
});

// @desc    Lấy thông tin thẻ RFID của một người dùng cụ thể
// @route   GET /api/rfid/users/:id
// @access  Private
exports.getUserRFID = asyncHandler(async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Tìm thẻ RFID theo userId
    const rfid = await RFID.findOne({ UserID: id, Status: 'Active' });
    
    if (!rfid) {
      return res.status(404).json({
        success: false,
        message: `Không tìm thấy thẻ RFID cho người dùng ${id}`
      });
    }
    
    // Lấy thông tin người dùng
    const user = await UserAccount.findOne({ userId: id });
    
    // Tạo đối tượng kết quả
    const result = {
      userID: rfid.UserID,
      fullName: user ? (user.username || user.email?.split('@')[0]) : rfid.UserID,
      role: user ? user.role : 'unknown',
      rfid: rfid.RFID_ID,
      expireTime: rfid.ExpiryDate,
      issueDate: rfid.IssueDate,
      status: rfid.Status
    };
    
    return res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error(`Error fetching RFID for user ${req.params.id}:`, error);
    return res.status(500).json({
      success: false,
      message: 'Không thể lấy dữ liệu thẻ RFID',
      error: error.message
    });
  }
});

// @desc    Tạo thẻ RFID mới
// @route   POST /api/rfid/create
// @access  Private (Admin)
exports.createNewRFID = asyncHandler(async (req, res, next) => {
  try {
    const { userId, rfidId } = req.body;
    
    // Kiểm tra dữ liệu đầu vào
    if (!userId || !rfidId) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp đầy đủ userId và rfidId'
      });
    }
    
    // Kiểm tra userId tồn tại
    const user = await UserAccount.findOne({ userId });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: `Không tìm thấy người dùng với ID ${userId}`
      });
    }
    
    // Kiểm tra nếu userId đã có RFID
    const existingUserRFID = await RFID.findOne({ UserID: userId, Status: 'Active' });
    if (existingUserRFID) {
      return res.status(400).json({
        success: false,
        message: `Người dùng ${userId} đã có thẻ RFID ${existingUserRFID.RFID_ID}`
      });
    }
    
    // Kiểm tra nếu rfidId đã tồn tại
    const existingRFID = await RFID.findOne({ RFID_ID: rfidId, Status: 'Active' });
    if (existingRFID) {
      return res.status(400).json({
        success: false,
        message: `RFID ${rfidId} đã được gán cho người dùng ${existingRFID.UserID}`
      });
    }
    
    // Tạo RFID mới
    const newRFID = await RFID.create({
      UserID: userId,
      RFID_ID: rfidId,
      Status: 'Active',
      IssueDate: new Date(),
      ExpiryDate: new Date(new Date().setFullYear(new Date().getFullYear() + 3)) // Mặc định hết hạn sau 3 năm
    });
    
    // Trả về kết quả
    res.status(201).json({
      success: true,
      message: `Đã tạo thẻ RFID ${rfidId} cho người dùng ${userId}`,
      data: newRFID
    });
  } catch (error) {
    console.error('Error creating RFID:', error);
    return res.status(500).json({
      success: false,
      message: 'Không thể tạo thẻ RFID',
      error: error.message
    });
  }
});

// @desc    Xóa thẻ RFID theo userId
// @route   DELETE /api/rfid/users/:id
// @access  Private (Admin)
exports.deleteUserRFID = asyncHandler(async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Tìm thẻ RFID theo userId
    const rfid = await RFID.findOne({ UserID: id, Status: 'Active' });
    
    if (!rfid) {
      return res.status(404).json({
        success: false,
        message: `Không tìm thấy thẻ RFID đang hoạt động cho người dùng ${id}`
      });
    }
    
    // Lưu thông tin trước khi xóa
    const rfidInfo = {
      userId: rfid.UserID,
      rfidId: rfid.RFID_ID
    };
    
    // Có hai phương pháp xóa:
    // 1. Xóa mềm: Đánh dấu là không hoạt động
    rfid.Status = 'Revoked';
    await rfid.save();
    
    // 2. Xóa cứng: Xóa hoàn toàn khỏi database
    // await RFID.deleteOne({ _id: rfid._id });
    
    return res.status(200).json({
      success: true,
      message: `Đã vô hiệu hóa thẻ RFID ${rfidInfo.rfidId} của người dùng ${rfidInfo.userId}`,
      data: rfidInfo
    });
  } catch (error) {
    console.error(`Error deleting RFID for user ${req.params.id}:`, error);
    return res.status(500).json({
      success: false,
      message: 'Không thể xóa thẻ RFID',
      error: error.message
    });
  }
}); 