import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../../../store/store";
import { searchUsers } from "../../../store/slices/userSlice";
import { SearchFilters } from "../../../model/userModels/userDataModels.model";
import { SearchClassFilters } from "../../../model/classModels/classModels.model";
import { fetchClassesByUserId } from "../../../store/slices/classByIdSlice";
import {
  AttendanceSearchParam,
  ClassPageList,
} from "../../../model/tableModels/tableDataModels.model";

function useTableToolBarHook({
  isAttendance,
  isClassManagement,
  isUserManagement,
  isTeacher,
  setFiltersUser,
  setFiltersClass,
  setFiltersClassPage,
  setFiltersAttendancePage,
  isClassArrangement,
  isNewSemester,
  isTeacherView,
  defaultClass,
  isRoleStudent,
  isNotifyPage,
  isRFIDPage,
  isRoleParent,
  classYears
}: {
  isAttendance: boolean;
  isClassManagement: boolean;
  isUserManagement: boolean;
  isTeacher?: boolean;
  setFiltersUser?: React.Dispatch<React.SetStateAction<SearchFilters>>;
  setFiltersClass?: React.Dispatch<React.SetStateAction<SearchClassFilters>>;
  setFiltersClassPage?: React.Dispatch<React.SetStateAction<number>>;
  setFiltersAttendancePage?: React.Dispatch<
    React.SetStateAction<AttendanceSearchParam>
  >;
  isClassArrangement?: boolean;
  classYears?: Array<{className: string, academicYear: string}>
  isNewSemester?: boolean;
  isTeacherView?: boolean;
  defaultClass?: string;
  isRoleStudent?: boolean;
  isRoleParent?:boolean;
  isNotifyPage?: boolean;
  isRFIDPage?: boolean;
}) {
  const dispatch = useDispatch<AppDispatch>();
  
  // Tạo default roles để đảm bảo luôn có giá trị
  const defaultRoles = isUserManagement ? ["student", "teacher", "parent"] : [];
  
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
    classId: 0,
    status: "",
    slotNumber: '',
    subjectId: 0,
    subjectName: "",
    semester: 0,
    year: "",
  });
  const [showTeacherAttendance, setShowTeacherAttendance] = useState(false);
  const classList = useSelector((state: RootState) => state.classById.classes);
  const parentData = useSelector((state: RootState) => state.parentData.data);
  interface Child {
    userId: string;
  }

  interface ParentDetail {
    children: Child[];
  }

  interface ParentData {
    details: ParentDetail;
  }
  interface ChildData {
    childId: string;
  }

  const childData: ChildData[] = isRoleParent ? (parentData[0] as ParentData).details.children.map(
    (child: Child): ChildData => ({ childId: child.userId })
  ) : [];
  
  const classAttendanceList: ClassPageList[] = classList.map(item => ({
    classId: item.classId,
    className: `${item.className} - ${item.academicYear}`,
  }));
  const handleCallAPIClass = () => {
    dispatch(fetchClassesByUserId(filters.userID));
  };  
  const [academicYearsForClass, setAcademicYearsForClass] = useState<string[]>([]);
  const [classNamesFiltered, setClassNamesFiltered] = useState<string[]>([]);
  useEffect(() => {
    if(classYears && isClassManagement){
      console.log('classYears in useTableToolBarHook:', classYears);
      
      const uniqueAcademicYears = Array.from(
        new Set((classYears ?? []).map((item) => item.academicYear))
      );
      const uniqueClassNames = Array.from( 
        new Set((classYears ?? []).map((item) => item.className))
      );
      
      console.log('uniqueAcademicYears:', uniqueAcademicYears);
      
      // Only update state if the values have actually changed
      if (JSON.stringify(uniqueAcademicYears) !== JSON.stringify(academicYearsForClass)) {
        setAcademicYearsForClass(uniqueAcademicYears);
      }
      
      // Only update state if the values have actually changed
      if (JSON.stringify(uniqueClassNames) !== JSON.stringify(classNamesFiltered)) {
        setClassNamesFiltered(uniqueClassNames);
      }
    }
  }, [classYears, isClassManagement, academicYearsForClass, classNamesFiltered]);

  const filterClassNamesByYear = (year: string) => {
    const filteredClassNames = (classYears ?? [])
      .filter((item) => item.academicYear === year)
      .map((item) => item.className);

    const uniqueClassNames = Array.from(new Set(filteredClassNames));

    setClassNamesFiltered(uniqueClassNames);
  };

  const handleFilterChange = (
    key: keyof typeof filters,
    value: string | string[] | number
  ) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };
  const getYears = (range = 5): number[] => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: range + 1 }, (_, i) => currentYear - i);
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
    if(showTeacherAttendance){
      const showTeacher ={
        semester: filters.semester,
        year: filters.year
      }
      console.log("show teacher attendance: ", showTeacher);
      return;
    }
    if (isRFIDPage) {
      const rfidSearch = {
        userID: filters.userID,
      };
      console.log("RFID Filter applied:", rfidSearch);
      return;
    }
    if (isNotifyPage) {
      const notifyFilters = {
        message: filters.message,
      };
      console.log("Notify Filter submitted:", notifyFilters);
    }
    if (isRoleStudent && isRoleParent) {
      const attendanceFilters: AttendanceSearchParam = {
        userId: filters.userID,
        subjectId: '',
        classId: '',
        teacherName: "",
        status: filters.status,
        dateFrom:filters.dateFrom,
        dateTo:filters.dateTo,
        slotNumber: `${filters.slotNumber}`,
      };
      if (setFiltersAttendancePage) {
        setFiltersAttendancePage(attendanceFilters);
      }
      return;
    }
    if (isRoleStudent) {
      const attendanceFilters: AttendanceSearchParam = {
        userId: '',
        subjectId: '',
        classId: '',
        teacherName: "",
        status: filters.status,
        dateFrom:filters.dateFrom,
        dateTo:filters.dateTo,
        slotNumber: `${filters.slotNumber}`,
      };
      if (setFiltersAttendancePage) {
        setFiltersAttendancePage(attendanceFilters);
      }
      return;
    }
    if (isTeacherView) {
      if (setFiltersClassPage) {
        setFiltersClassPage(filters.classId);
      }
      return;
    } else if (isTeacher) {
      const attendanceFilters: AttendanceSearchParam = {
        userId: filters.userID,
        subjectId: '',
        classId: `${filters.classId}`,
        teacherName: "",
        status: filters.status,
        dateFrom:filters.dateFrom,
        dateTo:filters.dateTo,
        slotNumber: `${filters.slotID}`,
      };
      if (setFiltersAttendancePage) {
        setFiltersAttendancePage(attendanceFilters);
      }
      return;
    } else if (isAttendance) {
      const attendanceFilters: AttendanceSearchParam = {
        userId: filters.userID,
        subjectId: filters.subjectId !== 0 ? `${filters.subjectId}` : '',
        classId: `${filters.classId}`,
        teacherName: "",
        status: filters.status,
        dateFrom:filters.dateFrom,
        dateTo:filters.dateTo,
        slotNumber: `${filters.slotNumber}`,
      };
      if (setFiltersAttendancePage) {
        setFiltersAttendancePage(attendanceFilters);
      }

      console.log("Attendance Filter submitted:", attendanceFilters);
      return;
    } else if (isClassManagement) {
      const classFilters: SearchClassFilters = {
        search: filters.class,
        academicYear: filters.academicYear,
        grade: filters.grade,
        homeroomTeacherId: filters.userID,
        preserveAcademicYears: true
      };
      if (setFiltersClass) {
        setFiltersClass(classFilters);
      }
      console.log("Class Management Filter submitted:", classFilters);
      return;
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
      return;
    } else if (isClassArrangement) {
      const classArrangementFilters = {
        name: filters.name,
      };
      console.log(
        "Class Arrangement Filter submitted:",
        classArrangementFilters
      );
      return;
    } else if (isNewSemester) {
      const newSemesterFilters = {
        name: filters.name,
        className: filters.class,
        academicYear: filters.academicYear,
      };
      console.log("New Semester Filter submitted:", newSemesterFilters);
      return;
    }
  };
  
  // Keep the original handleFilterSubmit for compatibility
  // const handleFilterSubmit = applyFilters;

  // const getAcademicYears = (range = 3) => {
  //   const currentYear = new Date().getFullYear();
  //   const startYear = currentYear - range;
  //   const endYear = currentYear + range;
  
  //   const years: string[] = [];
  
  //   for (let year = startYear; year <= endYear; year++) {
  //     years.push(`${year}-${year + 1}`);
  //   }
  
  //   return years;
  // };

  return {
    state: { filters, classAttendanceList, showTeacherAttendance,academicYearsForClass,classNamesFiltered,childData },
    handler: {
      handleFilterChange,
      onSubmit: handleFilterSubmit,
      getAcademicYears,
      handleCallAPIClass,
      setShowTeacherAttendance,
      getYears,
      filterClassNamesByYear
    },
  };
}

export default useTableToolBarHook;
