import { useEffect, useState } from "react";
import { useAppSelector } from "../../store/useStoreHook";
import { fetchUser } from "../../store/slices/userSlice";
import {
  ClassArrangementData,
  ClassArrangementHeadCellProps,
  ClassHeadCell,
  Data,
  HeadCell,
} from "../../model/tableModels/tableDataModels.model";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../../store/store";
import {
  fetchClasses,
  searchClassById,
  searchClasses,
} from "../../store/slices/classSlice";
import {
  ClassData,
  SearchClassFilters,
} from "../../model/classModels/classModels.model";
import { generateFakeClassArrangementData } from "./ClassArrangementFakeData";

function useClassManagementPageHook() {
  const [mode, setMode] = useState<
    "ClassManagement" | "ClassArrangement" | "NewSemester"
  >("ClassManagement");

  const handleModeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setMode(
      event.target.value as
        | "ClassManagement"
        | "ClassArrangement"
        | "NewSemester"
    );
  };
  const [filters, setFiltersClass] = useState<SearchClassFilters>({
    search: "",
    grade: "",
    homeroomTeacherd: "",
    academicYear: "",
  });
  const dispatch = useDispatch<AppDispatch>();
  const classState = useAppSelector(state => state.class);
  const [classMainData, setClassMainData] = useState<ClassData[]>([]);
  const [classArrangementMainData, setClassArrangementMainData] = useState<
    ClassArrangementData[]
  >(generateFakeClassArrangementData(50));
  const classes = useSelector((state: RootState) => state.class.allClasses);
  const classOptions = classes?.map(c => c.className) || [];
  useEffect(() => {
    if (!classes) {
      dispatch(fetchClasses());
    }
  }, [dispatch, classes]);
  useEffect(() => {
    if (!classState.classes) {
      dispatch(fetchClasses());
    } else {
      setClassMainData(classState?.classes);
    }
  }, [dispatch, classState.classes]);
  useEffect(() => {
    if (filters) {
      dispatch(searchClasses(filters));
    } else {
      dispatch(fetchClasses());
    }
  }, [filters, dispatch]);
  const headCellsData: ClassHeadCell[] = [
    {
      id: "id",
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
      id: "homeroomTeacherd",
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
  const classArrangementHeadCell: ClassArrangementHeadCellProps[] = [
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
      label: "User Name",
    },
    // {
    //   id: "avatar",
    //   numeric: false,
    //   disablePadding: false,
    //   label: "Avatar",
    // },
    {
      id: "name",
      numeric: false,
      disablePadding: false,
      label: "name",
    },
    {
      id: "email",
      numeric: false,
      disablePadding: false,
      label: "Email",
    },
    {
      id: "phone",
      numeric: false,
      disablePadding: false,
      label: "Phone",
    },
  ];
  const newSemesterHeadCell: ClassArrangementHeadCellProps[] = [
    {
      id: "id",
      numeric: false,
      disablePadding: true,
      label: "ID",
    },
    // {
    //   id: "avatar",
    //   numeric: false,
    //   disablePadding: false,
    //   label: "Avatar",
    // },
    {
      id: "username",
      numeric: false,
      disablePadding: true,
      label: "User Name",
    },
    {
      id: "name",
      numeric: false,
      disablePadding: false,
      label: "name",
    },
    {
      id: "email",
      numeric: false,
      disablePadding: false,
      label: "Email",
    },
    {
      id: "phone",
      numeric: false,
      disablePadding: false,
      label: "Phone",
    },
    {
      id: "grade",
      numeric: false,
      disablePadding: false,
      label: "Grade",
    },
    {
      id: "className",
      numeric: false,
      disablePadding: false,
      label: "Class Name",
    },
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
  const state = {
    headCellsData,
    classMainData,
    tableTitle,
    isCheckBox,
    mode,
    classArrangementHeadCell,
    classArrangementMainData,
    newSemesterHeadCell,
    classOptions
  };
  const handler = { handleModeChange, setFiltersClass };

  return { state, handler };
}

export default useClassManagementPageHook;
