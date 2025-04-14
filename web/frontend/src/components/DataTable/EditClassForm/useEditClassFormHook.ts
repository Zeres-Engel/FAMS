import { useState } from "react";
import { editClassForm } from "../../../model/tableModels/tableDataModels.model";
import { SelectChangeEvent } from "@mui/material";
function useEditClassFormHook(formData: editClassForm) {
  const editClassDefaul: editClassForm = {
    className: "",
    teacherId: "",
    batch: "",
  };
  const [editingClass, setEditingClass] = useState<editClassForm>(
    formData || editClassDefaul
  );
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
  const handler = { handleEditClassChange,handleSelectChange };
  return { state, handler };
}
export default useEditClassFormHook;
