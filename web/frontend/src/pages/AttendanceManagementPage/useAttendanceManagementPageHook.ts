import { useEffect, useState } from "react";
import { fetchUser } from "../../store/slices/userSlice";
import { useAppDispatch, useAppSelector } from "../../store/useStoreHook";
import {
  AttendanceHeadCell,
  AttendanceLog,
  Data,
  HeadCell,
} from "../../model/tableModels/tableDataModels.model";

function useAttendanceManagementPageHook() {
  const sampleData: AttendanceLog[] = [
    {
      id: "1",
      attendanceId: 1,
      scheduleId: 101,
      userId: 1001,
      face: null,
      checkin: "2025-04-16T07:05:00",
      status: "Present",
      checkinFace: "",
    },
    {
      id: "2",
      attendanceId: 2,
      scheduleId: 101,
      userId: 1002,
      face: null,
      checkin: "2025-04-16T07:15:00",
      status: "Late",
      checkinFace: "",
    },
    {
      id: "3",
      attendanceId: 3,
      scheduleId: 101,
      userId: 1003,
      face: null,
      checkin: null,
      status: "Absent",
      checkinFace: "",
    },
    {
      id: "4",
      attendanceId: 4,
      scheduleId: 102,
      userId: 1001,
      face: null,
      checkin: "2025-04-16T13:00:00",
      status: "Present",
      checkinFace: "",
    },
    {
      id: "5",
      attendanceId: 5,
      scheduleId: 102,
      userId: 1002,
      face: null,
      checkin: "2025-04-16T13:10:00",
      status: "Late",
      checkinFace: "",
    },
  ];
  const [userMainData, setUserMainData] = useState<AttendanceLog[]>(sampleData);

  const headCellsData: AttendanceHeadCell[] = [
    {
      id: "id",
      numeric: false,
      disablePadding: true,
      label: "ID",
    },
    {
      id: "scheduleId",
      numeric: false,
      disablePadding: true,
      label: "Schedule Id",
    },
    {
      id: "face",
      numeric: false,
      disablePadding: true,
      label: "User Avatar",
    },
    {
      id: "checkinFace",
      numeric: false,
      disablePadding: true,
      label: "Checkin Face",
    },
    {
      id: "userId",
      numeric: false,
      disablePadding: false,
      label: "User Id",
    },
    {
      id: "checkin",
      numeric: false,
      disablePadding: false,
      label: "Checkin",
    },
    {
      id: "note",
      numeric: false,
      disablePadding: false,
      label: "Note",
    },
    {
      id: "status",
      numeric: false,
      disablePadding: false,
      label: "Status",
    },
  ];
  const isCheckBox = false;
  const tableTitle = "Attendance Data";
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
export default useAttendanceManagementPageHook;
