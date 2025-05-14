/**
 * User Service - Tách biệt logic xử lý của User
 */

const { models } = require('../database');
const databaseService = require('./databaseService');
const mongoose = require('mongoose');

/**
 * Format phone number to ensure it's a 10-digit string starting with '0'
 * @param {any} phone - The phone number to format
 * @returns {string} - Formatted phone number
 */
const formatPhoneNumber = (phone) => {
  if (!phone) return '';
  
  // Convert to string and remove non-digit characters
  let phoneStr = String(phone).replace(/[^\d]/g, '');
  
  // If it's already 10 digits and starts with 0, return as is
  if (phoneStr.length === 10 && phoneStr.startsWith('0')) {
    return phoneStr;
  }
  
  // If it's 9 digits (missing leading 0), add the 0
  if (phoneStr.length === 9) {
    return '0' + phoneStr;
  }
  
  // If it has more than 10 digits, trim to 10
  if (phoneStr.length > 10) {
    // If it doesn't start with 0, keep first 9 digits and add 0
    if (!phoneStr.startsWith('0')) {
      return '0' + phoneStr.substring(0, 9);
    }
    // If it starts with 0, keep first 10 digits
    return phoneStr.substring(0, 10);
  }
  
  // For other cases, return as is with best effort
  if (!phoneStr.startsWith('0') && phoneStr.length > 0) {
    return '0' + phoneStr;
  }
  
  return phoneStr;
};

/**
 * Remove Vietnamese accents from a string
 * @param {string} str - The string to process
 * @returns {string} - String without accents
 */
const removeVietnameseAccents = (str) => {
  if (!str) return '';
  
  // Mapping of Vietnamese characters with accents to non-accented equivalents
  const map = {
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
  
  return str.replace(/[^\u0000-\u007E]/g, char => map[char] || char);
};

/**
 * Lấy danh sách người dùng với phân trang và lọc
 * @param {Object} options - Các option tìm kiếm
 * @returns {Promise<Object>} Danh sách người dùng
 */
exports.getUsers = async (options = {}) => {
  try {
    const { page = 1, limit = 10, sort = { userId: 1 }, filter = {}, search, className, roles, phone, grade, academicYear } = options;
    
    // Xây dựng query filter
    let query = {};
    
    // Xử lý tham số search nếu có
    if (search && search !== 'none') {
      // Tìm tất cả các người dùng dựa trên userId
      const userIdQuery = { userId: { $regex: search, $options: 'i' } };
      
      const Student = require('../database/models/Student');
      const Teacher = require('../database/models/Teacher');
      const Parent = require('../database/models/Parent');
      
      // Tìm kiếm không phân biệt có dấu hoặc không dấu
      const searchLower = search.toLowerCase();
      const searchWithoutAccent = removeVietnameseAccents(searchLower);
      
      // Tìm kiếm không phân biệt dấu
      // Chỉ tìm người có firstName là "Thanh" (không phải có chứa từ "thanh" trong tên)
      const isExactFirstNameMatch = (fullName) => {
        if (!fullName) return false;
        
        // Tách tên thành các phần
        const parts = removeVietnameseAccents(fullName.toLowerCase()).split(' ');
        
        // Thường tên (firstName) ở vị trí cuối cùng trong chuỗi tên tiếng Việt
        if (parts.length > 0) {
          // Nếu là Nguyễn Phước Thanh thì firstName là "Thanh"
          return parts[parts.length - 1] === searchWithoutAccent;
        }
        return false;
      };
      
      // Student
      const studentsWithoutAccent = await Student.find().then(students => 
        students.filter(student => isExactFirstNameMatch(student.fullName))
      );
      
      // Teacher
      const teachersWithoutAccent = await Teacher.find().then(teachers => 
        teachers.filter(teacher => isExactFirstNameMatch(teacher.fullName))
      );
      
      // Parent
      const parentsWithoutAccent = await Parent.find().then(parents => 
        parents.filter(parent => isExactFirstNameMatch(parent.fullName))
      );
      
      // Gộp các userId từ tất cả các nguồn tìm kiếm
      const studentUserIds = studentsWithoutAccent.map(s => s.userId);
      const teacherUserIds = teachersWithoutAccent.map(t => t.userId);
      const parentUserIds = parentsWithoutAccent.map(p => p.userId);
      
      // Loại bỏ trùng lặp
      const userIdsWithName = [...new Set([...studentUserIds, ...teacherUserIds, ...parentUserIds])];
      
      // Xây dựng query cuối cùng
      query = { 
        $or: [
          userIdQuery,
          { userId: { $in: userIdsWithName } }
        ] 
      };
      
      // Log thông tin tìm kiếm để dễ theo dõi
      console.log(`Search term: "${search}"`);
      console.log(`Search without accent: "${searchWithoutAccent}"`);
      console.log(`Found ${userIdsWithName.length} users matching name search`);
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
    
    // Xử lý lọc theo số điện thoại
    if (phone && phone !== 'none') {
      // Chuẩn hóa số điện thoại để tìm kiếm
      const formattedPhone = formatPhoneNumber(phone);
      console.log(`Searching for phone: ${phone}, formatted: ${formattedPhone}`);
      
      // Tìm kiếm học sinh, giáo viên, phụ huynh có số điện thoại tương ứng
      const Student = require('../database/models/Student');
      const Teacher = require('../database/models/Teacher');
      const Parent = require('../database/models/Parent');
      
      try {
        // Lọc theo tiền tố số điện thoại
        const phonePrefix = formattedPhone;
        
        // Tìm học sinh có số điện thoại bắt đầu bằng prefix
        const students = await Student.find().then(students => 
          students.filter(student => 
            formatPhoneNumber(student.phone).startsWith(phonePrefix)
          )
        );
        
        // Tìm giáo viên có số điện thoại bắt đầu bằng prefix
        const teachers = await Teacher.find().then(teachers => 
          teachers.filter(teacher => 
            formatPhoneNumber(teacher.phone).startsWith(phonePrefix)
          )
        );
        
        // Tìm phụ huynh có số điện thoại bắt đầu bằng prefix
        const parents = await Parent.find().then(parents => 
          parents.filter(parent => 
            formatPhoneNumber(parent.phone).startsWith(phonePrefix)
          )
        );
        
        // Lấy danh sách userId
        const studentUserIds = students.map(s => s.userId);
        const teacherUserIds = teachers.map(t => t.userId);
        const parentUserIds = parents.map(p => p.userId);
        
        // Gộp và loại bỏ trùng lặp
        const userIdsWithPhone = [...new Set([...studentUserIds, ...teacherUserIds, ...parentUserIds])];
        
        console.log(`Found ${userIdsWithPhone.length} users with phone number matching "${phonePrefix}"`);
        
        // Thêm điều kiện tìm kiếm
        if (userIdsWithPhone.length > 0) {
          if (query.$and) {
            query.$and.push({ userId: { $in: userIdsWithPhone } });
          } else if (query.$or) {
            query = {
              $and: [
                query,
                { userId: { $in: userIdsWithPhone } }
              ]
            };
          } else {
            query.userId = { $in: userIdsWithPhone };
          }
        } else {
          // Nếu không tìm thấy user nào, trả về kết quả rỗng
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
      } catch (error) {
        console.error('Error searching by phone:', error);
      }
    }
    
    // Chứa danh sách userId đã lọc
    let filteredUserIds = [];
    let hasClassOrGradeFilter = false;
    
    // Xử lý lọc theo className và grade
    if ((className && className !== 'none') || (grade && grade !== 'none') || (academicYear && academicYear !== 'none')) {
      hasClassOrGradeFilter = true;
      
      // Truy vấn lấy tất cả các lớp phù hợp
      let classQuery = {};
      
      if (className && className !== 'none') {
        classQuery.className = { $regex: className, $options: 'i' };
      }
      
      if (grade && grade !== 'none') {
        classQuery.grade = parseInt(grade, 10);
      }
      
      if (academicYear && academicYear !== 'none') {
        classQuery.academicYear = academicYear;
      }
      
      // Tìm tất cả các lớp phù hợp
      const Class = require('../database/models/Class');
      const matchingClasses = await Class.find(classQuery);
      const matchingClassIds = matchingClasses.map(cls => cls.classId);
      
      console.log(`Found ${matchingClasses.length} matching classes for filters:`, classQuery);
      
      if (matchingClassIds.length > 0) {
        // Student: Lấy học sinh trong các lớp phù hợp
        if (!selectedRoles.length || selectedRoles.includes('student')) {
          // Tìm học sinh trong các lớp (sử dụng classIds array)
          const Student = require('../database/models/Student');
          const students = await Student.find({ classIds: { $in: matchingClassIds } });
          const studentUserIds = students.map(student => student.userId);
          
          filteredUserIds.push(...studentUserIds);
          console.log(`Found ${studentUserIds.length} students in matching classes`);
        }
        
        // Teacher: Lấy giáo viên dạy các lớp phù hợp hoặc là GVCN
        if (!selectedRoles.length || selectedRoles.includes('teacher')) {
          // 1. Tìm giáo viên là GVCN của các lớp
          const homeroomTeacherIds = matchingClasses.map(cls => cls.homeroomTeacherId).filter(id => id);
          
          // 2. Tìm giáo viên dạy trong các lớp (sử dụng classIds array)
          const Teacher = require('../database/models/Teacher');
          const teachers = await Teacher.find({ 
            $or: [
              { userId: { $in: homeroomTeacherIds } },
              { classIds: { $in: matchingClassIds } }
            ]
          });
          
          const teacherUserIds = teachers.map(teacher => teacher.userId);
          filteredUserIds.push(...teacherUserIds);
          console.log(`Found ${teacherUserIds.length} teachers teaching matching classes`);
        }
        
        // Parent: Lấy phụ huynh có con học trong các lớp phù hợp
        if (!selectedRoles.length || selectedRoles.includes('parent')) {
          // 1. Tìm học sinh trong các lớp
          const Student = require('../database/models/Student');
          const students = await Student.find({ classIds: { $in: matchingClassIds } });
          const studentIds = students.map(student => student.studentId);
          
          // 2. Tìm phụ huynh qua parentIds trong bảng Student
          const parentUserIds = [];
          for (const student of students) {
            if (student.parentIds && student.parentIds.length > 0) {
              parentUserIds.push(...student.parentIds);
            }
          }
          
          if (parentUserIds.length > 0) {
            filteredUserIds.push(...parentUserIds);
            console.log(`Found ${parentUserIds.length} parents with children in matching classes`);
          }
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
    
    // Áp dụng lọc theo các tham số khác
    for (const [key, value] of Object.entries(filter)) {
      if (value !== 'none' && value !== '') {
        if (query.$and) {
          query.$and.push({ [key]: value });
        } else if (query.$or) {
          query = { $and: [query, { [key]: value }] };
        } else {
          query[key] = value;
        }
      }
    }
    
    console.log("Final MongoDB query:", JSON.stringify(query, null, 2));
    
    // Lấy tổng số bản ghi phù hợp với query
    const UserAccount = require('../database/models/UserAccount');
    const total = await UserAccount.countDocuments(query);
    
    // Tính toán skip và trang
    const skip = (page - 1) * limit;
    const pages = Math.ceil(total / limit);
    
    // Lấy danh sách người dùng với phân trang
    const users = await UserAccount.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit);
    
    // Bổ sung thông tin chi tiết người dùng theo vai trò
    const userData = await Promise.all(users.map(async (user) => {
      const userObj = user.toObject();
      
      // Không trả về mật khẩu
      delete userObj.password;
      
      const role = user.role.toLowerCase();
      
      // Bổ sung thông tin theo vai trò
      if (role === 'student') {
        // Lấy thông tin học sinh
        const Student = require('../database/models/Student');
        const student = await Student.findOne({ userId: user.userId });
        
        if (student) {
          // Lấy thông tin lớp học
          const Class = require('../database/models/Class');
          let classes = [];
          
          if (student.classIds && student.classIds.length > 0) {
            classes = await Class.find({ classId: { $in: student.classIds } });
          }
          
          userObj.details = {
            studentId: student.studentId,
            fullName: student.fullName,
            dateOfBirth: student.dateOfBirth,
            gender: student.gender,
            address: student.address,
            phone: formatPhoneNumber(student.phone),
            classes: classes.map(cls => ({
              classId: cls.classId,
              className: cls.className,
              grade: cls.grade,
              academicYear: cls.academicYear
            })),
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
                phone: formatPhoneNumber(parent.phone),
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
        // Lấy thông tin giáo viên
        const Teacher = require('../database/models/Teacher');
        const teacher = await Teacher.findOne({ userId: user.userId });
        
        if (teacher) {
          // Lấy danh sách lớp học
          const Class = require('../database/models/Class');
          let teachingClasses = [];
          
          if (teacher.classIds && teacher.classIds.length > 0) {
            teachingClasses = await Class.find({ classId: { $in: teacher.classIds } });
          }
          
          // Lấy các lớp làm GVCN
          const homeroomClasses = await Class.find({ homeroomTeacherId: teacher.userId });
          
          userObj.details = {
            teacherId: teacher.teacherId,
            fullName: teacher.fullName,
            dateOfBirth: teacher.dateOfBirth,
            gender: teacher.gender,
            address: teacher.address,
            phone: formatPhoneNumber(teacher.phone),
            major: teacher.major,
            degree: teacher.degree,
            weeklyCapacity: teacher.weeklyCapacity,
            academicYear: teacher.academicYear,
            classes: teachingClasses.map(cls => ({
              classId: cls.classId,
              className: cls.className,
              grade: cls.grade,
              academicYear: cls.academicYear,
              isHomeroom: homeroomClasses.some(h => h.classId === cls.classId)
            }))
          };
        }
      }
      else if (role === 'parent') {
        // Lấy thông tin phụ huynh từ Parent model
        const Parent = require('../database/models/Parent');
        const parent = await Parent.findOne({ userId: user.userId });
        
        if (parent) {
          // Lấy thông tin cơ bản của parent
          userObj.details = {
            parentId: parent.parentId,
            fullName: parent.fullName,
            firstName: parent.firstName,
            lastName: parent.lastName,
            phone: formatPhoneNumber(parent.phone),
            gender: parent.gender,
            career: parent.career,
            email: user.email,
            backup_email: user.backup_email
          };
          
          // Lấy thông tin các con của phụ huynh
          const ParentStudent = require('../database/models/ParentStudent');
          const Student = require('../database/models/Student');
          const Class = require('../database/models/Class');
          
          const parentStudentRelations = await ParentStudent.find({ parentId: parent.parentId });
          
          if (parentStudentRelations.length > 0) {
            const studentIds = parentStudentRelations.map(ps => ps.studentId);
            const students = await Student.find({ studentId: { $in: studentIds } });
            
            // Lấy thông tin lớp học của các con
            const allClassIds = students.reduce((ids, student) => {
              if (student.classIds && student.classIds.length > 0) {
                ids.push(...student.classIds);
              }
              return ids;
            }, []);
            
            const uniqueClassIds = [...new Set(allClassIds)];
            const classes = await Class.find({ classId: { $in: uniqueClassIds } });
            
            // Thông tin chi tiết các con
            const childrenDetails = students.map(student => {
              const studentClasses = classes.filter(cls => 
                student.classIds && student.classIds.includes(cls.classId)
              );
              
              // Tìm mối quan hệ
              const relation = parentStudentRelations.find(ps => ps.studentId === student.studentId);
              
              return {
                studentId: student.studentId,
                fullName: student.fullName,
                gender: student.gender,
                phone: formatPhoneNumber(student.phone),
                relationship: relation ? relation.relationship : 'Other',
                classes: studentClasses.map(cls => ({
                  classId: cls.classId,
                  className: cls.className,
                  grade: cls.grade,
                  academicYear: cls.academicYear
                }))
              };
            });
            
            userObj.details.children = childrenDetails;
            
            // Lấy thông tin academicYear từ các lớp học
            const academicYears = [...new Set(classes.map(cls => cls.academicYear))];
            userObj.details.academicYears = academicYears;
          } else {
            userObj.details.children = [];
            userObj.details.academicYears = [];
          }
        } else {
          // Nếu không tìm thấy thông tin phụ huynh, trả về thông tin cơ bản
          userObj.details = {
            fullName: user.name || '',
            email: user.email,
            backup_email: user.backup_email,
            children: [],
            academicYears: []
          };
        }
      }
      
      return userObj;
    }));
    
    return {
      success: true,
      data: userData,
      count: total,
      pagination: {
        total,
        page,
        limit,
        pages
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
          phone: formatPhoneNumber(student.phone),
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
              phone: formatPhoneNumber(parent.phone),
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
        userObj.phone = formatPhoneNumber(teacher.phone);
        userObj.dateOfBirth = teacher.dateOfBirth;
        userObj.gender = teacher.gender;
        userObj.major = teacher.major;
        userObj.degree = teacher.degree;
        userObj.WeeklyCapacity = teacher.WeeklyCapacity;
        
        // Remove backup_email for teacher role
        if ('backup_email' in userObj) {
          delete userObj.backup_email;
        }
        
        // Get classes where this teacher is homeroom teacher
        const Class = require('../database/models/Class');
        const homeroomClasses = await Class.find({ homeroomTeacherId: teacher.teacherId.toString() });
        
        // Get all classes that this teacher teaches
        const ClassSchedule = require('../database/models/ClassSchedule');
        const teachingSchedules = await ClassSchedule.find({ teacherId: teacher.teacherId });
        const teachingClassIds = [...new Set(teachingSchedules.map(s => s.classId))];
        const teachingClasses = await Class.find({ classId: { $in: teachingClassIds } });
        
        // Format classes theo định dạng yêu cầu
        userObj.classes = teachingClasses.map(cls => ({
          classId: cls.classId,
          className: cls.className,
          grade: cls.className ? cls.className.match(/^(\d+)/)?.[1] || '' : ''
        }));
        
        userObj.details = {
          teacherId: teacher.teacherId,
          fullName: teacher.fullName,
          dateOfBirth: teacher.dateOfBirth,
          gender: teacher.gender,
          address: teacher.address,
          phone: formatPhoneNumber(teacher.phone),
          major: teacher.major,
          degree: teacher.degree,
          weeklyCapacity: teacher.weeklyCapacity,
          academicYear: teacher.academicYear,
          classes: teachingClasses.map(cls => ({
            classId: cls.classId,
            className: cls.className,
            grade: cls.grade,
            academicYear: cls.academicYear,
            isHomeroom: homeroomClasses.some(h => h.classId === cls.classId)
          }))
        };
      }
    }
    else if (role === 'parent') {
      const parent = await models.Parent.findOne({ userId: user.userId });
      if (parent) {
        // Restructure parent data to match the format in getUsers
        userObj.details = {
          parentId: parent.parentId,
          fullName: parent.fullName,
          firstName: parent.firstName,
          lastName: parent.lastName,
          phone: formatPhoneNumber(parent.phone),
          gender: parent.gender,
          career: parent.career,
          email: user.email,
          backup_email: user.backup_email
        };
        
        // Get children
        const parentStudents = await models.ParentStudent.find({ parentId: parent.parentId });
        const studentIds = parentStudents.map(ps => ps.studentId);
        
        const students = studentIds.length > 0
          ? await models.Student.find({ studentId: { $in: studentIds } })
          : [];
          
        // Get class information for children
        const allClassIds = students.reduce((ids, student) => {
          if (student.classIds && student.classIds.length > 0) {
            ids.push(...student.classIds);
          }
          return ids;
        }, []);
        
        const uniqueClassIds = [...new Set(allClassIds)];
        const classes = await models.Class.find({ classId: { $in: uniqueClassIds } });
        
        // Format children details
        const childrenDetails = students.map(student => {
          const studentClasses = classes.filter(cls => 
            student.classIds && student.classIds.includes(cls.classId)
          );
          
          // Find relationship
          const relation = parentStudents.find(ps => ps.studentId === student.studentId);
          
          return {
            studentId: student.studentId,
            fullName: student.fullName,
            gender: student.gender,
            phone: formatPhoneNumber(student.phone),
            relationship: relation ? relation.relationship : 'Other',
            classes: studentClasses.map(cls => ({
              classId: cls.classId,
              className: cls.className,
              grade: cls.grade,
              academicYear: cls.academicYear
            }))
          };
        });
        
        userObj.details.children = childrenDetails;
        
        // Academic years
        const academicYears = [...new Set(classes.map(cls => cls.academicYear))];
        userObj.details.academicYears = academicYears;
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
