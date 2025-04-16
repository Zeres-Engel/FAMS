import React, { useEffect, useState } from "react";
import {
  AddUserForm,
  AttendanceLog,
  Data,
  EditAttendanceFormProps,
  editClassForm,
  EditTeacherForm,
  EditUserForm,
  Order,
} from "../../model/tableModels/tableDataModels.model";
import getComparator from "../utils/TableDataUtils/useTableDataUtils";
import { UserData } from "../../model/userModels/userDataModels.model";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../../store/store";
import {
  deleteUser,
  updateStudent,
  updateTeacher,
} from "../../store/slices/userSlice";
import { ClassData } from "../../model/classModels/classModels.model";

interface UseDataTableHookProps {
  tableMainData: Data[] | UserData[] | ClassData[] | AttendanceLog[];
}
function useDataTableHook(props: UseDataTableHookProps) {
  const { tableMainData } = props;
  const editClassDefaul: editClassForm = {
    className: "",
    teacherId: "",
    academicYear:"",
    grade:"10"
  };
  const editAttendanceDefault: EditAttendanceFormProps = {
    attendanceId: 0,
    scheduleId: 0,
    userId: 0,
    fullName: "",
    face: null,
    checkin: "",
    status: "Present",
    note: "",
    checkinFace: "",
  }
  const editUserDefault: EditUserForm = {
    classId: [],
    firstName: "",
    lastName: "",
    dob: "",
    gender: true,
    address: "",
    phone: "",
    parentNames: ["", ""],
    parentCareers: ["", ""],
    parentPhones: ["", ""],
    parentGenders: [false, false],
    major: "",
    weeklyCapacity: "",
    role: "",
  };
  const dispatch = useDispatch<AppDispatch>();
  const rows = React.useMemo(() => [...tableMainData], [tableMainData]);
  const [isCreateUser, setIsCreateUser] = useState<boolean>(false);
  const [order, setOrder] = React.useState<Order>("asc");
  const [orderBy, setOrderBy] = React.useState<keyof Data | keyof UserData | keyof ClassData | keyof AttendanceLog>(
    "id"
  );
  const [selected, setSelected] = React.useState<readonly number[]>([]);
  const [isEditOpen, setIsEditOpen] = React.useState(false);
  const [editingUser, setEditingUser] =
    React.useState<EditUserForm>(editUserDefault);
  const [editingClass, setEditingClass] =
    React.useState<editClassForm>(editClassDefaul);
  const [editingAttendance, setEditingAttendance] =
    React.useState<EditAttendanceFormProps>(editAttendanceDefault);
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(5);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedUserToDelete, setSelectedUserToDelete] = useState<
    Data | UserData | ClassData | null
  >(null);
  const [editingUserId, setEditingUserId] = useState<string | undefined>(
    undefined
  );
  const allUsers = useSelector((state: RootState) => state.users.user);
  const handleRequestSort = (
    event: React.MouseEvent<unknown>,
    property: keyof Data | keyof UserData | keyof ClassData | keyof AttendanceLog
  ) => {
    const isAsc = orderBy === property && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(property);
  };
  function formatUserToEditUserForm(user: any): EditUserForm {
    if (user?.role === "teacher") {
      return {
        classId: user?.classTeacher || [],
        firstName: user?.teacherFirstName || "",
        lastName: user?.teacherLastName || "",
        dob: user.details?.dateOfBirth
          ? new Date(user.details.dateOfBirth).toISOString().split("T")[0] // format yyyy-mm-dd
          : "",
        gender: user.gender === "Male" ? true : false,
        address: user.details?.address || "",
        phone: user?.phoneSub || "",

        parentNames: user.Parent?.map((p: any) => p.fullName) || ["", ""],
        parentCareers: user.Parent?.map((p: any) => p.career) || ["", ""],
        parentPhones: user.Parent?.map((p: any) => p.phone) || ["", ""],
        parentGenders: user.Parent?.map((p: any) => p.gender) || [false, false],

        major: user?.TeacherMajor, // không có dữ liệu trong object gốc, gán rỗng hoặc thêm logic nếu cần
        weeklyCapacity: user?.TeacherWeeklyCapacity, // tương tự
        role: user.role || "",
      };
    }
    return {
      classId: [user?.details?.classId],
      firstName: user.details?.firstName || "",
      lastName: user.details?.lastName || "",
      dob: user.details?.dateOfBirth
        ? new Date(user.details.dateOfBirth).toISOString().split("T")[0] // format yyyy-mm-dd
        : "",
      gender: user.gender === "Male" ? true : false,
      address: user.details?.address || "",
      phone: user.details?.phone || "",

      parentNames: user.Parent?.map((p: any) => p.fullName) || ["", ""],
      parentCareers: user.Parent?.map((p: any) => p.career) || ["", ""],
      parentPhones: user.Parent?.map((p: any) => p.phone) || ["", ""],
      parentGenders: user.Parent?.map((p: any) => p.gender) || [false, false],

      major: "", // không có dữ liệu trong object gốc, gán rỗng hoặc thêm logic nếu cần
      weeklyCapacity: "", // tương tự
      role: user.role || "",
    };
  }
  const formatTeacherObj = (obj: any): EditTeacherForm => {
    return {
      classId: obj.classId.map((id: string) => parseInt(id)), // chuyển classId thành kiểu số
      firstName: obj.firstName,
      lastName: obj.lastName,
      dateOfBirth: obj.dob,
      gender: obj.gender, // có thể bỏ nếu không cần thiết
      address: obj.address,
      phone: obj.phone,
      major: obj.major,
      weeklyCapacity: obj.weeklyCapacity.toString(), // chuyển weeklyCapacity thành chuỗi
      role: obj.role,
    };
  };
  const handleEditClick = (user: EditUserForm, userId?: string) => {
    const userEdit = allUsers?.find(u => u.id === userId);
    // Lọc tại đây nếu cần'
    setEditingUserId(userEdit?.id);
    setEditingUser(formatUserToEditUserForm(userEdit));
    setIsEditOpen(true);
  };
  const handleEditClassClick = (classData: editClassForm) => {
    setEditingClass(classData);
    setIsEditOpen(true);
  };
  const handleEditAttendanceClick = (attendanceStatus: EditAttendanceFormProps) => {
    setEditingAttendance(attendanceStatus);
    setIsEditOpen(true);
  };
  const handleDeleteClick = (user: Data | UserData | ClassData) => {
    console.log("Deleting user:", user.id);
    setSelectedUserToDelete(user);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = (typeDelete: string | undefined) => {
    if (selectedUserToDelete &&  typeDelete === "userDelete") {
      console.log("Deleting user:", selectedUserToDelete.id);
      dispatch(deleteUser(selectedUserToDelete.id));
    }
    if (selectedUserToDelete &&  typeDelete === "classDelete") {
      console.log("Deleting user:", selectedUserToDelete.id);
      // dispatch(deleteUser(selectedUserToDelete.id));
    }
    setIsDeleteDialogOpen(false);
    setSelectedUserToDelete(null);
  };
  const handleEditSave = (userFormData: EditUserForm, idUser: string) => {
    const userEdit = allUsers?.find(u => u.id === idUser);
    if (userFormData?.role === "teacher") {
      const teacherEdit = allUsers?.find(u => u.id === editingUserId);
      dispatch(
        updateTeacher({
          id: teacherEdit?.teacherId || "000",
          data: formatTeacherObj(userFormData),
        })
      );
    } else {
      dispatch(
        updateStudent({
          id: userEdit?.details?.studentId || "000",
          data: userFormData,
        })
      );
    }
    setIsEditOpen(false);
  };
  const handleEditClassSave = (classFormData: editClassForm) => {
    console.log("Saving edited class:", classFormData);
    setIsEditOpen(false);
  };
  const handleEditAttendanceSave = (attendanceData: EditAttendanceFormProps) => {
    console.log("Saving edited Attendance:", attendanceData);
    setIsEditOpen(false);
  };
  const handleSelectAllClick = (event: React.ChangeEvent<HTMLInputElement>) => {
    // if (event.target.checked) {
    //   const newSelected = rows.map(n => n.id);
    //   setSelected(newSelected);
    //   return;
    // }
    // setSelected([]);
  };

  const handleClick = (event: React.MouseEvent<unknown>, id: number) => {
    const selectedIndex = selected.indexOf(id);
    let newSelected: readonly number[] = [];

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selected, id);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selected.slice(1));
    } else if (selectedIndex === selected.length - 1) {
      newSelected = newSelected.concat(selected.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(
        selected.slice(0, selectedIndex),
        selected.slice(selectedIndex + 1)
      );
    }
    setSelected(newSelected);
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const emptyRows =
    page > 0 ? Math.max(0, (1 + page) * rowsPerPage - rows.length) : 0;

  const visibleRows = React.useMemo(
    () =>
      [...rows]
        .sort(getComparator(order, orderBy))
        .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [order, orderBy, page, rowsPerPage, rows]
  );
  const state = {
    emptyRows,
    visibleRows,
    selected,
    order,
    orderBy,
    rows,
    rowsPerPage,
    page,
    isCreateUser,
    isEditOpen,
    editingUser,
    isDeleteDialogOpen,
    selectedUserToDelete,
    editingClass,
    editingAttendance
  };
  const handler = {
    handleRequestSort,
    handleSelectAllClick,
    handleClick,
    handleChangeRowsPerPage,
    handleChangePage,
    setIsCreateUser,
    handleEditClick,
    setIsEditOpen,
    handleEditSave,
    setIsDeleteDialogOpen,
    handleConfirmDelete,
    handleDeleteClick,
    handleEditClassSave,
    handleEditClassClick,
    handleEditAttendanceClick,
    handleEditAttendanceSave
  };

  return { state, handler };
}
export default useDataTableHook;
