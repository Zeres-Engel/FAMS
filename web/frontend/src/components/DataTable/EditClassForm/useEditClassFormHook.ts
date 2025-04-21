import { useState } from "react";
import { editClassForm } from "../../../model/tableModels/tableDataModels.model";
import { SelectChangeEvent } from "@mui/material";
function useEditClassFormHook(formData: editClassForm) {
  console.log("formData", formData);
  
  const editClassDefaul: editClassForm = {
    className: "",
    teacherId: "",
    academicYear:"",
    grade:"10"
  };
  const getAcademicYears = (range = 3, baseYear?: string) => {
    let startYear: number;
  
    if (baseYear && baseYear.includes("-")) {
      const parsed = parseInt(baseYear.split("-")[0], 10);
      if (!isNaN(parsed)) {
        startYear = parsed - range;
      } else {
        startYear = new Date().getFullYear() - 1;
      }
    } else {
      startYear = new Date().getFullYear() - 1;
    }
  
    return Array.from({ length: range * 2 + 1 }, (_, i) => {
      const yearStart = startYear + i;
      const yearEnd = yearStart + 1;
      return `${yearStart}-${yearEnd}`;
    });
  };
  
  const normalizeAcademicYear = (year: string | undefined) => {
    if (!year) return "";
    return year.replace("–", "-"); // hoặc regex nếu cần rộng hơn
  };
  
  const [editingClass, setEditingClass] = useState<editClassForm>({
    ...editClassDefaul,
    ...formData,
    academicYear: normalizeAcademicYear(formData.academicYear),
  });
  const handleEditClassChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditingClass((prev: any) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };
  const handleSelectChange = (e: SelectChangeEvent) => {
    const { name, value } = e.target;
    setEditingClass((prev) => ({
      ...prev,
      [name]: value,
    }));
  };
  const state = { editingClass };
  const handler = { handleEditClassChange,handleSelectChange,getAcademicYears };
  return { state, handler };
}
export default useEditClassFormHook;
