const RFID = require('../database/models/RFID');
const User = require('../database/models/User');
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
  // Validate the UserID exists
  const user = await User.findOne({ userId: req.body.UserID });
  if (!user) {
    return next(new ErrorResponse(`User with ID ${req.body.UserID} not found`, 400, 'INVALID_USER_ID'));
  }
  
  // Check if RFID already exists
  const existingRFID = await RFID.findOne({ RFID_ID: req.body.RFID_ID });
  if (existingRFID) {
    return next(new ErrorResponse(`RFID with ID ${req.body.RFID_ID} already exists`, 400, 'DUPLICATE_RFID'));
  }

  // Check if user already has an RFID card
  const existingUserRFID = await RFID.findOne({ UserID: req.body.UserID });
  if (existingUserRFID) {
    return next(new ErrorResponse(`User ${req.body.UserID} already has an RFID card: ${existingUserRFID.RFID_ID}`, 400, 'USER_HAS_RFID'));
  }
  
  // Parse expiry date
  const rfidData = {
    ...req.body,
    ExpiryDate: parseExpiryDate(req.body.ExpiryDate)
  };
  
  // Create the RFID
  const rfid = await RFID.create(rfidData);
  
  res.status(201).json({
    success: true,
    data: rfid,
    message: 'RFID created successfully'
  });
});

// @desc    Update RFID 
// @route   PUT /api/rfid/:id
// @access  Private (Admin)
exports.updateRFID = asyncHandler(async (req, res, next) => {
  let rfid = await RFID.findOne({ RFID_ID: req.params.id });
  
  if (!rfid) {
    return next(new ErrorResponse(`RFID with ID ${req.params.id} not found`, 404, 'RFID_NOT_FOUND'));
  }
  
  // If UserID is being updated, validate it exists
  if (req.body.UserID) {
    const user = await User.findOne({ userId: req.body.UserID });
    if (!user) {
      return next(new ErrorResponse(`User with ID ${req.body.UserID} not found`, 400, 'INVALID_USER_ID'));
    }

    // Check if the new user already has an RFID card (except the current one)
    const existingUserRFID = await RFID.findOne({ 
      UserID: req.body.UserID, 
      RFID_ID: { $ne: req.params.id } 
    });

    if (existingUserRFID) {
      return next(new ErrorResponse(
        `User ${req.body.UserID} already has an RFID card: ${existingUserRFID.RFID_ID}`, 
        400, 
        'USER_HAS_RFID'
      ));
    }
  }

  // Process expiry date if provided
  const updateData = { ...req.body };
  if (req.body.ExpiryDate) {
    updateData.ExpiryDate = parseExpiryDate(req.body.ExpiryDate);
  }
  
  // Update RFID
  rfid = await RFID.findOneAndUpdate(
    { RFID_ID: req.params.id },
    updateData,
    { new: true, runValidators: true }
  );
  
  res.status(200).json({
    success: true,
    data: rfid,
    message: 'RFID updated successfully'
  });
});

// @desc    Delete RFID
// @route   DELETE /api/rfid/:id
// @access  Private (Admin)
exports.deleteRFID = asyncHandler(async (req, res, next) => {
  const rfid = await RFID.findOne({ RFID_ID: req.params.id });
  
  if (!rfid) {
    return next(new ErrorResponse(`RFID with ID ${req.params.id} not found`, 404, 'RFID_NOT_FOUND'));
  }
  
  await rfid.deleteOne();
  
  res.status(200).json({
    success: true,
    message: 'RFID deleted successfully'
  });
}); 