import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { AppDispatch } from "../../../store/store";
import { searchUsers } from "../../../store/slices/userSlice";
import { SearchFilters } from "../../../model/userModels/userDataModels.model";
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
  
  // Tạo default roles để đảm bảo luôn có giá trị
  const defaultRoles = isUserManagement ? ["student", "teacher", "parent", "supervisor"] : [];
  
  // Khởi tạo state với default roles
  const [filters, setFilters] = useState({
    class: defaultClass,
    name: "",
    grade: "",
    phone: "",
    roles: defaultRoles,
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
  
  // Debug
  console.log("TableToolBarHook initialized with roles:", filters.roles);

  const handleFilterChange = (
    key: keyof typeof filters,
    value: string | string[]
  ) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    
    // Apply the filter immediately after changing a value
    setTimeout(() => {
      applyFilters();
    }, 0);
  };
  
  // Add a separate function for applying filters
  const applyFilters = () => {
    if(isRFIDPage){
      const rfidSearch = {
        userID: filters.userID,
      };
      console.log("RFID Filter applied:", rfidSearch);
    }
    if (isNotifyPage) {
      const notifyFilters = {
        message: filters.message,
      };
      console.log("Notify Filter applied:", notifyFilters);
    }
    if(isRoleStudent) {
      const studentAttendance = {
        slotID: filters.slotID,
        date: filters.date,
      };
      console.log("Student Attendance Filter applied:", studentAttendance);
    }
    if (isTeacherView) {
      const teacherClassFilters = {
        className: filters.className,
      };
      console.log("Teacher Class Filter applied:", teacherClassFilters);
    } else
    if (isTeacher) {
      const teacherFilters = {
        slotID: filters.slotID,
        date: filters.date,
        className: filters.className,
      };
      console.log("Teacher Filter applied:", teacherFilters);
    } else if (isAttendance) {
      const attendanceFilters = {
        className: filters.className,
        userID: filters.userID,
        academicYear: filters.academicYear,
        dateFrom: filters.dateFrom,
        dateTo: filters.dateTo,
      };
      console.log("Attendance Filter applied:", attendanceFilters);
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
      console.log("Class Management Filter applied:", classFilters);
    } else if (isUserManagement) {
      const adminFilters: SearchFilters = {
        search: filters.name,
        grade: filters.grade,
        roles: filters.roles,
        className: filters.class,
        phone: filters.phone,
        academicYear: filters.academicYear,
      };
      
      console.log("User Management Filter applied:", adminFilters);
      if (setFiltersUser) {
        setFiltersUser(adminFilters);
      }
    }
    else if (isClassArrangement) {
      const classArrangementFilters = {
        name: filters.name,
      };
      console.log("Class Arrangement Filter applied:", classArrangementFilters);
    }
    else if (isNewSemester) {
      const newSemesterFilters = {
        name: filters.name,
        className: filters.class,
        academicYear: filters.academicYear,
      };
      console.log("New Semester Filter applied:", newSemesterFilters);
    }
  };
  
  // Keep the original handleFilterSubmit for compatibility
  const handleFilterSubmit = applyFilters;

  const getAcademicYears = (range = 3) => {
    const currentYear = new Date().getFullYear();
    const startYear = currentYear - range;
    const endYear = currentYear + range;
  
    const years: string[] = [];
  
    for (let year = startYear; year <= endYear; year++) {
      years.push(`${year}-${year + 1}`);
    }
  
    return years;
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
