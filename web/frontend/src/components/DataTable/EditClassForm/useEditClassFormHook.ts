import { useState, useEffect } from "react";
import { editClassForm } from "../../../model/tableModels/tableDataModels.model";
import { SelectChangeEvent } from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../../../store/store";
import { searchTeachers } from "../../../store/slices/teacherSlice";

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

  // Lấy danh sách giáo viên từ Redux store
  const teachers = useSelector((state: RootState) => state.teacher.teachers);

  useEffect(() => {
    if (!teachers || teachers.length === 0) {
      dispatch(searchTeachers({ search: "", page: 1, limit: 100 }));
    }
  }, [teachers, dispatch]);

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

  const state = { editingClass, formErrors, teachers };
  const handler = { handleEditClassChange, handleSelectChange, getAcademicYears, validateForm };

  return { state, handler };
}

export default useEditClassFormHook;
