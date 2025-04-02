const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Models
const User = mongoose.model('User', new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true, minlength: 4 },
  role: { type: String, enum: ['Admin', 'Teacher', 'Parent', 'Student'], default: 'Student' },
  createdAt: { type: Date, default: Date.now }
}), 'users');

const Student = mongoose.model('Student', new mongoose.Schema({
  studentId: { type: Number, required: true },
  userId: { type: String, required: true },
  fullName: { type: String, required: true },
  dateOfBirth: { type: Date },
  classId: { type: Number, required: true },
  batchId: { type: Number, required: true },
  gender: { type: Boolean },
  address: { type: String },
  phone: { type: String },
  parentIds: [{ type: Number }]
}), 'students');

const Teacher = mongoose.model('Teacher', new mongoose.Schema({
  teacherId: { type: Number, required: true },
  userId: { type: String, required: true },
  fullName: { type: String, required: true },
  email: { type: String },
  dateOfBirth: { type: Date },
  phone: { type: String },
  gender: { type: Boolean }
}), 'teachers');

const Parent = mongoose.model('Parent', new mongoose.Schema({
  parentId: { type: Number, required: true },
  userId: { type: String, required: true },
  fullName: { type: String, required: true },
  career: { type: String },
  phone: { type: String },
  gender: { type: Boolean },
  studentIds: [{ type: Number }]
}), 'parents');

const Class = mongoose.model('Class', new mongoose.Schema({
  classId: { type: Number, required: true },
  className: { type: String, required: true },
  homeroomTeacherId: { type: Number },
  batchId: { type: Number, required: true }
}), 'classes');

const Batch = mongoose.model('Batch', new mongoose.Schema({
  batchId: { type: Number, required: true },
  batchName: { type: String, required: true },
  startYear: { type: Number, required: true },
  endYear: { type: Number, required: true },
  grade: { type: Number, required: true }
}), 'batches');

const Subject = mongoose.model('Subject', new mongoose.Schema({
  subjectId: { type: Number, required: true },
  name: { type: String, required: true },
  type: { type: String },
  description: { type: String }
}), 'subjects');

const Classroom = mongoose.model('Classroom', new mongoose.Schema({
  classroomId: { type: Number, required: true },
  roomNumber: { type: String, required: true },
  building: { type: String },
  capacity: { type: Number }
}), 'classrooms');

const Schedule = mongoose.model('Schedule', new mongoose.Schema({
  scheduleId: { type: Number, required: true },
  semesterId: { type: Number, required: true },
  classId: { type: Number, required: true },
  subjectId: { type: Number },
  teacherId: { type: Number },
  classroomId: { type: Number },
  dayOfWeek: { type: String, required: true },
  period: { type: Number, required: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  isFreeTime: { type: Boolean, default: false }
}), 'schedules');

const Semester = mongoose.model('Semester', new mongoose.Schema({
  semesterId: { type: Number, required: true },
  name: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true }
}), 'semesters');

const Curriculum = mongoose.model('Curriculum', new mongoose.Schema({
  curriculumId: { type: Number, required: true },
  curriculumName: { type: String, required: true },
  description: { type: String },
  batchId: { type: Number, required: true },
  subjectIds: [{ type: Number }]
}), 'curriculums');

// Utility Functions
// Hàm để xóa dấu tiếng Việt
const removeAccents = (str) => {
  return str.normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd').replace(/Đ/g, 'D');
};

// Hàm tạo username từ tên đầy đủ
const generateUsername = (fullName, batchId = null, idNumber = null) => {
  const normalizedName = removeAccents(fullName);
  const nameParts = normalizedName.split(' ');
  
  let baseUsername;
  if (nameParts.length < 2) {
    baseUsername = normalizedName.toLowerCase();
  } else {
    const lastName = nameParts[nameParts.length - 1].toLowerCase();
    const initials = nameParts.slice(0, nameParts.length - 1).map(name => name[0].toLowerCase()).join('');
    baseUsername = `${lastName}${initials}`;
  }
  
  if (batchId !== null && idNumber !== null) {
    return `${baseUsername}${batchId}${idNumber}`;
  } else if (idNumber !== null) {
    return `${baseUsername}${idNumber}`;
  } else {
    return baseUsername;
  }
};

// Hàm parse ngày tháng
const parseDate = (dateStr) => {
  if (!dateStr) return null;
  
  try {
    if (dateStr.includes('/')) {
      const [day, month, year] = dateStr.split('/').map(Number);
      return new Date(year, month - 1, day);
    } else if (dateStr.includes('-')) {
      const [year, month, day] = dateStr.split('-').map(Number);
      return new Date(year, month - 1, day);
    }
  } catch (error) {
    console.error('Error parsing date:', error);
  }
  
  return null;
};

// Hàm đọc file CSV
const readCsvFile = (filePath) => {
  return new Promise((resolve, reject) => {
    const results = [];
    
    if (!fs.existsSync(filePath)) {
      console.warn(`File not found: ${filePath}`);
      resolve([]);
      return;
    }
    
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', (error) => reject(error));
  });
};

// Hàm tìm đường dẫn file
const findFilePath = (relativePaths) => {
  for (const relativePath of relativePaths) {
    const fullPath = path.resolve(process.cwd(), relativePath);
    if (fs.existsSync(fullPath)) {
      return fullPath;
    }
  }
  return null;
};

// Hàm đọc dữ liệu chương trình học
const getCurriculumData = async (grade) => {
  const filePaths = [
    `backend/database/curriculum_${grade}.csv`,
    `database/curriculum_${grade}.csv`
  ];
  
  const filePath = findFilePath(filePaths);
  if (!filePath) {
    console.warn(`Warning: Curriculum file for grade ${grade} not found`);
    return {};
  }
  
  try {
    const rows = await readCsvFile(filePath);
    const curriculumData = {};
    
    rows.forEach(row => {
      const subjectName = row.SubjectName;
      const sessions = parseInt(row.Sessions || 2);
      curriculumData[subjectName] = sessions;
    });
    
    return curriculumData;
  } catch (error) {
    console.error(`Error reading curriculum file for grade ${grade}:`, error);
    return {};
  }
};

// Hàm băm mật khẩu
const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

// Hàm xóa tất cả collections
const dropAllCollections = async () => {
  try {
    const collections = await mongoose.connection.db.listCollections().toArray();
    
    for (const collection of collections) {
      try {
        await mongoose.connection.db.dropCollection(collection.name);
        console.log(`Dropped collection: ${collection.name}`);
      } catch (error) {
        console.error(`Failed to drop ${collection.name}:`, error);
      }
    }
  } catch (error) {
    console.error('Error dropping collections:', error);
  }
};

// Main Database Initialization Function
const initDatabase = async () => {
  console.log('Initializing database...');
  
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGO_URI || 'mongodb+srv://db_server:1234@fams.8istq.mongodb.net/?retryWrites=true&w=majority&appName=FAMS';
    
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log(`MongoDB Connected: ${mongoose.connection.host}`);
    
    // Drop existing collections
    console.log('Cleaning up database...');
    await dropAllCollections();
    
    // Create admin account
    const adminPassword = await hashPassword('1234');
    const adminUser = new User({
      userId: 'admin',
      name: 'Administrator',
      email: 'admin@fams.edu.vn',
      password: adminPassword,
      role: 'Admin'
    });
    
    await adminUser.save();
    console.log('Admin account created');
    
    // Create batches
    const batches = [
      { batchId: 1, batchName: 'Khóa 2021-2024', startYear: 2021, endYear: 2024, grade: 12 },
      { batchId: 2, batchName: 'Khóa 2022-2025', startYear: 2022, endYear: 2025, grade: 11 },
      { batchId: 3, batchName: 'Khóa 2023-2026', startYear: 2023, endYear: 2026, grade: 10 }
    ];
    
    await Batch.insertMany(batches);
    console.log('Batches created');
    
    // Init classes with batch info
    const classes = [
      { classId: 1, className: '10A1', homeroomTeacherId: null, batchId: 3 },
      { classId: 2, className: '10A2', homeroomTeacherId: null, batchId: 3 },
      { classId: 3, className: '10A3', homeroomTeacherId: null, batchId: 3 },
      { classId: 4, className: '11A1', homeroomTeacherId: null, batchId: 2 },
      { classId: 5, className: '11A2', homeroomTeacherId: null, batchId: 2 },
      { classId: 6, className: '12A1', homeroomTeacherId: null, batchId: 1 },
      { classId: 7, className: '12A2', homeroomTeacherId: null, batchId: 1 },
      { classId: 8, className: '12A3', homeroomTeacherId: null, batchId: 1 },
      { classId: 9, className: '12D1', homeroomTeacherId: null, batchId: 1 }
    ];
    
    await Class.insertMany(classes);
    console.log('Classes created');
    
    // Create classrooms
    const classrooms = [
      { classroomId: 1, roomNumber: 'A101', building: 'A', capacity: 40 },
      { classroomId: 2, roomNumber: 'A102', building: 'A', capacity: 40 },
      { classroomId: 3, roomNumber: 'A103', building: 'A', capacity: 40 },
      { classroomId: 4, roomNumber: 'A201', building: 'A', capacity: 40 },
      { classroomId: 5, roomNumber: 'A202', building: 'A', capacity: 40 },
      { classroomId: 6, roomNumber: 'B101', building: 'B', capacity: 40 },
      { classroomId: 7, roomNumber: 'B102', building: 'B', capacity: 40 },
      { classroomId: 8, roomNumber: 'B201', building: 'B', capacity: 40 },
      { classroomId: 9, roomNumber: 'B202', building: 'B', capacity: 40 }
    ];
    
    await Classroom.insertMany(classrooms);
    console.log('Classrooms created');
    
    // Import teachers
    const teacherFilePath = findFilePath(['backend/database/teacher.csv', 'database/teacher.csv']);
    
    if (teacherFilePath) {
      const teacherRows = await readCsvFile(teacherFilePath);
      const teachers = [];
      const teacherUsers = [];
      
      for (let i = 0; i < teacherRows.length; i++) {
        const teacherId = i + 1;
        const row = teacherRows[i];
        const fullName = row.FullName;
        const username = generateUsername(fullName, null, teacherId);
        
        // Create teacher user account
        const password = await hashPassword('123456');
        const teacherUser = {
          userId: username,
          name: fullName,
          email: `${username}@fams.edu.vn`,
          password: password,
          role: 'Teacher'
        };
        
        teacherUsers.push(teacherUser);
        
        // Create teacher profile
        const teacher = {
          teacherId: teacherId,
          userId: username,
          fullName: fullName,
          email: `${username}@fams.edu.vn`,
          dateOfBirth: parseDate(row.DateOfBirth),
          phone: row.Phone || '',
          gender: row.Gender === 'True'
        };
        
        teachers.push(teacher);
        
        // Assign homeroom teachers
        if (i < classes.length) {
          classes[i].homeroomTeacherId = teacherId;
        }
      }
      
      if (teacherUsers.length > 0) {
        await User.insertMany(teacherUsers);
      }
      
      if (teachers.length > 0) {
        await Teacher.insertMany(teachers);
      }
      
      // Update classes with homeroom teachers
      for (const classDoc of classes) {
        await Class.updateOne(
          { classId: classDoc.classId },
          { $set: { homeroomTeacherId: classDoc.homeroomTeacherId } }
        );
      }
      
      console.log(`${teachers.length} teachers imported`);
    } else {
      console.warn('Teacher data file not found.');
    }
    
    // Import students
    const studentFilePath = findFilePath(['backend/database/student.csv', 'database/student.csv']);
    
    if (studentFilePath) {
      const studentRows = await readCsvFile(studentFilePath);
      const students = [];
      const studentUsers = [];
      
      for (let i = 0; i < studentRows.length; i++) {
        const studentId = i + 1;
        const row = studentRows[i];
        const fullName = row['Full Name'];
        
        // Find class and batch info
        const className = row.Class || '';
        const classDoc = await Class.findOne({ className: className });
        
        if (classDoc) {
          const classId = classDoc.classId;
          const batchId = classDoc.batchId;
          
          // Generate username with batch info
          const username = generateUsername(fullName, batchId, studentId);
          
          // Create student user account
          const password = await hashPassword('123456');
          const studentUser = {
            userId: username,
            name: fullName,
            email: `${username}@fams.edu.vn`,
            password: password,
            role: 'Student'
          };
          
          studentUsers.push(studentUser);
          
          // Create student profile
          const student = {
            studentId: studentId,
            userId: username,
            fullName: fullName,
            dateOfBirth: parseDate(row['Date of Birth']),
            classId: classId,
            batchId: batchId,
            gender: row.Gender === 'True',
            address: row.Address || '',
            phone: row.Phone || '',
            parentIds: []
          };
          
          students.push(student);
        }
      }
      
      if (studentUsers.length > 0) {
        await User.insertMany(studentUsers);
      }
      
      if (students.length > 0) {
        await Student.insertMany(students);
      }
      
      console.log(`${students.length} students imported`);
    } else {
      console.warn('Student data file not found.');
    }
    
    // Import parents
    const parentFilePath = findFilePath(['backend/database/parent.csv', 'database/parent.csv']);
    
    if (parentFilePath) {
      const parentRows = await readCsvFile(parentFilePath);
      const parents = [];
      const parentUsers = [];
      
      for (let i = 0; i < parentRows.length; i++) {
        const parentId = i + 1;
        const row = parentRows[i];
        const fullName = row.FullName;
        const username = generateUsername(fullName, null, parentId);
        
        // Create parent user account
        const password = await hashPassword('123456');
        const parentUser = {
          userId: username,
          name: fullName,
          email: `${username}@fams.edu.vn`,
          password: password,
          role: 'Parent'
        };
        
        parentUsers.push(parentUser);
        
        // Create parent profile
        const parent = {
          parentId: parentId,
          userId: username,
          fullName: fullName,
          career: row.Career || '',
          phone: row.Phone || '',
          gender: row.Gender === 'True',
          studentIds: []
        };
        
        parents.push(parent);
      }
      
      if (parentUsers.length > 0) {
        await User.insertMany(parentUsers);
      }
      
      if (parents.length > 0) {
        await Parent.insertMany(parents);
      }
      
      console.log(`${parents.length} parents imported`);
      
      // Assign students to parents
      const allStudents = await Student.find();
      const allParents = await Parent.find();
      
      // Each student gets 1-2 parents
      for (const student of allStudents) {
        const numParents = Math.min(2, allParents.length);
        const randomParents = [];
        
        // Select random parents without duplicates
        const availableParents = [...allParents];
        for (let i = 0; i < numParents; i++) {
          if (availableParents.length === 0) break;
          
          const randomIndex = Math.floor(Math.random() * availableParents.length);
          const selectedParent = availableParents.splice(randomIndex, 1)[0];
          randomParents.push(selectedParent);
        }
        
        const studentId = student.studentId;
        
        for (const parent of randomParents) {
          const parentId = parent.parentId;
          
          // Add parent to student
          await Student.updateOne(
            { studentId: studentId },
            { $push: { parentIds: parentId } }
          );
          
          // Add student to parent
          await Parent.updateOne(
            { parentId: parentId },
            { $push: { studentIds: studentId } }
          );
        }
      }
      
      console.log('Parent-student relationships created');
    } else {
      console.warn('Parent data file not found.');
    }
    
    // Import subjects
    const subjectFilePath = findFilePath(['backend/database/subject.csv', 'database/subject.csv']);
    
    if (subjectFilePath) {
      const subjectRows = await readCsvFile(subjectFilePath);
      const subjects = [];
      
      for (let i = 0; i < subjectRows.length; i++) {
        const row = subjectRows[i];
        const subject = {
          subjectId: i + 1,
          name: row.Name,
          type: row.Type,
          description: row.Description || ''
        };
        
        subjects.push(subject);
      }
      
      if (subjects.length > 0) {
        await Subject.insertMany(subjects);
      }
      
      console.log(`${subjects.length} subjects imported`);
    } else {
      console.warn('Subject data file not found.');
    }
    
    // Generate schedule
    await generateSchedule();
    
    console.log('Database initialization complete!');
  } catch (error) {
    console.error('Database initialization error:', error);
  } finally {
    // Close the connection
    mongoose.disconnect();
  }
};

// Generate schedule function
const generateSchedule = async () => {
  // Create a semester
  const semester = new Semester({
    semesterId: 1,
    name: 'Học kỳ 1 2023-2024',
    startDate: new Date(2023, 8, 1), // September 1, 2023
    endDate: new Date(2024, 0, 15)   // January 15, 2024
  });
  
  await semester.save();
  
  // Define periods
  const periods = {
    // Morning periods
    1: { start: '07:00', end: '07:45' },
    2: { start: '07:50', end: '08:35' },
    3: { start: '08:50', end: '09:35' },
    4: { start: '09:40', end: '10:25' },
    5: { start: '10:30', end: '11:15' },
    // Afternoon periods
    6: { start: '12:30', end: '13:15' },
    7: { start: '13:20', end: '14:05' },
    8: { start: '14:10', end: '14:55' },
    9: { start: '15:10', end: '15:55' },
    10: { start: '16:00', end: '16:45' }
  };
  
  // Days of the week
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const weekdays = days.slice(0, 5); // Only Monday-Friday for actual classes
  
  // Get all classes, subjects, teachers, and batches
  const classes = await Class.find();
  const subjects = await Subject.find();
  const teachers = await Teacher.find();
  const classrooms = await Classroom.find();
  const batches = await Batch.find();
  
  // Load curriculum data for each grade
  const curriculumData = {
    10: await getCurriculumData(10),
    11: await getCurriculumData(11),
    12: await getCurriculumData(12)
  };
  
  // Create a mapping of subject names to subject documents
  const subjectNameToDoc = {};
  subjects.forEach(subject => {
    subjectNameToDoc[subject.name] = subject;
  });
  
  // For tracking schedules
  const usedSlots = {}; // Track used slots: {classId: {day: [periods]}}
  const teacherSchedule = {}; // Track teacher schedules: {teacherId: {day: [periods]}}
  const classroomSchedule = {}; // Track classroom schedules: {classroomId: {day: [periods]}}
  let scheduleId = 1;
  
  // Generate schedules
  const schedules = [];
  
  // Reserve all weekend slots as "free time"
  for (const classDoc of classes) {
    const classId = classDoc.classId;
    if (!usedSlots[classId]) {
      usedSlots[classId] = {};
    }
    
    // Mark weekends as reserved (no classes)
    for (const day of days.slice(5)) { // Saturday and Sunday
      if (!usedSlots[classId][day]) {
        usedSlots[classId][day] = [];
      }
      
      // Mark all periods as used
      for (const periodNum in periods) {
        const period = periods[periodNum];
        
        const schedule = {
          scheduleId: scheduleId++,
          semesterId: 1,
          classId: classId,
          subjectId: null, // No subject (free time)
          teacherId: null, // No teacher
          classroomId: null, // No classroom
          dayOfWeek: day,
          period: parseInt(periodNum),
          startTime: period.start,
          endTime: period.end,
          isFreeTime: true
        };
        
        schedules.push(schedule);
        
        // Mark the slot as used
        usedSlots[classId][day].push(parseInt(periodNum));
      }
    }
  }
  
  // Generate schedule for each class
  for (const classDoc of classes) {
    const classId = classDoc.classId;
    const batchId = classDoc.batchId;
    
    // Get curriculum for this class's grade
    const batch = batches.find(b => b.batchId === batchId);
    const grade = batch ? batch.grade : 10;
    
    const classCurriculum = curriculumData[grade] || {};
    
    // Init tracking structures if needed
    if (!usedSlots[classId]) {
      usedSlots[classId] = {};
    }
    
    for (const day of weekdays) {
      if (!usedSlots[classId][day]) {
        usedSlots[classId][day] = [];
      }
    }
    
    // Schedule subjects from curriculum
    for (const subjectName in classCurriculum) {
      const numSessions = classCurriculum[subjectName];
      
      // Find corresponding subject in database
      const subject = subjectNameToDoc[subjectName];
      if (!subject) continue;
      
      // Assign a teacher
      if (teachers.length > 0) {
        const teacher = teachers[Math.floor(Math.random() * teachers.length)];
        const teacherId = teacher.teacherId;
        
        // Initialize teacher schedule if needed
        if (!teacherSchedule[teacherId]) {
          teacherSchedule[teacherId] = {};
          for (const day of weekdays) {
            teacherSchedule[teacherId][day] = [];
          }
        }
        
        // Assign a classroom
        const classroom = classrooms[Math.floor(Math.random() * classrooms.length)];
        const classroomId = classroom.classroomId;
        
        // Initialize classroom schedule if needed
        if (!classroomSchedule[classroomId]) {
          classroomSchedule[classroomId] = {};
          for (const day of weekdays) {
            classroomSchedule[classroomId][day] = [];
          }
        }
        
        // Schedule the required number of sessions
        let sessionsScheduled = 0;
        
        // Try to distribute sessions across days
        const daysCopy = [...weekdays];
        while (sessionsScheduled < numSessions && daysCopy.length > 0) {
          // Select a random day
          const randomIndex = Math.floor(Math.random() * daysCopy.length);
          const day = daysCopy.splice(randomIndex, 1)[0];
          
          // Find available periods
          const availablePeriods = [];
          for (const periodNum in periods) {
            const periodNumber = parseInt(periodNum);
            
            // Check if period is available for class, teacher, and classroom
            const classAvailable = !usedSlots[classId][day]?.includes(periodNumber);
            const teacherAvailable = !teacherSchedule[teacherId][day]?.includes(periodNumber);
            const classroomAvailable = !classroomSchedule[classroomId][day]?.includes(periodNumber);
            
            if (classAvailable && teacherAvailable && classroomAvailable) {
              availablePeriods.push(periodNumber);
            }
          }
          
          // Schedule if periods are available
          if (availablePeriods.length > 0) {
            const periodNum = availablePeriods[Math.floor(Math.random() * availablePeriods.length)];
            const period = periods[periodNum];
            
            const schedule = {
              scheduleId: scheduleId++,
              semesterId: 1,
              classId: classId,
              subjectId: subject.subjectId,
              teacherId: teacherId,
              classroomId: classroomId,
              dayOfWeek: day,
              period: periodNum,
              startTime: period.start,
              endTime: period.end,
              isFreeTime: false
            };
            
            schedules.push(schedule);
            
            // Mark slot as used
            if (!usedSlots[classId][day]) {
              usedSlots[classId][day] = [];
            }
            usedSlots[classId][day].push(periodNum);
            
            // Mark teacher and classroom as busy
            teacherSchedule[teacherId][day].push(periodNum);
            classroomSchedule[classroomId][day].push(periodNum);
            
            sessionsScheduled++;
          }
        }
      }
    }
  }
  
  // Fill remaining slots with free periods
  for (const classDoc of classes) {
    const classId = classDoc.classId;
    
    for (const day of weekdays) {
      if (!usedSlots[classId][day]) {
        usedSlots[classId][day] = [];
      }
      
      // Check each period
      for (const periodNum in periods) {
        const periodNumber = parseInt(periodNum);
        if (!usedSlots[classId][day].includes(periodNumber)) {
          const period = periods[periodNum];
          
          // Add as free time
          const schedule = {
            scheduleId: scheduleId++,
            semesterId: 1,
            classId: classId,
            subjectId: null,
            teacherId: null,
            classroomId: null,
            dayOfWeek: day,
            period: periodNumber,
            startTime: period.start,
            endTime: period.end,
            isFreeTime: true
          };
          
          schedules.push(schedule);
          
          // Mark slot as used
          usedSlots[classId][day].push(periodNumber);
        }
      }
    }
  }
  
  if (schedules.length > 0) {
    await Schedule.insertMany(schedules);
    console.log(`${schedules.length} schedule entries created`);
  }
  
  // Create curriculum documents
  const curriculums = [];
  for (const [gradeStr, curriculum] of Object.entries(curriculumData)) {
    const grade = parseInt(gradeStr);
    
    // Get batch for this grade
    const batch = batches.find(b => b.grade === grade);
    if (batch) {
      const subjectIds = [];
      for (const subjectName in curriculum) {
        const subject = subjectNameToDoc[subjectName];
        if (subject) {
          subjectIds.push(subject.subjectId);
        }
      }
      
      const curriculumDoc = {
        curriculumId: grade,
        curriculumName: `Chương trình lớp ${grade}`,
        description: `Chương trình học dành cho học sinh lớp ${grade}`,
        batchId: batch.batchId,
        subjectIds: subjectIds
      };
      
      curriculums.push(curriculumDoc);
    }
  }
  
  if (curriculums.length > 0) {
    await Curriculum.insertMany(curriculums);
    console.log(`${curriculums.length} curriculum documents created`);
  }
};

// Export the initialization function for use in other files
module.exports = initDatabase;

// If this file is run directly (not required as a module), run the initialization
if (require.main === module) {
  // Run init function
  console.log('Starting database initialization...');
  initDatabase()
    .then(() => {
      console.log('Database initialization completed successfully.');
      process.exit(0);
    })
    .catch(error => {
      console.error('Database initialization failed:', error);
      process.exit(1);
    });
} 