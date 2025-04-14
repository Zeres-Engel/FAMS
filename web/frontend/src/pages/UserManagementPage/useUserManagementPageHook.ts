import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../store/useStoreHook";
import { fetchUser, searchUsers } from "../../store/slices/userSlice";
import { UserHeadCell } from "../../model/tableModels/tableDataModels.model";
import {
  SearchFilters,
  UserData,
} from "../../model/userModels/userDataModels.model";

function useClassPageHook() {
  const [filters, setFiltersUser] = useState<SearchFilters>({
    className: "",
    search: "",
    grade: "",
    phone: "",
    roles: [] as string[],
  });

  const dispatch = useAppDispatch();
  const userState = useAppSelector(state => state.users);
  const [userMainData, setUserMainData] = useState<UserData[]>([]);

  const headCellsData: UserHeadCell[] = [
    {
      id: "id",
      numeric: false,
      disablePadding: true,
      label: "ID",
    },
    {
      id: "username",
      numeric: false,
      disablePadding: true,
      label: "UserName",
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

  useEffect(() => {
    if (userState.user) {
      setUserMainData(userState.user);
    }
  }, [userState.user]);
  useEffect(() => {
    if (filters) {
      dispatch(searchUsers(filters))
    }
  }, [filters, dispatch]);

  useEffect(() => {
    if (!userState.user) {
      dispatch(fetchUser());
    } else {
      setUserMainData(userState?.user);
    }
  }, [dispatch, userState.user]);

  const state = { headCellsData, userMainData, tableTitle, isCheckBox };
  const handler = { handleFilterSubmit, setFiltersUser };

  return { state, handler };
}

export default useClassPageHook;
