import { ClassData } from "../classModels/classModels.model";
import { UserData } from "../userModels/userDataModels.model";
import EditAttendanceForm from "../../components/DataTable/EditAttendanceForm/EditAttendanceForm";

type Order = "asc" | "desc";
interface Data {
  id: number;
  avatar: string;
  creationAt: string;
  email: string;
  name: string;
  role: string;
  updatedAt: string;
  // action?:string
}
interface AttendanceSearchParam {
  userId: string;
  subjectId?: string;
  classId?: string;
  teacherName?: string;
  status?: string;
  date?: string;
  dateFrom?:string;
  dateTo?:string
  slotNumber?: string;
  page?: number;
  limit?: number;
}
interface RFIDData {
  id: string;
  userid: string;
  rfid: string;
  expTime: string;
  faceAttendance: string;
  role?: string;
}
type AttendanceStatus = "Present" | "Late" | "Absent" | "Not now";
interface AttendanceLog {
  id: string;
  attendanceId: number;
  scheduleId: number;
  userId: number;
  face: string;
  checkin: string;
  status: string;
  checkinFace: string;
  role?: string;
  fullName?: string;
  note?: string;
}
interface ClassPageList {
  classId: number;
  className: string;
}
interface SubjectList {
  subjectId: number;
  subjectName: string;
}
interface ClassStudent {
  id: string;
  fullName: string;
  avatar: string;
  email: string;
  phone: string;
  role: string;
}
interface ClassStudentHeadCell {
  disablePadding: boolean;
  id: keyof ClassStudent;
  label: string;
  numeric: boolean;
}
interface HeadCell {
  disablePadding: boolean;
  id: keyof Data;
  label: string;
  numeric: boolean;
}
interface RFIDHeadCell {
  disablePadding: boolean;
  id: keyof RFIDData;
  label: string;
  numeric: boolean;
}
interface NotifyProps {
  id: string;
  message: string;
  sender: string;
  receiver: string;
  sendDate: string;
  role?: string;
}
interface NotifyHeadCell {
  disablePadding: boolean;
  id: keyof NotifyProps;
  label: string;
  numeric: boolean;
}
interface ClassArrangementData {
  id: string;
  username: string;
  className?: string;
  grade?: string;
  avatar: string;
  email: string;
  phone: string;
  name: string;
  action?: string;
  role?: string;
}
interface SystemRole {
  role: "student" | "teacher" | "admin" | "parent" | "supervisor";
}
interface ClassArrangementHeadCellProps {
  disablePadding: boolean;
  id: keyof ClassArrangementData;
  label: string;
  numeric: boolean;
}
interface AttendanceHeadCell {
  disablePadding: boolean;
  id: keyof AttendanceLog;
  label: string;
  numeric: boolean;
}
interface ClassHeadCell {
  disablePadding: boolean;
  id: keyof ClassData;
  label: string;
  numeric: boolean;
}
interface UserHeadCell {
  disablePadding: boolean;
  id: keyof UserData;
  label: string;
  numeric: boolean;
}
interface editClassForm {
  className: string;
  teacherId: string;
  academicYear: string;
  grade: string;
}
interface EditAttendanceFormProps {
  attendanceId: number;
  scheduleId: number;
  userId: string;
  fullName: string;
  face: string | null;
  checkin: string;
  status: AttendanceStatus;
  note: string;
  checkinFace: string;
}
interface AddUserForm {
  fullName: string;
  dob: string;
  gender: string;
  address: string;
  phone: string;
  parentNames: string;
  careers: string;
  parentPhones: string;
  parentGenders: string;
  major: string;
  weeklyCapacity: string;
  role: string;
}
interface ClassID {
  academicYear: string;
  classId: string;
  className: string;
  grade: string;
  isHomeroom: boolean;
}
interface EditUserForm {
  classId: ClassID[];
  firstName: string;
  lastName: string;
  fullName: string;
  dob: string;
  gender?: boolean;
  address: string;
  phone: string;
  parentNames: string[];
  parentCareers: string[];
  parentPhones: string[];
  parentGenders: string[];
  parentEmails: string[];
  major: string;
  weeklyCapacity: string;
  role: string;
  career?: string;
  email?: string;
  avatar?: string;
}
interface EditTeacherForm {
  classId: number[];
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender?: boolean;
  address: string;
  phone: string;
  major: string;
  weeklyCapacity: string;
  role: string;
}

export type {
  ClassID,
  Order,
  Data,
  HeadCell,
  AddUserForm,
  editClassForm,
  UserHeadCell,
  EditUserForm,
  EditTeacherForm,
  ClassHeadCell,
  AttendanceHeadCell,
  AttendanceLog,
  EditAttendanceFormProps,
  AttendanceStatus,
  ClassArrangementHeadCellProps,
  ClassArrangementData,
  NotifyHeadCell,
  NotifyProps,
  SystemRole,
  RFIDHeadCell,
  RFIDData,
  ClassStudent,
  ClassStudentHeadCell,
  ClassPageList,
  SubjectList,
  AttendanceSearchParam,
};
