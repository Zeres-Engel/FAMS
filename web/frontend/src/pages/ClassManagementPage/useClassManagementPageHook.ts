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
import { useDispatch } from "react-redux";
import { AppDispatch } from "../../store/store";
import { fetchClasses } from "../../store/slices/classSlice";
import { ClassData } from "../../model/classModels/classModels.model";
import { generateFakeClassArrangementData } from "./ClassArrangementFakeData";

function useClassManagementPageHook() {
  const fakeClassData: ClassData[] = [
    {
      _id: "cls001",
      id: "101",
      classId: 101,
      className: "10A1",
      grade: "10",
      homeroomTeacherd: "Nguyen Van A",
      studentNumber: "30",
      createdAt: "2024-08-01T08:00:00Z",
      updatedAt: "2025-04-10T10:30:00Z",
      academicYear: "2024–2025",
      batchId: 1,
      name: "Class 10A1",
    },
    {
      _id: "cls002",
      id: "102",
      classId: 102,
      className: "10A2",
      grade: "10",
      studentNumber: "30",
      homeroomTeacherd: "Tran Thi B",
      createdAt: "2024-08-02T08:00:00Z",
      updatedAt: "2025-04-11T10:30:00Z",
      academicYear: "2024–2025",
      batchId: 1,
      name: "Class 10A2",
    },
    {
      _id: "cls003",
      id: "103",
      classId: 103,
      className: "10B1",
      grade: "10",
      studentNumber: "30",
      homeroomTeacherd: "Le Van C",
      createdAt: "2024-08-03T08:00:00Z",
      updatedAt: "2025-04-12T10:30:00Z",
      academicYear: "2024–2025",
      batchId: 1,
      name: "Class 10B1",
    },
    {
      _id: "cls004",
      id: "104",
      classId: 104,
      className: "11A1",
      grade: "11",
      studentNumber: "30",
      homeroomTeacherd: "Pham Thi D",
      createdAt: "2023-08-01T08:00:00Z",
      updatedAt: "2024-04-10T10:30:00Z",
      academicYear: "2023–2024",
      batchId: 2,
      name: "Class 11A1",
    },
    {
      _id: "cls005",
      id: "105",
      classId: 105,
      className: "11A2",
      studentNumber: "30",
      grade: "11",
      homeroomTeacherd: "Vo Van E",
      createdAt: "2023-08-02T08:00:00Z",
      updatedAt: "2024-04-11T10:30:00Z",
      academicYear: "2023–2024",
      batchId: 2,
      name: "Class 11A2",
    },
    {
      _id: "cls006",
      id: "106",
      classId: 106,
      className: "11B1",
      studentNumber: "30",
      grade: "11",
      homeroomTeacherd: "Dang Thi F",
      createdAt: "2023-08-03T08:00:00Z",
      updatedAt: "2024-04-12T10:30:00Z",
      academicYear: "2023–2024",
      batchId: 2,
      name: "Class 11B1",
    },
    {
      _id: "cls007",
      id: "107",
      classId: 107,
      className: "12A1",
      studentNumber: "30",
      grade: "12",
      homeroomTeacherd: "Bui Van G",
      createdAt: "2022-08-01T08:00:00Z",
      updatedAt: "2023-04-10T10:30:00Z",
      academicYear: "2022–2023",
      batchId: 3,
      name: "Class 12A1",
    },
    {
      _id: "cls008",
      id: "108",
      classId: 108,
      className: "12A2",
      studentNumber: "30",
      grade: "12",
      homeroomTeacherd: "Nguyen Thi H",
      createdAt: "2022-08-02T08:00:00Z",
      updatedAt: "2023-04-11T10:30:00Z",
      academicYear: "2022–2023",
      batchId: 3,
      name: "Class 12A2",
    },
    {
      _id: "cls009",
      id: "109",
      classId: 109,
      className: "12B1",
      studentNumber: "30",
      grade: "12",
      homeroomTeacherd: "Tran Van I",
      createdAt: "2022-08-03T08:00:00Z",
      updatedAt: "2023-04-12T10:30:00Z",
      academicYear: "2022–2023",
      batchId: 3,
      name: "Class 12B1",
    },
    {
      _id: "cls010",
      id: "110",
      classId: 110,
      studentNumber: "30",
      className: "10C1",
      grade: "10",
      homeroomTeacherd: "Do Thi J",
      createdAt: "2024-08-04T08:00:00Z",
      updatedAt: "2025-04-13T10:30:00Z",
      academicYear: "2024–2025",
      batchId: 1,
      name: "Class 10C1",
    },
  ];
  const [mode, setMode] = useState<"ClassManagement" | "ClassArrangement" | "NewSemester">("ClassManagement");

  const handleModeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setMode(event.target.value as "ClassManagement" | "ClassArrangement" | "NewSemester");
  };

  const dispatch = useDispatch<AppDispatch>();
  const classState = useAppSelector(state => state.class);
  const [classMainData, setClassMainData] =
    useState<ClassData[]>(fakeClassData);
  const [classArrangementMainData, setClassArrangementMainData] =
    useState<ClassArrangementData[]>(generateFakeClassArrangementData(50));
  // useEffect(() => {
  //   if (!classState.classes) {
  //     dispatch(fetchClasses());
  //   } else {
  //     setClassMainData(classState?.classes);
  //     console.log("đây là hook",classState?.classes);
  //   }
  // }, [dispatch, classState.classes]);
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
      id: "batchId",
      numeric: false,
      disablePadding: false,
      label: "Batch Id",
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
  ]
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
  ]
  const isCheckBox = false;
  const tableTitle = "Class Data";
  // useEffect(() => {
  //   if (!userState.user) {
  //     dispatch(fetchUser());
  //   } else {
  //     // setUserMainData(userState?.user);
  //   }
  // }, [dispatch, userState.user]);
  const state = { headCellsData, classMainData, tableTitle, isCheckBox, mode,classArrangementHeadCell,classArrangementMainData,newSemesterHeadCell };
  const handler = { handleModeChange };

  return { state, handler };
}

export default useClassManagementPageHook;
