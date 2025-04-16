import { SelectChangeEvent } from "@mui/material";
import { useState } from "react";
import { editClassForm } from "../../../model/tableModels/tableDataModels.model";


type FormErrors = Partial<Record<keyof editClassForm, string>>;

export default function useAddClassFormHook() {
  const [form, setForm] = useState<editClassForm>({
    className: "",
    teacherId: "",
    academicYear:"",
    grade:"10"
  });

  const [formErrors, setFormErrors] = useState<FormErrors>({});

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setForm(prev => ({
      ...prev,
      [name]: value,
    }));

    setFormErrors(prev => ({
      ...prev,
      [name]: "",
    }));
  };
  const handleSelectChange = (e: SelectChangeEvent) => {
    const { name, value } = e.target;

    setForm(prev => ({
      ...prev,
      [name]: value,
    }));

    setFormErrors(prev => ({
      ...prev,
      [name]: "",
    }));
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

    if (!form.className.trim()) {
      errors.className = "Class Name is required";
    }

    if (!form.teacherId.trim()) {
      errors.teacherId = "Teacher Id is required";
    }
    if (!form.grade.trim()) {
      errors.grade = "Grade is required";
    }
    if (!form.academicYear.trim()) {
      errors.academicYear = "Academic Year is required";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      console.log("Form submitted:", form);
      // call API here if needed
    }
  };

  return {
    state: { form, formErrors },
    handler: { handleInputChange, handleSubmit, handleSelectChange,getAcademicYears },
  };
}
