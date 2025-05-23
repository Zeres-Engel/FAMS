
CREATE TABLE Announcement
(
  AnnouncementID INT          NULL     AUTO_INCREMENT,
  UserID         VARCHAR(100) NOT NULL,
  Content        TEXT         NULL    ,
  CreatedAt      DATETIME     NULL     DEFAULT CURRENT_TIMESTAMP,
  IsActive       BOOLEAN      NULL     DEFAULT TRUE,
  PRIMARY KEY (AnnouncementID)
);

CREATE TABLE AttendanceLog
(
  AttendanceID  INT                              NULL     AUTO_INCREMENT,
  ScheduleID    INT                              NOT NULL,
  UserID        VARCHAR(100)                     NOT NULL,
  Avatar        VARCHAR(255)                     NULL    ,
  CheckInFace   VARCHAR(255)                     NULL    ,
  CheckIn       DATETIME                         NULL    ,
  Note          VARCHAR(100)                     NULL    ,
  Status        ENUM(Present,Late,Absent,NotNow) NULL     DEFAULT Absent,
  CreatedAt     DATETIME                         NULL     DEFAULT CURRENT_TIMESTAMP,
  UpdatedAt     DATETIME                         NULL     DEFAULT CURRENT_TIMESTAMP,
  IsActive      BOOLEAN                          NULL     DEFAULT TRUE,
  TeacherId     INT                              NULL    ,
  TeacherName   VARCHAR(100)                     NULL    ,
  SubjectID     INT                              NULL    ,
  SubjectName   VARCHAR(100)                     NULL    ,
  ClassId       INT                              NULL    ,
  ClassName     VARCHAR(100)                     NULL    ,
  FaceVectorIDs LIST                             NULL    ,
  PRIMARY KEY (AttendanceID)
);

CREATE TABLE Batch
(
  BatchID   INT         NULL     AUTO_INCREMENT,
  BatchName VARCHAR(50) NOT NULL,
  StartDate DATE        NULL    ,
  EndDate   DATE        NULL    ,
  StartYear INT         NULL    ,
  CreatedAt DATETIME    NULL     DEFAULT CURRENT_TIMESTAMP,
  UpdatedAt DATETIME    NULL     DEFAULT CURRENT_TIMESTAMP,
  IsActive  BOOLEAN     NULL     DEFAULT TRUE,
  PRIMARY KEY (BatchID)
);

CREATE TABLE Class
(
  ClassID           INT         NULL     AUTO_INCREMENT,
  ClassName         VARCHAR(50) NOT NULL,
  HomeroomTeacherID INT         NULL    ,
  Grade             INT         NULL    ,
  AcademicYear      VARCHAR(10) NULL    ,
  CreatedAt         DATETIME    NULL     DEFAULT CURRENT_TIMESTAMP,
  UpdatedAt         DATETIME    NULL     DEFAULT CURRENT_TIMESTAMP,
  IsActive          BOOLEAN     NULL     DEFAULT TRUE,
  PRIMARY KEY (ClassID)
);

CREATE TABLE Classroom
(
  ClassroomID   INT          NULL     AUTO_INCREMENT,
  ClassroomName VARCHAR(100) NULL    ,
  RoomNumber    VARCHAR(20)  NOT NULL,
  Building      VARCHAR(50)  NULL    ,
  Location      VARCHAR(100) NULL    ,
  Capacity      INT          NULL     DEFAULT 40,
  CreatedAt     DATETIME     NULL     DEFAULT CURRENT_TIMESTAMP,
  UpdatedAt     DATETIME     NULL     DEFAULT CURRENT_TIMESTAMP,
  IsActive      BOOLEAN      NULL     DEFAULT TRUE,
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
  CreatedAt   DATETIME     NULL     DEFAULT CURRENT_TIMESTAMP,
  UpdatedAt   DATETIME     NULL     DEFAULT CURRENT_TIMESTAMP,
  IsActive    BOOLEAN      NULL     DEFAULT TRUE,
  PRIMARY KEY (ScheduleID)
);

CREATE TABLE Curriculum
(
  CurriculumID   INT          NULL     AUTO_INCREMENT,
  CurriculumName VARCHAR(100) NOT NULL,
  Description    TEXT         NULL    ,
  Grade          INT          NULL    ,
  CreatedAt      DATETIME     NULL     DEFAULT CURRENT_TIMESTAMP,
  UpdatedAt      DATETIME     NULL     DEFAULT CURRENT_TIMESTAMP,
  IsActive       BOOLEAN      NULL     DEFAULT TRUE,
  PRIMARY KEY (CurriculumID)
);

CREATE TABLE CurriculumSubject
(
  CurriculumID INT      NOT NULL,
  SubjectID    INT      NOT NULL,
  Sessions     INT      NOT NULL DEFAULT 2,
  CreatedAt    DATETIME NULL     DEFAULT CURRENT_TIMESTAMP,
  UpdatedAt    DATETIME NULL     DEFAULT CURRENT_TIMESTAMP,
  IsActive     BOOLEAN  NULL     DEFAULT TRUE,
  PRIMARY KEY (CurriculumID, SubjectID)
);

CREATE TABLE Device
(
  DeviceID    INT          NULL     AUTO_INCREMENT,
  DeviceName  VARCHAR(100) NOT NULL,
  DeviceType  VARCHAR(50)  NULL     DEFAULT Jetson,
  Status      BOOLEAN      NULL     DEFAULT TRUE,
  CreatedAt   DATETIME     NULL     DEFAULT CURRENT_TIMESTAMP,
  UpdatedAt   DATETIME     NULL     DEFAULT CURRENT_TIMESTAMP,
  IsActive    BOOLEAN      NULL     DEFAULT TRUE,
  ClassroomID INT          NOT NULL,
  PRIMARY KEY (DeviceID)
);

CREATE TABLE FaceVector
(
  FaceVectorID INT                            NULL     AUTO_INCREMENT,
  UserID       VARCHAR(100)                   NOT NULL,
  ModelD       INT                            NULL    ,
  Vector       JSON                           NOT NULL,
  CapturedDate DATETIME                       NULL     DEFAULT CURRENT_TIMESTAMP,
  CreatedAt    DATETIME                       NULL     DEFAULT CURRENT_TIMESTAMP,
  UpdatedAt    DATETIME                       NULL     DEFAULT CURRENT_TIMESTAMP,
  IsActive     BOOLEAN                        NULL     DEFAULT TRUE,
  Category     ENUM(front,up,down,left,right) NULL    ,
  Score        FLOAT                          NULL    ,
  PRIMARY KEY (FaceVectorID)
);

CREATE TABLE ModelVersion
(
  ModelID        INT                   NULL     AUTO_INCREMENT,
  DeviceID       INT                   NULL    ,
  ModelName      VARCHAR(100)          NOT NULL,
  Version        VARCHAR(50)           NOT NULL,
  DeploymentDate DATETIME              NULL     DEFAULT CURRENT_TIMESTAMP,
  Description    TEXT                  NULL    ,
  CheckpointPath VARCHAR(255)          NOT NULL,
  Status         ENUM(Active,Inactive) NULL     DEFAULT Active,
  CreatedAt      DATETIME              NULL     DEFAULT CURRENT_TIMESTAMP,
  UpdatedAt      DATETIME              NULL     DEFAULT CURRENT_TIMESTAMP,
  IsActive       BOOLEAN               NULL     DEFAULT TRUE,
  PRIMARY KEY (ModelID)
);

CREATE TABLE Notification
(
  NotificationID INT          NULL     AUTO_INCREMENT,
  SenderID       VARCHAR(100) NOT NULL,
  ReceiverID     VARCHAR(100) NOT NULL,
  Message        TEXT         NOT NULL,
  SentDate       DATETIME     NULL     DEFAULT CURRENT_TIMESTAMP,
  ReadStatus     BOOLEAN      NULL     DEFAULT FALSE,
  CreatedAt      DATETIME     NULL     DEFAULT CURRENT_TIMESTAMP,
  UpdatedAt      DATETIME     NULL     DEFAULT CURRENT_TIMESTAMP,
  IsActive       BOOLEAN      NULL     DEFAULT TRUE,
  PRIMARY KEY (NotificationID)
);

CREATE TABLE Parent
(
  ParentID  INT          NULL     AUTO_INCREMENT,
  UserID    VARCHAR(100) NOT NULL,
  FullName  VARCHAR(100) NULL    ,
  Email     VARCHAR(100) NULL    ,
  Career    VARCHAR(100) NULL    ,
  Phone     VARCHAR(20)  NULL    ,
  Gender    VARCHAR(10)  NULL    ,
  CreatedAt DATETIME     NULL     DEFAULT CURRENT_TIMESTAMP,
  UpdatedAt DATETIME     NULL     DEFAULT CURRENT_TIMESTAMP,
  IsActive  BOOLEAN      NULL     DEFAULT TRUE,
  PRIMARY KEY (ParentID)
);

ALTER TABLE Parent
  ADD CONSTRAINT UQ_UserID UNIQUE (UserID);

CREATE TABLE ParentStudent
(
  ParentStudentID    INT         NULL     AUTO_INCREMENT,
  ParentID           INT         NOT NULL,
  StudentID          INT         NOT NULL,
  Relationship       VARCHAR(20) NULL    ,
  IsEmergencyContact BOOLEAN     NULL     DEFAULT FALSE,
  CreatedAt          DATETIME    NULL     DEFAULT CURRENT_TIMESTAMP,
  UpdatedAt          DATETIME    NULL     DEFAULT CURRENT_TIMESTAMP,
  IsActive           BOOLEAN     NULL     DEFAULT TRUE,
  PRIMARY KEY (ParentStudentID)
);

ALTER TABLE ParentStudent
  ADD CONSTRAINT UQ_ParentID UNIQUE (ParentID);

ALTER TABLE ParentStudent
  ADD CONSTRAINT UQ_StudentID UNIQUE (StudentID);

CREATE TABLE RFID
(
  RFID_ID    VARCHAR(50)  NULL    ,
  UserID     VARCHAR(100) NOT NULL,
  IssueDate  DATETIME     NULL    ,
  ExpiryDate DATETIME     NULL    ,
  CreatedAt  DATETIME     NULL     DEFAULT CURRENT_TIMESTAMP,
  UpdatedAt  DATETIME     NULL     DEFAULT CURRENT_TIMESTAMP,
  IsActive   BOOLEAN      NULL     DEFAULT TRUE,
  PRIMARY KEY (RFID_ID)
);

CREATE TABLE ScheduleFormat
(
  SlotID     INT                                                            NULL     AUTO_INCREMENT,
  SlotName   VARCHAR(50)                                                    NULL    ,
  SlotNumber INT                                                            NOT NULL,
  DayOfWeek  ENUM(Monday,Tuesday,Wednesday,Thursday,Friday,Saturday,Sunday) NOT NULL,
  StartTime  TIME                                                           NOT NULL,
  EndTime    TIME                                                           NOT NULL,
  CreatedAt  DATETIME                                                       NULL     DEFAULT CURRENT_TIMESTAMP,
  UpdatedAt  DATETIME                                                       NULL     DEFAULT CURRENT_TIMESTAMP,
  IsActive   BOOLEAN                                                        NULL     DEFAULT TRUE,
  PRIMARY KEY (SlotID)
);

ALTER TABLE ScheduleFormat
  ADD CONSTRAINT UQ_SlotNumber UNIQUE (SlotNumber);

ALTER TABLE ScheduleFormat
  ADD CONSTRAINT UQ_DayOfWeek UNIQUE (DayOfWeek);

CREATE TABLE Semester
(
  SemesterID   INT         NULL     AUTO_INCREMENT,
  CurriculumID INT         NOT NULL,
  SemesterName VARCHAR(50) NOT NULL,
  StartDate    DATE        NOT NULL,
  EndDate      DATE        NOT NULL,
  CreatedAt    DATETIME    NULL     DEFAULT CURRENT_TIMESTAMP,
  UpdatedAt    DATETIME    NULL     DEFAULT CURRENT_TIMESTAMP,
  IsActive     BOOLEAN     NULL     DEFAULT TRUE,
  PRIMARY KEY (SemesterID)
);

CREATE TABLE Student
(
  StudentID   INT          NULL     AUTO_INCREMENT,
  UserID      VARCHAR(100) NOT NULL,
  ClassIDs    INT          NULL    ,
  BatchID     INT          NULL    ,
  FullName    VARCHAR(100) NOT NULL,
  Email       VARCHAR(100) NULL    ,
  DateOfBirth DATE         NULL    ,
  Gender      VARCHAR(10)  NULL    ,
  Address     VARCHAR(200) NULL    ,
  Phone       VARCHAR(20)  NULL    ,
  CreatedAt   DATETIME     NULL     DEFAULT CURRENT_TIMESTAMP,
  UpdatedAt   DATETIME     NULL     DEFAULT CURRENT_TIMESTAMP,
  IsActive    BOOLEAN      NULL     DEFAULT TRUE,
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
  CreatedAt   DATETIME                     NULL     DEFAULT CURRENT_TIMESTAMP,
  UpdatedAt   DATETIME                     NULL     DEFAULT CURRENT_TIMESTAMP,
  IsActive    BOOLEAN                      NULL     DEFAULT TRUE,
  PRIMARY KEY (SubjectID)
);

CREATE TABLE Teacher
(
  TeacherID      INT          NULL     AUTO_INCREMENT,
  UserID         VARCHAR(100) NOT NULL,
  ClassIDs       LIST         NULL    ,
  FullName       VARCHAR(100) NOT NULL,
  Email          VARCHAR(100) NULL    ,
  DateOfBirth    DATE         NULL    ,
  Address        VARCHAR(100) NULL    ,
  Phone          VARCHAR(20)  NULL    ,
  Gender         VARCHAR(10)  NULL    ,
  Major          VARCHAR(255) NULL    ,
  WeeklyCapacity INT          NOT NULL DEFAULT 10,
  CreatedAt      DATETIME     NULL     DEFAULT CURRENT_TIMESTAMP,
  UpdatedAt      DATETIME     NULL     DEFAULT CURRENT_TIMESTAMP,
  IsActive       BOOLEAN      NULL     DEFAULT TRUE,
  Degree         VARCHAR(100) NULL    ,
  PRIMARY KEY (TeacherID)
);

ALTER TABLE Teacher
  ADD CONSTRAINT UQ_UserID UNIQUE (UserID);

CREATE TABLE UserAccount
(
  UserID    VARCHAR(100)                       NULL    ,
  Email     VARCHAR(100)                       NOT NULL,
  Password  VARCHAR(255)                       NOT NULL,
  Role      ENUM(Admin,Teacher,Parent,Student) NULL     DEFAULT Student,
  Avatar    VARCHAR(255)                       NULL    ,
  CreatedAt DATETIME                           NULL     DEFAULT CURRENT_TIMESTAMP,
  UpdatedAt DATETIME                           NULL     DEFAULT CURRENT_TIMESTAMP,
  IsActive  BOOLEAN                            NULL     DEFAULT TRUE,
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
  ADD CONSTRAINT FK_ScheduleFormat_TO_ClassSchedule
    FOREIGN KEY (SlotID)
    REFERENCES ScheduleFormat (SlotID);

ALTER TABLE CurriculumSubject
  ADD CONSTRAINT FK_Curriculum_TO_CurriculumSubject
    FOREIGN KEY (CurriculumID)
    REFERENCES Curriculum (CurriculumID);

ALTER TABLE CurriculumSubject
  ADD CONSTRAINT FK_Subject_TO_CurriculumSubject
    FOREIGN KEY (SubjectID)
    REFERENCES Subject (SubjectID);

ALTER TABLE Device
  ADD CONSTRAINT FK_Classroom_TO_Device
    FOREIGN KEY (ClassroomID)
    REFERENCES Classroom (ClassroomID);

ALTER TABLE FaceVector
  ADD CONSTRAINT FK_UserAccount_TO_FaceVector
    FOREIGN KEY (UserID)
    REFERENCES UserAccount (UserID);

ALTER TABLE FaceVector
  ADD CONSTRAINT FK_ModelVersion_TO_FaceVector
    FOREIGN KEY (ModelD)
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

ALTER TABLE Student
  ADD CONSTRAINT FK_UserAccount_TO_Student
    FOREIGN KEY (UserID)
    REFERENCES UserAccount (UserID);

ALTER TABLE Student
  ADD CONSTRAINT FK_Class_TO_Student
    FOREIGN KEY (ClassIDs)
    REFERENCES Class (ClassID);

ALTER TABLE Student
  ADD CONSTRAINT FK_Batch_TO_Student
    FOREIGN KEY (BatchID)
    REFERENCES Batch (BatchID);

ALTER TABLE Teacher
  ADD CONSTRAINT FK_UserAccount_TO_Teacher
    FOREIGN KEY (UserID)
    REFERENCES UserAccount (UserID);
