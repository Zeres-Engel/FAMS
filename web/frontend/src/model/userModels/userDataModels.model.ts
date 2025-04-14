interface UserData {
  id: string;
  username: string;
  email: string;
  backup_email: string;
  name: string;
  role: string;
  updatedAt: string;
  createdAt: string;
  gender?: Gender;
  details?: UserDataDetails;
  Parent?: Parent[];
  phoneSub?: string;
  classSubId?: number;
  classTeacher?: string[];
  gradeSub?: string;
  teacherId?:string;
  teacherFirstName?: string;
  teacherLastName?: string;
  TeacherMajor?:string;
  TeacherWeeklyCapacity?:number;
}
interface UserDataDetails {
  studentId: string;
  firstName: string;
  lastName: string;
  fullName: string;
  phone: string;
  dateOfBirth: string;
  address: string;
  classId: number;
  batchId: number;
  className: string;
  grade: string;
}
interface Parent {
  parentId: string;
  firstName: string;
  lastName: string;
  fullName: string;
  phone: string;
  gender: boolean;
  career: string;
  email: string;
  backup_email: string | null;
}
interface SearchFilters {
  search?: string;
  grade?: string;
  roles?: string[];
  className?: string;
  limit?: number;
  phone?: string;
}
type Gender = "Male" | "Female";
type Role = "student" | "teacher";

interface CreateUserPayload {
  role: Role;
  firstName: string;
  lastName: string;
  backup_email: string;
  phone: string;
  gender: Gender;
  dateOfBirth: string; // ISO string format: "YYYY-MM-DD"
  address: string;
  batchYear: string; // e.g., "2025-2028"
  parentNames: string[];
  parentCareers: string[];
  parentPhones: string[];
  parentGenders: boolean[]; // true: Male, false: Female
  major: string;
  weeklyCapacity: number; // as number, not string
}
export interface UpdateTeacherForm {
  firstName: string;
  lastName: string;
  phone: string;
  address: string;
  major: string;
  weeklyCapacity: number;
  backup_email?: string; // optional
}

interface AddUserFormValues {
  firstName: string;
  lastName: string;
  backup_email: string;
  phone: string;
  gender: "Male" | "Female" | "";
  dateOfBirth: string;
  address: string;
  batchYear: string;
  parentNames: string[];
  parentPhones: string[];
  parentCareers: string[];
  parentGenders: boolean[];
  major: string;
  weeklyCapacity: string;
  role: Role;
}
interface EditUserFormValues {
  firstName: string;
  lastName: string;
  backup_email: string;
  phone: string;
  gender: "Male" | "Female" | "";
  dateOfBirth: string;
  address: string;
  batchYear: string;
  parentNames: string[];
  parentPhones: string[];
  parentCareers: string[];
  parentGenders: boolean[];
  major: string;
  weeklyCapacity: string;
  role: Role;
}
export type {
  Gender,
  Parent,
  UserData,
  SearchFilters,
  CreateUserPayload,
  EditUserFormValues,
  AddUserFormValues,
  Role,
};
