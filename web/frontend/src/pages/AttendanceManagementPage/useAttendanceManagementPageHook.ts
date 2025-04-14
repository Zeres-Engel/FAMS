import { useEffect, useState } from "react";
import { fetchUser } from "../../store/slices/userSlice";
import { useAppDispatch, useAppSelector } from "../../store/useStoreHook";
import { Data, HeadCell } from "../../model/tableModels/tableDataModels.model";

function useAttendanceManagementPageHook() {
const dispatch = useAppDispatch();
  const userState = useAppSelector(state => state.users);
  const [userMainData, setUserMainData] = useState<Data[]>([]);
  const headCellsData: HeadCell[] = [
    {
      id: "id",
      numeric: false,
      disablePadding: true,
      label: "ID",
    },
    {
      id: "name",
      numeric: false,
      disablePadding: true,
      label: "Name",
    },
    {
      id: "avatar",
      numeric: false,
      disablePadding: false,
      label: "Avatar",
    },
    {
      id: "creationAt",
      numeric: false,
      disablePadding: false,
      label: "CreationAt",
    },
    {
      id: "email",
      numeric: false,
      disablePadding: false,
      label: "Email",
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
  ];
  const isCheckBox = false;
  const tableTitle = "Attendance Data";
  useEffect(() => {  
    if (!userState.user) {
      dispatch(fetchUser());
    } else {
      // setUserMainData(userState?.user);
    }
  }, [dispatch, userState.user]);

  const state = { headCellsData, userMainData, tableTitle, isCheckBox };
  const handler = {};
    return { state, handler };
  }
  export default useAttendanceManagementPageHook;