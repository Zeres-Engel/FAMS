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
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../../store/store";
import { fetchSubjects } from "../../store/slices/subjectSlice";
import { fetchClasses } from "../../store/slices/classSlice";
import { fetchAttendanceByUser } from "../../store/slices/attendanceSlice";

function useAttendanceManagementPageHook() {
  const dispatch = useDispatch<AppDispatch>();

  const subjectList = useSelector((state: RootState) => state.subject.subjects);
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
    })
  );
  const classList = useSelector((state: RootState) => state.class.allClasses);
  const classPageList: ClassPageList[] = classList
    ? classList.map(item => ({
        classId: item.classId as number,
        className: `${item.className} - ${item.academicYear}`,
      }))
    : [];
  useEffect(() => {
    if (!classList) {
      dispatch(fetchClasses());
    }
  }, [dispatch, classList]);
  useEffect(() => {
    if (!subjectList || subjectList.length === 0) {
      dispatch(fetchSubjects());
    }
  }, [dispatch, subjectList]);

  const [userMainData, setUserMainData] = useState<AttendanceLog[]>([]);
  const [filters, setFiltersAttendancePage] = useState<AttendanceSearchParam>({
    userId: "",
    subjectId: "",
    classId: "",
    teacherName: "",
    status: "",
    date: "",
    slotNumber: "1",
  });
  useEffect(() => {
    if (filters) {
      dispatch(fetchAttendanceByUser(filters));
    }
  }, [filters, dispatch]);
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

  const state = {
    headCellsData,
    userMainData,
    tableTitle,
    isCheckBox,
    subjectList,
    classPageList,
    attendanceFormattedData,
  };
  const handler = { setFiltersAttendancePage };
  return { state, handler };
}
export default useAttendanceManagementPageHook;
