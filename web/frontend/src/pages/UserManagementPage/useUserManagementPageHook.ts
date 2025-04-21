import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../store/useStoreHook";
import { fetchUser, searchUsers } from "../../store/slices/userSlice";
import { UserHeadCell } from "../../model/tableModels/tableDataModels.model";
import {
  SearchFilters,
  UserData,
} from "../../model/userModels/userDataModels.model";
import { RootState } from "../../store/store";
import { useSelector } from "react-redux";
import { fetchClasses } from "../../store/slices/classSlice";

function useClassPageHook() {
  const [filters, setFiltersUser] = useState<SearchFilters>({
    className: "",
    search: "",
    grade: "",
    phone: "",
    roles: [] as string[],
    academicYear: "",
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
  const headCellsData: UserHeadCell[] = [
    {
      id: "id",
      numeric: false,
      disablePadding: true,
      label: "ID",
    },
    {
      id: "email",
      numeric: false,
      disablePadding: false,
      label: "Email",
    },
    {
      id: "name",
      numeric: false,
      disablePadding: false,
      label: "Name",
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
      id: "classSubId",
      numeric: false,
      disablePadding: false,
      label: "Class Name",
    },
    {
      id: "gradeSub",
      numeric: false,
      disablePadding: false,
      label: "Grade",
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

  const handleFilterSubmit = () => {
    console.log("User Management Filter submitted:", filters);
    dispatch(searchUsers(filters));
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
  }, [userState.user]);
  useEffect(() => {
    if (filters) {
      dispatch(searchUsers(filters));
    }
  }, [filters, dispatch]);

  useEffect(() => {
    if (!userState.user) {
      dispatch(fetchUser());
    } else {
      setUserMainData(userState?.user);
    }
  }, [dispatch, userState.user]);

  const state = {
    headCellsData,
    userMainData,
    tableTitle,
    isCheckBox,
    initUserFile,
    classOptions
  };
  const handler = {
    handleFilterSubmit,
    setFiltersUser,
    handleFileChange,
    handleSubmitInitUserData,
  };

  return { state, handler };
}

export default useClassPageHook;
