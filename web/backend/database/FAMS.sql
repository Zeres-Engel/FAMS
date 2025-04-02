CREATE TABLE UserAccount (
  UserID INT AUTO_INCREMENT PRIMARY KEY,
  Name VARCHAR(100) NOT NULL,
  Email VARCHAR(100) NOT NULL UNIQUE,
  Password VARCHAR(255) NOT NULL,
  Role ENUM('Admin','Teacher','Parent','Student') DEFAULT 'Student'
);

CREATE TABLE Teacher (
  TeacherID INT AUTO_INCREMENT PRIMARY KEY,
  UserID INT NOT NULL UNIQUE,
  FullName VARCHAR(100) NOT NULL,
  Email VARCHAR(100),
  DateOfBirth DATETIME,
  Address VARCHAR(100),
  Phone VARCHAR(20),
  Gender BIT,
  FOREIGN KEY (UserID) REFERENCES UserAccount(UserID)
);

CREATE TABLE Parent (
  ParentID INT AUTO_INCREMENT PRIMARY KEY,
  UserID INT NOT NULL UNIQUE,
  FullName VARCHAR(100),
  Career VARCHAR(100),
  Phone VARCHAR(20),
  Gender BIT,
  StudentIDs JSON,  -- Danh sách StudentID liên kết với Parent
  FOREIGN KEY (UserID) REFERENCES UserAccount(UserID)
);

CREATE TABLE Class (
  ClassID INT AUTO_INCREMENT PRIMARY KEY,
  ClassName VARCHAR(50) NOT NULL,
  HomeroomTeacherID INT,
  FOREIGN KEY (HomeroomTeacherID) REFERENCES Teacher(TeacherID)
);

CREATE TABLE Student (
  StudentID INT AUTO_INCREMENT PRIMARY KEY,
  UserID INT NOT NULL UNIQUE,
  FullName VARCHAR(100) NOT NULL,
  DateOfBirth DATETIME,
  ClassID INT,
  Gender BIT,
  Address VARCHAR(200),
  Phone VARCHAR(20),
  ParentIDs JSON,  -- Danh sách ParentID liên kết với Student (có thể chứa 1 hoặc 2)
  FOREIGN KEY (UserID) REFERENCES UserAccount(UserID),
  FOREIGN KEY (ClassID) REFERENCES Class(ClassID)
);

CREATE TABLE Classroom (
  ClassroomID INT AUTO_INCREMENT PRIMARY KEY,
  RoomNumber VARCHAR(20) NOT NULL,
  Building VARCHAR(50),
  Capacity INT
);

CREATE TABLE Subject (
  SubjectID INT AUTO_INCREMENT PRIMARY KEY,
  SubjectName VARCHAR(100) NOT NULL,
  Description TEXT,
  SubjectType ENUM('Chinh','TuChon','NgoaiKhoa') NOT NULL
);

CREATE TABLE Curriculum (
  CurriculumID INT AUTO_INCREMENT PRIMARY KEY,
  CurriculumName VARCHAR(100) NOT NULL,
  Description TEXT,
  SubjectIDs JSON  -- Danh sách SubjectID thuộc Curriculum
);

CREATE TABLE Semester (
  SemesterID INT AUTO_INCREMENT PRIMARY KEY,
  SemesterName VARCHAR(50) NOT NULL,
  StartDate DATETIME NOT NULL,
  EndDate DATETIME NOT NULL,
  CurriculumID INT NOT NULL,
  FOREIGN KEY (CurriculumID) REFERENCES Curriculum(CurriculumID)
);

CREATE TABLE Announcement (
  AnnouncementID INT AUTO_INCREMENT PRIMARY KEY,
  UserID INT NOT NULL,
  Content TEXT,
  CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (UserID) REFERENCES UserAccount(UserID)
);

CREATE TABLE RFID (
  RFID_ID VARCHAR(50) PRIMARY KEY,
  UserID INT NOT NULL,  -- Dùng cho cả Teacher và Student
  IssueDate DATETIME,
  ExpiryDate DATETIME,
  FOREIGN KEY (UserID) REFERENCES UserAccount(UserID)
);

CREATE TABLE ClassSession (
  SessionID INT AUTO_INCREMENT PRIMARY KEY,
  SemesterID INT NOT NULL,
  ClassID INT NOT NULL,
  SubjectID INT NOT NULL,
  TeacherID INT NOT NULL,
  ClassroomID INT NOT NULL,
  SessionDate DATETIME NOT NULL,
  StartTime TIME NOT NULL,
  EndTime TIME NOT NULL,
  Topic VARCHAR(255),
  FOREIGN KEY (SemesterID) REFERENCES Semester(SemesterID),
  FOREIGN KEY (ClassID) REFERENCES Class(ClassID),
  FOREIGN KEY (SubjectID) REFERENCES Subject(SubjectID),
  FOREIGN KEY (TeacherID) REFERENCES Teacher(TeacherID),
  FOREIGN KEY (ClassroomID) REFERENCES Classroom(ClassroomID)
);

CREATE TABLE AttendanceLog (
  AttendanceID INT AUTO_INCREMENT PRIMARY KEY,
  SessionID INT NOT NULL,
  UserID INT NOT NULL,  -- Dùng cho cả Student và Teacher
  CheckInTime DATETIME,
  Status ENUM('Present','Late','Absent') DEFAULT 'Absent',
  FOREIGN KEY (SessionID) REFERENCES ClassSession(SessionID),
  FOREIGN KEY (UserID) REFERENCES UserAccount(UserID)
);

CREATE TABLE Schedule (
  ScheduleID INT AUTO_INCREMENT PRIMARY KEY,
  SemesterID INT NOT NULL,
  ClassID INT NOT NULL,
  SubjectID INT NOT NULL,
  TeacherID INT NOT NULL,
  ClassroomID INT NOT NULL,
  DayOfWeek ENUM('Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday') NOT NULL,
  StartTime TIME NOT NULL,
  EndTime TIME NOT NULL,
  FOREIGN KEY (SemesterID) REFERENCES Semester(SemesterID),
  FOREIGN KEY (ClassID) REFERENCES Class(ClassID),
  FOREIGN KEY (SubjectID) REFERENCES Subject(SubjectID),
  FOREIGN KEY (TeacherID) REFERENCES Teacher(TeacherID),
  FOREIGN KEY (ClassroomID) REFERENCES Classroom(ClassroomID)
);

CREATE TABLE Notification (
  NotificationID INT AUTO_INCREMENT PRIMARY KEY,
  UserID INT NOT NULL,
  Message TEXT NOT NULL,
  SentDate DATETIME DEFAULT CURRENT_TIMESTAMP,
  ReadStatus BOOLEAN DEFAULT FALSE,
  FOREIGN KEY (UserID) REFERENCES UserAccount(UserID)
);
