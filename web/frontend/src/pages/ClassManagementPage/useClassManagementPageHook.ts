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
  const fetchUsers = async (
    searchTerm = "", 
    role = "", 
    academicYear = "2024-2025", 
    className = "",
    noClass = false,
    noAcademicYear = false
  ) => {
    setIsLoadingUsers(true);
    try {
      // Xác định API endpoint dựa trên role
      if (role === 'student' || role === 'all') {
        // Sử dụng API student-info
        const searchParams = new URLSearchParams();
        
        // Thêm tham số tìm kiếm nếu có
        if (searchTerm) {
          searchParams.append("q", searchTerm);
        }
        
        // Thêm tham số phân trang
        searchParams.append("page", "1");
        searchParams.append("limit", "500"); // Tăng limit để lấy nhiều học sinh hơn
        
        // Thêm tham số năm học nếu có và không phải là noAcademicYear
        if (academicYear && !noAcademicYear) {
          searchParams.append("academicYear", academicYear);
        }
        
        // Thêm tham số lớp học nếu có và không phải là noClass
        if (className && !noClass) {
          searchParams.append("className", className);
        }
        
        // Thêm tham số tìm kiếm học sinh không có lớp
        if (noClass) {
          searchParams.append("noClass", "true");
        }
        
        // Thêm tham số tìm kiếm học sinh không có năm học
        if (noAcademicYear) {
          searchParams.append("noAcademicYear", "true");
        }
        
        const response = await axiosInstance.get(`http://fams.io.vn/api-nodejs/student-info?${searchParams.toString()}`);
        
        if (response.data?.success) {
          // Chuyển đổi dữ liệu học sinh
          const formattedStudents = response.data.data.map((student: any) => ({
            id: student.userId,
            name: student.fullName,
            fullName: student.fullName,
            role: "student",
            gender: student.gender ? "Nam" : "Nữ",
            phone: student.phone || "-",
            email: student.email || "-",
            studentId: student.studentId,
            classIds: student.classIds || [],
            classes: student.classes || [],
            academicYear: student.classes && student.classes.length > 0 
              ? student.classes[0].academicYear 
              : academicYear, // Sử dụng academicYear từ tham số nếu không có trong dữ liệu
            className: student.classes && student.classes.length > 0
              ? student.classes[0].className
              : "",
            avatar: student.user?.avatar || null,
            dateOfBirth: student.dateOfBirth
          }));
          
          setUsers(formattedStudents);
        } else {
          console.error("Failed to fetch students:", response.data);
          setUsers([]);
        }
      } else {
        // Tìm kiếm giáo viên hoặc các vai trò khác (giữ nguyên code cũ)
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
      // Chuẩn bị dữ liệu lớp học
      const classData = {
        className: classInfo.className,
        grade: classInfo.grade,
        homeroomTeacherId: classInfo.homeroomTeacherId,
        academicYear: classInfo.academicYear
      };
      
      // Lấy danh sách studentIds và teacherIds
      const students = selectedUsers.filter(user => user.role === "student");
      const teachers = selectedUsers.filter(user => user.role === "teacher");
      
      const studentIds = students.map(student => student.id);
      const teacherIds = teachers.map(teacher => teacher.id);
      
      // Tạo lớp và thêm học sinh/giáo viên cùng lúc nếu có người dùng được chọn
      if (studentIds.length > 0 || teacherIds.length > 0) {
        // Sử dụng API mới tạo lớp kèm danh sách học sinh và giáo viên
        const response = await axiosInstance.post(`http://fams.io.vn/api-nodejs/classes/with-students`, {
          ...classData,
          studentIds,
          teacherIds
        });
        
        if (response.data?.success) {
          // Làm mới danh sách lớp học
          dispatch(fetchClasses());
          
          return { 
            success: true, 
            message: response.data.message || "Class created successfully with users" 
          };
        } else {
          return { 
            success: false, 
            message: response.data?.error || "Failed to create class with users" 
          };
        }
      } else {
        // Không có người dùng được chọn, chỉ tạo lớp mới
        const result = await dispatch(createClass(classData)).unwrap();
        
        if (result && result.classId) {
          // Làm mới danh sách lớp học
          dispatch(fetchClasses());
          
          return { success: true, message: "Class created successfully" };
        } else {
          return { success: false, message: "Failed to create class" };
        }
      }
    } catch (error: any) {
      console.error("Error creating class:", error);
      return { 
        success: false, 
        message: error.response?.data?.message || error.message || "Error creating class" 
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
