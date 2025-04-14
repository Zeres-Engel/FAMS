import { useState } from "react";
import { useDispatch } from "react-redux";
import { AppDispatch } from "../../../store/store";
import { searchUsers } from "../../../store/slices/userSlice";
import { SearchFilters } from "../../../model/userModels/userDataModels.model";

function useTableToolBarHook({
  isAttendance,
  isClassManagement,
  isUserManagement,
  setFiltersUser
}: {
  isAttendance: boolean;
  isClassManagement: boolean;
  isUserManagement: boolean;
  setFiltersUser?: React.Dispatch<React.SetStateAction<SearchFilters>>;
}) {
  const dispatch = useDispatch<AppDispatch>();
  const [filters, setFilters] = useState({
    class: "",
    name: "",
    grade: "",
    phone: "",
    roles: [] as string[],
    className: "",
    userID: "",
    batch: "",
    dateFrom: "",
    dateTo: "",
  });

  const handleFilterChange = (
    key: keyof typeof filters,
    value: string | string[]
  ) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleFilterSubmit = () => {
    if (isAttendance) {
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
