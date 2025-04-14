import { useState } from "react";
import { AddUserForm, EditUserForm } from "../../../model/tableModels/tableDataModels.model";
import { RootState } from "../../../store/store";
import { useSelector } from "react-redux";
import { UserData } from "../../../model/userModels/userDataModels.model";

function useEditTableFormHook(formData: AddUserForm, userId: string) {
  const user = useSelector((state: RootState) =>
    state.users.user?.find(u => u.id === userId)
  );

  const editUserDefault: EditUserForm = {
    classId:[],
    firstName: "",
    lastName: "",
    dob: "",
    gender: true,
    address: "",
    phone: "",
    parentNames: ["", ""],
    parentCareers: ["", ""],
    parentPhones: ["", ""],
    parentGenders: [false, false],
    major: "",
    weeklyCapacity: "",
    role: "",
  };

  const formatUserEditData = (data: UserData | undefined): EditUserForm => {
    // if (!data)
       return editUserDefault;

    // return {
    //   firstName: data.details?.firstName || "",
    //   lastName: data.details?.lastName || "",
    //   dob: data.details?.dateOfBirth || "",
    //   gender: data.gender || "",
    //   address: data.details?.address || "",
    //   phone: data.details?.phone || "",
    //   parentNames: data.details?.parentNames || ["", ""],
    //   careers: data.details?.careers || ["", ""],
    //   parentPhones: data.details?.parentPhones || ["", ""],
    //   parentGenders: data.details?.parentGenders || [false, false],
    //   major: data.details?.major || "",
    //   weeklyCapacity: data.details?.weeklyCapacity || "",
    //   role: data.role || "",
    // };
  };

  const [editingUser, setEditingUser] = useState<EditUserForm>(
    formatUserEditData(user)
  );

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditingUser(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleArrayChange = (key: keyof EditUserForm, index: number) => 
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setEditingUser(prev => {
        const arr = [...(prev[key] as string[])];
        arr[index] = value;
        return { ...prev, [key]: arr };
      });
    };

  const handleParentGenderChange = (index: number) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const isFemale = e.target.value === "Female";
      setEditingUser(prev => {
        const newGenders = [...(prev.parentGenders || [false, false])];
        newGenders[index] = isFemale;
        return { ...prev, parentGenders: newGenders };
      });
    };

  return {
    state: { editingUser },
    handler: {
      handleEditChange,
      handleArrayChange,
      handleParentGenderChange,
    },
  };
}

export default useEditTableFormHook;
