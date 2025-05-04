const mongoose = require('mongoose');
const Curriculum = require('../database/models/Curriculum');
const CurriculumSubject = require('../database/models/CurriculumSubject');
const Subject = require('../database/models/Subject');
const asyncHandler = require('../middleware/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Lấy danh sách tất cả giáo trình
// @route   GET /api/curriculum
// @access  Private
exports.getAllCurriculums = asyncHandler(async (req, res, next) => {
  try {
    const curriculums = await Curriculum.find({ isActive: true })
      .sort({ grade: 1, curriculumName: 1 });

    res.status(200).json({
      success: true,
      count: curriculums.length,
      data: curriculums
    });
  } catch (error) {
    console.error('Error fetching curriculums:', error);
    return res.status(500).json({
      success: false,
      message: 'Không thể lấy danh sách giáo trình',
      error: error.message
    });
  }
});

// @desc    Lấy thông tin giáo trình theo ID cùng với các môn học liên quan
// @route   GET /api/curriculum/:id
// @access  Private
exports.getCurriculumWithSubjects = asyncHandler(async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Tìm giáo trình theo ID
    const curriculum = await Curriculum.findOne({ curriculumId: id, isActive: true });
    
    if (!curriculum) {
      return res.status(404).json({
        success: false,
        message: `Không tìm thấy giáo trình với ID ${id}`,
      });
    }
    
    // Tìm tất cả môn học trong giáo trình này
    const curriculumSubjects = await CurriculumSubject.find({ 
      curriculumId: id,
      isActive: true
    });
    
    // Lấy danh sách subjectIds để query Subject
    const subjectIds = curriculumSubjects.map(cs => cs.subjectId);
    
    // Lấy thông tin chi tiết các môn học
    const subjects = await Subject.find({ 
      subjectId: { $in: subjectIds },
      isActive: true
    });
    
    // Tạo map để dễ dàng truy cập thông tin môn học
    const subjectMap = {};
    subjects.forEach(subject => {
      subjectMap[subject.subjectId] = subject;
    });
    
    // Kết hợp thông tin môn học và số tiết học
    const subjectsInfo = curriculumSubjects.map(cs => {
      const subject = subjectMap[cs.subjectId] || {};
      return {
        subjectId: cs.subjectId,
        subjectName: subject.subjectName || 'Unknown Subject',
        subjectType: subject.subjectType || 'Unknown',
        sessions: cs.sessions || 0,
        description: subject.description || ''
      };
    });
    
    // Tạo response
    const result = {
      curriculumId: curriculum.curriculumId,
      curriculumName: curriculum.curriculumName,
      description: curriculum.description,
      grade: curriculum.grade,
      totalSubjects: subjectsInfo.length,
      totalSessions: subjectsInfo.reduce((total, s) => total + s.sessions, 0),
      subjects: subjectsInfo
    };
    
    return res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error(`Error fetching curriculum with ID ${req.params.id}:`, error);
    return res.status(500).json({
      success: false,
      message: 'Không thể lấy thông tin giáo trình',
      error: error.message
    });
  }
});

// @desc    Cập nhật thông tin giáo trình
// @route   PUT /api/curriculum/:id
// @access  Private (Admin)
exports.updateCurriculum = asyncHandler(async (req, res, next) => {
  try {
    const { id } = req.params;
    const { curriculumName, description, grade } = req.body;
    
    // Tìm giáo trình theo ID
    let curriculum = await Curriculum.findOne({ curriculumId: id, isActive: true });
    
    if (!curriculum) {
      return res.status(404).json({
        success: false,
        message: `Không tìm thấy giáo trình với ID ${id}`
      });
    }
    
    // Cập nhật thông tin
    const updateData = {};
    if (curriculumName) updateData.curriculumName = curriculumName;
    if (description !== undefined) updateData.description = description;
    if (grade !== undefined) updateData.grade = grade;
    
    // Thực hiện cập nhật
    curriculum = await Curriculum.findOneAndUpdate(
      { curriculumId: id, isActive: true },
      updateData,
      { new: true, runValidators: true }
    );
    
    return res.status(200).json({
      success: true,
      message: `Đã cập nhật thông tin giáo trình ${id}`,
      data: curriculum
    });
  } catch (error) {
    console.error(`Error updating curriculum with ID ${req.params.id}:`, error);
    return res.status(500).json({
      success: false,
      message: 'Không thể cập nhật thông tin giáo trình',
      error: error.message
    });
  }
});

// @desc    Cập nhật danh sách môn học trong giáo trình
// @route   PUT /api/curriculum/:id/subjects
// @access  Private (Admin)
exports.updateCurriculumSubjects = asyncHandler(async (req, res, next) => {
  try {
    const { id } = req.params;
    const { subjects } = req.body;
    
    // Kiểm tra dữ liệu đầu vào
    if (!subjects || !Array.isArray(subjects)) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp danh sách môn học hợp lệ'
      });
    }
    
    // Tìm giáo trình theo ID
    const curriculum = await Curriculum.findOne({ curriculumId: id, isActive: true });
    
    if (!curriculum) {
      return res.status(404).json({
        success: false,
        message: `Không tìm thấy giáo trình với ID ${id}`
      });
    }
    
    // Xác thực tất cả subjectId hợp lệ
    const subjectIds = subjects.map(s => s.subjectId);
    const existingSubjects = await Subject.find({ 
      subjectId: { $in: subjectIds }, 
      isActive: true 
    });
    
    if (existingSubjects.length !== subjectIds.length) {
      const foundIds = existingSubjects.map(s => s.subjectId);
      const invalidIds = subjectIds.filter(id => !foundIds.includes(id));
      
      return res.status(400).json({
        success: false,
        message: `Các môn học sau không tồn tại: ${invalidIds.join(', ')}`
      });
    }
    
    // Bắt đầu giao dịch để đảm bảo tính nhất quán
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      // Vô hiệu hóa tất cả các liên kết môn học cũ
      await CurriculumSubject.updateMany(
        { curriculumId: id, isActive: true },
        { isActive: false },
        { session }
      );
      
      // Tạo các liên kết môn học mới
      const curriculumSubjects = [];
      
      for (const subject of subjects) {
        // Kiểm tra xem đã có liên kết chưa
        let currSubject = await CurriculumSubject.findOne({
          curriculumId: id,
          subjectId: subject.subjectId
        });
        
        if (currSubject) {
          // Cập nhật liên kết hiện tại
          currSubject.sessions = subject.sessions || 2;
          currSubject.isActive = true;
          await currSubject.save({ session });
          curriculumSubjects.push(currSubject);
        } else {
          // Tạo liên kết mới
          const newCurrSubject = await CurriculumSubject.create([{
            curriculumId: id,
            subjectId: subject.subjectId,
            sessions: subject.sessions || 2,
            isActive: true
          }], { session });
          
          curriculumSubjects.push(newCurrSubject[0]);
        }
      }
      
      // Hoàn thành giao dịch
      await session.commitTransaction();
      
      // Tạo response thông tin đã cập nhật
      const result = {
        curriculumId: curriculum.curriculumId,
        curriculumName: curriculum.curriculumName,
        totalSubjects: subjects.length,
        subjects: subjects.map(s => ({
          subjectId: s.subjectId,
          sessions: s.sessions || 2
        }))
      };
      
      return res.status(200).json({
        success: true,
        message: `Đã cập nhật ${subjects.length} môn học cho giáo trình ${curriculum.curriculumName}`,
        data: result
      });
    } catch (error) {
      // Rollback giao dịch nếu có lỗi
      await session.abortTransaction();
      throw error;
    } finally {
      // Kết thúc session
      session.endSession();
    }
  } catch (error) {
    console.error(`Error updating curriculum subjects with ID ${req.params.id}:`, error);
    return res.status(500).json({
      success: false,
      message: 'Không thể cập nhật danh sách môn học',
      error: error.message
    });
  }
}); 