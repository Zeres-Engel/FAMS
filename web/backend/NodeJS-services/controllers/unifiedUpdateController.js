/**
 * Unified Update Controller
 * 
 * This controller handles updates for all user types (Student, Teacher, Parent) 
 * through a single API endpoint based on the user's role.
 */

const mongoose = require('mongoose');
const UserAccount = require('../database/models/UserAccount');
const Student = require('../database/models/Student');
const Teacher = require('../database/models/Teacher');
const Parent = require('../database/models/Parent');
const ParentStudent = require('../database/models/ParentStudent');
const RFID = require('../database/models/RFID');
const Batch = require('../database/models/Batch');
const Class = require('../database/models/Class');

// Helper function to generate userId for parent
const generateParentUserId = async (firstName, lastName, parentId) => {
  const normalizedFirstName = firstName.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const lastNameWords = lastName.normalize('NFD').replace(/[\u0300-\u036f]/g, '').split(' ');
  const lastNameInitials = lastNameWords.map(word => word.charAt(0).toLowerCase()).join('');
  
  return `${normalizedFirstName}${lastNameInitials}pr${parentId}`;
};

// Helper function to process gender input
const processGender = (gender) => {
  if (gender === undefined) return undefined;
  
  if (typeof gender === 'string') {
    const lowerGender = gender.toLowerCase();
    if (lowerGender === 'male' || lowerGender === 'true') {
      return true;
    } else if (lowerGender === 'female' || lowerGender === 'false') {
      return false;
    }
  }
  
  return Boolean(gender);
};

// Helper function to create a new parent
const createNewParent = async (parentData, studentId) => {
  try {
    // Find the last parent ID
    const lastParent = await Parent.findOne().sort({ parentId: -1 });
    const newParentId = lastParent ? parseInt(lastParent.parentId) + 1 : 1;
    
    // Generate parent userId
    const userId = await generateParentUserId(
      parentData.firstName || parentData.name.split(' ').pop(),
      parentData.lastName || parentData.name.split(' ').slice(0, -1).join(' '),
      newParentId
    );
    
    // Check if userId already exists
    const existingUser = await UserAccount.findOne({ userId });
    if (existingUser) {
      throw new Error(`UserId ${userId} already exists. Please try a different name.`);
    }
    
    // Create parent user account
    const parentEmail = parentData.email || `${userId}@fams.edu.vn`;
    await UserAccount.create({
      userId,
      username: userId,
      password: 'FAMS@2023', // Default password
      email: parentEmail,
      backup_email: parentData.email || null,
      role: 'Parent',
      isActive: true
    });
    
    // Create parent record
    const fullName = parentData.fullName || 
      `${(parentData.lastName || parentData.name.split(' ').slice(0, -1).join(' '))} ${(parentData.firstName || parentData.name.split(' ').pop())}`;
    
    const parent = await Parent.create({
      parentId: newParentId,
      userId,
      fullName,
      email: parentEmail,
      career: parentData.career || null,
      phone: parentData.phone,
      gender: processGender(parentData.gender),
      studentIds: studentId ? [studentId] : [],
      isActive: true
    });
    
    // If studentId is provided, create parent-student relationship
    if (studentId) {
      // Create relation in ParentStudent collection
      await ParentStudent.create({
        parentId: newParentId,
        studentId,
        relationship: parentData.relationship || 'Other',
        isEmergencyContact: parentData.isEmergencyContact || false
      });
      
      // Update student record to include this parent
      await Student.findOneAndUpdate(
        { studentId },
        { 
          $addToSet: { 
            parentIds: newParentId,
            parentInfo: {
              name: fullName,
              career: parentData.career || null,
              phone: parentData.phone,
              gender: processGender(parentData.gender),
              relationship: parentData.relationship || 'Other'
            }
          }
        }
      );
    }
    
    return parent;
  } catch (error) {
    console.error('Error creating new parent:', error);
    throw error;
  }
};

// Helper function to parse RFID expiry date
const parseExpiryDate = (expiryDate) => {
  if (!expiryDate) {
    // Default to 3 years
    const date = new Date();
    date.setFullYear(date.getFullYear() + 3);
    return date;
  }
  
  // Check if it's a year shorthand (e.g., "2y")
  const yearMatch = /^(\d+)y$/i.exec(expiryDate);
  if (yearMatch) {
    const years = parseInt(yearMatch[1]);
    const date = new Date();
    date.setFullYear(date.getFullYear() + years);
    return date;
  }
  
  // Otherwise, parse as date
  return new Date(expiryDate);
};

// Helper function to update or create RFID
const updateOrCreateRFID = async (userId, rfidData) => {
  try {
    if (!rfidData || !rfidData.RFID_ID) return null;
    
    // Check if user already has RFID
    const existingRFID = await RFID.findOne({ UserID: userId });
    
    if (existingRFID) {
      // Update existing RFID
      const updateData = {
        ...rfidData,
        ExpiryDate: rfidData.ExpiryDate ? parseExpiryDate(rfidData.ExpiryDate) : existingRFID.ExpiryDate
      };
      
      return await RFID.findOneAndUpdate(
        { UserID: userId },
        updateData,
        { new: true }
      );
    } else {
      // Create new RFID
      return await RFID.create({
        RFID_ID: rfidData.RFID_ID,
        UserID: userId,
        IssueDate: new Date(),
        ExpiryDate: parseExpiryDate(rfidData.ExpiryDate),
        isActive: true
      });
    }
  } catch (error) {
    console.error('Error updating/creating RFID:', error);
    throw error;
  }
};

/**
 * Unified update controller
 * @route PUT /api/users/update/:userId
 * @access Private
 */
module.exports = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { userId } = req.params;
    const updateData = req.body;
    
    // Find user account
    const user = await UserAccount.findOne({ userId });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: `User with ID ${userId} not found`,
        code: 'USER_NOT_FOUND'
      });
    }
    
    // Extract RFID data if provided
    const { rfid, ...userData } = updateData;
    
    // Update user account if basic user data is provided
    if (userData.email || userData.backup_email || userData.name || userData.password) {
      const userUpdateData = {};
      if (userData.email) userUpdateData.email = userData.email;
      if (userData.backup_email) userUpdateData.backup_email = userData.backup_email;
      if (userData.name) userUpdateData.name = userData.name;
      if (userData.password) userUpdateData.password = userData.password;
      
      // Ensure username is set to prevent validation error
      if (!user.username) {
        userUpdateData.username = userId; // Use userId as username if not set
      }
      
      Object.assign(user, userUpdateData);
      await user.save();
    }
    
    let result = {};
    
    // Handle RFID update/creation
    if (rfid) {
      const updatedRFID = await updateOrCreateRFID(userId, rfid);
      if (updatedRFID) {
        result.rfid = updatedRFID;
      }
    }
    
    // Based on user role, update appropriate record
    const role = user.role.toLowerCase();
    
    if (role === 'student') {
      // Update student record
      const student = await Student.findOne({ userId });
      
      if (!student) {
        await session.abortTransaction();
        return res.status(404).json({
          success: false,
          message: `Student record for user ${userId} not found`,
          code: 'STUDENT_RECORD_NOT_FOUND'
        });
      }
      
      // Process parents if provided
      if (userData.parents || userData.parentNames) {
        // Handle existing and new parents
        const parentData = [];
        const parentIds = [];
        
        // Process parent arrays if provided
        if (userData.parentNames && userData.parentNames.length > 0) {
          for (let i = 0; i < userData.parentNames.length; i++) {
            const name = userData.parentNames[i];
            
            // Skip empty names
            if (!name) continue;
            
            const parentInfo = {
              name,
              career: userData.parentCareers && userData.parentCareers[i] ? userData.parentCareers[i] : null,
              phone: userData.parentPhones && userData.parentPhones[i] ? userData.parentPhones[i] : null,
              gender: userData.parentGenders && userData.parentGenders[i] !== undefined
                ? processGender(userData.parentGenders[i])
                : null,
              relationship: userData.parentRelationships && userData.parentRelationships[i] 
                ? userData.parentRelationships[i] 
                : 'Other'
            };
            
            // Check if parent with this phone exists
            let parentId = null;
            if (parentInfo.phone) {
              const existingParent = await Parent.findOne({ phone: parentInfo.phone });
              if (existingParent) {
                parentId = existingParent.parentId;
                
                // Update existing parent's student list
                await Parent.findOneAndUpdate(
                  { parentId },
                  { $addToSet: { studentIds: student.studentId } }
                );
              }
            }
            
            // Skip creating new parent accounts during updates
            if (!parentId) {
              console.log(`Skipping creation of new parent account for ${parentInfo.name} - using existing parents only`);
              continue;
            }
            
            // Add to parentIds list
            if (parentId) {
              parentIds.push(parentId);
              parentData.push(parentInfo);
              
              // Ensure parent-student relationship exists
              const existingRelation = await ParentStudent.findOne({
                parentId,
                studentId: student.studentId
              });
              
              if (!existingRelation) {
                await ParentStudent.create({
                  parentId,
                  studentId: student.studentId,
                  relationship: parentInfo.relationship,
                  isEmergencyContact: i === 0 // First parent is emergency contact
                });
              }
            }
          }
        } else if (userData.parents && userData.parents.length > 0) {
          // Handle direct parent objects
          for (const parentData of userData.parents) {
            if (parentData.parentId) {
              // Existing parent - just update relationship
              parentIds.push(parentData.parentId);
              
              // Ensure parent-student relationship
              const existingRelation = await ParentStudent.findOne({
                parentId: parentData.parentId,
                studentId: student.studentId
              });
              
              if (!existingRelation) {
                await ParentStudent.create({
                  parentId: parentData.parentId,
                  studentId: student.studentId,
                  relationship: parentData.relationship || 'Other',
                  isEmergencyContact: parentData.isEmergencyContact || false
                });
                
                // Update parent's student list
                await Parent.findOneAndUpdate(
                  { parentId: parentData.parentId },
                  { $addToSet: { studentIds: student.studentId } }
                );
              }
            } else {
              // Skip creating new parent accounts - only work with existing parents
              console.log(`Skipping creation of new parent during student update - using existing parents only`);
              continue;
            }
          }
        }
        
        // Update student's parentIds
        if (parentIds.length > 0) {
          student.parentIds = parentIds;
        }
      }
      
      // Handle other student fields
      const studentFields = [
        'fullName', 'dateOfBirth', 'gender', 
        'address', 'phone', 'batchId', 'isActive'
      ];
      
      studentFields.forEach(field => {
        if (userData[field] !== undefined) {
          if (field === 'gender') {
            student[field] = processGender(userData[field]);
          } else if (field === 'dateOfBirth' && userData[field]) {
            student[field] = new Date(userData[field]);
          } else {
            student[field] = userData[field];
          }
        }
      });
      
      // Handle classIds separately - accept both classId and classIds
      if (userData.classIds !== undefined && Array.isArray(userData.classIds)) {
        student.classIds = userData.classIds;
      } else if (userData.classId !== undefined) {
        // If only a single classId is provided, make it an array
        if (!Array.isArray(student.classIds)) {
          student.classIds = [];
        }
        if (!student.classIds.includes(userData.classId)) {
          student.classIds.push(userData.classId);
        }
      }
      
      // Remove unnecessary fields that might cause unwanted data
      if (student) {
        // Remove empty parent arrays to avoid data bloat
        const fieldsToRemove = ['parentCareers', 'parentEmails', 'parentGenders', 'parentIds', 'parentNames', 'parentPhones'];
        fieldsToRemove.forEach(field => {
          // Only remove if not explicitly provided in update data
          if (!userData[field]) {
            student[field] = undefined;
          }
        });
      }
      
      // Save student changes
      await student.save();
      
      // Format the response to match getUserDetails API
      // Get class information
      let classes = [];
      if (student.classIds && student.classIds.length > 0) {
        classes = await Class.find({ classId: { $in: student.classIds } });
      }
      
      // Get RFID info
      const rfidInfo = await RFID.findOne({ UserID: userId });
      
      // Get parent information
      const parents = [];
      
      // Get parents from ParentStudent using studentId
      const studentId = student.studentId;
      if (studentId) {
        const parentStudentRelations = await ParentStudent.find({ studentId: studentId });
        
        if (parentStudentRelations && parentStudentRelations.length > 0) {
          const parentIds = parentStudentRelations.map(ps => ps.parentId);
          const parentRecords = await Parent.find({ parentId: { $in: parentIds } });
          
          // Get parent user accounts for additional info
          const parentUserIds = parentRecords.map(p => p.userId);
          const parentUsers = await UserAccount.find({ userId: { $in: parentUserIds } });
          
          // Add parents from ParentStudent relationships
          for (const parentRecord of parentRecords) {
            const parentUser = parentUsers.find(u => u.userId === parentRecord.userId);
            const relation = parentStudentRelations.find(ps => ps.parentId === parentRecord.parentId);
            
            parents.push({
              parentId: parentRecord.parentId,
              fullName: parentRecord.fullName,
              phone: parentRecord.phone && !parentRecord.phone.startsWith('0') ? 
                    '0' + parentRecord.phone : parentRecord.phone,
              gender: typeof parentRecord.gender === 'boolean' ? 
                    (parentRecord.gender ? 'Male' : 'Female') : parentRecord.gender,
              career: parentRecord.career || '',
              email: parentUser?.email || parentRecord.email || '',
              backup_email: parentUser?.backup_email || null,
              relationship: relation?.relationship || 'Other'
            });
          }
        }
      }
      
      // If we still have no parents, fallback to parentIds
      if (parents.length === 0 && student.parentIds && student.parentIds.length > 0) {
        // Get parent information from parent IDs stored in student record
        const parentDetails = await Parent.find({ userId: { $in: student.parentIds } });
        const parentUsers = await UserAccount.find({ userId: { $in: student.parentIds } });
        
        // Map parents with their user accounts
        for (let i = 0; i < student.parentIds.length; i++) {
          const parentUserId = student.parentIds[i];
          const parentRecord = parentDetails.find(p => p.userId === parentUserId);
          const parentUserRecord = parentUsers.find(u => u.userId === parentUserId);
          
          if (parentRecord) {
            // We found the complete parent record
            parents.push({
              parentId: parentRecord.parentId,
              fullName: parentRecord.fullName,
              phone: parentRecord.phone && !parentRecord.phone.startsWith('0') ? 
                    '0' + parentRecord.phone : parentRecord.phone,
              gender: typeof parentRecord.gender === 'boolean' ? 
                    (parentRecord.gender ? 'Male' : 'Female') : parentRecord.gender,
              career: parentRecord.career || '',
              email: parentUserRecord?.email || parentRecord.email || '',
              backup_email: parentUserRecord?.backup_email || null
            });
          }
        }
      }
      
      // Ensure phone number has correct format
      const phoneFormatted = student.phone && !student.phone.startsWith('0') ? '0' + student.phone : student.phone;
      
      // Format student details in the same structure as the getUserDetails API
      const details = {
        studentId: student.studentId,
        fullName: student.fullName,
        dateOfBirth: student.dateOfBirth,
        gender: typeof student.gender === 'boolean' ? (student.gender ? 'Male' : 'Female') : student.gender,
        address: student.address,
        phone: phoneFormatted,
        batchId: student.batchId,
        classes: classes.map(cls => ({
          classId: cls.classId,
          className: cls.className,
          grade: cls.grade,
          academicYear: cls.academicYear
        })),
        parents: parents
      };
      
      if (rfidInfo) {
        details.rfid = {
          rfidId: rfidInfo.RFID_ID,
          expiryDate: rfidInfo.ExpiryDate
        };
      }
      
      result.student = student;
      result.details = details;
      
    } else if (role === 'teacher') {
      // Update teacher record
      const teacher = await Teacher.findOne({ userId });
      
      if (!teacher) {
        await session.abortTransaction();
        return res.status(404).json({
          success: false,
          message: `Teacher record for user ${userId} not found`,
          code: 'TEACHER_RECORD_NOT_FOUND'
        });
      }
      
      // Handle teacher fields
      const teacherFields = [
        'fullName', 'dateOfBirth', 'gender', 
        'address', 'phone', 'major', 'degree', 'weeklyCapacity', 'isActive'
      ];
      
      teacherFields.forEach(field => {
        if (userData[field] !== undefined) {
          if (field === 'gender') {
            teacher[field] = processGender(userData[field]);
          } else if (field === 'dateOfBirth' && userData[field]) {
            teacher[field] = new Date(userData[field]);
          } else {
            teacher[field] = userData[field];
          }
        }
      });
      
      // Save teacher changes
      await teacher.save();
      result.teacher = teacher;
      
    } else if (role === 'parent') {
      // Update parent record
      const parent = await Parent.findOne({ userId });
      
      if (!parent) {
        await session.abortTransaction();
        return res.status(404).json({
          success: false,
          message: `Parent record for user ${userId} not found`,
          code: 'PARENT_RECORD_NOT_FOUND'
        });
      }
      
      // Handle parent fields
      const parentFields = [
        'fullName', 'career', 
        'phone', 'gender', 'isActive'
      ];
      
      parentFields.forEach(field => {
        if (userData[field] !== undefined) {
          if (field === 'gender') {
            parent[field] = processGender(userData[field]);
          } else {
            parent[field] = userData[field];
          }
        }
      });
      
      // Handle children updates if provided
      if (userData.studentIds && Array.isArray(userData.studentIds)) {
        // Get current studentIds
        const currentStudentIds = parent.studentIds || [];
        
        // Find new studentIds to add - only use existing student IDs, don't create new students
        const studentsToAdd = userData.studentIds.filter(id => !currentStudentIds.includes(id));
        
        // Add new parent-student relationships for existing students
        for (const studentId of studentsToAdd) {
          // Check if student exists
          const student = await Student.findOne({ studentId });
          if (!student) continue;
          
          // Create relationship only if student exists
          await ParentStudent.create({
            parentId: parent.parentId,
            studentId,
            relationship: 'Other',
            isEmergencyContact: false
          });
          
          // Update student record
          await Student.findOneAndUpdate(
            { studentId },
            { 
              $addToSet: { 
                parentIds: parent.parentId,
                parentInfo: {
                  name: parent.fullName,
                  career: parent.career,
                  phone: parent.phone,
                  gender: parent.gender,
                  relationship: 'Other'
                }
              }
            }
          );
        }
        
        // Update parent's studentIds
        parent.studentIds = userData.studentIds;
      }
      
      // Save parent changes
      await parent.save();
      result.parent = parent;
    }
    
    // Commit transaction
    await session.commitTransaction();
    
    // Build a comprehensive response based on role
    let roleSpecificData = {};
    
    if (role === 'student') {
      // Get batch and class info
      const student = result.student;
      
      // Fix batch lookup - ensure proper type conversion and add logging
      let batch = null;
      if (student.batchId) {
        try {
          console.log(`Looking up batch with ID: ${student.batchId} (type: ${typeof student.batchId})`);
          
          // First try to find by batchId
          batch = await Batch.findOne({ batchId: Number(student.batchId) });
          console.log(`Batch lookup result: ${batch ? JSON.stringify(batch) : 'null'}`);
          
          if (!batch) {
            console.log(`Warning: Batch with ID ${student.batchId} not found for student ${student.studentId}, attempting to create it`);
            
            // Try to get the current year
            const currentYear = new Date().getFullYear();
            
            // Try to use the Batch model's built-in method to find or create
            try {
              batch = await Batch.findOrCreateByStartYear(currentYear);
              console.log(`Created/found batch using findOrCreateByStartYear: ${JSON.stringify(batch)}`);
              
              // If the batch ID doesn't match the student's batchId, try to create directly
              if (batch.batchId !== Number(student.batchId)) {
                console.log(`Created batch has different ID (${batch.batchId}) than student's batchId (${student.batchId}), creating direct batch`);
                
                // Try direct creation of batch with proper ID
                try {
                  const directBatch = await Batch.create({
                    batchId: Number(student.batchId),
                    batchName: `K${currentYear}`,
                    startYear: currentYear,
                    startDate: new Date(`${currentYear}-09-01`),
                    endDate: new Date(`${currentYear + 3}-06-30`),
                    isActive: true
                  });
                  
                  console.log(`Created direct batch: ${JSON.stringify(directBatch)}`);
                  batch = directBatch;
                } catch (directCreateErr) {
                  console.log(`Error creating direct batch: ${directCreateErr.message}`);
                  // Continue with the already created/found batch
                }
              }
            } catch (createErr) {
              console.log(`Error using findOrCreateByStartYear: ${createErr.message}`);
              
              // Fallback to creating a basic batch object manually
              batch = {
                batchId: Number(student.batchId),
                batchName: `K${currentYear}`,
                startYear: currentYear,
                startDate: new Date(`${currentYear}-09-01`),
                endDate: new Date(`${currentYear + 3}-06-30`)
              };
              console.log(`Created fallback batch object: ${JSON.stringify(batch)}`);
            }
          }
        } catch (err) {
          console.error(`Error finding batch for student ${student.studentId}:`, err);
          
          // Always make sure we have a batch object
          batch = {
            batchId: Number(student.batchId),
            batchName: `K${new Date().getFullYear()}`
          };
          console.log(`Created emergency fallback batch: ${JSON.stringify(batch)}`);
        }
      }
      
      const classInfo = student.classId ? await Class.findOne({ classId: student.classId }) : null;
      
      // Get parents
      const parentStudentRelations = await ParentStudent.find({ studentId: student.studentId });
      const parentIds = parentStudentRelations.map(rel => rel.parentId);
      const parents = await Parent.find({ parentId: { $in: parentIds } });
      
      // Clean student object by removing empty array fields
      const cleanStudent = student.toObject();
      const fieldsToRemove = ['firstName', 'lastName', 'parentCareers', 'parentEmails', 'parentGenders', 'parentIds', 'parentNames', 'parentPhones'];
      fieldsToRemove.forEach(field => {
        delete cleanStudent[field];
      });
      
      roleSpecificData = {
        type: 'student',
        student: cleanStudent,
        batch: batch,
        class: classInfo ? {
          classId: classInfo.classId,
          className: classInfo.className,
          grade: classInfo.grade
        } : null,
        parents: parents.map(parent => ({
          parentId: parent.parentId,
          fullName: parent.fullName,
          phone: parent.phone,
          career: parent.career,
          relationship: parentStudentRelations.find(r => r.parentId === parent.parentId)?.relationship || 'Other'
        }))
      };
    } else if (role === 'teacher') {
      // Get classes where teacher is homeroom teacher
      const teacher = result.teacher;
      
      // Clean teacher object
      const cleanTeacher = teacher.toObject();
      // Remove any empty array fields and firstName/lastName
      const teacherFieldsToRemove = ['firstName', 'lastName'];
      teacherFieldsToRemove.forEach(field => {
        delete cleanTeacher[field];
      });
      
      Object.keys(cleanTeacher).forEach(key => {
        if (Array.isArray(cleanTeacher[key]) && cleanTeacher[key].length === 0) {
          delete cleanTeacher[key];
        }
      });
      
      const classes = await Class.find({ homeroomTeacherId: teacher.teacherId.toString() });
      
      roleSpecificData = {
        type: 'teacher',
        teacher: cleanTeacher,
        classes: classes.map(c => ({
          classId: c.classId,
          className: c.className,
          grade: c.grade
        }))
      };
    } else if (role === 'parent') {
      // Get students and their classes
      
      // Get parent from result
      const parent = result.parent;
      
      // Clean parent object
      const cleanParent = parent.toObject();
      // Remove any empty array fields and firstName/lastName
      const parentFieldsToRemove = ['firstName', 'lastName'];
      parentFieldsToRemove.forEach(field => {
        delete cleanParent[field];
      });
      
      // Remove any empty array fields
      Object.keys(cleanParent).forEach(key => {
        if (Array.isArray(cleanParent[key]) && cleanParent[key].length === 0) {
          delete cleanParent[key];
        }
      });
      
      // Get parent-student relations
      const relations = await ParentStudent.find({ parentId: parent.parentId });
      
      // Get students
      const studentIds = relations.map(rel => rel.studentId);
      const students = await Student.find({ studentId: { $in: studentIds } });
      
      // Get class info for each student
      const enhancedStudents = await Promise.all(students.map(async (student) => {
        let classInfo = null;
        if (student.classId) {
          classInfo = await Class.findOne({ classId: student.classId.toString() });
        }
        
        return {
          studentId: student.studentId,
          fullName: student.fullName,
          className: classInfo ? classInfo.className : null,
          relationship: relations.find(r => r.studentId.toString() === student.studentId.toString())?.relationship || 'Other'
        };
      }));
      
      roleSpecificData = {
        type: 'parent',
        parent: cleanParent,
        children: enhancedStudents
      };
    }
    
    // Add RFID to response if present
    if (result.rfid) {
      roleSpecificData.rfid = result.rfid;
    }
    
    // Final safety check for student batch - ensure it's never null if student has batchId
    if (role === 'student' && roleSpecificData.student && roleSpecificData.student.batchId && !roleSpecificData.batch) {
      console.log('Final safety check: Creating emergency batch object');
      roleSpecificData.batch = {
        batchId: Number(roleSpecificData.student.batchId),
        batchName: `K${new Date().getFullYear()}`,
        startYear: new Date().getFullYear()
      };
    }
    
    // Send success response
    return res.status(200).json({
      success: true,
      message: `User ${userId} updated successfully`,
      data: [
        {
          _id: user._id,
          userId: user.userId,
          email: user.email,
          password: user.password,
          role: user.role,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
          isActive: user.isActive,
          id: user._id,
          details: role === 'student' ? result.details : roleSpecificData
        }
      ],
      count: 1,
      pagination: {
        total: 1,
        page: 1,
        limit: 1,
        pages: 1
      }
    });
  } catch (error) {
    // Abort transaction on error
    try {
      await session.abortTransaction();
    } catch (transactionError) {
      console.error('Transaction already completed, could not abort:', transactionError.message);
    }
    
    console.error('Error in unified update controller:', error);
    return res.status(500).json({
      success: false,
      message: error.message,
      code: 'UPDATE_FAILED'
    });
  } finally {
    // End session
    session.endSession();
  }
}; 