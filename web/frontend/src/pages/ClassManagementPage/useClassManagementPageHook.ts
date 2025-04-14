import { useEffect, useState } from "react";
import {  useAppSelector } from "../../store/useStoreHook";
import { fetchUser } from "../../store/slices/userSlice";
import { Data, HeadCell } from "../../model/tableModels/tableDataModels.model";
import { useDispatch } from "react-redux";
import { AppDispatch } from "../../store/store";
import { fetchClasses } from "../../store/slices/classSlice";
import { ClassData } from "../../model/classModels/classModels.model";

function useClassManagementPageHook() {
  const dispatch = useDispatch<AppDispatch>();
  const classState = useAppSelector(state => state.class);
  const [classMainData, setClassMainData] = useState<ClassData[]>([]);
  useEffect(() => {
    if (!classState.classes) {
      dispatch(fetchClasses());
    } else {
      setClassMainData(classState?.classes);
      console.log(classState?.classes);
      
    }
  }, [dispatch, classState.classes]);
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
    // {
    //   id: "action",
    //   numeric: false,
    //   disablePadding: false,
    //   label: "action",
    // },
  ];
  const isCheckBox = false;
  const tableTitle = "Class Data";
  // useEffect(() => {  
  //   if (!userState.user) {
  //     dispatch(fetchUser());
  //   } else {
  //     // setUserMainData(userState?.user);
  //   }
  // }, [dispatch, userState.user]);
  const state = { headCellsData, userMainData, tableTitle, isCheckBox };
  const handler = {};

  return { state, handler };
}

export default useClassManagementPageHook;
