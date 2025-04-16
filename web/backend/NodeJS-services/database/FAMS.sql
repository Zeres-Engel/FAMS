
CREATE TABLE Announcement
(
  AnnouncementID INT      NULL     AUTO_INCREMENT,
  UserID         INT      NOT NULL,
  Content        TEXT     NULL    ,
  CreatedAt      DATETIME NULL     DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (AnnouncementID)
);

CREATE TABLE AttendanceLog
(
  AttendanceID INT                       NULL     AUTO_INCREMENT,
  ScheduleID   INT                       NOT NULL,
  UserID       INT                       NOT NULL,
  CheckInFace  BLOB                      NULL    ,
  CheckIn      DATETIME                  NULL    ,
  Status       ENUM(Present,Late,Absent) NULL     DEFAULT Absent,
  PRIMARY KEY (AttendanceID)
);

CREATE TABLE Batch
(
  BatchID   INT         NULL     AUTO_INCREMENT,
  BatchName VARCHAR(50) NOT NULL,
  StartYear INT         NULL    ,
  PRIMARY KEY (BatchID)
);

CREATE TABLE Class
(
  ClassID           INT         NULL     AUTO_INCREMENT,
  HomeroomTeacherID INT         NULL    ,
  ClassName         VARCHAR(50) NOT NULL,
  Grade             INT         NULL    ,
  PRIMARY KEY (ClassID)
);

CREATE TABLE Classroom
(
  ClassroomID INT         NULL     AUTO_INCREMENT,
  RoomNumber  VARCHAR(20) NOT NULL,
  Building    VARCHAR(50) NULL    ,
  Capacity    INT         NULL    ,
  PRIMARY KEY (ClassroomID)
);

CREATE TABLE ClassSchedule
(
  ScheduleID  INT          NULL     AUTO_INCREMENT,
  SemesterID  INT          NOT NULL,
  ClassID     INT          NOT NULL,
  SubjectID   INT          NOT NULL,
  TeacherID   INT          NOT NULL,
  ClassroomID INT          NOT NULL,
  SlotID      INT          NOT NULL,
  Topic       VARCHAR(255) NULL    ,
  SessionDate DATE         NULL    ,
  SessionWeek VARCHAR(255) NULL    ,
  PRIMARY KEY (ScheduleID)
);

CREATE TABLE Curriculum
(
  CurriculumID   INT          NULL     AUTO_INCREMENT,
  CurriculumName VARCHAR(100) NOT NULL,
  Description    TEXT         NULL    ,
  Grade          INT          NULL    ,
  PRIMARY KEY (CurriculumID)
);

CREATE TABLE CurriculumSubject
(
  CurriculumID INT NOT NULL,
  SubjectID    INT NOT NULL,
  Sessions     INT NOT NULL DEFAULT 2,
  PRIMARY KEY (CurriculumID, SubjectID)
);

CREATE TABLE Device
(
  DeviceID   INT          NULL     AUTO_INCREMENT,
  DeviceName VARCHAR(100) NOT NULL,
  DeviceType VARCHAR(50)  NULL     DEFAULT Jetson Nano,
  Location   VARCHAR(100) NULL    ,
  Status     BOOLEAN      NULL     DEFAULT TRUE,
  PRIMARY KEY (DeviceID)
);

CREATE TABLE FaceVector
(
  FaceVectorID INT      NULL     AUTO_INCREMENT,
  UserID       INT      NOT NULL,
  ModelID      INT      NULL    ,
  Vector       JSON     NOT NULL,
  CapturedDate DATETIME NULL     DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (FaceVectorID)
);

CREATE TABLE ModelVersion
(
  ModelID        INT                   NULL     AUTO_INCREMENT,
  ModelName      VARCHAR(100)          NOT NULL,
  Version        VARCHAR(50)           NOT NULL,
  DeploymentDate DATETIME              NULL     DEFAULT CURRENT_TIMESTAMP,
  Description    TEXT                  NULL    ,
  DeviceID       INT                   NULL    ,
  CheckpointPath VARCHAR(255)          NOT NULL,
  Status         ENUM(Active,Inactive) NULL     DEFAULT Active,
  PRIMARY KEY (ModelID)
);

CREATE TABLE Notification
(
  NotificationID INT      NULL     AUTO_INCREMENT,
  SenderID       INT      NOT NULL,
  ReceiverID     INT      NOT NULL,
  Message        TEXT     NOT NULL,
  SentDate       DATETIME NULL     DEFAULT CURRENT_TIMESTAMP,
  ReadStatus     BOOLEAN  NULL     DEFAULT FALSE,
  PRIMARY KEY (NotificationID)
);

CREATE TABLE Parent
(
  ParentID INT          NULL     AUTO_INCREMENT,
  UserID   INT          NOT NULL,
  FullName VARCHAR(100) NULL    ,
  Career   VARCHAR(100) NULL    ,
  Phone    VARCHAR(20)  NULL    ,
  Gender   BIT          NULL    ,
  PRIMARY KEY (ParentID)
);

ALTER TABLE Parent
  ADD CONSTRAINT UQ_UserID UNIQUE (UserID);

CREATE TABLE ParentStudent
(
  ParentID  INT NOT NULL,
  StudentID INT NOT NULL,
  PRIMARY KEY (ParentID, StudentID)
);

CREATE TABLE RFID
(
  RFID_ID    VARCHAR(50) NULL    ,
  UserID     INT         NOT NULL,
  IssueDate  DATETIME    NULL    ,
  ExpiryDate DATETIME    NULL    ,
  PRIMARY KEY (RFID_ID)
);

CREATE TABLE ScheduleFromat
(
  SlotID     INT                                                            NULL     AUTO_INCREMENT,
  SlotNumber INT                                                            NOT NULL,
  DayOfWeek  ENUM(Monday,Tuesday,Wednesday,Thursday,Friday,Saturday,Sunday) NOT NULL,
  StartTime  TIME                                                           NOT NULL,
  EndTime    TIME                                                           NOT NULL,
  PRIMARY KEY (SlotID)
);

ALTER TABLE ScheduleFromat
  ADD CONSTRAINT UQ_SlotNumber UNIQUE (SlotNumber);

ALTER TABLE ScheduleFromat
  ADD CONSTRAINT UQ_DayOfWeek UNIQUE (DayOfWeek);

CREATE TABLE Semester
(
  SemesterID   INT         NULL     AUTO_INCREMENT,
  SemesterName VARCHAR(50) NOT NULL,
  StartDate    DATE        NOT NULL,
  EndDate      DATE        NOT NULL,
  CurriculumID INT         NOT NULL,
  BatchID      INT         NOT NULL,
  PRIMARY KEY (SemesterID)
);

CREATE TABLE Student
(
  StudentID   INT          NULL     AUTO_INCREMENT,
  UserID      INT          NOT NULL,
  FullName    VARCHAR(100) NOT NULL,
  DateOfBirth DATE         NULL    ,
  ClassID     INT          NULL    ,
  Gender      BIT          NULL    ,
  Address     VARCHAR(200) NULL    ,
  Phone       VARCHAR(20)  NULL    ,
  PRIMARY KEY (StudentID)
);

ALTER TABLE Student
  ADD CONSTRAINT UQ_UserID UNIQUE (UserID);

CREATE TABLE Subject
(
  SubjectID   INT                          NULL     AUTO_INCREMENT,
  SubjectName VARCHAR(100)                 NOT NULL,
  Description TEXT                         NULL    ,
  SubjectType ENUM(Chinh,TuChon,NgoaiKhoa) NOT NULL,
  PRIMARY KEY (SubjectID)
);

CREATE TABLE Teacher
(
  TeacherID      INT          NULL     AUTO_INCREMENT,
  UserID         INT          NOT NULL,
  FullName       VARCHAR(100) NOT NULL,
  Email          VARCHAR(100) NULL    ,
  DateOfBirth    DATE         NULL    ,
  Address        VARCHAR(100) NULL    ,
  Phone          VARCHAR(20)  NULL    ,
  Gender         BIT          NULL    ,
  Major          VARCHAR(255) NULL    ,
  WeeklyCapacity INT          NOT NULL DEFAULT 10,
  PRIMARY KEY (TeacherID)
);

ALTER TABLE Teacher
  ADD CONSTRAINT UQ_UserID UNIQUE (UserID);

CREATE TABLE UserAccount
(
  UserID   INT                                NULL     AUTO_INCREMENT,
  Name     VARCHAR(100)                       NOT NULL,
  Email    VARCHAR(100)                       NOT NULL,
  Password VARCHAR(255)                       NOT NULL,
  Role     ENUM(Admin,Teacher,Parent,Student) NULL     DEFAULT Student,
  Avatar   VARCHAR(255)                       NULL    ,
  PRIMARY KEY (UserID)
);

ALTER TABLE UserAccount
  ADD CONSTRAINT UQ_Email UNIQUE (Email);

ALTER TABLE Announcement
  ADD CONSTRAINT FK_UserAccount_TO_Announcement
    FOREIGN KEY (UserID)
    REFERENCES UserAccount (UserID);

ALTER TABLE AttendanceLog
  ADD CONSTRAINT FK_ClassSchedule_TO_AttendanceLog
    FOREIGN KEY (ScheduleID)
    REFERENCES ClassSchedule (ScheduleID);

ALTER TABLE AttendanceLog
  ADD CONSTRAINT FK_UserAccount_TO_AttendanceLog
    FOREIGN KEY (UserID)
    REFERENCES UserAccount (UserID);

ALTER TABLE Class
  ADD CONSTRAINT FK_Teacher_TO_Class
    FOREIGN KEY (HomeroomTeacherID)
    REFERENCES Teacher (TeacherID);

ALTER TABLE ClassSchedule
  ADD CONSTRAINT FK_Semester_TO_ClassSchedule
    FOREIGN KEY (SemesterID)
    REFERENCES Semester (SemesterID);

ALTER TABLE ClassSchedule
  ADD CONSTRAINT FK_Class_TO_ClassSchedule
    FOREIGN KEY (ClassID)
    REFERENCES Class (ClassID);

ALTER TABLE ClassSchedule
  ADD CONSTRAINT FK_Subject_TO_ClassSchedule
    FOREIGN KEY (SubjectID)
    REFERENCES Subject (SubjectID);

ALTER TABLE ClassSchedule
  ADD CONSTRAINT FK_Teacher_TO_ClassSchedule
    FOREIGN KEY (TeacherID)
    REFERENCES Teacher (TeacherID);

ALTER TABLE ClassSchedule
  ADD CONSTRAINT FK_Classroom_TO_ClassSchedule
    FOREIGN KEY (ClassroomID)
    REFERENCES Classroom (ClassroomID);

ALTER TABLE ClassSchedule
  ADD CONSTRAINT FK_ScheduleFromat_TO_ClassSchedule
    FOREIGN KEY (SlotID)
    REFERENCES ScheduleFromat (SlotID);

ALTER TABLE CurriculumSubject
  ADD CONSTRAINT FK_Curriculum_TO_CurriculumSubject
    FOREIGN KEY (CurriculumID)
    REFERENCES Curriculum (CurriculumID);

ALTER TABLE CurriculumSubject
  ADD CONSTRAINT FK_Subject_TO_CurriculumSubject
    FOREIGN KEY (SubjectID)
    REFERENCES Subject (SubjectID);

ALTER TABLE FaceVector
  ADD CONSTRAINT FK_UserAccount_TO_FaceVector
    FOREIGN KEY (UserID)
    REFERENCES UserAccount (UserID);

ALTER TABLE FaceVector
  ADD CONSTRAINT FK_ModelVersion_TO_FaceVector
    FOREIGN KEY (ModelID)
    REFERENCES ModelVersion (ModelID);

ALTER TABLE ModelVersion
  ADD CONSTRAINT FK_Device_TO_ModelVersion
    FOREIGN KEY (DeviceID)
    REFERENCES Device (DeviceID);

ALTER TABLE Notification
  ADD CONSTRAINT FK_UserAccount_TO_Notification
    FOREIGN KEY (SenderID)
    REFERENCES UserAccount (UserID);

ALTER TABLE Notification
  ADD CONSTRAINT FK_UserAccount_TO_Notification1
    FOREIGN KEY (ReceiverID)
    REFERENCES UserAccount (UserID);

ALTER TABLE Parent
  ADD CONSTRAINT FK_UserAccount_TO_Parent
    FOREIGN KEY (UserID)
    REFERENCES UserAccount (UserID);

ALTER TABLE ParentStudent
  ADD CONSTRAINT FK_Parent_TO_ParentStudent
    FOREIGN KEY (ParentID)
    REFERENCES Parent (ParentID);

ALTER TABLE ParentStudent
  ADD CONSTRAINT FK_Student_TO_ParentStudent
    FOREIGN KEY (StudentID)
    REFERENCES Student (StudentID);

ALTER TABLE RFID
  ADD CONSTRAINT FK_UserAccount_TO_RFID
    FOREIGN KEY (UserID)
    REFERENCES UserAccount (UserID);

ALTER TABLE Semester
  ADD CONSTRAINT FK_Curriculum_TO_Semester
    FOREIGN KEY (CurriculumID)
    REFERENCES Curriculum (CurriculumID);

ALTER TABLE Semester
  ADD CONSTRAINT FK_Batch_TO_Semester
    FOREIGN KEY (BatchID)
    REFERENCES Batch (BatchID);

ALTER TABLE Student
  ADD CONSTRAINT FK_UserAccount_TO_Student
    FOREIGN KEY (UserID)
    REFERENCES UserAccount (UserID);

ALTER TABLE Student
  ADD CONSTRAINT FK_Class_TO_Student
    FOREIGN KEY (ClassID)
    REFERENCES Class (ClassID);

ALTER TABLE Teacher
  ADD CONSTRAINT FK_UserAccount_TO_Teacher
    FOREIGN KEY (UserID)
    REFERENCES UserAccount (UserID);
