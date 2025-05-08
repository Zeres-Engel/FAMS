import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../store/useStoreHook";
import {
  ClassPageList,
  ClassStudent,
  ClassStudentHeadCell,
} from "../../model/tableModels/tableDataModels.model";
import { SearchFilters } from "../../model/userModels/userDataModels.model";
import { fetchClassesByUserId } from "../../store/slices/classByIdSlice";
import { useSelector } from "react-redux";
import { RootState } from "../../store/store";
import { getClassUsers } from "../../store/slices/classUserSlice";
import { searchUsers } from "../../store/slices/userSlice";

function useClassPageHook() {
  const dispatch = useAppDispatch();
  const role = useAppSelector(state => state.authUser.role);
  const userData = useAppSelector(state => state.login.loginData);
  const classList = useSelector((state: RootState) => state.classById.classes);
  const classOptions = classList?.map(c => c.className) || [];
  const classPageList: ClassPageList[] = classList.map(item => ({
    classId: item.classId,
    className: `${item.className} - ${item.academicYear}`,
  }));
  const hoomroomTeacherList = classList.map(item => ({
    homeroomTeacherId: item.homeroomTeacherId,
    className: `${item.className} - ${item.academicYear}`,
    classId:item.classId
  }));
  const classPageData = useSelector(
    (state: RootState) => state.classUser.students
  );
  const [filters, setFiltersClassPage] = useState<number>(0);
  useEffect(() => {
    if (userData && classList.length === 0 && role !== "parent") {
      dispatch(fetchClassesByUserId(userData?.userId));
    }
  }, [dispatch, userData, classList,role]);
  useEffect(() => {
    if (filters) {
      dispatch(getClassUsers(filters));
    }
  }, [filters, dispatch]);
  useEffect(()=>{
    if(role === "parent"){
      dispatch(searchUsers({search:userData?.userId}))
    }
  },[dispatch, role, userData?.userId])
  useEffect(() => {
    if (classList.length > 0 && !filters && role !== "parent") {
      const lastClass = classList[classList.length - 1];
      if (lastClass?.classId) {
        setFiltersClassPage(lastClass.classId);
      }
    }
  }, [classList, filters, role]);  
  const [userMainData, setUserMainData] = useState<ClassStudent[]>([]);
  const headCellsData: ClassStudentHeadCell[] = [
    {
      id: "id",
      numeric: false,
      disablePadding: true,
      label: "ID",
    },
    {
      id: "fullName",
      numeric: false,
      disablePadding: true,
      label: "Full name",
    },
    {
      id: "avatar",
      numeric: false,
      disablePadding: false,
      label: "Avatar",
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
      id: "role",
      numeric: false,
      disablePadding: false,
      label: "Role",
    },
  ];
  const isCheckBox = false;
  const tableTitle = "Student Data";
  const state = {
    headCellsData,
    userMainData,
    tableTitle,
    isCheckBox,
    role,
    classOptions,
    classPageList,
    classPageData,
    hoomroomTeacherList,
  };
  const handler = { setFiltersClassPage };

  return { state, handler };
}

export default useClassPageHook;
