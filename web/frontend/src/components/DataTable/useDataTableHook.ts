import React, { useEffect, useState } from "react";
import {
  AddUserForm,
  AttendanceLog,
  ClassArrangementData,
  ClassStudent,
  Data,
  EditAttendanceFormProps,
  editClassForm,
  EditTeacherForm,
  EditUserForm,
  NotifyProps,
  Order,
  RFIDData,
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
import { deleteClass, editClass } from "../../store/slices/classSlice";

interface UseDataTableHookProps {
  tableMainData:
    | Data[]
    | UserData[]
    | ClassData[]
    | AttendanceLog[]
    | ClassArrangementData[]
    | NotifyProps[]
    | RFIDData[]
    | ClassStudent[];
}
function useDataTableHook(props: UseDataTableHookProps) {
  const { tableMainData } = props;
  const editClassDefaul: editClassForm = {
    className: "",
    teacherId: "",
    academicYear: "",
    grade: "10",
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
  };
  const editUserDefault: EditUserForm = {
    classId: [],
    firstName: "",
    lastName: "",
    fullName: "",
    dob: "",
    gender: true,
    address: "",
    phone: "",
    parentNames: ["", ""],
    parentCareers: ["", ""],
    parentPhones: ["", ""],
    parentGenders: ["Male", "Female"],
    parentEmails: ["", ""],
    major: "",
    weeklyCapacity: "",
    role: "",
  };
  const dispatch = useDispatch<AppDispatch>();
  const rows = React.useMemo(() => [...tableMainData], [tableMainData]);
  const [isCreateUser, setIsCreateUser] = useState<boolean>(false);
  const [order, setOrder] = React.useState<Order>("asc");
  const [orderBy, setOrderBy] = React.useState<
    | keyof Data
    | keyof UserData
    | keyof ClassData
    | keyof AttendanceLog
    | keyof ClassArrangementData
    | keyof NotifyProps
    | keyof RFIDData
    | keyof ClassStudent
  >("id");
  const [gradeError, setGradeError] = React.useState(false);
  const [selected, setSelected] = React.useState<readonly string[]>([]);
  const [selectedGrade, setSelectedGrade] = React.useState<string>("");
  const [isEditOpen, setIsEditOpen] = React.useState(false);
  const [editingUser, setEditingUser] =
    React.useState<EditUserForm>(editUserDefault);
  const [editingClass, setEditingClass] =
    React.useState<editClassForm>(editClassDefaul);
  const [editingClassID, setEditingClassID] = React.useState<string>("");
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
  const [isShowNotifyOpen, setIsShowNotifyOpen] = useState(false);
  const [selectedNotify, setSelectedNotify] = useState<NotifyProps | null>(
    null
  );

  const allUsers = useSelector((state: RootState) => state.users.user);
  const handleRequestSort = (
    event: React.MouseEvent<unknown>,
    property:
      | keyof Data
      | keyof UserData
      | keyof ClassData
      | keyof AttendanceLog
      | keyof ClassArrangementData
      | keyof NotifyProps
      | keyof RFIDData
      | keyof ClassStudent
  ) => {
    const isAsc = orderBy === property && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(property);
  };
  function formatUserToEditUserForm(user: any): EditUserForm {
    if (user?.role === "teacher") {
      return {
        avatar: user?.avatar || null,
        classId: user?.classTeacher || [],
        firstName: user?.teacherFirstName || "",
        lastName: user?.teacherLastName || "",
        fullName: user?.name || "",
        dob: user?.TeacherDOB
          ? new Date(user?.TeacherDOB).toISOString().split("T")[0] // format yyyy-mm-dd
          : "",
        gender: user.gender === "Male" ? true : false,
        address: user.TeacherAddress || "",
        phone: user?.phoneSub || "",

        parentNames: user.Parent?.map((p: any) => p.fullName) || ["", ""],
        parentCareers: user.Parent?.map((p: any) => p.career) || ["", ""],
        parentPhones: user.Parent?.map((p: any) => p.phone) || ["", ""],
        parentEmails: user.Parent?.map((p: any) => p.email) || ["", ""],
        parentGenders: user.Parent?.map((p: any) => p.gender) || [false, false],

        major: user?.TeacherMajor, // không có dữ liệu trong object gốc, gán rỗng hoặc thêm logic nếu cần
        weeklyCapacity: user?.TeacherWeeklyCapacity, // tương tự
        role: user.role || "",
      };
    }
    return {
      avatar: user?.avatar || null,
      classId: user?.role === "student" ? user?.details.classes : [],
      firstName: user.details?.firstName || "",
      lastName: user.details?.lastName || "",
      fullName: user.name || "",
      dob: user.details?.dateOfBirth
        ? new Date(user.details.dateOfBirth).toISOString().split("T")[0] // format yyyy-mm-dd
        : "",
      gender: user.gender === "Male" ? true : false,
      address: user.details?.address || "",
      phone: user.details?.phone || user.phoneSub,
      career: user.parentCareer || "",
      email: user.parentEmail || "",
      parentNames: user.Parent?.map((p: any) => p.fullName) || ["", ""],
      parentCareers: user.Parent?.map((p: any) => p.career) || ["", ""],
      parentPhones: user.Parent?.map((p: any) => p.phone) || ["", ""],
      parentEmails: user.Parent?.map((p: any) => p.email) || ["", ""],
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
  const handlerClassDistribution = () => {};
  const handleEditClick = (user: EditUserForm, userId?: string) => {
    const userEdit = allUsers?.find(u => u.id === userId);
    // Lọc tại đây nếu cần'
    console.log("Editing user:", userEdit);

    console.log(formatUserToEditUserForm(userEdit));
    setEditingUserId(userEdit?.id);
    setEditingUser(formatUserToEditUserForm(userEdit));
    setIsEditOpen(true);
  };
  const handleEditClassClick = (classData: editClassForm, editID: string) => {
    setEditingClass(classData);
    setIsEditOpen(true);
    setEditingClassID(editID);
  };
  const handleEditAttendanceClick = (
    attendanceStatus: EditAttendanceFormProps
  ) => {
    setEditingAttendance(attendanceStatus);
    setIsEditOpen(true);
  };
  const handleDeleteClick = (user: Data | UserData | ClassData) => {
    console.log("Deleting user:", user.id);
    setSelectedUserToDelete(user);
    setIsDeleteDialogOpen(true);
  };
  const handleShowNotify = (row: any) => {
    setSelectedNotify({
      id: row.id,
      sender: row.sender,
      receiver: row.receiver || "",
      message: row.message,
      sendDate: row.sendDate,
    });
    setIsShowNotifyOpen(true);
  };
  const handleConfirmDelete = (typeDelete: string | undefined) => {
    if (selectedUserToDelete && typeDelete === "userDelete") {
      console.log("Deleting user:", selectedUserToDelete.id);
      dispatch(deleteUser(selectedUserToDelete.id));
    }
    if (selectedUserToDelete && typeDelete === "classDelete") {
      console.log("Deleting Class:", selectedUserToDelete.id);
      dispatch(deleteClass(String(selectedUserToDelete.id)));
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
    const payload = {
      className: classFormData.className,
      homeroomTeacherId: classFormData.teacherId,
      grade: classFormData.grade,
      academicYear: classFormData.academicYear,
    };
    console.log("Saving edited class:", classFormData);
    console.log("Saving edited class ID:", editingClassID);
    dispatch(editClass({ id: editingClassID, ...payload }));
    setIsEditOpen(false);
  };
  const handleEditAttendanceSave = (
    attendanceData: EditAttendanceFormProps
  ) => {
    console.log("Saving edited Attendance:", attendanceData);
    setIsEditOpen(false);
  };
  const handleSelectAllClick = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      const newSelected = rows.map(n => String(n.id));
      setSelected(newSelected);
      return;
    }
    setSelected([]);
  };

  const handleClick = (event: React.MouseEvent<unknown>, id: string) => {
    const idStr = String(id);
    const selectedIndex = selected.indexOf(idStr);
    let newSelected: readonly string[] = [];

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selected, idStr);
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
  const handleSubmitClassArrangement = (isClassArrangement: boolean) => {
    if (isClassArrangement && state.selected.length > 0 && !selectedGrade) {
      setGradeError(true);
      return;
    }

    console.log("Submitting with grade:", selectedGrade);
    console.log("Submitting with data:", selected);
    setGradeError(false);
  };
  const handleSubmitNewSemesterArrangement = (isNewSemester: boolean) => {
    if (isNewSemester && state.selected.length > 0) {
      console.log("Submitting New Semester with data:", selected);
      return;
    }
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
    editingAttendance,
    selectedGrade,
    gradeError,
    isShowNotifyOpen,
    selectedNotify,
    editingUserId,
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
    handleEditAttendanceSave,
    setSelectedGrade,
    handleSubmitClassArrangement,
    handleSubmitNewSemesterArrangement,
    handlerClassDistribution,
    handleShowNotify,
    setIsShowNotifyOpen,
  };

  return { state, handler };
}
export default useDataTableHook;
