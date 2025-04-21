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
type AttendanceStatus = "Present" | "Late" | "Absent";
interface AttendanceLog {
  id: string;
  attendanceId: number;
  scheduleId: number;
  userId: number;
  face: string | null; // Base64 hoặc binary encoded string
  checkin: string | null; // ISO datetime string (e.g. "2025-04-16T07:05:00")
  status: AttendanceStatus;
  checkinFace:string;
  role?: string;
  fullName?: string;
  note?: string;
}
interface HeadCell {
  disablePadding: boolean;
  id: keyof Data;
  label: string;
  numeric: boolean;
}
interface NotifyProps {
  id: string;
  message: string;
  sender: string;
  receiver: string;
  sendDate:string;
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
interface SystemRole{
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
  userId: number;
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
interface EditUserForm {
  classId: string[];
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
  career?: string; // <-- add this
  email?: string;  // <-- and this
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
};
