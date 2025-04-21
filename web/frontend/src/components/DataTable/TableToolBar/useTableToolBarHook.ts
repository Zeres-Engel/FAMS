import { useState } from "react";
import { useDispatch } from "react-redux";
import { AppDispatch } from "../../../store/store";
import { searchUsers } from "../../../store/slices/userSlice";
import { SearchFilters } from "../../../model/userModels/userDataModels.model";
import { ac } from "react-router/dist/development/route-data-BL8ToWby";
import { SearchClassFilters } from "../../../model/classModels/classModels.model";

function useTableToolBarHook({
  isAttendance,
  isClassManagement,
  isUserManagement,
  isTeacher,
  setFiltersUser,
  setFiltersClass,
  isClassArrangement,
  isNewSemester,
  isTeacherView,
  defaultClass,
  isRoleStudent,
  isNotifyPage,
  isRFIDPage
}: {
  isAttendance: boolean;
  isClassManagement: boolean;
  isUserManagement: boolean;
  isTeacher?: boolean;
  setFiltersUser?: React.Dispatch<React.SetStateAction<SearchFilters>>;
  setFiltersClass?: React.Dispatch<React.SetStateAction<SearchClassFilters>>;
  isClassArrangement?: boolean;
  isNewSemester?: boolean;
  isTeacherView?: boolean;
  defaultClass?: string;
  isRoleStudent?: boolean;
  isNotifyPage?: boolean;
  isRFIDPage?: boolean;
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
    academicYear: "",
  });

  const handleFilterChange = (
    key: keyof typeof filters,
    value: string | string[]
  ) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };
  const getAcademicYears = (range = 2) => {
    const currentYear = new Date().getFullYear();
    const startYear = currentYear - range;
    const endYear = currentYear + range;
  
    const years: string[] = [];
  
    for (let year = startYear; year <= endYear; year++) {
      years.push(`${year}-${year + 1}`);
    }
  
    return years;
  };
  const handleFilterSubmit = () => {
    if(isRFIDPage){
      const rfidSearch = {
        userID: filters.userID,
      };
      console.log("RFID Filter submitted:", rfidSearch);
    }
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
        academicYear: filters.academicYear,
        dateFrom: filters.dateFrom,
        dateTo: filters.dateTo,
      };
      console.log("Attendance Filter submitted:", attendanceFilters);
    } else if (isClassManagement) {
      const classFilters: SearchClassFilters = {
        search: filters.class,
        academicYear: filters.academicYear,
        grade: filters.grade,
        homeroomTeacherd: filters.userID,
      };
      if (setFiltersClass) {
        setFiltersClass(classFilters);
      }
      console.log("Class Management Filter submitted:", classFilters);
    } else if (isUserManagement) {
      const adminFilters: SearchFilters = {
        search: filters.name,
        grade: filters.grade,
        roles: filters.roles,
        className: filters.class,
        phone: filters.phone,
        academicYear: filters.academicYear,
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
        academicYear: filters.academicYear,
      };
      console.log("New Semester Filter submitted:", newSemesterFilters);
    }
  };

  return {
    state: { filters },
    handler: {
      handleFilterChange,
      onSubmit: handleFilterSubmit,
      getAcademicYears
    },
  };
}

export default useTableToolBarHook;
