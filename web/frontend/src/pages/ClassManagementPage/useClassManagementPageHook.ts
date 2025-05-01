import { useEffect, useState } from "react";
import { useAppSelector } from "../../store/useStoreHook";
import {
  ClassHeadCell,
} from "../../model/tableModels/tableDataModels.model";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../../store/store";
import {
  fetchClasses,
  searchClasses,
  createClass
} from "../../store/slices/classSlice";
import { searchUsers } from "../../store/slices/userSlice";
import {
  ClassData,
  SearchClassFilters,
} from "../../model/classModels/classModels.model";
import axiosInstance from "../../services/axiosInstance";

function useClassManagementPageHook() {
  const [filters, setFiltersClass] = useState<SearchClassFilters>({
    search: "",
    grade: "",
    homeroomTeacherd: "",
    academicYear: "",
  });
  const dispatch = useDispatch<AppDispatch>();
  const classState = useAppSelector(state => state.class);
  const [classMainData, setClassMainData] = useState<ClassData[]>([]);
  const classes = useSelector((state: RootState) => state.class.allClasses);
  const classOptions = classes?.map(c => c.className) || [];
  const classYears =
    classes?.map(c => {
      return { className: c.className, academicYear: c.academicYear };
    }) || [];
  
  // State để quản lý người dùng
  const [users, setUsers] = useState<any[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState<boolean>(false);

  useEffect(() => {
    if (!classes) {
      dispatch(fetchClasses());
    }
  }, [dispatch, classes]);
  
  useEffect(() => {
    if (!classState.classes) {
      dispatch(fetchClasses());
    } else {
      setClassMainData(classState?.classes);
    }
  }, [dispatch, classState.classes]);
  
  useEffect(() => {
    if (filters) {
      dispatch(searchClasses(filters));
    } else {
      dispatch(fetchClasses());
    }
  }, [filters, dispatch]);

  // Lấy danh sách người dùng từ API
  const fetchUsers = async (searchTerm = "", role = "") => {
    setIsLoadingUsers(true);
    try {
      // Tạo tham số tìm kiếm
      const searchParams = new URLSearchParams();
      if (searchTerm) searchParams.append("search", searchTerm);
      if (role && role !== "all") searchParams.append("roles", role);
      
      // Gọi API để lấy danh sách người dùng
      const response = await axiosInstance.get(`/users?${searchParams.toString()}`);
      
      if (response.data?.success) {
        // Chuyển đổi dữ liệu để phù hợp với cấu trúc cần thiết
        const formattedUsers = response.data.data.map((user: any) => ({
          id: user.userId || user._id,
          name: user.fullName || `${user.firstName} ${user.lastName}`,
          role: user.role,
          gender: user.gender,
          phone: user.phone || "-",
          email: user.email || "-"
        }));
        
        setUsers(formattedUsers);
      } else {
        console.error("Failed to fetch users:", response.data);
        setUsers([]);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      setUsers([]);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  // Tạo lớp mới
  const handleCreateClass = async (classInfo: any, selectedUsers: any[]) => {
    try {
      // 1. Tạo lớp học mới
      const classData = {
        className: classInfo.className,
        grade: classInfo.grade,
        homeroomTeacherId: classInfo.homeroomTeacherId,
        academicYear: classInfo.academicYear
      };
      
      const result = await dispatch(createClass(classData)).unwrap();
      
      if (result && result.classId) {
        // 2. Nếu tạo lớp thành công và có người dùng được chọn, thêm họ vào lớp
        if (selectedUsers.length > 0) {
          const classId = result.classId;
          
          // Tách danh sách học sinh và giáo viên
          const students = selectedUsers.filter(user => user.role === "student");
          const teachers = selectedUsers.filter(user => user.role === "teacher");
          
          // Thêm học sinh vào lớp (nếu có)
          if (students.length > 0) {
            const studentIds = students.map(student => student.id);
            await axiosInstance.post(`/classes/${classId}/students`, {
              studentIds: studentIds
            });
          }
          
          // Thêm giáo viên vào lớp (nếu có)
          if (teachers.length > 0) {
            const teacherIds = teachers.map(teacher => teacher.id);
            await axiosInstance.post(`/classes/${classId}/teachers`, {
              teacherIds: teacherIds
            });
          }
        }
        
        // 3. Làm mới danh sách lớp học
        dispatch(fetchClasses());
        
        return { success: true, message: "Class created successfully" };
      } else {
        return { success: false, message: "Failed to create class" };
      }
    } catch (error: any) {
      console.error("Error creating class:", error);
      return { 
        success: false, 
        message: error.response?.data?.message || "Error creating class" 
      };
    }
  };
  
  const headCellsData: ClassHeadCell[] = [
    {
      id: "id",
      numeric: false,
      disablePadding: true,
      label: "ID",
    },
    {
      id: "className",
      numeric: false,
      disablePadding: true,
      label: "Class name",
    },
    {
      id: "grade",
      numeric: false,
      disablePadding: false,
      label: "Grade",
    },
    {
      id: "homeroomTeacherd",
      numeric: false,
      disablePadding: false,
      label: "Teacher Id",
    },
    {
      id: "studentNumber",
      numeric: false,
      disablePadding: false,
      label: "Student Number",
    },
    {
      id: "academicYear",
      numeric: false,
      disablePadding: false,
      label: "Academic Year",
    },
    {
      id: "createdAt",
      numeric: false,
      disablePadding: false,
      label: "Created At",
    },
  ];

  const isCheckBox = false;
  const tableTitle = "Class Data";

  const state = {
    headCellsData,
    classMainData,
    tableTitle,
    isCheckBox,
    classOptions,
    classYears,
    users,
    isLoadingUsers
  };
  
  const handler = { 
    setFiltersClass,
    fetchUsers,
    handleCreateClass
  };

  return { state, handler };
}

export default useClassManagementPageHook;
