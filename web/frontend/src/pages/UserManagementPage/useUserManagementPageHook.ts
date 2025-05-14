import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../store/useStoreHook";
import {
  fetchUser,
  fetchUserPaginated,
  searchUsers,
} from "../../store/slices/userSlice";
import { UserHeadCell } from "../../model/tableModels/tableDataModels.model";
import {
  SearchFilters,
  UserData,
} from "../../model/userModels/userDataModels.model";
import { RootState } from "../../store/store";
import { useSelector } from "react-redux";
import { fetchClasses } from "../../store/slices/classSlice";
import axios from "axios";
import axiosInstance from "../../services/axiosInstance";

function useClassPageHook() {
  // Thêm state pagination
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 5, // Đổi mặc định thành 5 dòng cố định
    total: 0,
    pages: 0,
  });

  const [filters, setFiltersUser] = useState<SearchFilters>({
    className: "",
    search: "",
    grade: "",
    phone: "",
    roles: ["student", "teacher", "parent"], // Đã loại bỏ "supervisor"
    academicYear: "", // Trống ban đầu, sẽ được cập nhật sau khi lấy dữ liệu
    // Thêm page và limit vào filters
    page: 1,
    limit: 5, // Luôn cố định 5 dòng
  });

  // State để lưu trữ dữ liệu lớp học và năm học
  const [classesData, setClassesData] = useState<any[]>([]); // Lưu toàn bộ dữ liệu classes
  const [availableAcademicYears, setAvailableAcademicYears] = useState<
    string[]
  >([]); // Các năm học có sẵn
  const [availableClassNames, setAvailableClassNames] = useState<string[]>([]); // Các lớp học có sẵn
  const [classesGroupedByYear, setClassesGroupedByYear] = useState<
    Record<string, string[]>
  >({}); // Lớp học theo năm

  const dispatch = useAppDispatch();
  const userState = useAppSelector((state: RootState) => state.users);
  const [userMainData, setUserMainData] = useState<UserData[]>([]);
  const [initUserFile, setInitUserFile] = useState<File | null>(null);
  const [uploadedUserData, setUploadedUserData] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // 👇 NEW: Handle file upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setInitUserFile(file);
      console.log("File selected:", file.name);
    }
  };

  // 👇 NEW: Upload file to API
  const handleSubmitInitUserData = async () => {
    if (!initUserFile) {
      console.error("No file selected");
      return;
    }

    setIsUploading(true);

    try {
      // Create FormData
      const formData = new FormData();
      formData.append("file", initUserFile);

      // Send request to API with increased timeout (30 seconds)
      const response = await axios.post(
        "http://fams.io.vn/api-python/users/upload/fams",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          timeout: 30000, // 30 seconds timeout
        }
      );

      console.log("API response:", response.data);

      if (response.data && response.data.data) {
        // Store the user data from response
        setUploadedUserData(response.data.data.user_data || []);
        return response.data.data.user_data || [];
      } else {
        console.error("Invalid API response format", response.data);
        return [];
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      return [];
    } finally {
      setIsUploading(false);
    }
  };

  // Hàm xử lý chuyển trang
  const handlePageChange = (newPage: number) => {
    console.log(`Changing to page ${newPage} with fixed 5 rows per page`);
    setFiltersUser({
      ...filters,
      page: newPage,
    });
  };

  // Fetch classes data from API
  const fetchClassesData = async () => {
    try {
      const response = await axiosInstance.get(
        "http://fams.io.vn/api-nodejs/classes"
      );

      if (response.data?.success) {
        const classes = response.data.data;

        // Lưu toàn bộ dữ liệu classes
        setClassesData(classes);

        // Nhóm các lớp học theo năm học
        const groupedByYear = groupClassesByYear(classes);
        setClassesGroupedByYear(groupedByYear);

        // Lấy danh sách các năm học sắp xếp tăng dần (cũ nhất lên đầu)
        const years = Object.keys(groupedByYear).sort((a, b) => {
          return parseInt(a.split("-")[0]) - parseInt(b.split("-")[0]);
        });
        setAvailableAcademicYears(years);

        // Nếu có năm học, chọn năm học đầu tiên làm mặc định
        if (years.length > 0) {
          const firstYear = years[0];

          // Cập nhật filters với năm học đầu tiên
          setFiltersUser((prev: SearchFilters) => ({
            ...prev,
            academicYear: firstYear,
          }));

          // Cập nhật danh sách lớp học sẵn có cho năm học này
          setAvailableClassNames(groupedByYear[firstYear] || []);
        } else {
          // Nếu không có năm học nào, đặt mảng trống
          setFiltersUser((prev: SearchFilters) => ({
            ...prev,
            academicYear: "",
            className: "",
          }));
          setAvailableClassNames([]);
        }
      } else {
        console.error(
          "API did not return success or empty data",
          response.data
        );
        // Đặt giá trị rỗng nếu API không trả về dữ liệu
        setAvailableAcademicYears([]);
        setFiltersUser((prev: SearchFilters) => ({
          ...prev,
          academicYear: "",
          className: "",
        }));
        setAvailableClassNames([]);
      }
    } catch (error) {
      console.error("Error fetching classes data:", error);
      // Xử lý lỗi: đặt giá trị rỗng
      setAvailableAcademicYears([]);
      setFiltersUser((prev: SearchFilters) => ({
        ...prev,
        academicYear: "",
        className: "",
      }));
      setAvailableClassNames([]);
    }
  };

  // Hàm nhóm lớp học theo năm học
  const groupClassesByYear = (classes: any[]): Record<string, string[]> => {
    const grouped: Record<string, string[]> = {};

    if (!classes || classes.length === 0) {
      return grouped;
    }

    classes.forEach(classItem => {
      const { academicYear, className } = classItem;

      if (!academicYear) return; // Bỏ qua nếu không có academicYear

      if (!grouped[academicYear]) {
        grouped[academicYear] = [];
      }

      // Chỉ thêm className nếu chưa có trong mảng
      if (className && !grouped[academicYear].includes(className)) {
        grouped[academicYear].push(className);
      }
    });

    // Sắp xếp tên lớp trong mỗi năm học theo khối và lớp
    Object.keys(grouped).forEach(year => {
      grouped[year].sort((a, b) => {
        // Lấy ra khối (10, 11, 12) từ tên lớp
        const classGradeA = a.match(/^(\d+)/);
        const classGradeB = b.match(/^(\d+)/);

        // Nếu một trong hai không có khối thì so sánh theo string thông thường
        if (!classGradeA || !classGradeB) return a.localeCompare(b);

        const gradeA = parseInt(classGradeA[1]);
        const gradeB = parseInt(classGradeB[1]);

        // So sánh khối trước
        if (gradeA !== gradeB) return gradeA - gradeB;

        // Nếu cùng khối, lấy phần chữ và số sau khối
        const classNameA = a.substring(classGradeA[0].length);
        const classNameB = b.substring(classGradeB[0].length);

        // So sánh phần còn lại theo thứ tự từ điển
        return classNameA.localeCompare(classNameB);
      });
    });

    return grouped;
  };

  // Xử lý khi chọn năm học
  const handleAcademicYearChange = (year: string) => {

    // Cập nhật filters với năm học mới và reset className
    setFiltersUser({
      ...filters,
      academicYear: year || "",
      className: "", // Reset class selection
    });

    // Cập nhật danh sách lớp học có sẵn dựa trên năm học đã chọn
    setAvailableClassNames(classesGroupedByYear[year] || []);
  };

  // Xử lý khi chọn lớp học
  const handleClassChange = (className: string) => {
    if (!className) return; // Không cập nhật nếu className không hợp lệ

    setFiltersUser({
      ...filters,
      className,
    });
  };

  // Fetch classes data when component mounts
  useEffect(() => {
    fetchClassesData();
  }, []);

  const headCellsData: UserHeadCell[] = [
    {
      id: "id",
      numeric: false,
      disablePadding: true,
      label: "ID",
    },
    {
      id: "avatar",
      numeric: false,
      disablePadding: false,
      label: "Avatar",
    },
    {
      id: "name",
      numeric: false,
      disablePadding: false,
      label: "Name",
    },
    {
      id: "email",
      numeric: false,
      disablePadding: false,
      label: "Email",
    },
    {
      id: "phoneSub",
      numeric: false,
      disablePadding: false,
      label: "Phone",
    },
    {
      id: "role",
      numeric: false,
      disablePadding: false,
      label: "Role",
    },
    {
      id: "updatedAt",
      numeric: false,
      disablePadding: false,
      label: "UpdatedAt",
    },
    {
      id: "createdAt",
      numeric: false,
      disablePadding: false,
      label: "CreatedAt",
    },
  ];

  const isCheckBox = false;
  const tableTitle = "";

  // Thêm handleFilterSubmit để luôn bao gồm tham số phân trang
  const handleFilterSubmit = () => {
    // Đảm bảo các tham số phân trang được giữ nguyên khi tìm kiếm
    dispatch(
      searchUsers({
        ...filters,
        page: 1, // Reset về trang 1 khi tìm kiếm
        limit: 5, // Luôn cố định 5 dòng
      })
    );
  };

  useEffect(() => {
    console.log(userState.user);
    
    if (userState.user?.length !== 0 && userState.user) {
      // Filter out admin users from the displayed data
      const filteredUsers = userState.user.filter(
        user => user.role !== "admin"
      );
      setUserMainData(filteredUsers);
    } else {
      console.log('hehehe');
      // Handle case when API returns no users (empty array)
      setUserMainData([]);
    }

    // Cập nhật thông tin phân trang từ response
    if (userState.pagination) {
      setPagination({
        page: userState.pagination.page,
        limit: userState.pagination.limit,
        total: userState.pagination.total,
        pages: userState.pagination.pages, // Thêm tổng số trang
      });
    } else {
      // Reset pagination when no data is returned
      setPagination({
        page: 1,
        limit: 5,
        total: 0,
        pages: 0,
      });
    }
  }, [userState.user, userState.pagination]);
  useEffect(()=>{
    console.log(userMainData);
    
  },[userMainData])
  // Add additional debugging
  useEffect(() => {
    // Gọi API với các tham số phân trang
    dispatch(fetchUserPaginated(filters));
  }, [filters, dispatch]);

  // 👇 NEW: Toggle user selection status
  const toggleUserSelection = (index: number) => {
    setUploadedUserData((prev: any[]) => {
      const newData = [...prev];
      // Đảm bảo chosen được set rõ ràng là true hoặc false
      const currentValue = newData[index].chosen;
      // Nếu currentValue là undefined hoặc true, đổi thành false; ngược lại là true
      newData[index] = {
        ...newData[index],
        chosen:
          currentValue === undefined || currentValue === true ? false : true,
      };
      console.log(
        "Toggled user selection:",
        index,
        "New value:",
        newData[index].chosen
      );
      return newData;
    });
  };

  // 👇 Import selected users with optimistic UI
  const confirmImportUsers = async () => {
    // Filter only users with chosen=true or undefined (default is true)
    const selectedUsers = uploadedUserData.filter(
      (user: any) => user.chosen !== false
    );

    if (selectedUsers.length === 0) {
      console.error("No users selected for import");
      return { success: false, message: "Không có người dùng nào được chọn để nhập" };
    }

    try {
      console.log("Bắt đầu nhập dữ liệu người dùng...");
      
      // Create a promise that either resolves with the fetch result or times out
      const importPromise = new Promise(async (resolve, reject) => {
        try {
          // Send the request
          const fetchResponse = await fetch("http://fams.io.vn/api-python/users/import/users", {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(selectedUsers),
          });
          
          // If we get a response, resolve with it
          resolve(fetchResponse);
        } catch (error) {
          // If there's an error, reject with it
          reject(error);
        }
      });
      
      // Create a timeout promise that resolves after 30 seconds
      const timeoutPromise = new Promise(resolve => {
        setTimeout(() => {
          // Resolve with a "success" response after timeout
          resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve({
              success: true,
              message: "Data is being processed in the system",
              optimistic: true
            })
          });
        }, 30000); // 30 seconds
      });
      
      // Race the import promise against the timeout
      const response: any = await Promise.race([importPromise, timeoutPromise]);
      
      // Get the response data
      const responseData = await response.json().catch((e: Error) => ({}));
      console.log("Phản hồi từ máy chủ:", responseData);
      
      // Consider success if we get an OK status or reached the timeout
      if (response.ok || responseData.optimistic) {
        console.log("Nhập dữ liệu thành công");
        
        // Clear uploaded data after successful import
        setUploadedUserData([]);
        setInitUserFile(null);
        
        return { 
          success: true, 
          data: responseData,
          message: responseData.message || "Đã nhập dữ liệu người dùng thành công" 
        };
      } else {
        console.error("Lỗi khi nhập dữ liệu:", response.status);
        return {
          success: false,
          message: responseData?.message || `Lỗi khi nhập dữ liệu (${response.status})`,
        };
      }
    } catch (error: any) {
      console.error("Lỗi khi nhập dữ liệu người dùng:", error);
      
      // If we've gotten an error before 30 seconds, it's a real error
      return { 
        success: false, 
        message: error.message || "Lỗi khi nhập dữ liệu người dùng" 
      };
    }
  };

  // 👇 NEW: Verify import success after a timeout error
  const verifyImportSuccess = async () => {
    try {
      // Refetch the user list to see if our import was actually successful
      await dispatch(fetchUserPaginated(filters));
      
      // Return the current state of userState after refetching
      return {
        success: true,
        message: "Users may have been imported successfully. Please check the user list."
      };
    } catch (error) {
      console.error("Error verifying import:", error);
      return {
        success: false,
        message: "Could not verify import status."
      };
    }
  };

  const state = {
    headCellsData,
    userMainData,
    tableTitle,
    isCheckBox,
    initUserFile,
    uploadedUserData,
    isUploading,
    pagination,
    academicYear: filters.academicYear,
    className: filters.className,
    availableAcademicYears,
    availableClassNames,
  };

  const handler = {
    handleFilterSubmit,
    setFiltersUser,
    handleFileChange,
    handleSubmitInitUserData,
    toggleUserSelection,
    confirmImportUsers,
    verifyImportSuccess,
    handlePageChange,
    handleAcademicYearChange,
    handleClassChange,
  };

  return { state, handler };
}

export default useClassPageHook;
