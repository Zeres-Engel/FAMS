import { useEffect, useState } from "react";
import { fetchUser } from "../../store/slices/userSlice";
import { useAppDispatch, useAppSelector } from "../../store/useStoreHook";
import {
  AttendanceHeadCell,
  AttendanceLog,
  AttendanceSearchParam,
  ClassPageList,
  Data,
  HeadCell,
} from "../../model/tableModels/tableDataModels.model";
import { RootState } from "../../store/store";
import { useSelector } from "react-redux";
import { fetchClassesByUserId } from "../../store/slices/classByIdSlice";
import { fetchAttendanceByUser } from "../../store/slices/attendanceSlice";

function useAttendancePageHook() {
  const dispatch = useAppDispatch();
  const role = useAppSelector(state => state.authUser.role);
  const userData = useAppSelector(state => state.login.loginData);
  const parentData = useSelector((state: RootState) => state.parentData.data);
  const classList = useSelector((state: RootState) => state.classById.classes);
  const classAttendanceList: ClassPageList[] = classList.map(item => ({
    classId: item.classId,
    className: `${item.className} - ${item.academicYear}`,
  }));
  useEffect(() => {
    if (userData && role !== "parent") {
      dispatch(fetchClassesByUserId(userData?.userId));
    }
  }, [dispatch, userData, role]);
  const attendanceMainData = useSelector(
    (state: RootState) => state.attendanceData.attendances
  );
  const attendanceFormattedData: AttendanceLog[] = attendanceMainData.map(
    e => ({
      id: `${e.attendanceId}`,
      attendanceId: e.attendanceId,
      scheduleId: e.scheduleId,
      userId: e.userId,
      face: e.avatar,
      checkin: e.checkIn,
      status: e.status,
      checkinFace: e.checkInFace,
      fullName: role === "teacher" ? e.teacherName : e.studentName,
      note: e.note,
      subject: e.subjectName,
      slotNumber: e.slotNumber,
    })
  );
  const [filters, setFiltersAttendancePage] = useState<AttendanceSearchParam>({
    userId: "",
    subjectId: "",
    classId: "",
    teacherName: "",
    status: "",
    dateFrom: "",
    dateTo: "",
    slotNumber: "1",
  });
  const [userMainData, setUserMainData] = useState<AttendanceLog[]>([]);
  useEffect(() => {
    if (filters) {
      if (userData?.role === "parent") {
        dispatch(fetchAttendanceByUser({ ...filters,userId: parentData[0].details.children[0].userId }));
        return;
      }
      dispatch(
        fetchAttendanceByUser({ ...filters, userId: userData?.userId || "" })
      );
    }
  }, [filters, dispatch, userData, parentData]);
  const onShowMyAttendance = () => {
    dispatch(fetchAttendanceByUser({ userId: userData?.userId || "" }));
  };
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
      id: "subject",
      numeric: false,
      disablePadding: false,
      label: "Subject",
    },
    {
      id: "slotNumber",
      numeric: false,
      disablePadding: false,
      label: "Slot",
    },
    // {
    //   id: "fullName",
    //   numeric: false,
    //   disablePadding: false,
    //   label: "Full Name",
    // },
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

  const state = {
    headCellsData,
    userMainData,
    tableTitle,
    isCheckBox,
    role,
    classAttendanceList,
    attendanceFormattedData,
  };
  const handler = { setFiltersAttendancePage, onShowMyAttendance };
  return { state, handler };
}
export default useAttendancePageHook;
