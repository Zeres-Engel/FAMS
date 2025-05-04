import { useEffect, useState } from "react";
import axios from "../../services/axiosInstance";
import {
  ClassHeadCell,
} from "../../model/tableModels/tableDataModels.model";

// Định nghĩa kiểu dữ liệu
interface ClassData {
  _id: string;
  className: string;
  grade: number;
  homeroomTeacherId: string;
  academicYear: string;
  createdAt: string;
  isActive: boolean;
  classId: number;
  id: string;
  studentNumber: number;
}

interface SearchClassFilters {
  search?: string;
  academicYear?: string;
  preserveAcademicYears?: boolean;
  grade?: string;
  homeroomTeacherId?: string;
}

function useClassManagementPageHook() {
  const [classMainData, setClassMainData] = useState<ClassData[]>([]);
  const [filters, setFiltersClass] = useState<SearchClassFilters>({
    search: "",
    academicYear: "",
    preserveAcademicYears: true
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [academicYear, setAcademicYear] = useState<string>("");
  const [academicYearOptions, setAcademicYearOptions] = useState<string[]>([]);
  const [classOptions, setClassOptions] = useState<string[]>([]);
  
  // State để quản lý người dùng
  const [users, setUsers] = useState<any[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState<boolean>(false);
  
  // Lấy danh sách tất cả các lớp khi component được mount
  useEffect(() => {
    fetchClasses();
  }, []);
  
  // Gọi API khi academicYear hoặc filters thay đổi
  useEffect(() => {
    fetchClasses();
  }, [academicYear, filters]);
  
  // Hàm gọi API để lấy danh sách lớp
  const fetchClasses = async () => {
    setIsLoading(true);
    try {
      // Tạo URL với các tham số filter
      const params = new URLSearchParams();
      
      // Thêm tham số năm học nếu có
      if (filters.academicYear) {
        params.append("academicYear", filters.academicYear);
      }
      
      // Thêm tham số tìm kiếm nếu có
      if (filters.search) {
        params.append("search", filters.search);
      }
      
      // Thêm tham số grade nếu có
      if (filters.grade) {
        params.append("grade", filters.grade);
      }
      
      // Thêm tham số homeroomTeacherId nếu có
      if (filters.homeroomTeacherId) {
        params.append("homeroomTeacherId", filters.homeroomTeacherId);
      }
      
      const url = `http://fams.io.vn/api-nodejs/classes?${params.toString()}`;
      console.log("Fetching classes with URL:", url);
      
      const response = await axios.get(url);
      
      if (response.data?.success) {
        const classes = response.data.data;
        setClassMainData(classes);
        
        // Lấy danh sách các tên lớp cho dropdown
        const classNames = classes.map((cls: ClassData) => cls.className);
        setClassOptions(Array.from(new Set(classNames)));
        
        // Lấy danh sách các năm học từ dữ liệu API
        const years = classes.map((cls: ClassData) => cls.academicYear);
        const uniqueYears = Array.from(new Set(years)).sort() as string[];
        
        // Nếu academicYearOptions rỗng hoặc chưa được khởi tạo, hãy cập nhật nó
        if (academicYearOptions.length === 0) {
          console.log("Initializing academicYearOptions");
          
          // Tạo danh sách năm học từ API hoặc từ năm hiện tại
          if (uniqueYears.length > 0) {
            // Nếu API trả về năm học, sử dụng danh sách đó
            console.log("Setting academicYearOptions from API data:", uniqueYears);
            setAcademicYearOptions(uniqueYears);
          } else {
            // Nếu không có dữ liệu năm học từ API, tạo danh sách từ năm hiện tại
            const currentYear = new Date().getFullYear();
            const options = [];
            for (let i = -3; i <= 1; i++) {
              const startYear = currentYear + i;
              const endYear = startYear + 1;
              options.push(`${startYear}-${endYear}`);
            }
            console.log("Setting academicYearOptions from generated data:", options);
            setAcademicYearOptions(options);
          }
        } else {
          // Nếu có danh sách năm học rồi, kiểm tra xem có năm học mới nào không có trong danh sách hiện tại
          const currentOptions = new Set(academicYearOptions);
          let hasNewYears = false;
          
          uniqueYears.forEach(year => {
            if (!currentOptions.has(year)) {
              hasNewYears = true;
              currentOptions.add(year);
            }
          });
          
          // Cập nhật danh sách nếu có năm học mới
          if (hasNewYears) {
            const newOptions = Array.from(currentOptions).sort();
            console.log("Updating academicYearOptions with new years:", newOptions);
            setAcademicYearOptions(newOptions);
          }
        }
      } else {
        console.error("Failed to fetch classes:", response.data);
        setClassMainData([]);
        setClassOptions([]);
      }
    } catch (error) {
      console.error("Error fetching classes:", error);
      setClassMainData([]);
      setClassOptions([]);
    } finally {
      setIsLoading(false);
    }
  };
  
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
        
        const response = await axios.get(`http://fams.io.vn/api-nodejs/student-info?${searchParams.toString()}`);
        
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
        // Tìm kiếm giáo viên hoặc các vai trò khác
        const searchParams = new URLSearchParams();
        if (searchTerm) searchParams.append("search", searchTerm);
        if (role && role !== "all") searchParams.append("roles", role);
        
        // Gọi API để lấy danh sách người dùng
        const response = await axios.get(`/users?${searchParams.toString()}`);
        
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
        const response = await axios.post(`http://fams.io.vn/api-nodejs/classes/with-students`, {
          ...classData,
          studentIds,
          teacherIds
        });
        
        if (response.data?.success) {
          // Làm mới danh sách lớp học
          fetchClasses();
          
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
        const response = await axios.post(`http://fams.io.vn/api-nodejs/classes`, classData);
        
        if (response.data?.success) {
          // Làm mới danh sách lớp học
          fetchClasses();
          
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
      id: "classId",
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
      id: "homeroomTeacherId",
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
  const tableTitle = "";

  // Tạo mảng classYears từ dữ liệu lớp học
  const classYearData = classMainData.map((cls: ClassData) => ({
    className: cls.className,
    academicYear: cls.academicYear
  }));

  const state = {
    headCellsData,
    classMainData,
    tableTitle,
    isCheckBox,
    academicYearOptions,
    isLoading,
    classOptions,
    users,
    isLoadingUsers,
    classYears: classYearData
  };
  
  const handler = { 
    setFiltersClass,
    setAcademicYear,
    fetchClasses,
    fetchUsers,
    handleCreateClass
  };

  return { state, handler };
}

export default useClassManagementPageHook;
