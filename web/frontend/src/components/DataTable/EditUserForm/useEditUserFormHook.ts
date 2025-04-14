import { useState } from "react";
import { AddUserForm } from "../../../model/tableModels/tableDataModels.model";

function useEditTableFormHook(formData: AddUserForm) {
  const editUserDefault: AddUserForm = {
    fullName: "",
    dob: "",
    gender: "",
    address: "",
    phone: "",
    parentNames: "",
    careers: "",
    parentPhones: "",
    parentGenders: "",
    major: "",
    weeklyCapacity: "",
    role: "",
  };
  const [editingUser, setEditingUser] = useState<AddUserForm>(
    formData || editUserDefault
  );
  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditingUser((prev: any) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const state = { editingUser };
  const handler = { handleEditChange };
  return { state, handler };
}
export default useEditTableFormHook;
