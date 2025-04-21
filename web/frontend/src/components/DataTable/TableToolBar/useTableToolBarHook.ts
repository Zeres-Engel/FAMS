import { useState } from "react";
import { useDispatch } from "react-redux";
import { AppDispatch } from "../../../store/store";
import { searchUsers } from "../../../store/slices/userSlice";
import { SearchFilters } from "../../../model/userModels/userDataModels.model";

function useTableToolBarHook({
  isAttendance,
  isClassManagement,
  isUserManagement,
  isTeacher,
  setFiltersUser,
  isClassArrangement,
  isNewSemester,
  isTeacherView,
  defaultClass,
  isRoleStudent,
  isNotifyPage
}: {
  isAttendance: boolean;
  isClassManagement: boolean;
  isUserManagement: boolean;
  isTeacher?: boolean;
  setFiltersUser?: React.Dispatch<React.SetStateAction<SearchFilters>>;
  isClassArrangement?: boolean;
  isNewSemester?: boolean;
  isTeacherView?: boolean;
  defaultClass?: string;
  isRoleStudent?: boolean;
  isNotifyPage?: boolean;
}) {
  const dispatch = useDispatch<AppDispatch>();
  const [filters, setFilters] = useState({
    class: defaultClass,
    name: "",
    grade: "",
    phone: "",
    roles: [] as string[],
    className: "",
    userID: "",
    batch: "",
    dateFrom: "",
    dateTo: "",
    slotID: "",
    date: "",
    message: "",
  });

  const handleFilterChange = (
    key: keyof typeof filters,
    value: string | string[]
  ) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleFilterSubmit = () => {
    if (isNotifyPage) {
      const notifyFilters = {
        message: filters.message,
      };
      console.log("Notify Filter submitted:", notifyFilters);
    }
    if(isRoleStudent) {
      const studentAttendance = {
        slotID: filters.slotID,
        date: filters.date,
      };
      console.log("Student Attendance Filter submitted:", studentAttendance);
    }
    if (isTeacherView) {
      const teacherClassFilters = {
        className: filters.className,
      };
      console.log("Teacher Class Filter submitted:", teacherClassFilters);
    } else
    if (isTeacher) {
      const teacherFilters = {
        slotID: filters.slotID,
        date: filters.date,
        className: filters.className,
      };
      console.log("Teacher Filter submitted:", teacherFilters);
    } else if (isAttendance) {
      const attendanceFilters = {
        className: filters.className,
        userID: filters.userID,
        dateFrom: filters.dateFrom,
        dateTo: filters.dateTo,
      };
      console.log("Attendance Filter submitted:", attendanceFilters);
    } else if (isClassManagement) {
      const classFilters = {
        className: filters.className,
        userID: filters.userID,
        batch: filters.batch,
      };
      console.log("Class Management Filter submitted:", classFilters);
    } else if (isUserManagement) {
      const adminFilters: SearchFilters = {
        search: filters.name,
        grade: filters.grade,
        roles: filters.roles,
        className: filters.class,
        phone: filters.phone,
      };
      
      console.log("User Management Filter submitted:", adminFilters);
      if (setFiltersUser) {
        setFiltersUser(adminFilters);
      }
    }
    else if (isClassArrangement) {
      const classArrangementFilters = {
        name: filters.name,
      };
      console.log("Class Arrangement Filter submitted:", classArrangementFilters);
    }
    else if (isNewSemester) {
      const newSemesterFilters = {
        name: filters.name,
        className: filters.class,
      };
      console.log("New Semester Filter submitted:", newSemesterFilters);
    }
  };

  return {
    state: { filters },
    handler: {
      handleFilterChange,
      onSubmit: handleFilterSubmit,
    },
  };
}

export default useTableToolBarHook;
