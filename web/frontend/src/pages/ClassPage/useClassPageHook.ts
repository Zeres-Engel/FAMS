import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../store/useStoreHook";
import { fetchUser } from "../../store/slices/userSlice";
import { Data, HeadCell } from "../../model/tableModels/tableDataModels.model";

function useClassPageHook() {
  const dispatch = useAppDispatch();
  const role = useAppSelector(state => state.authUser.role);
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
  const tableTitle = "Student Data";
  useEffect(() => {  
    if (!userState.user) {
      dispatch(fetchUser());
    } else {
      // setUserMainData(userState?.user);
    }
  }, [dispatch, userState.user]);
  const state = { headCellsData, userMainData, tableTitle, isCheckBox,role };
  const handler = {};

  return { state, handler };
}

export default useClassPageHook;
