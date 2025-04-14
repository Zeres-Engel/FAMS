/**
 * Teacher Service - Tách biệt logic xử lý của Teacher
 */

const { models } = require('../database');
const databaseService = require('./databaseService');
const mongoose = require('mongoose');

/**
 * Direct access to ClassSchedule collection to handle schema mismatches
 */
async function findClassSchedules(teacherId) {
  // Get direct access to the collection
  const ClassScheduleCollection = mongoose.connection.db.collection('ClassSchedule');
  
  try {
    // Query using the exact format seen in the database
    const schedules = await ClassScheduleCollection.find({ teacherId: String(teacherId) }).toArray();
    console.log(`Found ${schedules.length} schedules for teacher ${teacherId} using direct collection access`);
    return schedules;
  } catch (error) {
    console.error(`Error querying ClassSchedule collection: ${error.message}`);
    return [];
  }
}

/**
 * Lấy danh sách giáo viên với phân trang và lọc
 * @param {Object} options - Các option tìm kiếm
 * @returns {Promise<Object>} Danh sách giáo viên
 */
exports.getTeachers = async (options = {}) => {
  try {
    const { page = 1, limit = 10, sort = { teacherId: 1 }, filter = {}, search, className } = options;
    
    // Xây dựng query filter
    let query = {};
    
    // Xử lý tham số search nếu có
    if (search && search !== 'none') {
      query = {
        $or: [
          { teacherId: { $regex: search, $options: 'i' } },
          { firstName: { $regex: search, $options: 'i' } },
          { lastName: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } },
          { userId: { $regex: search, $options: 'i' } },
          { major: { $regex: search, $options: 'i' } }
        ]
      };
    }
    
    // Xử lý lọc theo className (nếu có)
    if (className && className !== 'none') {
      try {
        // Tìm class dựa trên className
        const classInfo = await models.Class.findOne({ className });
        
        if (classInfo) {
          // Tìm lịch dạy của lớp này
          const schedules = await models.ClassSchedule.find({ classId: classInfo.classId });
          
          // Lấy danh sách teacherId từ các lịch dạy
          const teacherIds = [...new Set(schedules.map(s => s.teacherId))];
          
          if (teacherIds.length > 0) {
            // Thêm điều kiện vào query
            if (query.$or) {
              // Đã có $or query, thêm điều kiện AND
              query = {
                $and: [
                  query,
                  { teacherId: { $in: teacherIds } }
                ]
              };
            } else {
              // Chưa có query, thêm trực tiếp
              query.teacherId = { $in: teacherIds };
            }
            console.log(`Found ${teacherIds.length} teachers teaching class ${className}`);
          } else {
            console.log(`No schedules found for class ${className}`);
          }
        } else {
          console.log(`No class found with name ${className}`);
        }
      } catch (error) {
        console.error(`Error looking up class by name ${className}:`, error);
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
            const modelSchema = models.Teacher.schema.paths[key];
            if (modelSchema && modelSchema.instance === 'Number') {
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
    const teachers = await models.Teacher.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit);
      
    const total = await models.Teacher.countDocuments(query);
    
    console.log(`Found ${teachers.length} teachers out of ${total} total`);
    
    // Lấy thông tin lớp học đang dạy cho mỗi giáo viên
    const teachersWithClasses = await Promise.all(teachers.map(async (teacher) => {
      const teacherObj = teacher.toObject();
      
      // Tìm tất cả lịch dạy của giáo viên
      console.log(`Looking for schedules with teacherId: ${teacher.teacherId}`);
      
      // Use direct collection access to bypass schema issues
      const schedules = await findClassSchedules(teacher.teacherId);
      
      // Lấy danh sách unique classIds - ensure they're numbers for querying
      const classIds = [...new Set(schedules.map(s => Number(s.classId)))];
      console.log(`Unique classIds for teacher ${teacher.teacherId}: ${classIds.join(', ')}`);
      
      if (classIds.length > 0) {
        // Lấy thông tin về các lớp - ensure classId is treated as a number
        const classes = await models.Class.find({ classId: { $in: classIds } });
        console.log(`Found ${classes.length} classes for teacher ${teacher.teacherId}`);
        
        if (classes.length > 0) {
          console.log(`Sample class: ${JSON.stringify(classes[0])}`);
        } else {
          // If no classes found, try logging one class to see format
          const sampleClass = await models.Class.findOne();
          if (sampleClass) {
            console.log(`Sample class from DB: ${JSON.stringify(sampleClass)}`);
            console.log(`classId type in sample: ${typeof sampleClass.classId}, value: ${sampleClass.classId}`);
          }
        }
        
        // Thêm mảng classesName và classesId để dễ sử dụng
        teacherObj.classesName = classes.map(c => c.className);
        teacherObj.classesId = classes.map(c => c.classId);
        
        console.log(`Teacher ${teacher.teacherId} classes: ${teacherObj.classesName.join(', ')}`);
      } else {
        // Nếu không tìm thấy lớp học nào, khởi tạo mảng rỗng
        teacherObj.classesName = [];
        teacherObj.classesId = [];
      }
      
      return teacherObj;
    }));
    
    return {
      success: true,
      data: teachersWithClasses,
      count: teachers.length,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    console.error('Error getting teachers:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Lấy thông tin chi tiết giáo viên theo ID
 * @param {string} teacherId - ID của giáo viên
 * @param {boolean} includeClasses - Có bao gồm thông tin lớp học không
 * @returns {Promise<Object>} Thông tin giáo viên
 */
exports.getTeacherById = async (teacherId, includeClasses = true) => {
  try {
    const teacher = await databaseService.findById(models.Teacher, teacherId, 'teacherId');
    
    if (!teacher) {
      return { success: false, error: 'Teacher not found', code: 'TEACHER_NOT_FOUND' };
    }
    
    const teacherObj = teacher.toObject();
    
    if (includeClasses) {
      // Tìm tất cả lịch dạy của giáo viên
      console.log(`Looking for schedules with teacherId: ${teacherId}`);
      
      // Use direct collection access to bypass schema issues
      const schedules = await findClassSchedules(teacherId);
      
      // Lấy danh sách unique classIds - ensure they're numbers for querying
      const classIds = [...new Set(schedules.map(s => Number(s.classId)))];
      console.log(`Unique classIds for teacher ${teacherId}: ${classIds.join(', ')}`);
      
      if (classIds.length > 0) {
        // Lấy thông tin về các lớp - ensure classId is treated as a number
        const classes = await models.Class.find({ classId: { $in: classIds } });
        console.log(`Found ${classes.length} classes for teacher ${teacherId}`);
        
        if (classes.length > 0) {
          console.log(`Sample class: ${JSON.stringify(classes[0])}`);
        } else {
          // If no classes found, try logging one class to see format
          const sampleClass = await models.Class.findOne();
          if (sampleClass) {
            console.log(`Sample class from DB: ${JSON.stringify(sampleClass)}`);
            console.log(`classId type in sample: ${typeof sampleClass.classId}, value: ${sampleClass.classId}`);
          }
        }
        
        // Thêm mảng classesName và classesId để dễ sử dụng
        teacherObj.classesName = classes.map(c => c.className);
        teacherObj.classesId = classes.map(c => c.classId);
        
        console.log(`Teacher ${teacherId} classes: ${teacherObj.classesName.join(', ')}`);
      } else {
        // Nếu không tìm thấy lớp học nào, khởi tạo mảng rỗng
        teacherObj.classesName = [];
        teacherObj.classesId = [];
      }
      
      // Lấy thông tin về user liên kết
      const user = await databaseService.findById(models.User, teacher.userId, 'userId');
      if (user) {
        teacherObj.user = {
          name: user.name,
          email: user.email,
          role: user.role
        };
      }
    }
    
    return { success: true, data: teacherObj };
  } catch (error) {
    console.error('Error getting teacher by ID:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Lấy lịch dạy của giáo viên
 * @param {string} teacherId - ID của giáo viên
 * @returns {Promise<Object>} Lịch dạy của giáo viên
 */
exports.getTeacherSchedule = async (teacherId) => {
  try {
    const teacher = await databaseService.findById(models.Teacher, teacherId, 'teacherId');
    
    if (!teacher) {
      return { success: false, error: 'Teacher not found', code: 'TEACHER_NOT_FOUND' };
    }
    
    // Get current semester
    const semester = await models.Semester.findOne().sort({ startDate: -1 });
    
    if (!semester) {
      return { 
        success: false, 
        error: 'No active semester found',
        code: 'NO_ACTIVE_SEMESTER'
      };
    }
    
    console.log(`Looking for schedules with teacherId: ${teacherId} and semesterId: ${semester.semesterId}`);
    
    // Get teacher's schedule - ensure teacherId type consistency
    const teacherIdStr = String(teacherId);
    
    console.log(`Searching for teacherId: "${teacherIdStr}"`);
    
    // Check if any matching schedules exist in the database
    const scheduleCount = await models.ClassSchedule.countDocuments({ teacherId: teacherIdStr });
    console.log(`Found ${scheduleCount} matching schedules in total`);
    
    const schedules = await models.ClassSchedule.find({ teacherId: teacherIdStr })
      .sort({ dayOfWeek: 1, startTime: 1 });
    
    console.log(`Retrieved ${schedules.length} schedules for teacher ${teacherId}`);
    
    if (schedules.length > 0) {
      console.log('Sample schedule:', JSON.stringify(schedules[0].toObject(), null, 2));
    }
    
    // Enhance schedule with class, subject and classroom information
    const enhancedSchedules = await Promise.all(schedules.map(async (schedule) => {
      const [classInfo, subject, classroom] = await Promise.all([
        databaseService.findById(models.Class, schedule.classId, 'classId'),
        databaseService.findById(models.Subject, schedule.subjectId, 'subjectId'),
        databaseService.findById(models.Classroom, schedule.classroomId, 'classroomId')
      ]);
      
      return {
        ...schedule.toObject(),
        className: classInfo ? classInfo.className : 'Unknown Class',
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
    console.error('Error getting teacher schedule:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Tạo giáo viên mới
 * @param {Object} teacherData - Dữ liệu giáo viên
 * @returns {Promise<Object>} Giáo viên đã tạo
 */
exports.createTeacher = async (teacherData) => {
  try {
    const teacher = await databaseService.createDocument(models.Teacher, teacherData);
    
    if (!teacher) {
      return { success: false, error: 'Failed to create teacher', code: 'CREATE_FAILED' };
    }
    
    return { success: true, data: teacher };
  } catch (error) {
    console.error('Error creating teacher:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Cập nhật thông tin giáo viên
 * @param {string} teacherId - ID của giáo viên
 * @param {Object} updateData - Dữ liệu cập nhật
 * @returns {Promise<Object>} Giáo viên đã cập nhật
 */
exports.updateTeacher = async (teacherId, updateData) => {
  try {
    // Tìm giáo viên theo ID
    const teacher = await models.Teacher.findOne({ teacherId });
    
    if (!teacher) {
      return { success: false, error: 'Teacher not found', code: 'UPDATE_FAILED' };
    }
    
    // Lấy thông tin user liên kết
    const user = await models.User.findOne({ userId: teacher.userId });
    
    if (!user) {
      return { success: false, error: 'Related user not found', code: 'UPDATE_FAILED' };
    }
    
    // Lọc bỏ các trường chỉ dành riêng cho student
    const studentOnlyFields = ['className', 'classId', 'batchId', 'batchYear', 'parentIds', 'parentNames', 'parentCareers', 'parentPhones', 'parentGenders'];
    studentOnlyFields.forEach(field => {
      if (updateData[field] !== undefined) {
        delete updateData[field];
        console.log(`Ignored student-specific field: ${field}`);
      }
    });
    
    // Trích xuất thông tin cập nhật backup_email (dành cho user)
    const { backup_email } = updateData;
    
    // Biến kiểm tra xem có cần cập nhật userId và email không
    let needToUpdateUserIdAndEmail = false;
    let deletedScheduleIds = [];
    
    // Nếu firstName hoặc lastName thay đổi, cần tạo lại userId và email
    if ((updateData.firstName && updateData.firstName !== teacher.firstName) || 
        (updateData.lastName && updateData.lastName !== teacher.lastName)) {
      needToUpdateUserIdAndEmail = true;
    }
    
    // Xử lý nếu major thay đổi - cần xóa các lịch dạy cho môn không còn dạy
    if (updateData.major && updateData.major !== teacher.major) {
      const oldMajors = teacher.major ? teacher.major.split(', ') : [];
      const newMajors = updateData.major.split(', ');
      
      // Tìm các môn không còn dạy nữa
      const removedSubjects = oldMajors.filter(subject => !newMajors.includes(subject));
      
      if (removedSubjects.length > 0) {
        console.log(`Teacher ${teacherId} no longer teaches: ${removedSubjects.join(', ')}`);
        
        // Lấy danh sách các subjectId từ tên môn học
        const subjects = await models.Subject.find({});
        const subjectMap = {};
        
        // Tạo map từ tên môn học đến ID
        subjects.forEach(subject => {
          subjectMap[subject.subjectName] = subject.subjectId;
        });
        
        // Lấy subjectIds của các môn không còn dạy
        const removedSubjectIds = removedSubjects
          .map(subjectName => subjectMap[subjectName])
          .filter(id => id); // Loại bỏ undefined
        
        if (removedSubjectIds.length > 0) {
          console.log(`Removed subject IDs: ${removedSubjectIds.join(', ')}`);
          
          try {
            // Tìm và xóa tất cả lịch dạy liên quan đến các môn không còn dạy
            // Truy cập trực tiếp vào collection ClassSchedule thay vì qua model
            const ClassScheduleCollection = mongoose.connection.db.collection('ClassSchedule');
            
            // Đảm bảo teacherId là string
            const teacherIdString = String(teacherId);
            
            // Tìm các lịch dạy cần xóa
            const schedulesToDelete = await ClassScheduleCollection.find({
              teacherId: teacherIdString,
              subjectId: { $in: removedSubjectIds.map(id => String(id)) }
            }).toArray();
            
            console.log(`Found ${schedulesToDelete.length} schedules to delete for teacher ${teacherId}`);
            
            // Lưu ID của các lịch dạy bị xóa
            deletedScheduleIds = schedulesToDelete.map(schedule => 
              schedule._id ? schedule._id.toString() : null
            ).filter(id => id); // Loại bỏ các giá trị null
            
            // Xóa các lịch dạy
            if (schedulesToDelete.length > 0) {
              const deleteResult = await ClassScheduleCollection.deleteMany({
                teacherId: teacherIdString,
                subjectId: { $in: removedSubjectIds.map(id => String(id)) }
              });
              
              console.log(`Deleted ${deleteResult.deletedCount} schedules`);
            }
          } catch (error) {
            console.error('Error deleting ClassSchedules:', error);
          }
        }
      }
    }
    
    // Loại bỏ các trường không được phép cập nhật trực tiếp
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
    
    // Cập nhật backup_email trong User model nếu có
    if (backup_email !== undefined) {
      console.log(`Updating backup_email for user ${user.userId} to ${backup_email}`);
      user.backup_email = backup_email;
      await user.save();
    }
    
    // Cập nhật các trường khác của giáo viên
    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined && key !== '_id') {
        teacher[key] = updateData[key];
      }
    });
    
    // Nếu firstName hoặc lastName thay đổi, cập nhật userId và email
    if (needToUpdateUserIdAndEmail) {
      const firstName = updateData.firstName || teacher.firstName;
      const lastName = updateData.lastName || teacher.lastName;
      
      // Tạo userId mới
      const newUserId = generateTeacherUserId(firstName, lastName, teacherId);
      
      // Tạo email mới
      const newEmail = `${newUserId}@fams.edu.vn`;
      
      console.log(`Updating userId from ${teacher.userId} to ${newUserId} and email from ${teacher.email} to ${newEmail}`);
      
      // Xóa user account cũ
      await models.User.deleteOne({ userId: teacher.userId });
      
      // Tạo user account mới
      await models.User.create({
        userId: newUserId,
        username: newUserId,
        password: user.password,
        email: newEmail,
        backup_email: backup_email !== undefined ? backup_email : user.backup_email,
        role: 'teacher',
        isActive: true
      });
      
      // Cập nhật userId và email trong Teacher model
      teacher.userId = newUserId;
      teacher.email = newEmail;
    }
    
    // Lưu thông tin giáo viên
    const updatedTeacher = await teacher.save();
    
    if (!updatedTeacher) {
      return { success: false, error: 'Failed to update teacher', code: 'UPDATE_FAILED' };
    }
    
    return { 
      success: true, 
      data: updatedTeacher,
      deletedScheduleIds: deletedScheduleIds.length > 0 ? deletedScheduleIds : null,
      message: 'Teacher updated successfully'
    };
  } catch (error) {
    console.error('Error updating teacher:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Xóa giáo viên
 * @param {string} teacherId - ID của giáo viên
 * @returns {Promise<Object>} Kết quả xóa
 */
exports.deleteTeacher = async (teacherId) => {
  try {
    // Tìm giáo viên để lấy thông tin liên quan
    const teacher = await models.Teacher.findOne({ teacherId });
    
    if (!teacher) {
      return { success: false, error: 'Teacher not found', code: 'DELETE_FAILED' };
    }
    
    // Lấy userId để xóa user liên quan
    const userId = teacher.userId;
    
    try {
      // Đảm bảo teacherId là string
      const teacherIdString = String(teacherId);
      
      // Truy cập trực tiếp vào collection ClassSchedule thay vì qua model
      const ClassScheduleCollection = mongoose.connection.db.collection('ClassSchedule');
      
      // Tìm tất cả lịch dạy của giáo viên
      const teacherSchedules = await ClassScheduleCollection.find({ teacherId: teacherIdString }).toArray();
      console.log(`Found ${teacherSchedules.length} schedules for teacher ${teacherId} using direct collection access`);
      
      // Lưu ID của các lịch dạy bị xóa
      const deletedScheduleIds = teacherSchedules.map(schedule => 
        schedule._id ? schedule._id.toString() : null
      ).filter(id => id); // Loại bỏ các giá trị null
      
      // Xóa tất cả lịch dạy của giáo viên
      if (deletedScheduleIds.length > 0) {
        const deleteResult = await ClassScheduleCollection.deleteMany({ teacherId: teacherIdString });
        console.log(`Deleted ${deleteResult.deletedCount} schedules for teacher ${teacherId}`);
      }
      
      // Xóa giáo viên
      const teacherDeleted = await models.Teacher.deleteOne({ teacherId });
      
      // Xóa user liên quan
      await models.User.deleteOne({ userId });
      
      return { 
        success: true, 
        message: 'Teacher and related data deleted successfully',
        teacherDeleted: teacherDeleted.deletedCount > 0,
        deletedScheduleIds: deletedScheduleIds
      };
    } catch (error) {
      console.error('Error deleting teacher related data:', error);
      // Nếu có lỗi khi xóa dữ liệu liên quan, vẫn tiếp tục xóa teacher và user
      const teacherDeleted = await models.Teacher.deleteOne({ teacherId });
      await models.User.deleteOne({ userId });
      
      return { 
        success: true, 
        message: 'Teacher deleted successfully but there was an error deleting related data',
        teacherDeleted: teacherDeleted.deletedCount > 0,
        error: error.message
      };
    }
  } catch (error) {
    console.error('Error deleting teacher:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Tạo userId cho giáo viên dựa trên firstName, lastName và teacherId
 * @param {string} firstName - Tên của giáo viên
 * @param {string} lastName - Họ của giáo viên
 * @param {string} teacherId - ID giáo viên
 * @returns {string} userId được tạo
 */
function generateTeacherUserId(firstName, lastName, teacherId) {
  if (!firstName || !lastName || !teacherId) {
    throw new Error('Missing required fields for userId generation');
  }
  
  // Trong tên tiếng Việt, họ đứng trước (Nguyễn Văn A) -> lastName = Nguyễn Văn, firstName = A
  
  // Chuẩn hóa tên (loại bỏ dấu, chuyển thành chữ thường)
  const normalizedFirstName = removeDiacritics(firstName).toLowerCase();
  
  // Lấy chữ cái đầu của mỗi từ trong lastName và loại bỏ dấu
  const lastNameParts = lastName.split(' ');
  const lastNameInitials = lastNameParts.map(part => removeDiacritics(part.charAt(0)).toLowerCase()).join('');
  
  // Kết hợp với firstName và ID
  return `${normalizedFirstName}${lastNameInitials}${teacherId}`;
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
 * Directly check if teacher has any schedules
 * @param {string} teacherId - ID of the teacher
 * @returns {Promise<Object>} Result with schedule information
 */
exports.checkTeacherSchedules = async (teacherId) => {
  try {
    console.log(`Directly checking schedules for teacher ${teacherId}`);
    
    // Ensure we're using the correct type for comparison
    const teacherIdStr = String(teacherId);
    
    console.log(`Searching for teacherId: "${teacherIdStr}"`);
    
    // Check if any matching schedules exist in the database
    const scheduleCount = await models.ClassSchedule.countDocuments({ teacherId: teacherIdStr });
    console.log(`Found ${scheduleCount} matching schedules in total`);
    
    // Get the matching schedules
    const exactSchedules = await models.ClassSchedule.find({ teacherId: teacherIdStr });
    console.log(`Retrieved ${exactSchedules.length} schedules for teacher ${teacherId}`);
    
    // Get a sample of all schedules to check what teacherIds exist
    const sampleSchedules = await models.ClassSchedule.find().limit(10);
    const sampleTeacherIds = [...new Set(sampleSchedules.map(s => s.teacherId))];
    
    // Query for classIds related to this teacher - ensure they're numbers for querying
    const classIds = [...new Set(exactSchedules.map(s => Number(s.classId)))];
    console.log(`Unique classIds for teacher ${teacherId}: ${classIds.join(', ')}`);
    
    // Get class information if there are classIds
    let classes = [];
    if (classIds.length > 0) {
      classes = await models.Class.find({ classId: { $in: classIds } });
      console.log(`Found ${classes.length} classes with IDs [${classIds.join(', ')}]`);
      
      if (classes.length > 0) {
        // Get properties from first class to examine
        const classKeys = Object.keys(classes[0].toObject());
        console.log(`Class model keys: ${classKeys.join(', ')}`);
        console.log(`First class sample: ${JSON.stringify(classes[0].toObject())}`);
      } else {
        console.log(`No matching classes found for IDs [${classIds.join(', ')}]`);
        
        // Log some sample classes for comparison
        const sampleClasses = await models.Class.find().limit(3);
        if (sampleClasses.length > 0) {
          console.log('Sample classes from database:');
          sampleClasses.forEach((c, i) => {
            console.log(`Class ${i+1}: ${JSON.stringify(c.toObject())}`);
          });
        }
      }
    }
    
    // Check our ClassSchedule sample to see what types we're actually dealing with
    const scheduleClassIdTypes = exactSchedules.map(s => ({
      classId: s.classId,
      type: typeof s.classId,
      asNumber: Number(s.classId)
    }));
    
    return {
      success: true,
      data: {
        exactCount: exactSchedules.length,
        scheduleCount: scheduleCount,
        classIds: classIds,
        scheduleClassIdTypes: scheduleClassIdTypes,
        classes: classes.map(c => ({
          classId: c.classId,
          className: c.className,
          allFields: c.toObject()
        })),
        classesName: classes.map(c => c.className),
        classesId: classes.map(c => c.classId),
        teacherIdsInDB: sampleTeacherIds,
        sampleSchedules: sampleSchedules.map(s => ({
          scheduleId: s.scheduleId,
          classId: s.classId,
          teacherId: s.teacherId,
          teacherIdType: typeof s.teacherId
        }))
      }
    };
  } catch (error) {
    console.error('Error checking teacher schedules:', error);
    return { success: false, error: error.message };
  }
}; 