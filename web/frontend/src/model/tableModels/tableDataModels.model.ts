import { UserData } from "../userModels/userDataModels.model";

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
interface HeadCell {
  disablePadding: boolean;
  id: keyof Data;
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
  batch: string;
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
  dob: string;
  gender?: boolean;
  address: string;
  phone: string;
  parentNames: string[];
  parentCareers: string[];
  parentPhones: string[];
  parentGenders: boolean[];
  major: string;
  weeklyCapacity: string;
  role: string;
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
};
