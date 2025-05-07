const ScheduleFormat = require('../database/models/ScheduleFormat');
const asyncHandler = require('../middleware/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Lấy danh sách tất cả khung giờ học
// @route   GET /api/schedule-formats
// @access  Private
exports.getAllScheduleFormats = asyncHandler(async (req, res, next) => {
  try {
    const { dayOfWeek, showInactive } = req.query;
    
    // Xây dựng query dựa trên tham số
    const query = {};
    
    // Nếu có chỉ định ngày, thêm vào điều kiện tìm kiếm
    if (dayOfWeek) {
      query.dayOfWeek = dayOfWeek;
    }
    
    // Mặc định chỉ lấy các slot đang active trừ khi showInactive = true
    if (showInactive !== 'true') {
      query.isActive = true;
    }
    
    // Lấy tất cả khung giờ và sắp xếp theo ngày trong tuần và số thứ tự tiết học
    const scheduleFormats = await ScheduleFormat.find(query)
      .sort({ dayOfWeek: 1, slotNumber: 1 });
    
    // Trả về kết quả
    res.status(200).json({
      success: true,
      count: scheduleFormats.length,
      data: scheduleFormats
    });
  } catch (error) {
    console.error('Error fetching schedule formats:', error);
    return res.status(500).json({
      success: false,
      message: 'Không thể lấy danh sách khung giờ học',
      error: error.message
    });
  }
});

// @desc    Lấy khung giờ học theo ID
// @route   GET /api/schedule-formats/:id
// @access  Private
exports.getScheduleFormatById = asyncHandler(async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Tìm khung giờ học theo ID
    const scheduleFormat = await ScheduleFormat.findOne({ slotId: id });
    
    // Kiểm tra nếu không tìm thấy
    if (!scheduleFormat) {
      return res.status(404).json({
        success: false,
        message: `Không tìm thấy khung giờ học với ID ${id}`
      });
    }
    
    // Trả về kết quả
    res.status(200).json({
      success: true,
      data: scheduleFormat
    });
  } catch (error) {
    console.error(`Error fetching schedule format with ID ${req.params.id}:`, error);
    return res.status(500).json({
      success: false,
      message: 'Không thể lấy thông tin khung giờ học',
      error: error.message
    });
  }
});

// @desc    Lấy khung giờ học theo ngày trong tuần
// @route   GET /api/schedule-formats/day/:dayOfWeek
// @access  Private
exports.getScheduleFormatsByDay = asyncHandler(async (req, res, next) => {
  try {
    const { dayOfWeek } = req.params;
    
    // Kiểm tra tham số ngày trong tuần hợp lệ
    const validDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    if (!validDays.includes(dayOfWeek)) {
      return res.status(400).json({
        success: false,
        message: `Ngày không hợp lệ. Ngày phải thuộc một trong: ${validDays.join(', ')}`
      });
    }
    
    // Tìm tất cả khung giờ học trong ngày được chỉ định và sắp xếp theo số thứ tự tiết học
    const scheduleFormats = await ScheduleFormat.find({ dayOfWeek })
      .sort({ slotNumber: 1 });
    
    // Trả về kết quả
    res.status(200).json({
      success: true,
      count: scheduleFormats.length,
      data: scheduleFormats
    });
  } catch (error) {
    console.error(`Error fetching schedule formats for day ${req.params.dayOfWeek}:`, error);
    return res.status(500).json({
      success: false,
      message: 'Không thể lấy danh sách khung giờ học theo ngày',
      error: error.message
    });
  }
});

// @desc    Tạo khung giờ học mới
// @route   POST /api/schedule-formats
// @access  Private (Admin)
exports.createScheduleFormat = asyncHandler(async (req, res, next) => {
  try {
    const { slotNumber, dayOfWeek, startTime, endTime, slotName, isActive } = req.body;
    
    // Kiểm tra dữ liệu đầu vào
    if (!slotNumber || !dayOfWeek || !startTime || !endTime || !slotName) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp đầy đủ thông tin: slotNumber, slotName, dayOfWeek, startTime, endTime'
      });
    }
    
    // Kiểm tra xem đã tồn tại khung giờ học với số thứ tự này trong ngày chưa
    const existingSlot = await ScheduleFormat.findOne({ 
      slotNumber, 
      dayOfWeek,
      isActive: true
    });
    
    if (existingSlot) {
      return res.status(400).json({
        success: false,
        message: `Khung giờ học với slotNumber ${slotNumber} vào ${dayOfWeek} đã tồn tại`
      });
    }
    
    // Tìm slotId lớn nhất hiện tại
    const maxSlotDoc = await ScheduleFormat.findOne().sort('-slotId');
    const nextSlotId = maxSlotDoc ? maxSlotDoc.slotId + 1 : 1;
    
    // Tạo khung giờ học mới
    const scheduleFormat = await ScheduleFormat.create({
      slotId: nextSlotId,
      slotNumber,
      slotName,
      dayOfWeek,
      startTime,
      endTime,
      isActive: isActive !== undefined ? isActive : true
    });
    
    // Trả về kết quả
    res.status(201).json({
      success: true,
      message: 'Đã tạo khung giờ học mới thành công',
      data: scheduleFormat
    });
  } catch (error) {
    console.error('Error creating schedule format:', error);
    return res.status(500).json({
      success: false,
      message: 'Không thể tạo khung giờ học mới',
      error: error.message
    });
  }
});

// @desc    Cập nhật khung giờ học
// @route   PUT /api/schedule-formats/:id
// @access  Private (Admin)
exports.updateScheduleFormat = asyncHandler(async (req, res, next) => {
  try {
    const { id } = req.params;
    const { slotNumber, dayOfWeek, startTime, endTime, slotName, isActive } = req.body;
    
    // Tìm khung giờ học cần cập nhật
    let scheduleFormat = await ScheduleFormat.findOne({ slotId: id });
    
    // Kiểm tra nếu không tìm thấy
    if (!scheduleFormat) {
      return res.status(404).json({
        success: false,
        message: `Không tìm thấy khung giờ học với ID ${id}`
      });
    }
    
    // Nếu thay đổi slotNumber hoặc dayOfWeek, kiểm tra xem đã tồn tại chưa
    if ((slotNumber && slotNumber !== scheduleFormat.slotNumber) || 
        (dayOfWeek && dayOfWeek !== scheduleFormat.dayOfWeek)) {
      const existingSlot = await ScheduleFormat.findOne({ 
        slotNumber: slotNumber || scheduleFormat.slotNumber,
        dayOfWeek: dayOfWeek || scheduleFormat.dayOfWeek,
        slotId: { $ne: id },
        isActive: true
      });
      
      if (existingSlot) {
        return res.status(400).json({
          success: false,
          message: `Khung giờ học với slotNumber ${slotNumber || scheduleFormat.slotNumber} vào ${dayOfWeek || scheduleFormat.dayOfWeek} đã tồn tại`
        });
      }
    }
    
    // Cập nhật thông tin
    const updateData = {};
    if (slotNumber) updateData.slotNumber = slotNumber;
    if (slotName) updateData.slotName = slotName;
    if (dayOfWeek) updateData.dayOfWeek = dayOfWeek;
    if (startTime) updateData.startTime = startTime;
    if (endTime) updateData.endTime = endTime;
    if (isActive !== undefined) updateData.isActive = isActive;
    
    // Thực hiện cập nhật
    scheduleFormat = await ScheduleFormat.findOneAndUpdate(
      { slotId: id },
      updateData,
      { new: true, runValidators: true }
    );
    
    // Trả về kết quả
    res.status(200).json({
      success: true,
      message: 'Đã cập nhật khung giờ học thành công',
      data: scheduleFormat
    });
  } catch (error) {
    console.error(`Error updating schedule format with ID ${req.params.id}:`, error);
    return res.status(500).json({
      success: false,
      message: 'Không thể cập nhật khung giờ học',
      error: error.message
    });
  }
});

// @desc    Xóa khung giờ học
// @route   DELETE /api/schedule-formats/:id
// @access  Private (Admin)
exports.deleteScheduleFormat = asyncHandler(async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Tìm khung giờ học cần xóa
    const scheduleFormat = await ScheduleFormat.findOne({ slotId: id });
    
    // Kiểm tra nếu không tìm thấy
    if (!scheduleFormat) {
      return res.status(404).json({
        success: false,
        message: `Không tìm thấy khung giờ học với ID ${id}`
      });
    }
    
    // TODO: Kiểm tra xem khung giờ này có đang được sử dụng trong lịch học không
    // Nếu có, không cho phép xóa hoặc cảnh báo
    
    // Thay vì xóa, chỉ đánh dấu là không hoạt động
    await ScheduleFormat.findOneAndUpdate(
      { slotId: id },
      { isActive: false }
    );
    
    // Trả về kết quả
    res.status(200).json({
      success: true,
      message: 'Đã vô hiệu hóa khung giờ học thành công',
      data: { slotId: id, isActive: false }
    });
  } catch (error) {
    console.error(`Error deleting schedule format with ID ${req.params.id}:`, error);
    return res.status(500).json({
      success: false,
      message: 'Không thể xóa khung giờ học',
      error: error.message
    });
  }
});

// @desc    Thay đổi trạng thái kích hoạt khung giờ học
// @route   PATCH /api/schedule-formats/:id/toggle-status
// @access  Private (Admin)
exports.toggleScheduleFormatStatus = asyncHandler(async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Tìm khung giờ học cần cập nhật
    const scheduleFormat = await ScheduleFormat.findOne({ slotId: id });
    
    // Kiểm tra nếu không tìm thấy
    if (!scheduleFormat) {
      return res.status(404).json({
        success: false,
        message: `Không tìm thấy khung giờ học với ID ${id}`
      });
    }
    
    // Đảo ngược trạng thái kích hoạt
    const newActiveStatus = !scheduleFormat.isActive;
    
    // Cập nhật trạng thái
    const updatedSlot = await ScheduleFormat.findOneAndUpdate(
      { slotId: id },
      { isActive: newActiveStatus },
      { new: true }
    );
    
    // Trả về kết quả
    res.status(200).json({
      success: true,
      message: `Khung giờ học đã được ${newActiveStatus ? 'kích hoạt' : 'vô hiệu hóa'} thành công`,
      data: updatedSlot
    });
  } catch (error) {
    console.error(`Error toggling schedule format status with ID ${req.params.id}:`, error);
    return res.status(500).json({
      success: false,
      message: 'Không thể thay đổi trạng thái khung giờ học',
      error: error.message
    });
  }
}); 