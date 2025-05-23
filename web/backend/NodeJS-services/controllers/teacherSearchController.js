const UserAccount = require('../database/models/UserAccount');
const Teacher = require('../database/models/Teacher');
const mongoose = require('mongoose');

/**
 * Search teachers with minimal information (userId and fullName only)
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @returns {Promise<void>} - Response with teachers data
 */
exports.searchTeachers = async (req, res) => {
  try {
    // Extract query parameters
    const { page = 1, limit = 10, search, academicYear, phone } = req.query;
    
    // Adjust limit for autocomplete - use a smaller default for faster responses
    const autocompleteLimit = parseInt(limit, 10) || 5;
    
    // Build query filter for UserAccount to get teacher userId list
    let userQuery = { role: 'teacher' };
    
    // Search by userId if provided
    if (search && search !== 'none') {
      // Prepend '^' to search to match beginning of string only
      const prefixSearch = `^${search}`;
      userQuery.$or = [
        { userId: { $regex: prefixSearch, $options: 'i' } }
      ];
    }

    // Filter by phone if provided
    if (phone && phone !== 'none') {
      if (userQuery.$or) {
        userQuery = {
          $and: [
            { $or: userQuery.$or },
            { phone: { $regex: phone, $options: 'i' } }
          ]
        };
      } else {
        userQuery.phone = { $regex: phone, $options: 'i' };
      }
    }
    
    // Filter by academic year if provided
    let teacherIds = [];
    if (academicYear && academicYear !== 'none') {
      // Find classes for the academic year
      const Class = require('../database/models/Class');
      const classes = await Class.find({ academicYear });
      const classIds = classes.map(cls => cls.classId);
      
      // Find teachers teaching those classes
      if (classIds.length > 0) {
        const teachers = await Teacher.find({ 
          $or: [
            { classIds: { $in: classIds } },
            { userId: { $in: classes.map(cls => cls.homeroomTeacherId).filter(id => id) } }
          ]
        });
        
        teacherIds = teachers.map(teacher => teacher.userId);
        
        if (teacherIds.length > 0) {
          if (userQuery.$and) {
            userQuery.$and.push({ userId: { $in: teacherIds } });
          } else if (userQuery.$or) {
            userQuery = {
              $and: [
                { $or: userQuery.$or },
                { userId: { $in: teacherIds } }
              ]
            };
          } else {
            userQuery.userId = { $in: teacherIds };
          }
        } else if (academicYear) {
          // If no teachers found for this academic year, return empty result
          return res.status(200).json({
            success: true,
            data: [],
            count: 0,
            pagination: {
              total: 0,
              page: parseInt(page),
              limit: parseInt(limit),
              pages: 0
            }
          });
        }
      }
    }
    
    // Calculate pagination values
    const pageNum = parseInt(page, 10);
    const limitNum = search ? autocompleteLimit : (parseInt(limit, 10) || 10); // Smaller limit when searching
    const skip = (pageNum - 1) * limitNum;
    
    console.log("Teacher search user query:", JSON.stringify(userQuery, null, 2));
    
    // Get teacher userIds from UserAccount
    const userAccounts = await UserAccount.find(userQuery, 'userId')
      .sort({ userId: 1 })
      .skip(skip)
      .limit(limitNum);
    
    const userIds = userAccounts.map(user => user.userId);
    
    // Build query for Teacher collection to get fullName
    let teacherQuery = { userId: { $in: userIds } };
    
    // Add fullName search if provided - match beginning of name only
    if (search && search !== 'none') {
      const prefixSearch = `^${search}`;
      // Combine with original userIds to prevent duplicate results
      teacherQuery = {
        $or: [
          { userId: { $in: userIds } },
          { fullName: { $regex: prefixSearch, $options: 'i' } }
        ]
      };
    }
    
    console.log("Teacher collection query:", JSON.stringify(teacherQuery, null, 2));
    
    // Count total matching teachers for pagination
    // We need to count based on the original query before pagination
    const total = await UserAccount.countDocuments(userQuery);
    
    // Get teacher details from Teacher collection
    const teachers = await Teacher.find(teacherQuery, 'userId fullName teacherId');
    
    // Filter out extra results if we have teachers matching the prefix
    // This ensures we only get results that EITHER have userId OR fullName starting with search
    let filteredTeachers = [];
    const prefixSearch = search ? new RegExp(`^${search}`, 'i') : null;
    
    if (prefixSearch) {
      // First try exact matches on userId
      filteredTeachers = teachers.filter(teacher => 
        prefixSearch.test(teacher.userId) || prefixSearch.test(teacher.fullName)
      );
    } else {
      filteredTeachers = teachers;
    }
    
    // Create a mapping of userId to fullName and teacherId
    const teacherMap = {};
    filteredTeachers.forEach(teacher => {
      teacherMap[teacher.userId] = {
        fullName: teacher.fullName || '',
        teacherId: teacher.teacherId
      };
    });
    
    // Format teacher data to return userId, fullName and teacherId
    // Only include those in the filtered results
    const formattedTeachers = userAccounts
      .filter(user => teacherMap[user.userId] || prefixSearch?.test(user.userId))
      .map(user => ({
        userId: user.userId,
        fullName: teacherMap[user.userId]?.fullName || '',
        teacherId: teacherMap[user.userId]?.teacherId || null
      }));
    
    // Đảm bảo rằng tất cả đều có teacherId
    const teacherPromises = [];
    for (let i = 0; i < formattedTeachers.length; i++) {
      const teacher = formattedTeachers[i];
      if (!teacher.teacherId) {
        teacherPromises.push(
          Teacher.findOne({ userId: teacher.userId })
            .then(foundTeacher => {
              if (foundTeacher) {
                teacher.teacherId = foundTeacher.teacherId;
              }
              return teacher;
            })
        );
      }
    }
    
    // Chờ tất cả các promise hoàn thành
    if (teacherPromises.length > 0) {
      await Promise.all(teacherPromises);
    }
    
    // For autocomplete, return a more compact response without pagination details
    if (search && !page) {
      return res.status(200).json({
        success: true,
        data: formattedTeachers
      });
    }
    
    // Return full data with pagination info for regular search
    return res.status(200).json({
      success: true,
      data: formattedTeachers,
      count: total,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Error searching teachers:', error);
    res.status(500).json({
      success: false,
      message: error.message,
      code: 'TEACHER_SEARCH_ERROR'
    });
  }
}; 