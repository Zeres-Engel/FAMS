/**
 * User Service - Tách biệt logic xử lý của User
 */

const { models } = require('../database');
const databaseService = require('./databaseService');
const mongoose = require('mongoose');

/**
 * Lấy danh sách người dùng với phân trang và lọc
 * @param {Object} options - Các option tìm kiếm
 * @returns {Promise<Object>} Danh sách người dùng
 */
exports.getUsers = async (options = {}) => {
  try {
    const { page = 1, limit = 10, sort = { userId: 1 }, filter = {}, search, className, roles, phone, grade } = options;
    
    // Xây dựng query filter
    let query = {};
    
    // Xử lý tham số search nếu có
    if (search && search !== 'none') {
      query = {
        $or: [
          { userId: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { backup_email: { $regex: search, $options: 'i' } },
          { username: { $regex: search, $options: 'i' } }
        ]
      };
    }
    
    // Xử lý lọc theo nhiều roles
    let selectedRoles = [];
    if (roles && (typeof roles === 'string' || Array.isArray(roles))) {
      // Chuyển sang mảng, tách bằng dấu phẩy và loại bỏ khoảng trắng
      const rolesArray = Array.isArray(roles) 
        ? roles 
        : roles.split(',').map(role => role.trim());
      
      selectedRoles = rolesArray.filter(r => r && r !== 'none');
      
      if (selectedRoles.length > 0) {
        if (query.$or) {
          // Nếu đã có điều kiện $or, thêm điều kiện AND
          query = {
            $and: [
              query,
              { role: { $in: selectedRoles } }
            ]
          };
        } else {
          // Nếu chưa có điều kiện $or, thêm trực tiếp
          query.role = { $in: selectedRoles };
        }
      }
    }
    
    // Xử lý lọc theo phone
    if (phone && phone !== 'none') {
      // Tiến hành tìm kiếm thông tin phone trong các bảng liên quan
      const [students, teachers, parents] = await Promise.all([
        models.Student.find({ phone: { $regex: phone, $options: 'i' } }),
        models.Teacher.find({ phone: { $regex: phone, $options: 'i' } }),
        models.Parent.find({ phone: { $regex: phone, $options: 'i' } })
      ]);
      
      const userIds = [
        ...students.map(s => s.userId),
        ...teachers.map(t => t.userId),
        ...parents.map(p => p.userId)
      ];
      
      if (userIds.length > 0) {
        if (query.$and || query.$or) {
          // Có điều kiện phức tạp, thêm điều kiện AND
          if (query.$and) {
            query.$and.push({ userId: { $in: userIds } });
          } else {
            query = {
              $and: [
                query,
                { userId: { $in: userIds } }
              ]
            };
          }
        } else {
          // Chưa có điều kiện, thêm trực tiếp
          query.userId = { $in: userIds };
        }
      } else {
        // Nếu không tìm thấy user nào với số điện thoại này, trả về kết quả rỗng
        return {
          success: true,
          data: [],
          count: 0,
          pagination: {
            total: 0,
            page,
            limit,
            pages: 0
          }
        };
      }
    }
    
    // Tạo danh sách userIds để áp dụng filter
    let filteredUserIds = [];
    let hasClassOrGradeFilter = false;
    
    // Xử lý lọc theo className và grade
    if ((className && className !== 'none') || (grade && grade !== 'none')) {
      hasClassOrGradeFilter = true;
      
      // Lấy danh sách các lớp phù hợp với điều kiện
      let matchingClassIds = [];
      
      if (className && className !== 'none') {
        // Tìm classId từ className cụ thể
        const classInfo = await models.Class.findOne({ className });
        if (classInfo) {
          matchingClassIds.push(classInfo.classId);
        }
      }
      
      if (grade && grade !== 'none') {
        // Tìm tất cả các lớp có khối tương ứng (bắt đầu bằng grade number)
        const gradeString = grade.toString();
        const gradeClasses = await models.Class.find({ 
          className: { $regex: `^${gradeString}`, $options: 'i' } 
        });
        
        if (gradeClasses && gradeClasses.length > 0) {
          // Chỉ thêm các classId chưa có trong danh sách
          for (const cls of gradeClasses) {
            if (!matchingClassIds.includes(cls.classId)) {
              matchingClassIds.push(cls.classId);
            }
          }
        }
      }
      
      console.log(`Found ${matchingClassIds.length} matching classes`);
      
      if (matchingClassIds.length > 0) {
        // Xử lý khác nhau cho từng role
        
        // Student: Lấy học sinh học trong các lớp phù hợp
        if (!selectedRoles.length || selectedRoles.includes('student')) {
          const students = await models.Student.find({ classId: { $in: matchingClassIds } });
          const studentUserIds = students.map(student => student.userId);
          filteredUserIds.push(...studentUserIds);
          console.log(`Found ${studentUserIds.length} students in matching classes`);
        }
        
        // Teacher: Lấy giáo viên dạy trong các lớp phù hợp
        if (!selectedRoles.length || selectedRoles.includes('teacher')) {
          // Tìm lịch dạy cho các lớp
          // Use direct collection access to bypass schema issues
          const ClassScheduleCollection = mongoose.connection.db.collection('ClassSchedule');
          const schedules = await ClassScheduleCollection.find({ classId: { $in: matchingClassIds.map(id => Number(id)) } }).toArray();
          
          // Lấy danh sách unique teacherIds
          const teacherIds = [...new Set(schedules.map(s => s.teacherId))];
          console.log(`Found ${teacherIds.length} unique teachers in matching classes`);
          
          // Lấy thông tin giáo viên
          const teachers = await models.Teacher.find({ teacherId: { $in: teacherIds } });
          const teacherUserIds = teachers.map(teacher => teacher.userId);
          filteredUserIds.push(...teacherUserIds);
          console.log(`Found ${teacherUserIds.length} teachers teaching matching classes`);
        }
        
        // Parent: Lấy phụ huynh có con học trong các lớp phù hợp
        if (!selectedRoles.length || selectedRoles.includes('parent')) {
          // 1. Tìm học sinh trong các lớp
          const students = await models.Student.find({ classId: { $in: matchingClassIds } });
          const studentIds = students.map(student => student.studentId);
          
          // 2. Tìm quan hệ phụ huynh-học sinh
          const parentStudentRelations = await models.ParentStudent.find({ 
            studentId: { $in: studentIds } 
          });
          const parentIds = [...new Set(parentStudentRelations.map(relation => relation.parentId))];
          
          // 3. Lấy thông tin phụ huynh
          const parents = await models.Parent.find({ parentId: { $in: parentIds } });
          const parentUserIds = parents.map(parent => parent.userId);
          
          filteredUserIds.push(...parentUserIds);
          console.log(`Found ${parentUserIds.length} parents with children in matching classes`);
        }
      }
    }
    
    // Áp dụng filter theo classId hoặc grade nếu có
    if (hasClassOrGradeFilter && filteredUserIds.length > 0) {
      // Loại bỏ các userId trùng lặp
      filteredUserIds = [...new Set(filteredUserIds)];
      
      if (query.$and || query.$or) {
        // Có điều kiện phức tạp, thêm điều kiện AND
        if (query.$and) {
          query.$and.push({ userId: { $in: filteredUserIds } });
        } else {
          query = {
            $and: [
              query,
              { userId: { $in: filteredUserIds } }
            ]
          };
        }
      } else {
        // Chưa có điều kiện, thêm trực tiếp
        query.userId = { $in: filteredUserIds };
      }
    }
    else if (hasClassOrGradeFilter && filteredUserIds.length === 0) {
      // Nếu áp dụng filter className/grade nhưng không tìm thấy user nào, trả về kết quả rỗng
      return {
        success: true,
        data: [],
        count: 0,
        pagination: {
          total: 0,
          page,
          limit,
          pages: 0
        }
      };
    }
    
    // Thêm các điều kiện filter khác
    const filterKeys = Object.keys(filter);
    for (const key of filterKeys) {
      if (key !== 'page' && key !== 'limit' && key !== 'sortBy' && key !== 'sortDir' &&
          key !== 'search' && key !== 'className' && key !== 'roles' &&
          key !== 'phone' && key !== 'grade') {
        const value = filter[key];
        
        // Bỏ qua các giá trị là 'none'
        if (value !== 'none' && value !== undefined && value !== '') {
          try {
            // Kiểm tra nếu field là number trong schema thì convert sang Number
            const modelSchema = models.User.schema.paths[key];
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
    const users = await models.User.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit);
      
    const total = await models.User.countDocuments(query);
    
    console.log(`Found ${users.length} users out of ${total} total`);
    
    // Bổ sung thông tin chi tiết cho từng người dùng dựa theo role
    const usersWithDetails = await Promise.all(users.map(async (user) => {
      const userObj = user.toObject();
      
      // Không trả về mật khẩu
      delete userObj.password;
      
      // Get RFID information for this user if exists
      const RFID = require('../database/models/RFID');
      const rfidCard = await RFID.findOne({ UserID: user.userId });
      if (rfidCard) {
        userObj.rfid = {
          RFID_ID: rfidCard.RFID_ID,
          IssueDate: rfidCard.IssueDate,
          ExpiryDate: rfidCard.ExpiryDate,
          Status: rfidCard.Status
        };
      }
      
      // Lấy thông tin chi tiết dựa theo role
      const role = user.role.toLowerCase();
      
      if (role === 'student') {
        const student = await models.Student.findOne({ userId: user.userId });
        if (student) {
          // Debug to check if gender value exists in Student document
          console.log(`Student ${student.fullName} (${user.userId}) gender from DB:`, student.gender);
          console.log('Student gender type:', typeof student.gender);
          console.log('Student full data:', JSON.stringify(student, null, 2));
          
          // Thêm gender trực tiếp vào userObj - xử lý dạng chuỗi (Male/Female)
          userObj.gender = student.gender || null;
          
          // Bổ sung thông tin học sinh
          userObj.details = {
            studentId: student.studentId,
            firstName: student.firstName,
            lastName: student.lastName,
            fullName: student.fullName,
            phone: student.phone,
            gender: student.gender || null, // Giữ nguyên giá trị chuỗi Male/Female
            dateOfBirth: student.dateOfBirth,
            address: student.address,
            classId: student.classId,
            batchId: student.batchId
          };

          // Lấy thông tin phụ huynh của học sinh
          const parentStudentRelations = await models.ParentStudent.find({ studentId: student.studentId });
          if (parentStudentRelations.length > 0) {
            const parentIds = parentStudentRelations.map(ps => ps.parentId);
            const parents = await models.Parent.find({ parentId: { $in: parentIds } });
            
            // Lấy thông tin User của phụ huynh
            const parentUserIds = parents.map(p => p.userId);
            const parentUsers = await models.User.find({ userId: { $in: parentUserIds } });
            
            // Kết hợp thông tin phụ huynh
            userObj.details.parents = parents.map(parent => {
              const parentUser = parentUsers.find(u => u.userId === parent.userId);
              return {
                parentId: parent.parentId,
                firstName: parent.firstName,
                lastName: parent.lastName,
                fullName: parent.fullName,
                phone: parent.phone,
                gender: parent.gender,
                career: parent.career,
                email: parentUser ? parentUser.email : null,
                backup_email: parentUser ? parentUser.backup_email : null
              };
            });
          }
          
          // Thêm thông tin className nếu có
          if (student.classId) {
            const classInfo = await models.Class.findOne({ classId: student.classId });
            if (classInfo) {
              userObj.details.className = classInfo.className;
              // Thêm grade từ className
              if (classInfo.className) {
                const match = classInfo.className.match(/^(\d+)/);
                if (match && match[1]) {
                  userObj.details.grade = match[1];
                }
              }
            }
          }
        }
      }
      else if (role === 'teacher') {
        const teacher = await models.Teacher.findOne({ userId: user.userId });
        if (teacher) {
          // Copy teacher data directly to userObj (flatter structure)
          userObj.teacherId = teacher.teacherId;
          userObj.firstName = teacher.firstName || null;
          userObj.lastName = teacher.lastName || null;
          userObj.fullName = teacher.fullName;
          userObj.phone = teacher.phone;
          userObj.dateOfBirth = teacher.dateOfBirth;
          userObj.gender = teacher.gender;
          userObj.major = teacher.major;
          userObj.degree = teacher.degree;
          userObj.WeeklyCapacity = teacher.WeeklyCapacity;
          
          // Remove backup_email for teacher role
          delete userObj.backup_email;
          
          // Get classes taught
          // Use direct collection access to bypass schema issues
          const ClassScheduleCollection = mongoose.connection.db.collection('ClassSchedule');
          const schedules = await ClassScheduleCollection.find({ teacherId: Number(teacher.teacherId) }).toArray();
          
          // Lấy danh sách unique classIds - ensure they're numbers for querying
          const classIds = [...new Set(schedules.map(s => Number(s.classId)))];
          
          // Get class information
          const classes = classIds.length > 0 
            ? await models.Class.find({ classId: { $in: classIds } })
            : [];
          
          // Format classes array consistently with getUsers
          userObj.classes = classes.map(c => ({
            classId: c.classId,
            className: c.className,
            grade: c.className ? c.className.match(/^(\d+)/)?.[1] : null
          }));
        }
      }
      else if (role === 'parent') {
        const parent = await models.Parent.findOne({ userId: user.userId });
        if (parent) {
          // Copy parent data directly to userObj
          userObj.parentId = parent.parentId;
          userObj.firstName = parent.firstName;
          userObj.lastName = parent.lastName;
          userObj.fullName = parent.fullName;
          userObj.phone = parent.phone;
          userObj.gender = parent.gender;
          userObj.career = parent.career;
          
          // Tìm các học sinh liên quan
          const parentStudents = await models.ParentStudent.find({ parentId: parent.parentId });
          
          // Initialize empty arrays
          userObj.studentsId = [];
          userObj.classesId = [];
          userObj.classesName = [];
          userObj.grades = [];
          userObj.students = [];
          
          if (parentStudents.length > 0) {
            const studentIds = parentStudents.map(ps => ps.studentId);
            const students = await models.Student.find({ studentId: { $in: studentIds } });
            
            // Add student IDs directly to parent
            userObj.studentsId = students.map(s => s.studentId);
            
            // Collect all classes and grades
            const allClassIds = [];
            const allClassNames = [];
            const allGrades = [];
            
            // Tìm lớp học và thêm grade cho mỗi học sinh
            const studentDetails = await Promise.all(students.map(async (s) => {
              const studentObj = {
                studentId: s.studentId,
                firstName: s.firstName,
                lastName: s.lastName,
                fullName: s.fullName
              };
              
              if (s.classId) {
                allClassIds.push(s.classId);
                
                const classInfo = await models.Class.findOne({ classId: s.classId });
                if (classInfo) {
                  studentObj.className = classInfo.className;
                  allClassNames.push(classInfo.className);
                  
                  if (classInfo.className) {
                    const match = classInfo.className.match(/^(\d+)/);
                    if (match && match[1]) {
                      studentObj.grade = match[1];
                      allGrades.push(match[1]);
                    }
                  }
                }
              }
              
              return studentObj;
            }));
            
            userObj.students = studentDetails;
            
            // Add unique class IDs, class names and grades to parent
            userObj.classesId = [...new Set(allClassIds)];
            userObj.classesName = [...new Set(allClassNames)];
            userObj.grades = [...new Set(allGrades)];
          }
        }
      }
      
      return userObj;
    }));
    
    return {
      success: true,
      data: usersWithDetails,
      count: users.length,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    console.error('Error getting users:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Lấy thông tin chi tiết người dùng theo ID
 * @param {string} userId - ID của người dùng
 * @param {boolean} includeDetails - Có bao gồm thông tin chi tiết không
 * @returns {Promise<Object>} Thông tin người dùng
 */
exports.getUserById = async (userId, includeDetails = true) => {
  try {
    const user = await databaseService.findById(models.User, userId, 'userId');
    
    if (!user) {
      return { success: false, error: 'User not found', code: 'USER_NOT_FOUND' };
    }
    
    const userObj = user.toObject();
    
    // Không trả về mật khẩu
    delete userObj.password;
    
    // Get RFID information for this user if exists
    const RFID = require('../database/models/RFID');
    const rfidCard = await RFID.findOne({ UserID: userId });
    if (rfidCard) {
      userObj.rfid = {
        RFID_ID: rfidCard.RFID_ID,
        IssueDate: rfidCard.IssueDate,
        ExpiryDate: rfidCard.ExpiryDate,
        Status: rfidCard.Status
      };
    }
    
    if (!includeDetails) {
      return { success: true, data: userObj };
    }
    
    // Lấy thông tin chi tiết dựa theo role
    const role = user.role.toLowerCase();
    
    if (role === 'student') {
      const student = await models.Student.findOne({ userId: user.userId });
      if (student) {
        // Debug to check if gender value exists in Student document
        console.log(`Student ${student.fullName} (${user.userId}) gender from DB:`, student.gender);
        console.log('Student gender type:', typeof student.gender);
        console.log('Student full data:', JSON.stringify(student, null, 2));
        
        // Thêm gender trực tiếp vào userObj - xử lý dạng chuỗi (Male/Female)
        userObj.gender = student.gender || null;
        
        // Bổ sung thông tin học sinh
        userObj.details = {
          studentId: student.studentId,
          firstName: student.firstName,
          lastName: student.lastName,
          fullName: student.fullName,
          phone: student.phone,
          gender: student.gender || null, // Giữ nguyên giá trị chuỗi Male/Female
          dateOfBirth: student.dateOfBirth,
          address: student.address,
          classId: student.classId,
          batchId: student.batchId
        };

        // Lấy thông tin phụ huynh của học sinh
        const parentStudentRelations = await models.ParentStudent.find({ studentId: student.studentId });
        if (parentStudentRelations.length > 0) {
          const parentIds = parentStudentRelations.map(ps => ps.parentId);
          const parents = await models.Parent.find({ parentId: { $in: parentIds } });
          
          // Lấy thông tin User của phụ huynh
          const parentUserIds = parents.map(p => p.userId);
          const parentUsers = await models.User.find({ userId: { $in: parentUserIds } });
          
          // Kết hợp thông tin phụ huynh
          userObj.details.parents = parents.map(parent => {
            const parentUser = parentUsers.find(u => u.userId === parent.userId);
            return {
              parentId: parent.parentId,
              firstName: parent.firstName,
              lastName: parent.lastName,
              fullName: parent.fullName,
              phone: parent.phone,
              gender: parent.gender,
              career: parent.career,
              email: parentUser ? parentUser.email : null,
              backup_email: parentUser ? parentUser.backup_email : null
            };
          });
        }
      }
    }
    else if (role === 'teacher') {
      const teacher = await models.Teacher.findOne({ userId: user.userId });
      if (teacher) {
        // Copy teacher data directly to userObj (flatter structure)
        userObj.teacherId = teacher.teacherId;
        userObj.firstName = teacher.firstName || null;
        userObj.lastName = teacher.lastName || null;
        userObj.fullName = teacher.fullName;
        userObj.phone = teacher.phone;
        userObj.dateOfBirth = teacher.dateOfBirth;
        userObj.gender = teacher.gender;
        userObj.major = teacher.major;
        userObj.degree = teacher.degree;
        userObj.WeeklyCapacity = teacher.WeeklyCapacity;
        
        // Remove backup_email for teacher role
        delete userObj.backup_email;
        
        // Get classes taught
        // Use direct collection access to bypass schema issues
        const ClassScheduleCollection = mongoose.connection.db.collection('ClassSchedule');
        const schedules = await ClassScheduleCollection.find({ teacherId: Number(teacher.teacherId) }).toArray();
        
        // Lấy danh sách unique classIds - ensure they're numbers for querying
        const classIds = [...new Set(schedules.map(s => Number(s.classId)))];
        
        // Get class information
        const classes = classIds.length > 0 
          ? await models.Class.find({ classId: { $in: classIds } })
          : [];
        
        // Format classes array consistently with getUsers
        userObj.classes = classes.map(c => ({
          classId: c.classId,
          className: c.className,
          grade: c.className ? c.className.match(/^(\d+)/)?.[1] : null
        }));
      }
    }
    else if (role === 'parent') {
      const parent = await models.Parent.findOne({ userId: user.userId });
      if (parent) {
        // Get children
        const parentStudents = await models.ParentStudent.find({ parentId: parent.parentId });
        const studentIds = parentStudents.map(ps => ps.studentId);
        
        const students = studentIds.length > 0
          ? await models.Student.find({ studentId: { $in: studentIds } })
          : [];
        
        userObj.details = {
          parent,
          students,
          relations: parentStudents
        };
      }
    }
    
    return { success: true, data: userObj };
  } catch (error) {
    console.error('Error getting user by ID:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Xóa người dùng và dữ liệu liên quan dựa trên userId
 * @param {string} userId - ID của người dùng cần xóa
 * @returns {Promise<Object>} Kết quả xóa
 */
exports.deleteUser = async (userId) => {
  try {
    // Tìm người dùng
    const user = await models.User.findOne({ userId });
    
    if (!user) {
      return { 
        success: false, 
        error: 'User not found', 
        code: 'USER_NOT_FOUND' 
      };
    }
    
    // Biến lưu kết quả xóa
    const deletedData = {
      user: false,
      studentData: false,
      teacherData: false,
      parentData: false,
      parentStudentRelations: false,
      schedules: []
    };
    
    // Xử lý xóa dữ liệu liên quan dựa trên role
    const role = user.role.toLowerCase();
    
    // Xử lý student
    if (role === 'student') {
      // Tìm thông tin học sinh
      const student = await models.Student.findOne({ userId });
      
      if (student) {
        const studentId = student.studentId;
        
        console.log(`Deleting student ${studentId} with userId ${userId}`);
        
        // Xóa quan hệ phụ huynh-học sinh
        const deletedRelations = await models.ParentStudent.deleteMany({ studentId });
        deletedData.parentStudentRelations = deletedRelations.deletedCount > 0;
        console.log(`Deleted ${deletedRelations.deletedCount} parent-student relations`);
        
        // Xóa học sinh
        await models.Student.deleteOne({ studentId });
        deletedData.studentData = true;
        console.log(`Deleted student record with ID ${studentId}`);
      }
    }
    // Xử lý teacher
    else if (role === 'teacher') {
      // Tìm thông tin giáo viên
      const teacher = await models.Teacher.findOne({ userId });
      
      if (teacher) {
        const teacherId = teacher.teacherId;
        
        console.log(`Deleting teacher ${teacherId} with userId ${userId}`);
        
        // Xóa lịch dạy của giáo viên
        // Truy cập trực tiếp collection
        const ClassScheduleCollection = mongoose.connection.db.collection('ClassSchedule');
        
        // Tìm tất cả lịch dạy cần xóa
        const teacherSchedules = await ClassScheduleCollection.find({ 
          teacherId: Number(teacherId) 
        }).toArray();
        
        // Lưu ID của lịch
        deletedData.schedules = teacherSchedules.map(schedule => 
          schedule._id ? schedule._id.toString() : null
        ).filter(id => id);
        
        // Xóa lịch dạy
        const deletedSchedules = await ClassScheduleCollection.deleteMany({ teacherId: Number(teacherId) });
        console.log(`Deleted ${deletedSchedules.deletedCount} class schedules for teacher ${teacherId}`);
        
        // Bỏ chủ nhiệm lớp nếu có
        const updatedClasses = await models.Class.updateMany(
          { homeroomTeacherId: userId },
          { $unset: { homeroomTeacherId: "" } }
        );
        console.log(`Updated ${updatedClasses.modifiedCount} classes to remove homeroom teacher reference`);
        
        // Xóa giáo viên
        await models.Teacher.deleteOne({ teacherId });
        deletedData.teacherData = true;
        console.log(`Deleted teacher record with ID ${teacherId}`);
      }
    }
    // Xử lý parent
    else if (role === 'parent') {
      // Tìm thông tin phụ huynh
      const parent = await models.Parent.findOne({ userId });
      
      if (parent) {
        const parentId = parent.parentId;
        
        console.log(`Deleting parent ${parentId} with userId ${userId}`);
        
        // Xóa quan hệ phụ huynh-học sinh
        const deletedRelations = await models.ParentStudent.deleteMany({ parentId });
        deletedData.parentStudentRelations = deletedRelations.deletedCount > 0;
        console.log(`Deleted ${deletedRelations.deletedCount} parent-student relations`);
        
        // Xóa phụ huynh
        await models.Parent.deleteOne({ parentId });
        deletedData.parentData = true;
        console.log(`Deleted parent record with ID ${parentId}`);
      }
    }
    
    // Xóa tài khoản người dùng
    await models.User.deleteOne({ userId });
    deletedData.user = true;
    console.log(`Deleted user account with userId ${userId}`);
    
    return {
      success: true,
      message: 'User and related data deleted successfully',
      deletedData
    };
  } catch (error) {
    console.error('Error deleting user:', error);
    return { 
      success: false, 
      error: error.message,
      code: 'DELETE_FAILED'
    };
  }
};
