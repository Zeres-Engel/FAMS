import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../store/useStoreHook";
import { fetchUser } from "../../store/slices/userSlice";
import { Data, HeadCell } from "../../model/tableModels/tableDataModels.model";

function useClassPageHook() {
  const dispatch = useAppDispatch();
  const userState = useAppSelector(state => state.users);
  const [userMainData, setUserMainData] = useState<Data[]>([]); 
  const headCellsData: HeadCell[] = [
    {
      id: 'id',
      numeric: false,
      disablePadding: true,
      label: 'name',
    },
    {
      id: 'avatar',
      numeric: false,
      disablePadding: false,
      label: 'avatar',
    },
    {
      id: 'creationAt',
      numeric: false,
      disablePadding: false,
      label: 'creationAt',
    },
    {
      id: 'email',
      numeric: false,
      disablePadding: false,
      label: 'email',
    },
    {
      id: 'role',
      numeric: false,
      disablePadding: false,
      label: 'role',
    },
    {
      id: 'updatedAt',
      numeric: false,
      disablePadding: false,
      label: 'updatedAt',
    },
  ];
  const tableTitle = 'Student Data'
  useEffect(() => {
    if (!userState.user) {
      dispatch(fetchUser());
    } else {
      setUserMainData(userState.user); 
    }
  }, [dispatch, userState.user]);
  console.log(userMainData);
  
 
  const state = { headCellsData, userMainData,tableTitle };
  const handler = {};

  return { state, handler };
}

export default useClassPageHook;
