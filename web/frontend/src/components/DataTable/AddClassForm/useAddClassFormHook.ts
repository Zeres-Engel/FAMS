import { SelectChangeEvent } from "@mui/material";
import { useState, useEffect } from "react";
import { editClassForm } from "../../../model/tableModels/tableDataModels.model";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch } from "../../../store/store";
import { createClass } from "../../../store/slices/classSlice";
import { searchTeachers } from "../../../store/slices/teacherSlice";
import { RootState } from "../../../store/store"; // Đảm bảo rootState có chứa slice teacher

type FormErrors = Partial<Record<keyof editClassForm, string>>;

export default function useAddClassFormHook() {
  const [form, setForm] = useState<editClassForm>({
    className: "",
    teacherId: "",
    academicYear: "",
    grade: "10",
  });

  const [formErrors, setFormErrors] = useState<FormErrors>({});

  const dispatch = useDispatch<AppDispatch>();

  // Lấy danh sách giáo viên từ Redux store
  const teachers = useSelector((state: RootState) => state.teacher.teachers);
  const resetForm = () => {
    setForm({
      className: "",
      teacherId: "",
      academicYear: "",
      grade: "10",
    });
    setFormErrors({});
  };
  useEffect(() => {
    // Chỉ gọi API khi teachers chưa có dữ liệu
    if (!teachers || teachers.length === 0) {
      dispatch(searchTeachers({ search: "", page: 1, limit: 100 }));
    }
  }, [teachers, dispatch]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setFormErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleSelectChange = (e: SelectChangeEvent) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setFormErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const getAcademicYears = (range = 3) => {
    const currentYear = new Date().getFullYear();
    const startYear = currentYear - 1;
    return Array.from({ length: range }, (_, i) => {
      const yearStart = startYear + i;
      const yearEnd = yearStart + 1;
      return `${yearStart}-${yearEnd}`;
    });
  };

  const validateForm = (): boolean => {
    const errors: FormErrors = {};

    if (!form.className.trim()) errors.className = "Class Name is required";
    if (!form.teacherId.trim()) errors.teacherId = "Teacher Id is required";
    if (!form.grade.trim()) errors.grade = "Grade is required";
    if (!form.academicYear.trim()) errors.academicYear = "Academic Year is required";

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      const payload = {
        className: form.className,
        homeroomTeacherId: form.teacherId,
        grade: form.grade,
        academicYear: form.academicYear,
      };

      console.log("Creating class:", payload);
      dispatch(createClass(payload));
      resetForm();
    }
  };

  return {
    state: { form, formErrors, teachers },
    handler: {
      handleInputChange,
      handleSubmit,
      handleSelectChange,
      getAcademicYears,
    },
  };
}
