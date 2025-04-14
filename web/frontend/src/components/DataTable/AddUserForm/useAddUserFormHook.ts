import { useState } from "react";
import { AddUserForm } from "../../../model/tableModels/tableDataModels.model";

type UserType = "student" | "teacher";
type FormErrors = Partial<Record<keyof AddUserForm, string>>;

export default function useAddUserFormHook() {
  const [userType, setUserType] = useState<UserType>("student");
  const [form, setForm] = useState<AddUserForm>({
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
    role: "student",
  });
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setForm(prev => ({
      ...prev,
      [name]: value,
    }));

    // Clear the error for the field being changed
    setFormErrors(prev => ({
      ...prev,
      [name]: "",
    }));
  };

  const handleUserTypeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUserType(e.target.value as UserType);
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    if (!form.fullName.trim()) newErrors.fullName = "Full Name is required";
    if (!form.phone.trim()) newErrors.phone = "Phone is required";
    if (!form.gender.trim()) newErrors.gender = "Gender is required";
    if (!form.dob.trim()) newErrors.dob = "Date of Birth is required";
    if (!form.address.trim()) newErrors.address = "Address is required";

    if (userType === "student") {
      if (!form.parentNames.trim())
        newErrors.parentNames = "Parent Names are required";
      if (!form.careers.trim()) newErrors.careers = "Careers are required";
      if (!form.parentPhones.trim())
        newErrors.parentPhones = "Parent Phones are required";
      if (!form.parentGenders.trim())
        newErrors.parentGenders = "Parent Genders are required";
    }

    if (userType === "teacher") {
      if (!form.major.trim()) newErrors.major = "Major is required";
      if (!form.weeklyCapacity.trim())
        newErrors.weeklyCapacity = "Weekly Capacity is required";
    }

    setFormErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      form.role = userType;
      console.log("Submitted:", { userType, form });
      // You can handle API submission here
    }
  };

  return {
    state: { userType, form, formErrors },
    handler: { handleInputChange, handleUserTypeChange, handleSubmit },
  };
}
