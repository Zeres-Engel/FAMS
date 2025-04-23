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
    roles: [] as string[],
    academicYear: "",
    // Thêm page và limit vào filters
    page: 1,
    limit: 5, // Đổi mặc định thành 5 dòng cố định
  });

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
  const tableTitle = "User Data";

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
  
  const classes = useSelector((state: RootState) => state.class.classes);
  const classOptions = classes?.map(c => c.className) || [];
  
  useEffect(() => {
    if (!classes) {
      dispatch(fetchClasses());
    }
  }, [dispatch, classes]);
  
  useEffect(() => {
    if (userState.user) {
      setUserMainData(userState.user);
    }
    
    // Cập nhật thông tin phân trang từ response
    if (userState.pagination) {
      setPagination({
        page: userState.pagination.page,
        limit: userState.pagination.limit,
        total: userState.pagination.total,
        pages: userState.pagination.pages, // Thêm tổng số trang
      });
    }
  }, [userState.user, userState.pagination]);
  
  useEffect(() => {
    // Gọi API với các tham số phân trang
    dispatch(fetchUserPaginated(filters));
  }, [filters, dispatch]);

  const state = {
    headCellsData,
    userMainData,
    tableTitle,
    isCheckBox,
    initUserFile,
    classOptions,
    pagination, // Thêm state pagination
  };
  
  const handler = {
    handleFilterSubmit,
    setFiltersUser,
    handleFileChange,
    handleSubmitInitUserData,
    handlePageChange, // Thêm handler cho phân trang
  };

  return { state, handler };
}

export default useClassPageHook;
