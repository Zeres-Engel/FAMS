import { useEffect, useState } from "react";
import { fetchUser } from "../../store/slices/userSlice";
import { useAppDispatch, useAppSelector } from "../../store/useStoreHook";
import {
  AttendanceHeadCell,
  AttendanceLog,
  Data,
  HeadCell,
} from "../../model/tableModels/tableDataModels.model";

function useAttendancePageHook() {
  const role = useAppSelector((state) => state.authUser.role);
  const attendanceLogs: AttendanceLog[] = [
    {
      id: "1",
      attendanceId: 1,
      scheduleId: 101,
      userId: 1001,
      fullName: "Nguyen Van A",
      face: null,
      checkin: "2025-04-16T07:05:00",
      status: "Present",
      checkinFace: "",
      note: "Đến đúng giờ.",
    },
    {
      id: "2",
      attendanceId: 2,
      scheduleId: 101,
      userId: 1002,
      fullName: "Tran Thi B",
      face: null,
      checkin: "2025-04-16T07:15:00",
      status: "Late",
      checkinFace: "",
      note: "Đến trễ 15 phút do kẹt xe.",
    },
    {
      id: "3",
      attendanceId: 3,
      scheduleId: 101,
      userId: 1003,
      fullName: "Le Van C",
      face: null,
      checkin: null,
      status: "Absent",
      checkinFace: "",
      note: "Vắng không phép.",
    },
    {
      id: "4",
      attendanceId: 4,
      scheduleId: 102,
      userId: 1001,
      fullName: "Nguyen Van A",
      face: null,
      checkin: "2025-04-16T13:00:00",
      status: "Present",
      checkinFace: "",
      note: "Có mặt đầy đủ.",
    },
    {
      id: "5",
      attendanceId: 5,
      scheduleId: 102,
      userId: 1002,
      fullName: "Tran Thi B",
      face: null,
      checkin: "2025-04-16T13:10:00",
      status: "Late",
      checkinFace: "",
      note: "Đến trễ do lý do cá nhân.",
    },
  ];
  
  const [userMainData, setUserMainData] =
    useState<AttendanceLog[]>(attendanceLogs);

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
      id: "fullName",
      numeric: false,
      disablePadding: false,
      label: "Full Name",
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

  const state = { headCellsData, userMainData, tableTitle, isCheckBox,role };
  const handler = {};
  return { state, handler };
}
export default useAttendancePageHook;
