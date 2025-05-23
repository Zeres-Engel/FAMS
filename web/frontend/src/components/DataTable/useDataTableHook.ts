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
import { fetchUserPaginated } from "../../store/slices/userSlice";
import { deleteClass, editClass, fetchClasses } from "../../store/slices/classSlice";
import { editAttendance } from "../../store/slices/attendanceSlice";

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

const useDataTableHook = ({ tableMainData }: UseDataTableHookProps) => {
  const dispatch = useDispatch<AppDispatch>();
  const [order, setOrder] = useState<Order>("asc");
  const [orderBy, setOrderBy] = useState<
    | keyof Data
    | keyof UserData
    | keyof ClassData
    | keyof AttendanceLog
    | keyof ClassArrangementData
    | keyof NotifyProps
    | keyof RFIDData
  >("id");
  const [selected, setSelected] = useState<readonly string[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [rows, setRows] = useState<typeof tableMainData>([]);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<EditUserForm | null>(null);
  const [editingUserId, setEditingUserId] = useState<string | undefined>(undefined);
  const [selectedUserToDelete, setSelectedUserToDelete] = useState<Data | UserData | ClassData | null>(null);
  const [isCreateUser, setIsCreateUser] = useState(false);
  const [selectedGrade, setSelectedGrade] = useState<string>("");
  const [gradeError, setGradeError] = useState(false);
  const [isShowNotifyOpen, setIsShowNotifyOpen] = useState(false);
  const [selectedNotify, setSelectedNotify] = useState<NotifyProps | null>(null);
  const [editingClass, setEditingClass] = useState<editClassForm | null>(null);
  const [editingClassID, setEditingClassID] = useState<string>('');
  const [editingAttendance, setEditingAttendance] = useState<EditAttendanceFormProps | null>(null);
  const [selectedClassToView, setSelectedClassToView] = useState<ClassData | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [classStudents, setClassStudents] = useState<any[]>([]);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);

  // Cập nhật rows khi tableMainData thay đổi
  useEffect(() => {
    if (tableMainData && tableMainData.length > 0) {
      setRows(tableMainData);
    }else{
      setRows([])
    }
  }, [tableMainData]);

  const editClassDefaul: editClassForm = {
    className: "",
    teacherId: "",
    academicYear: "",
    grade: "10",
  };
  
  const editAttendanceDefault: EditAttendanceFormProps = {
    attendanceId: 0,
    scheduleId: 0,
    userId: '',
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
    setOrderBy(property as keyof Data | keyof UserData | keyof ClassData | keyof AttendanceLog | keyof ClassArrangementData | keyof NotifyProps | keyof RFIDData);
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
    
    // Xử lý thông tin classId - đảm bảo là mảng số hoặc object có classId
    let classIds = [];

    // Kiểm tra nếu user.details.classes tồn tại và là mảng
    if (user?.details?.classes && Array.isArray(user.details.classes)) {
      classIds = user.details.classes.map((cls: any) => {
        // Nếu đã là object có classId, sử dụng trực tiếp
        if (typeof cls === 'object' && cls !== null && 'classId' in cls) {
          return cls;
        }
        // Nếu là số, chuyển thành object
        if (typeof cls === 'number') {
          return { classId: cls };
        }
        // Nếu là string và có thể chuyển thành số
        if (typeof cls === 'string' && !isNaN(parseInt(cls))) {
          return { classId: parseInt(cls) };
        }
        // Giữ nguyên nếu không phù hợp cấu trúc nào
        return cls;
      });
    }

    return {
      avatar: user?.avatar || null,
      classId: classIds,
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
    console.log("Editing userID:", userId);
    console.log("Editing user:", userEdit);

    console.log(formatUserToEditUserForm(userEdit));
    setEditingUserId(userEdit?.id || "");
    setEditingUser(formatUserToEditUserForm(userEdit));
    setIsEditOpen(true);
  };
  const handleEditClassClick = (classData: editClassForm, editID: string) => {
    setEditingClass(classData);
    setIsEditOpen(true);
    // Chuyển đổi để sử dụng classId thay vì _id cho API
    // Sử dụng type assertion để tránh lỗi TypeScript với union type
    const typedRows = rows as Array<{id?: string, _id?: string, classId?: number | string}>;
    const row = typedRows.find(r => r.id === editID || r._id === editID);
    console.log("Found class row:", row);
    // Đảm bảo luôn sử dụng classId để gọi API
    setEditingClassID(row?.classId?.toString() || row?.id?.toString() || editID);
  };
  const handleEditAttendanceClick = (
    attendanceStatus: EditAttendanceFormProps
  ) => {
    setEditingAttendance(attendanceStatus);
    setIsEditOpen(true);
  };
  const handleDeleteClick = (user: Data | UserData | ClassData) => {
    console.log("Deleting user:", user.id);
    setSelectedUserToDelete(user as UserData);
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
      // Sử dụng classId thay vì id để xóa lớp
      const classIdToDelete = (selectedUserToDelete as ClassData).classId || selectedUserToDelete.id;
      console.log("Deleting Class with classId:", classIdToDelete);
      
      // Dispatch action xóa lớp và đợi kết quả
      dispatch(deleteClass(String(classIdToDelete)))
        .then(() => {
          console.log("Class deleted successfully, refreshing data...");
          // Gọi lại fetchClasses để đảm bảo dữ liệu được cập nhật
          dispatch(fetchClasses());
        })
        .catch((error) => {
          console.error("Error deleting class:", error);
        });
    }
    setIsDeleteDialogOpen(false);
    setSelectedUserToDelete(null);
  };
  const handleEditSave = (userFormData: EditUserForm, idUser: string) => {
    const userEdit = allUsers?.find(u => u.id === idUser);
    console.log("Đang cập nhật user với dữ liệu:", JSON.stringify(userFormData, null, 2));
    console.log("User tìm thấy từ allUsers:", JSON.stringify(userEdit, null, 2));
    
    let updatePromise;
    
    if (userFormData?.role === "teacher") {
      const teacherEdit = allUsers?.find(u => u.id === editingUserId);
      console.log("Teacher Edit ID:", editingUserId);
      console.log("Teacher tìm thấy:", JSON.stringify(teacherEdit, null, 2));
      const formattedData = formatTeacherObj(userFormData);
      console.log("Dữ liệu teacher được format:", JSON.stringify(formattedData, null, 2));
      
      updatePromise = dispatch(
        updateTeacher({
          id: userEdit?.id || teacherEdit?.id || (editingUserId || ""),
          data: formattedData,
        })
      );
    } else {
      console.log("Student ID:", userEdit?.id || idUser);
      console.log("Student data gửi đi:", JSON.stringify(userFormData, null, 2));
      
      updatePromise = dispatch(
        updateStudent({
          id: userEdit?.id || idUser,
          data: userFormData,
        })
      );
    }
    
    // Handle after update
    updatePromise.then((result) => {
      console.log("Kết quả cập nhật:", result);
      
      // Refresh data table while staying on the same page
      // Get the current filters from component state if available
      const currentPage = page + 1; // React MUI uses 0-based indexing for pages
      
      // Dispatch action to fetch users with current pagination
      dispatch(fetchUserPaginated({
        page: currentPage,
        limit: rowsPerPage,
        search: "",
        grade: "",
        roles: [],
        className: "",
        academicYear: "",
        phone: ""
      }));
    }).catch((error) => {
      console.error("Lỗi khi cập nhật:", error);
    });
    
    setIsEditOpen(false);
  };
  const handleEditClassSave = (classFormData: editClassForm) => {
    const payload = {
      className: classFormData.className,
      homeroomTeacherId: classFormData.teacherId,
      grade: classFormData.grade,
      academicYear: classFormData.academicYear,
    };
    
    // Log ra để debug
    console.log("[handleEditClassSave] Dữ liệu form:", classFormData);
    console.log("[handleEditClassSave] Payload gửi API:", payload);
    console.log("[handleEditClassSave] Class ID được sử dụng:", editingClassID);
    console.log("[handleEditClassSave] Kiểu của classId:", typeof editingClassID);
    
    // Đảm bảo gửi classId chứ không phải _id và theo dõi kết quả sau khi hoàn thành
    const updatePromise = dispatch(editClass({ id: editingClassID, ...payload }));
    
    // Đợi cập nhật hoàn tất trước khi đóng form
    updatePromise.then(() => {
      console.log("[handleEditClassSave] Cập nhật thành công, đang làm mới dữ liệu");
      // Gọi lại fetchClasses để đảm bảo dữ liệu được cập nhật
      dispatch(fetchClasses());
      
      // Kích hoạt sự kiện custom để thông báo việc cập nhật dữ liệu
      window.dispatchEvent(new Event('class-updated'));
    }).catch((error) => {
      console.error("[handleEditClassSave] Lỗi khi cập nhật:", error);
    });
    
    setIsEditOpen(false);
  };
  const handleEditAttendanceSave = (
    attendanceData: EditAttendanceFormProps
  ) => {
    dispatch(
      editAttendance({
        userId: attendanceData.userId,
        scheduleId: attendanceData.scheduleId,
        status: attendanceData.status,
        note:attendanceData.note,
        checkInFace: attendanceData.checkinFace,
      }))
    console.log("Saving edited Attendance:", attendanceData);
    setIsEditOpen(false);
  };
  const handleSelectAllClick = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      const newSelected = rows.map((n) => String(n.id || ""));
      setSelected(newSelected);
      return;
    }
    setSelected([]);
  };

  const handleClick = (
    event: React.MouseEvent<unknown>,
    id: string
  ) => {
    const selectedIndex = selected.indexOf(id);
    let newSelected: string[] = [];

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
  const handleSubmitClassArrangement = (isClassArrangement: boolean) => {
    if (isClassArrangement && selected.length > 0 && !selectedGrade) {
      setGradeError(true);
      return;
    }

    console.log("Submitting with grade:", selectedGrade);
    console.log("Submitting with data:", selected);
    setGradeError(false);
  };
  const handleSubmitNewSemesterArrangement = (isNewSemester: boolean) => {
    if (isNewSemester && selected.length > 0) {
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

  const handleViewClick = async (classData: ClassData) => {
    setSelectedClassToView(classData);
    setIsViewDialogOpen(true);
    setIsLoadingStudents(true);
    
    try {
      // Gọi API để lấy danh sách học sinh của lớp
      const response = await fetch(`http://fams.io.vn/api/classes/${classData.classId}/students`);
      const data = await response.json();
      
      if (data.success) {
        setClassStudents(data.data);
      } else {
        console.error("Failed to fetch students:", data);
        setClassStudents([]);
      }
    } catch (error) {
      console.error("Error fetching students:", error);
      setClassStudents([]);
    } finally {
      setIsLoadingStudents(false);
    }
  };

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
    selectedClassToView,
    isViewDialogOpen,
    classStudents,
    isLoadingStudents
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
    handleViewClick,
    setIsViewDialogOpen
  };

  return { state, handler };
};

export default useDataTableHook;
