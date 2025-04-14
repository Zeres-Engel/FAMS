import { SelectChangeEvent } from "@mui/material";
import { useState } from "react";

interface AddClassForm {
  className: string;
  teacherName: string;
  batch: string;
}

type FormErrors = Partial<Record<keyof AddClassForm, string>>;

export default function useAddClassFormHook() {
  const [form, setForm] = useState<AddClassForm>({
    className: "",
    teacherName: "",
    batch: "",
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

  const validateForm = (): boolean => {
    const errors: FormErrors = {};

    if (!form.className.trim()) {
      errors.className = "Class Name is required";
    }

    if (!form.teacherName.trim()) {
      errors.teacherName = "Teacher Name is required";
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
    handler: { handleInputChange, handleSubmit, handleSelectChange },
  };
}
