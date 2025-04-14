/**
 * Student Service - Tách biệt logic xử lý của Student
 */

const { models } = require('../database');
const databaseService = require('./databaseService');

/**
 * Lấy danh sách học sinh với phân trang và lọc
 * @param {Object} options - Các option tìm kiếm
 * @returns {Promise<Object>} Danh sách học sinh
 */
exports.getStudents = async (options = {}) => {
  try {
    const { page = 1, limit = 10, sort = { studentId: 1 }, filter = {}, search, className, batchYear } = options;
    
    // Xây dựng query filter
    let query = {};
    
    // Xử lý tham số search nếu có
    if (search && search !== 'none') {
      query = {
        $or: [
          { studentId: { $regex: search, $options: 'i' } },
          { firstName: { $regex: search, $options: 'i' } },
          { lastName: { $regex: search, $options: 'i' } },
          { fullName: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } },
          { userId: { $regex: search, $options: 'i' } }
        ]
      };
    }
    
    // Xử lý lọc theo className (nếu có)
    if (className && className !== 'none') {
      try {
        // Tìm class dựa trên className
        const classInfo = await models.Class.findOne({ className });
        if (classInfo) {
          query.classId = classInfo.classId;
          console.log(`Found class with ID ${classInfo.classId} for className ${className}`);
        } else {
          console.log(`No class found with name ${className}`);
        }
      } catch (error) {
        console.error(`Error looking up class by name ${className}:`, error);
      }
    }
    
    // Xử lý lọc theo batchYear (nếu có)
    if (batchYear && batchYear !== 'none') {
      try {
        const [startYear, endYear] = batchYear.split('-').map(year => parseInt(year));
        if (!isNaN(startYear) && !isNaN(endYear)) {
          // Tính toán batchId dựa vào quy tắc: 2021-2024 = batchId 1
          const baseStartYear = 2021;
          const batchId = startYear - baseStartYear + 1;
          
          if (!isNaN(batchId) && batchId > 0) {
            query.batchId = batchId;
            console.log(`Calculated batchId ${batchId} for batchYear ${batchYear}`);
          } else {
            console.log(`Invalid batchId calculated: ${batchId}`);
          }
        } else {
          console.log(`Invalid batchYear format: ${batchYear}`);
        }
      } catch (error) {
        console.error(`Error processing batchYear ${batchYear}:`, error);
      }
    }
    
    // Thêm các điều kiện filter khác
    const filterKeys = Object.keys(filter);
    for (const key of filterKeys) {
      if (key !== 'page' && key !== 'limit' && key !== 'sortBy' && key !== 'sortDir') {
        const value = filter[key];
        
        // Bỏ qua các giá trị là 'none'
        if (value !== 'none' && value !== undefined && value !== '') {
          try {
            // Kiểm tra nếu field là number trong schema thì convert sang Number
            const modelSchema = models.Student.schema.paths[key];
            if (modelSchema && modelSchema.instance === 'Number') {
              const numValue = Number(value);
              if (!isNaN(numValue)) {
                query[key] = numValue;
              }
            } else if (key === 'batchId' || key === 'classId') {
              // Đặc biệt xử lý cho batchId và classId
              const numValue = Number(value);
              if (!isNaN(numValue)) {
                query[key] = numValue;
              }
            } else {
              query[key] = value;
            }
          } catch (error) {
            console.error(`Error processing filter ${key}=${value}:`, error);
            query[key] = value; // Sử dụng giá trị gốc nếu có lỗi
          }
        }
      }
    }
    
    console.log("Query filter:", JSON.stringify(query));
    
    const skip = (page - 1) * limit;
    const students = await models.Student.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit);
      
    const total = await models.Student.countDocuments(query);
    
    console.log(`Found ${students.length} students out of ${total} total`);
    
    // Bổ sung thông tin className và batchYear vào kết quả
    const studentsWithInfo = await Promise.all(students.map(async (student) => {
      const studentObj = student.toObject();
      
      // Lấy thông tin lớp học
      if (student.classId) {
        try {
          const classInfo = await models.Class.findOne({ classId: student.classId });
          if (classInfo) {
            studentObj.className = classInfo.className;
          }
        } catch (error) {
          console.error(`Error getting class info for student ${student.studentId}:`, error);
        }
      }
      
      // Lấy thông tin và tính batchYear từ batchId
      if (student.batchId) {
        try {
          const batch = await models.Batch.findOne({ batchId: student.batchId });
          if (batch) {
            // Nếu có thông tin batch từ database
            studentObj.batchName = batch.batchName;
            
            // Tính batchYear từ batchId
            const baseStartYear = 2021; // Năm bắt đầu của batchId=1
            const startYear = baseStartYear + student.batchId - 1;
            const endYear = startYear + 3; // 3 năm học
            studentObj.batchYear = `${startYear}-${endYear}`;
          }
        } catch (error) {
          console.error(`Error getting batch info for student ${student.studentId}:`, error);
        }
      }
      
      return studentObj;
    }));
    
    return {
      success: true,
      data: studentsWithInfo,
      count: students.length,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    console.error('Error getting students:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Lấy thông tin chi tiết học sinh theo ID
 * @param {string} studentId - ID của học sinh
 * @param {boolean} includeRelated - Có bao gồm thông tin liên quan không
 * @returns {Promise<Object>} Thông tin học sinh
 */
exports.getStudentById = async (studentId, includeRelated = false) => {
  try {
    const student = await databaseService.findById(models.Student, studentId, 'studentId');
    
    if (!student) {
      return { success: false, error: 'Student not found', code: 'STUDENT_NOT_FOUND' };
    }
    
    const studentObj = student.toObject();
    
    // Luôn thêm thông tin className và batchYear
    if (student.classId) {
      const classInfo = await models.Class.findOne({ classId: student.classId });
      if (classInfo) {
        studentObj.className = classInfo.className;
      }
    }
    
    if (student.batchId) {
      const batch = await models.Batch.findOne({ batchId: student.batchId });
      if (batch) {
        studentObj.batchName = batch.batchName;
        
        // Tính batchYear từ batchId
        const baseStartYear = 2021;
        const startYear = baseStartYear + student.batchId - 1;
        const endYear = startYear + 3;
        studentObj.batchYear = `${startYear}-${endYear}`;
      }
    }
    
    if (!includeRelated) {
      return { success: true, data: studentObj };
    }
    
    // Get related information
    const [user, classInfo, batchInfo, parents] = await Promise.all([
      databaseService.findById(models.User, student.userId, 'userId'),
      databaseService.findById(models.Class, student.classId, 'classId'),
      databaseService.findById(models.Batch, student.batchId, 'batchId'),
      student.parentIds && student.parentIds.length 
        ? models.Parent.find({ parentId: { $in: student.parentIds } })
        : []
    ]);
    
    return {
      success: true,
      data: {
        ...studentObj,
        user: user ? {
          name: user.name,
          email: user.email,
          role: user.role
        } : null,
        class: classInfo || null,
        batch: batchInfo || null,
        parents: parents || []
      }
    };
  } catch (error) {
    console.error('Error getting student by ID:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Lấy thời khóa biểu của học sinh
 * @param {string} studentId - ID của học sinh
 * @returns {Promise<Object>} Thời khóa biểu của học sinh
 */
exports.getStudentSchedule = async (studentId) => {
  try {
    const student = await databaseService.findById(models.Student, studentId, 'studentId');
    
    if (!student) {
      return { success: false, error: 'Student not found', code: 'STUDENT_NOT_FOUND' };
    }
    
    // Get latest semester for student's batch
    const semester = await models.Semester.findOne({ 
      batchId: student.batchId 
    }).sort({ startDate: -1 });
    
    if (!semester) {
      return { 
        success: false, 
        error: 'No active semester found for this student',
        code: 'NO_ACTIVE_SEMESTER'
      };
    }
    
    // Get student's class schedule
    const schedules = await models.ClassSchedule.find({ 
      semesterId: semester.semesterId,
      classId: student.classId
    }).sort({ dayOfWeek: 1, startTime: 1 });
    
    // Enhance schedule with teacher, subject and classroom information
    const enhancedSchedules = await Promise.all(schedules.map(async (schedule) => {
      const [teacher, subject, classroom] = await Promise.all([
        databaseService.findById(models.Teacher, schedule.teacherId, 'teacherId'),
        databaseService.findById(models.Subject, schedule.subjectId, 'subjectId'),
        databaseService.findById(models.Classroom, schedule.classroomId, 'classroomId')
      ]);
      
      return {
        ...schedule.toObject(),
        teacherName: teacher ? teacher.fullName : 'Unknown Teacher',
        subjectName: subject ? subject.name : 'Unknown Subject',
        classroomNumber: classroom ? classroom.roomNumber : 'Unknown Classroom'
      };
    }));
    
    return {
      success: true,
      data: {
        semester: semester.semesterName,
        schedules: enhancedSchedules
      },
      count: enhancedSchedules.length
    };
  } catch (error) {
    console.error('Error getting student schedule:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Lấy học sinh theo lớp
 * @param {string} classId - ID của lớp
 * @returns {Promise<Object>} Danh sách học sinh
 */
exports.getStudentsByClass = async (classId) => {
  try {
    const students = await models.Student.find({ classId }).sort({ fullName: 1 });
    
    return {
      success: true,
      data: students,
      count: students.length
    };
  } catch (error) {
    console.error('Error getting students by class:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Tạo học sinh mới
 * @param {Object} studentData - Dữ liệu học sinh
 * @returns {Promise<Object>} Học sinh đã tạo
 */
exports.createStudent = async (studentData) => {
  try {
    const student = await databaseService.createDocument(models.Student, studentData);
    
    if (!student) {
      return { success: false, error: 'Failed to create student', code: 'CREATE_FAILED' };
    }
    
    return { success: true, data: student };
  } catch (error) {
    console.error('Error creating student:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Cập nhật thông tin học sinh
 * @param {string} studentId - ID của học sinh
 * @param {Object} updateData - Dữ liệu cập nhật
 * @returns {Promise<Object>} Học sinh đã cập nhật
 */
exports.updateStudent = async (studentId, updateData) => {
  try {
    // Tìm học sinh theo ID
    const student = await models.Student.findOne({ studentId });
    
    if (!student) {
      return { success: false, error: 'Student not found', code: 'UPDATE_FAILED' };
    }
    
    // Lấy thông tin user liên kết
    const user = await models.User.findOne({ userId: student.userId });
    
    if (!user) {
      return { success: false, error: 'Related user not found', code: 'UPDATE_FAILED' };
    }
    
    // Lọc bỏ các trường chỉ dành riêng cho teacher
    const teacherOnlyFields = ['major', 'weeklyCapacity'];
    teacherOnlyFields.forEach(field => {
      if (updateData[field] !== undefined) {
        delete updateData[field];
        console.log(`Ignored teacher-specific field: ${field}`);
      }
    });
    
    // Xử lý cập nhật theo className nếu có
    if (updateData.className) {
      // Tìm kiếm lớp theo tên
      const classInfo = await models.Class.findOne({ className: updateData.className });
      
      if (!classInfo) {
        return { success: false, error: 'Class name does not exist', code: 'CLASS_NOT_FOUND' };
      }
      
      // Cập nhật classId dựa vào className tìm được
      updateData.classId = classInfo.classId;
      
      // Xóa className khỏi updateData vì đã xử lý
      delete updateData.className;
    }
    
    // Trích xuất thông tin cập nhật backup_email (dành cho user)
    const { backup_email } = updateData;
    
    // Biến kiểm tra xem có cần cập nhật userId và email không
    let needToUpdateUserIdAndEmail = false;
    
    // Nếu firstName hoặc lastName thay đổi, cần tạo lại userId và email
    if ((updateData.firstName && updateData.firstName !== student.firstName) || 
        (updateData.lastName && updateData.lastName !== student.lastName)) {
      needToUpdateUserIdAndEmail = true;
    }
    
    // Loại bỏ các trường không được phép cập nhật trực tiếp
    // userId và email sẽ được tạo lại nếu cần
    delete updateData._id;
    delete updateData.backup_email; // Xử lý riêng
    
    // Kiểm tra và chuẩn hóa dữ liệu gender nếu có
    if (updateData.gender !== undefined) {
      if (typeof updateData.gender === 'string') {
        // Chuyển đổi chuỗi thành boolean
        if (updateData.gender.toLowerCase() === 'male' || updateData.gender === 'true') {
          updateData.gender = true;
        } else if (updateData.gender.toLowerCase() === 'female' || updateData.gender === 'false') {
          updateData.gender = false;
        }
      }
    }
    
    // Xử lý cập nhật thông tin phụ huynh
    let parentUpdated = false;
    const parentUpdates = [];
    
    if (updateData.parentIds || updateData.parentNames || 
        updateData.parentCareers || updateData.parentPhones || 
        updateData.parentGenders) {
      
      // Lấy các mảng thông tin phụ huynh hiện tại
      const currentParentIds = student.parentIds || [];
      const currentParentNames = student.parentNames || [];
      const currentParentCareers = student.parentCareers || [];
      const currentParentPhones = student.parentPhones || [];
      const currentParentGenders = student.parentGenders || [];
      
      // Nếu có thay đổi về danh sách phụ huynh
      if (updateData.parentIds) {
        // Xác định phụ huynh bị loại bỏ (có trong danh sách cũ nhưng không có trong danh sách mới)
        const removedParentIds = currentParentIds.filter(id => !updateData.parentIds.includes(id));
        
        // Xóa phụ huynh nếu không còn liên kết với học sinh nào khác
        for (const parentId of removedParentIds) {
          // Kiểm tra xem phụ huynh có liên kết với học sinh khác không
          const parentRelations = await models.ParentStudent.find({ parentId });
          const otherStudents = parentRelations.filter(relation => relation.studentId !== studentId);
          
          if (otherStudents.length === 0) {
            // Phụ huynh không còn liên kết với học sinh nào khác, xóa phụ huynh
            console.log(`Deleting parent ${parentId} as they no longer have any students.`);
            await models.Parent.deleteOne({ parentId });
            
            // Xóa user account của phụ huynh
            await models.User.deleteOne({ userId: parentId });
          }
          
          // Xóa mối quan hệ giữa học sinh và phụ huynh
          await models.ParentStudent.deleteOne({ parentId, studentId });
          parentUpdated = true;
        }
        
        // Thêm phụ huynh mới nếu có
        const newParentIds = updateData.parentIds.filter(id => !currentParentIds.includes(id));
        for (const parentId of newParentIds) {
          const parent = await models.Parent.findOne({ parentId });
          if (parent) {
            // Tạo mối quan hệ mới
            await models.ParentStudent.create({
              parentId,
              studentId,
              relationship: 'Other'
            });
            parentUpdated = true;
          }
        }
      }
      
      // Cập nhật thông tin phụ huynh
      if (updateData.parentNames) {
        // Đảm bảo có đủ parentIds tương ứng
        const parentIds = updateData.parentIds || currentParentIds;
        
        for (let i = 0; i < parentIds.length; i++) {
          const parentId = parentIds[i];
          const parentName = updateData.parentNames[i] || '';
          const parentCareer = updateData.parentCareers?.[i] || '';
          const parentPhone = updateData.parentPhones?.[i] || '';
          let parentGender = updateData.parentGenders?.[i];
          
          // Chuẩn hóa gender
          if (parentGender !== undefined && typeof parentGender === 'string') {
            if (parentGender.toLowerCase() === 'male' || parentGender === 'true') {
              parentGender = true;
            } else if (parentGender.toLowerCase() === 'female' || parentGender === 'false') {
              parentGender = false;
            }
          }
          
          // Tìm parent cũ
          const parent = await models.Parent.findOne({ parentId });
          
          // Tách tên thành firstName và lastName
          // Trong tên tiếng Việt, họ đứng trước (Nguyễn Văn A) -> lastName = Nguyễn Văn, firstName = A
          const nameParts = parentName.split(' ');
          const firstName = nameParts.pop() || '';  // Phần tử cuối là firstName
          const lastName = nameParts.join(' ');    // Các phần tử còn lại là lastName
          
          if (parent) {
            // Kiểm tra nếu tên thay đổi, cần tạo lại userId và email
            if (firstName !== parent.firstName || lastName !== parent.lastName) {
              // Tạo userId mới cho parent
              const newUserId = generateParentUserId(firstName, lastName, parentId);
              
              // Tạo email mới cho parent
              const newEmail = `${newUserId}@fams.edu.vn`;
              
              // Cập nhật/Tạo mới user account cho parent
              const parentUser = await models.User.findOne({ userId: parent.userId });
              
              if (parentUser) {
                // Xóa user account cũ
                await models.User.deleteOne({ userId: parent.userId });
                
                // Tạo user account mới với userId và email mới
                await models.User.create({
                  userId: newUserId,
                  username: newUserId,
                  password: parentUser.password,
                  email: newEmail,
                  backup_email: parentUser.backup_email,
                  role: 'parent',
                  isActive: true
                });
              } else {
                // Tạo user account mới nếu không tìm thấy user cũ
                await models.User.create({
                  userId: newUserId,
                  username: newUserId,
                  password: 'FAMS@2023', // Mật khẩu mặc định
                  email: newEmail,
                  role: 'parent',
                  isActive: true
                });
              }
              
              // Cập nhật parent với userId và email mới
              parent.userId = newUserId;
              parent.email = newEmail;
            }
            
            // Cập nhật thông tin phụ huynh
            parent.firstName = firstName;
            parent.lastName = lastName;
            parent.fullName = parentName;
            if (parentCareer) parent.career = parentCareer;
            if (parentPhone) parent.phone = parentPhone;
            if (parentGender !== undefined) parent.gender = parentGender;
            
            await parent.save();
            parentUpdated = true;
            parentUpdates.push(`Updated parent: ${parentId}`);
          } else {
            // Tạo mới phụ huynh nếu không tìm thấy
            // Tạo userId cho phụ huynh mới
            const newParentId = parentId || String(Date.now()).slice(-3);
            const newUserId = generateParentUserId(firstName, lastName, newParentId);
            
            // Tạo email cho phụ huynh mới
            const newEmail = `${newUserId}@fams.edu.vn`;
            
            // Tạo user account cho phụ huynh mới
            await models.User.create({
              userId: newUserId,
              username: newUserId,
              password: 'FAMS@2023', // Mật khẩu mặc định
              email: newEmail,
              role: 'parent',
              isActive: true
            });
            
            // Tạo phụ huynh mới
            const newParent = await models.Parent.create({
              parentId: newParentId,
              userId: newUserId,
              firstName,
              lastName,
              fullName: parentName,
              email: newEmail,
              career: parentCareer,
              phone: parentPhone,
              gender: parentGender,
              isActive: true
            });
            
            // Cập nhật danh sách phụ huynh trong mảng parentIds
            if (!updateData.parentIds) {
              updateData.parentIds = [...currentParentIds];
            }
            if (!updateData.parentIds.includes(newParentId)) {
              updateData.parentIds.push(newParentId);
            }
            
            // Tạo mối quan hệ giữa học sinh và phụ huynh mới
            await models.ParentStudent.create({
              parentId: newParentId,
              studentId,
              relationship: 'Other'
            });
            
            parentUpdated = true;
            parentUpdates.push(`Created parent: ${newParentId}`);
          }
        }
      }
      
      // Lưu các mảng thông tin phụ huynh vào học sinh
      if (updateData.parentIds) student.parentIds = updateData.parentIds;
      if (updateData.parentNames) student.parentNames = updateData.parentNames;
      if (updateData.parentCareers) student.parentCareers = updateData.parentCareers;
      if (updateData.parentPhones) student.parentPhones = updateData.parentPhones;
      if (updateData.parentGenders) student.parentGenders = updateData.parentGenders;
      
      // Loại bỏ các thông tin phụ huynh khỏi updateData (đã xử lý riêng)
      delete updateData.parentIds;
      delete updateData.parentNames;
      delete updateData.parentCareers;
      delete updateData.parentPhones;
      delete updateData.parentGenders;
    }
    
    // Cập nhật backup_email trong User model nếu có
    if (backup_email !== undefined) {
      user.backup_email = backup_email;
      await user.save();
    }
    
    // Cập nhật các trường khác của học sinh
    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined && key !== '_id') {
        student[key] = updateData[key];
      }
    });
    
    // Nếu firstName hoặc lastName thay đổi, cập nhật userId và email
    if (needToUpdateUserIdAndEmail) {
      const firstName = updateData.firstName || student.firstName;
      const lastName = updateData.lastName || student.lastName;
      
      // Tạo userId mới
      const newUserId = generateStudentUserId(firstName, lastName, student.batchId, studentId);
      
      // Tạo email mới
      const newEmail = `${newUserId}@fams.edu.vn`;
      
      console.log(`Updating userId from ${student.userId} to ${newUserId} and email from ${student.email} to ${newEmail}`);
      
      // Xóa user account cũ
      await models.User.deleteOne({ userId: student.userId });
      
      // Tạo user account mới
      await models.User.create({
        userId: newUserId,
        username: newUserId,
        password: user.password,
        email: newEmail,
        backup_email: user.backup_email,
        role: 'student',
        isActive: true
      });
      
      // Cập nhật userId và email trong Student model
      student.userId = newUserId;
      student.email = newEmail;
    }
    
    // Lưu thông tin học sinh
    const updatedStudent = await student.save();
    
    if (!updatedStudent) {
      return { success: false, error: 'Failed to update student', code: 'UPDATE_FAILED' };
    }
    
    return { 
      success: true, 
      data: updatedStudent,
      parentUpdates: parentUpdated ? parentUpdates : null,
      message: 'Student updated successfully'
    };
  } catch (error) {
    console.error('Error updating student:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Tạo userId cho học sinh dựa trên firstName, lastName, batchId và studentId
 * @param {string} firstName - Tên của học sinh
 * @param {string} lastName - Họ của học sinh
 * @param {number} batchId - ID khóa học
 * @param {string} studentId - ID học sinh
 * @returns {string} userId được tạo
 */
function generateStudentUserId(firstName, lastName, batchId, studentId) {
  if (!firstName || !lastName || !batchId || !studentId) {
    throw new Error('Missing required fields for userId generation');
  }
  
  // Trong tên tiếng Việt, họ đứng trước (Nguyễn Văn A) -> lastName = Nguyễn Văn, firstName = A
  
  // Chuẩn hóa tên (loại bỏ dấu, chuyển thành chữ thường)
  const normalizedFirstName = removeDiacritics(firstName).toLowerCase();
  
  // Lấy chữ cái đầu của mỗi từ trong lastName và loại bỏ dấu
  const lastNameParts = lastName.split(' ');
  const lastNameInitials = lastNameParts.map(part => removeDiacritics(part.charAt(0)).toLowerCase()).join('');
  
  // Kết hợp với firstName, "st" suffix và IDs
  return `${normalizedFirstName}${lastNameInitials}st${batchId}${studentId}`;
}

/**
 * Tạo userId cho phụ huynh dựa trên firstName, lastName và parentId
 * @param {string} firstName - Tên của phụ huynh
 * @param {string} lastName - Họ của phụ huynh
 * @param {string} parentId - ID phụ huynh
 * @returns {string} userId được tạo
 */
function generateParentUserId(firstName, lastName, parentId) {
  if (!firstName || !lastName || !parentId) {
    throw new Error('Missing required fields for userId generation');
  }
  
  // Trong tên tiếng Việt, họ đứng trước (Nguyễn Văn A) -> lastName = Nguyễn Văn, firstName = A
  
  // Chuẩn hóa tên (loại bỏ dấu, chuyển thành chữ thường)
  const normalizedFirstName = removeDiacritics(firstName).toLowerCase();
  
  // Lấy chữ cái đầu của mỗi từ trong lastName và loại bỏ dấu
  const lastNameParts = lastName.split(' ');
  const lastNameInitials = lastNameParts.map(part => removeDiacritics(part.charAt(0)).toLowerCase()).join('');
  
  // Kết hợp với firstName, "pr" suffix và ID
  return `${normalizedFirstName}${lastNameInitials}pr${parentId}`;
}

/**
 * Loại bỏ dấu tiếng Việt
 * @param {string} str - Chuỗi cần loại bỏ dấu
 * @returns {string} Chuỗi đã loại bỏ dấu
 */
function removeDiacritics(str) {
  if (!str) return '';
  
  // Bảng chuyển đổi các ký tự có dấu sang không dấu
  const diacriticsMap = {
    'à': 'a', 'á': 'a', 'ả': 'a', 'ã': 'a', 'ạ': 'a',
    'ă': 'a', 'ằ': 'a', 'ắ': 'a', 'ẳ': 'a', 'ẵ': 'a', 'ặ': 'a',
    'â': 'a', 'ầ': 'a', 'ấ': 'a', 'ẩ': 'a', 'ẫ': 'a', 'ậ': 'a',
    'đ': 'd',
    'è': 'e', 'é': 'e', 'ẻ': 'e', 'ẽ': 'e', 'ẹ': 'e',
    'ê': 'e', 'ề': 'e', 'ế': 'e', 'ể': 'e', 'ễ': 'e', 'ệ': 'e',
    'ì': 'i', 'í': 'i', 'ỉ': 'i', 'ĩ': 'i', 'ị': 'i',
    'ò': 'o', 'ó': 'o', 'ỏ': 'o', 'õ': 'o', 'ọ': 'o',
    'ô': 'o', 'ồ': 'o', 'ố': 'o', 'ổ': 'o', 'ỗ': 'o', 'ộ': 'o',
    'ơ': 'o', 'ờ': 'o', 'ớ': 'o', 'ở': 'o', 'ỡ': 'o', 'ợ': 'o',
    'ù': 'u', 'ú': 'u', 'ủ': 'u', 'ũ': 'u', 'ụ': 'u',
    'ư': 'u', 'ừ': 'u', 'ứ': 'u', 'ử': 'u', 'ữ': 'u', 'ự': 'u',
    'ỳ': 'y', 'ý': 'y', 'ỷ': 'y', 'ỹ': 'y', 'ỵ': 'y',
    'À': 'A', 'Á': 'A', 'Ả': 'A', 'Ã': 'A', 'Ạ': 'A',
    'Ă': 'A', 'Ằ': 'A', 'Ắ': 'A', 'Ẳ': 'A', 'Ẵ': 'A', 'Ặ': 'A',
    'Â': 'A', 'Ầ': 'A', 'Ấ': 'A', 'Ẩ': 'A', 'Ẫ': 'A', 'Ậ': 'A',
    'Đ': 'D',
    'È': 'E', 'É': 'E', 'Ẻ': 'E', 'Ẽ': 'E', 'Ẹ': 'E',
    'Ê': 'E', 'Ề': 'E', 'Ế': 'E', 'Ể': 'E', 'Ễ': 'E', 'Ệ': 'E',
    'Ì': 'I', 'Í': 'I', 'Ỉ': 'I', 'Ĩ': 'I', 'Ị': 'I',
    'Ò': 'O', 'Ó': 'O', 'Ỏ': 'O', 'Õ': 'O', 'Ọ': 'O',
    'Ô': 'O', 'Ồ': 'O', 'Ố': 'O', 'Ổ': 'O', 'Ỗ': 'O', 'Ộ': 'O',
    'Ơ': 'O', 'Ờ': 'O', 'Ớ': 'O', 'Ở': 'O', 'Ỡ': 'O', 'Ợ': 'O',
    'Ù': 'U', 'Ú': 'U', 'Ủ': 'U', 'Ũ': 'U', 'Ụ': 'U',
    'Ư': 'U', 'Ừ': 'U', 'Ứ': 'U', 'Ử': 'U', 'Ữ': 'U', 'Ự': 'U',
    'Ỳ': 'Y', 'Ý': 'Y', 'Ỷ': 'Y', 'Ỹ': 'Y', 'Ỵ': 'Y'
  };
  
  // Chuyển đổi từng ký tự trong chuỗi
  return str.split('').map(char => diacriticsMap[char] || char).join('');
}

/**
 * Xóa học sinh
 * @param {string} studentId - ID của học sinh
 * @returns {Promise<Object>} Kết quả xóa
 */
exports.deleteStudent = async (studentId) => {
  try {
    // Tìm học sinh để lấy thông tin liên quan
    const student = await models.Student.findOne({ studentId });
    
    if (!student) {
      return { success: false, error: 'Student not found', code: 'DELETE_FAILED' };
    }
    
    // Lấy userId để xóa user liên quan
    const userId = student.userId;
    
    // Lấy danh sách parentIds để kiểm tra và xóa nếu cần
    const parentIds = student.parentIds || [];
    
    // Xử lý xóa phụ huynh
    for (const parentId of parentIds) {
      // Xóa mối quan hệ giữa phụ huynh và học sinh này
      await models.ParentStudent.deleteOne({ parentId, studentId });
      
      // Kiểm tra xem phụ huynh có còn liên kết với học sinh khác không
      const otherRelations = await models.ParentStudent.find({ parentId });
      
      if (otherRelations.length === 0) {
        // Phụ huynh không còn liên kết với học sinh nào khác, xóa phụ huynh
        console.log(`Deleting parent ${parentId} as they no longer have any students.`);
        await models.Parent.deleteOne({ parentId });
        
        // Xóa user của phụ huynh
        await models.User.deleteOne({ userId: parentId });
      }
    }
    
    // Xóa học sinh
    const studentDeleted = await models.Student.deleteOne({ studentId });
    
    // Xóa user liên quan
    await models.User.deleteOne({ userId });
    
    return { 
      success: true, 
      message: 'Student and related data deleted successfully',
      studentDeleted: studentDeleted.deletedCount > 0
    };
  } catch (error) {
    console.error('Error deleting student:', error);
    return { success: false, error: error.message };
  }
}; 