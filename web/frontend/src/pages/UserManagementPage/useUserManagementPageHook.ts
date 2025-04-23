import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../store/useStoreHook";
import { fetchUser, fetchUserPaginated, searchUsers } from "../../store/slices/userSlice";
import { UserHeadCell } from "../../model/tableModels/tableDataModels.model";
import {
  SearchFilters,
  UserData,
} from "../../model/userModels/userDataModels.model";
import { RootState } from "../../store/store";
import { useSelector } from "react-redux";
import { fetchClasses } from "../../store/slices/classSlice";
import axios from "axios";

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
    roles: ["student", "teacher", "parent", "supervisor"], // Exclude admin accounts by default
    academicYear: `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`, // Current academic year
    // Thêm page và limit vào filters
    page: 1,
    limit: 5, // Đổi mặc định thành 5 dòng cố định
  });

  // State to hold class autocomplete options
  const [classOptions, setClassOptions] = useState<Array<{className: string, id: string}>>([]);
  const [searchClass, setSearchClass] = useState("");

  const dispatch = useAppDispatch();
  const userState = useAppSelector(state => state.users);
  const [userMainData, setUserMainData] = useState<UserData[]>([]);
  const [initUserFile, setInitUserFile] = useState<File | null>(null);
  
  // 👇 NEW: Handle file upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setInitUserFile(file);
      console.log("filesent");

      // dispatch(uploadInitUserFile(file)); // gọi API gửi file lên
    }
  };

  // 👇 NEW: Gửi file đã upload để xử lý
  const handleSubmitInitUserData = () => {
    console.log("fileaccept");
    // dispatch(submitInitUserData()); // không truyền file vì file đã được gửi ở bước trước
  };
  
  // Hàm xử lý chuyển trang
  const handlePageChange = (newPage: number) => {
    console.log(`Changing to page ${newPage} with fixed 5 rows per page`);
    setFiltersUser({
      ...filters,
      page: newPage,
    });
  };
  
  // Function to fetch class data for autocomplete
  const fetchClassOptions = async (searchTerm: string) => {
    try {
      console.log("Fetching class options with term:", searchTerm);
      console.log("Using academic year:", filters.academicYear);
      
      // Sử dụng CORS headers
      const requestHeaders = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      };
      
      // URL với các tham số được mã hóa đúng cách
      const encodedSearchTerm = encodeURIComponent(searchTerm);
      const encodedAcademicYear = encodeURIComponent(filters.academicYear || '2024-2025');
      
      const url = `http://fams.io.vn/api-nodejs/classes?grade=&search=${encodedSearchTerm}&homeroomTeacherd=&academicYear=${encodedAcademicYear}`;
      console.log("Calling API URL:", url);
      
      const response = await axios.get(url, { headers: requestHeaders });
      
      console.log("API response:", response.data);
      
      if (response.data?.success) {
        const classes = response.data.data.map((c: any) => ({
          className: c.className,
          id: c._id
        }));
        
        console.log("Processed class options:", classes);
        setClassOptions(classes);
      } else {
        console.error("API did not return success flag", response.data);
      }
    } catch (error) {
      console.error("Error fetching class options:", error);
    }
  };

  // Handle class search input change
  const handleClassSearchChange = (value: string) => {
    console.log("Class search changed to:", value);
    setSearchClass(value);
    fetchClassOptions(value);
    
    // Update filters to include class search
    setFiltersUser({
      ...filters,
      className: value
    });
  };
  
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
    console.log("User Management Filter submitted:", filters);
    // Đảm bảo các tham số phân trang được giữ nguyên khi tìm kiếm
    dispatch(searchUsers({
      ...filters,
      page: 1, // Reset về trang 1 khi tìm kiếm
      limit: 5, // Luôn cố định 5 dòng
    }));
  };
  
  // Fetch classes on initial load and when academicYear changes
  useEffect(() => {
    console.log("useEffect triggered for academicYear:", filters.academicYear);
    fetchClassOptions("");
  }, [filters.academicYear]);
  
  // Thêm useEffect để load danh sách lớp ngay khi component mount
  useEffect(() => {
    console.log("Component mounted - loading initial class list");
    // Gọi hàm fetchClassOptions với chuỗi rỗng để lấy tất cả các lớp
    fetchClassOptions("");
  }, []);
  
  useEffect(() => {
    if (userState.user) {
      // Filter out admin users from the displayed data
      const filteredUsers = userState.user.filter(user => user.role !== "admin");
      setUserMainData(filteredUsers);
    } else {
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
        pages: 0
      });
    }
  }, [userState.user, userState.pagination]);
  
  // Add additional debugging
  useEffect(() => {
    console.log("Filters changed, calling API with:", filters);
    // Gọi API với các tham số phân trang
    dispatch(fetchUserPaginated(filters));
  }, [filters, dispatch]);

  const state = {
    headCellsData,
    userMainData,
    tableTitle,
    isCheckBox,
    initUserFile,
    classOptions: classOptions.map(c => c.className), // For backward compatibility
    classOptionsData: classOptions, // Full class data including id
    pagination, // Thêm state pagination
    searchClass,
  };
  
  const handler = {
    handleFilterSubmit,
    setFiltersUser,
    handleFileChange,
    handleSubmitInitUserData,
    handlePageChange, // Thêm handler cho phân trang
    handleClassSearchChange,
  };

  return { state, handler };
}

export default useClassPageHook;
