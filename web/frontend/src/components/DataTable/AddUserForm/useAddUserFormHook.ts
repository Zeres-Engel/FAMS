import { useForm } from "react-hook-form";
import { useEffect, useState } from "react";
import {
  AddUserFormValues,
  CreateUserPayload,
  Role,
} from "../../../model/userModels/userDataModels.model";
import { useDispatch } from "react-redux";
import { AppDispatch } from "../../../store/store";
import { createUser } from "../../../store/slices/userSlice";

export default function useAddUserFormHook() {
  const dispatch = useDispatch<AppDispatch>();
  const [userType, setUserType] = useState<Role>("student");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const currentYear = new Date().getFullYear();

  const batchOptions = Array.from({ length: 4 }, (_, i) => {
    const start = currentYear - 4 + i + 1;
    return `${start}-${start + 3}`;
  });
  useEffect(() => {
    return () => {
      if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    };
  }, [avatarPreview]);
  const defaultValues: AddUserFormValues = {
    firstName: "",
    lastName: "",
    backup_email: "",
    phone: "",
    gender: "",
    dateOfBirth: "",
    address: "",
    parentNames: ["", ""],
    parentPhones: ["", ""],
    parentCareers: ["", ""],
    parentEmails: ["", ""],
    parentGenders: [true, false],
    major: "",
    weeklyCapacity: "",
    role: userType,
    avatar: null,
  };

  const form = useForm<AddUserFormValues>({
    defaultValues,
    mode: "onChange",
  });

  const handleUserTypeChange = (value: Role) => {
    setUserType(value);
    form.setValue("role", value);
  };

  const onSubmit = (data: AddUserFormValues) => {
    const payload: CreateUserPayload = {
      ...data,
      gender: data.gender as "Male" | "Female",
      role: userType,
      weeklyCapacity: Number(data.weeklyCapacity),
    };

    // console.log("🚀 payload:", payload);
    dispatch(createUser(payload));
  };

  return {
    form,
    userType,
    handleUserTypeChange,
    onSubmit,
    batchOptions,
    avatarPreview,
    setAvatarPreview,
  };
}
