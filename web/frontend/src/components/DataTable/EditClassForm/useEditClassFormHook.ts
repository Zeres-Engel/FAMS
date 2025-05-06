import { useState, useEffect } from "react";
import { editClassForm } from "../../../model/tableModels/tableDataModels.model";
import { SelectChangeEvent } from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../../../store/store";
import { searchTeachers } from "../../../store/slices/teacherSlice";
import axios from "axios";

// Kiểu cho form errors
type FormErrors = Partial<Record<keyof editClassForm, string>>;

function useEditClassFormHook(formData: editClassForm) {
  const dispatch = useDispatch<AppDispatch>();

  const editClassDefault: editClassForm = {
    className: "",
    teacherId: "",
    academicYear: "",
    grade: "10",
  };

  const normalizeAcademicYear = (year: string | undefined) => {
    if (!year) return "";
    return year.replace("–", "-");
  };

  const [editingClass, setEditingClass] = useState<editClassForm>({
    ...editClassDefault,
    ...formData,
    academicYear: normalizeAcademicYear(formData.academicYear),
  });

  const [formErrors, setFormErrors] = useState<FormErrors>({});
  
  // State local để lưu trữ danh sách giáo viên đã lọc
  const [availableTeachers, setAvailableTeachers] = useState<any[]>([]);

  // Lấy danh sách giáo viên từ Redux store
  const allTeachers = useSelector((state: RootState) => state.teacher.teachers || []);

  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        // Fetch all teachers
        const isNotify = true; // Initialize isNotify with a default value
        await dispatch(searchTeachers({ search: "", page: 1, limit: 100, isNotify }));
        
        // Fetch all classes to get list of homeroom teachers
        const classesResponse = await axios.get('http://fams.io.vn/api-nodejs/classes?search=&academicYear=');
        
        if (allTeachers && allTeachers.length > 0 && classesResponse.data?.success) {
          // Extract all homeroom teacher IDs from classes
          const assignedTeacherIds = new Set(
            classesResponse.data.data.map((cls: any) => cls.homeroomTeacherId)
          );
          
          // Kiểm tra xem giáo viên đã lọc
          let filteredTeachersList: any[] = [];
          
          // If editing an existing class, include its current teacher and all unassigned teachers
          if (editingClass?.teacherId) {
            // Filter to get only unassigned teachers + the current teacher
            filteredTeachersList = allTeachers.filter(
              (teacher: any) => !assignedTeacherIds.has(teacher.userId) || teacher.userId === editingClass.teacherId
            );
          } else {
            // New class case - only show unassigned teachers
            filteredTeachersList = allTeachers.filter(
              (teacher: any) => !assignedTeacherIds.has(teacher.userId)
            );
          }
          
          console.log(`Found ${filteredTeachersList.length} available teachers for editing`);
          setAvailableTeachers(filteredTeachersList);
        }
      } catch (error) {
        console.error('Error fetching teachers:', error);
      }
    };

    fetchTeachers();
  }, [dispatch, editingClass?.teacherId, allTeachers]);

  const handleEditClassChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditingClass((prev) => ({
      ...prev,
      [name]: value,
    }));
    setFormErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleSelectChange = (e: SelectChangeEvent) => {
    const { name, value } = e.target;
    setEditingClass((prev) => ({
      ...prev,
      [name]: value,
    }));
    setFormErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const getAcademicYears = (range = 3, baseYear?: string) => {
    let startYear: number;

    if (baseYear && baseYear.includes("-")) {
      const parsed = parseInt(baseYear.split("-")[0], 10);
      startYear = !isNaN(parsed) ? parsed - range : new Date().getFullYear() - 1;
    } else {
      startYear = new Date().getFullYear() - 1;
    }

    return Array.from({ length: range * 2 + 1 }, (_, i) => {
      const yearStart = startYear + i;
      const yearEnd = yearStart + 1;
      return `${yearStart}-${yearEnd}`;
    });
  };

  const validateForm = (): boolean => {
    const errors: FormErrors = {};
    if (!editingClass.className.trim()) errors.className = "Class Name is required";
    if (!editingClass.teacherId.trim()) errors.teacherId = "Teacher is required";
    if (!editingClass.grade) errors.grade = "Grade is required";
    if (!editingClass.academicYear.trim()) errors.academicYear = "Academic Year is required";

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const state = { editingClass, formErrors, teachers: availableTeachers };
  const handler = { handleEditClassChange, handleSelectChange, getAcademicYears, validateForm };

  return { state, handler };
}

export default useEditClassFormHook;
