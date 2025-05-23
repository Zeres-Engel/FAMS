  import React, { useState } from "react";
  import {
    Box,
    TextField,
    FormControl,
    FormLabel,
    RadioGroup,
    FormControlLabel,
    Radio,
    Button,
    InputAdornment,
    FormHelperText,
  } from "@mui/material";
  import { Controller, useWatch } from "react-hook-form";
  import useAddUserFormHook from "./useAddUserFormHook";

  const AddUserForm: React.FC = () => {
    const {
      form: {
        control,
        handleSubmit,
        register,
        formState: { errors },
        setValue,
      },
      userType,
      handleUserTypeChange,
      onSubmit,
      avatarPreview,
      setAvatarPreview,
    } = useAddUserFormHook();

    const parentNames = useWatch({ control, name: "parentNames" });
    const parentPhones = useWatch({ control, name: "parentPhones" });
    const parentCareers = useWatch({ control, name: "parentCareers" });
    const parentEmails = useWatch({ control, name: "parentEmails" });
    const parentGenders = useWatch({ control, name: "parentGenders" });
    const avatar = useWatch({ control, name: "avatar" });

    const [parentErrors, setParentErrors] = useState<string[]>(["", ""]);

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        if (file.size > 5 * 1024 * 1024) {
          alert("File size must be under 5MB");
          return;
        }
        setValue("avatar", file);
        setAvatarPreview(URL.createObjectURL(file));
      } else {
        setValue("avatar", null);
        setAvatarPreview(null);
      }
    };

    const handleParentStringFieldChange = (
      fieldName:
        | "parentNames"
        | "parentPhones"
        | "parentCareers"
        | "parentEmails",
      index: number,
      value: string
    ) => {
      const map: any = {
        parentNames,
        parentPhones,
        parentCareers,
        parentEmails,
      };
      const updated = [...(map[fieldName] || [])];
      updated[index] = value;
      setValue(fieldName, updated);
    };

    const handleParentGenderChange = (index: number, value: boolean) => {
      const updated = [...(parentGenders || [])];
      updated[index] = value;
      setValue("parentGenders", updated);
    };

    const handleValidatedSubmit = (data: any) => {
      const newErrors = ["", ""];
      let hasError = false;

      for (let i = 0; i < 2; i++) {
        const anyFilled =
          parentNames?.[i] ||
          parentPhones?.[i] ||
          parentCareers?.[i] ||
          parentEmails?.[i];
        const allFilled =
          parentNames?.[i] &&
          parentPhones?.[i] &&
          parentCareers?.[i] &&
          parentEmails?.[i];
        if (anyFilled && !allFilled) {
          newErrors[i] = `Please fill in all fields for Parent ${i + 1}`;
          hasError = true;
        }
      }

      setParentErrors(newErrors);
      if (hasError) return;

      onSubmit(data);
    };

    const today = new Date();
    const minTeacher = new Date(today.getFullYear() - 60, 0, 1);
    const maxTeacher = new Date(today.getFullYear() - 22, 11, 31);
    const maxStudent = new Date(today.getFullYear() - 16, 11, 31);

    return (
      <Box
        component="form"
        onSubmit={handleSubmit(handleValidatedSubmit)}
        sx={{ p: 3, display: "flex", flexDirection: "column", gap: 2 }}
      >
        {/* User Type */}
        <Box sx={{ display: "flex", gap: 2 }}>
          {["student", "teacher"].map(type => (
            <FormControlLabel
              key={type}
              control={
                <Radio
                  checked={userType === type}
                  onChange={() => handleUserTypeChange(type as any)}
                />
              }
              label={type.charAt(0).toUpperCase() + type.slice(1)}
            />
          ))}
        </Box>

        {/* Basic Info */}
        <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
          <TextField
            label="First Name"
            {...register("firstName", { required: "Required" })}
            error={!!errors.firstName}
            helperText={errors.firstName?.message}
          />
          <TextField
            label="Last Name"
            {...register("lastName", { required: "Required" })}
            error={!!errors.lastName}
            helperText={errors.lastName?.message}
          />
          {userType === "teacher" ? (
            <TextField
              label="Email"
              {...register("email", {
                required: "Required",
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: "Invalid email",
                },
              })}
              error={!!errors.email}
              helperText={errors.email?.message}
            />
          ) : (
            <TextField
              label="Backup Email"
              {...register("backup_email", {
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: "Invalid email",
                },
              })}
              error={!!errors.backup_email}
              helperText={errors.backup_email?.message || "Optional"}
            />
          )}
          <TextField
            label="Phone"
            {...register("phone", {
              required: "Required",
              pattern: {
                value: /^\d{10,11}$/,
                message: "Phone must be 10-11 digits",
              },
            })}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">+84</InputAdornment>
              ),
              inputProps: { maxLength: 11 },
            }}
            onInput={(e: React.ChangeEvent<HTMLInputElement>) => {
              e.target.value = e.target.value.replace(/\D/g, "").slice(0, 11);
            }}
            error={!!errors.phone}
            helperText={errors.phone?.message}
          />
          <FormControl error={!!errors.gender}>
            <FormLabel>Gender</FormLabel>
            <Controller
              name="gender"
              control={control}
              rules={{ required: "Required" }}
              render={({ field }) => (
                <RadioGroup row {...field}>
                  <FormControlLabel
                    value="Male"
                    control={<Radio />}
                    label="Male"
                  />
                  <FormControlLabel
                    value="Female"
                    control={<Radio />}
                    label="Female"
                  />
                </RadioGroup>
              )}
            />
            <FormHelperText>{errors.gender?.message}</FormHelperText>
          </FormControl>
          <Controller
            name="dateOfBirth"
            control={control}
            rules={{
              required: "Required",
              validate: value => {
                const age =
                  new Date().getFullYear() - new Date(value).getFullYear();
                if (userType === "student" && age < 16)
                  return "Student must be at least 16 years old";
                if (userType === "teacher" && age < 22)
                  return "Teacher must be at least 22 years old";
                return true;
              },
            }}
            render={({ field }) => (
              <TextField
                {...field}
                type="date"
                label="Date of Birth"
                InputLabelProps={{ shrink: true }}
                inputProps={{
                  min:
                    userType === "student"
                      ? "1980-01-01"
                      : minTeacher.toISOString().split("T")[0],
                  max:
                    userType === "student"
                      ? maxStudent.toISOString().split("T")[0]
                      : maxTeacher.toISOString().split("T")[0],
                }}
                error={!!errors.dateOfBirth}
                helperText={errors.dateOfBirth?.message}
              />
            )}
          />
        </Box>

        {/* Address */}
        <TextField
          label="Address"
          {...register("address", { required: "Required" })}
          error={!!errors.address}
          helperText={errors.address?.message}
          fullWidth
        />

        {/* Avatar Upload */}
        <FormControl>
          <FormLabel>Upload Avatar</FormLabel>
          <Button variant="outlined" component="label">
            Choose Image
            <input
              type="file"
              accept="image/*"
              hidden
              onChange={handleAvatarChange}
            />
          </Button>
          {avatarPreview && <img src={avatarPreview} alt="preview" width={80} />}
          {avatar && <FormHelperText>Selected: {avatar.name}</FormHelperText>}
        </FormControl>

        {/* Teacher fields */}
        {userType === "teacher" && (
          <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
            <TextField
              label="Major"
              {...register("major", { required: "Required" })}
              error={!!errors.major}
              helperText={errors.major?.message}
            />
            <TextField
              label="Weekly Capacity"
              {...register("weeklyCapacity", { required: "Required" })}
              error={!!errors.weeklyCapacity}
              helperText={errors.weeklyCapacity?.message}
            />
            <TextField
              label="Degree"
              {...register("degree")}
              error={!!errors.degree}
              helperText={errors.degree?.message}
            />
          </Box>
        )}

        {/* Parent section */}
        {userType === "student" && (
          <>
            <FormLabel>Parent Information</FormLabel>
            {[0, 1].map(i => (
              <Box key={i} sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                <TextField
                  label={`Parent Name ${i + 1}`}
                  {...register(`parentNames.${i}`, {
                    validate: (_, formValues) => {
                      const anyFilled =
                        formValues.parentPhones?.[i] ||
                        formValues.parentCareers?.[i] ||
                        formValues.parentEmails?.[i];
                      if (anyFilled && !_?.trim())
                        return "Parent name required if other fields are filled";
                      return true;
                    },
                  })}
                  error={!!errors.parentNames?.[i]}
                  helperText={errors.parentNames?.[i]?.message}
                />

                <TextField
                  label={`Parent Phone ${i + 1}`}
                  {...register(`parentPhones.${i}`, {
                    validate: (value, formValues) => {
                      const anyFilled =
                        formValues.parentNames?.[i] ||
                        formValues.parentCareers?.[i] ||
                        formValues.parentEmails?.[i];
                      if (anyFilled && !value) return "Phone required";
                      if (value && !/^\d{10,11}$/.test(value))
                        return "Phone must be 10-11 digits";
                      return true;
                    },
                  })}
                  value={parentPhones?.[i] || ""}
                  onInput={(e: React.ChangeEvent<HTMLInputElement>) => {
                    const cleaned = e.target.value
                      .replace(/\D/g, "")
                      .slice(0, 11);
                    setValue(`parentPhones.${i}`, cleaned);
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">+84</InputAdornment>
                    ),
                    inputProps: { maxLength: 11 },
                  }}
                  error={!!errors.parentPhones?.[i]}
                  helperText={errors.parentPhones?.[i]?.message}
                />

                <TextField
                  label={`Parent Career ${i + 1}`}
                  {...register(`parentCareers.${i}`, {
                    validate: (_, formValues) => {
                      const anyFilled =
                        formValues.parentPhones?.[i] ||
                        formValues.parentNames?.[i] ||
                        formValues.parentEmails?.[i];
                      if (anyFilled && !_?.trim()) return "Career required";
                      return true;
                    },
                  })}
                  error={!!errors.parentCareers?.[i]}
                  helperText={errors.parentCareers?.[i]?.message}
                />

                <TextField
                  label={`Parent Email ${i + 1}`}
                  {...register(`parentEmails.${i}`, {
                    validate: (value, formValues) => {
                      const anyFilled =
                        formValues.parentPhones?.[i] ||
                        formValues.parentNames?.[i] ||
                        formValues.parentCareers?.[i];
                      if (anyFilled && !value) return "Email required";
                      if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
                        return "Invalid email format";
                      return true;
                    },
                  })}
                  error={!!errors.parentEmails?.[i]}
                  helperText={errors.parentEmails?.[i]?.message}
                />

                <FormControl>
                  <FormLabel>{`Parent ${i + 1} Gender`}</FormLabel>
                  <RadioGroup
                    row
                    value={parentGenders?.[i] ? "Male" : "Female"}
                    onChange={e =>
                      handleParentGenderChange(i, e.target.value === "Male")
                    }
                  >
                    <FormControlLabel
                      value="Male"
                      control={<Radio />}
                      label="Male"
                    />
                    <FormControlLabel
                      value="Female"
                      control={<Radio />}
                      label="Female"
                    />
                  </RadioGroup>
                </FormControl>
              </Box>
            ))}
          </>
        )}

        <Box display="flex" justifyContent="center">
          <Button type="submit" variant="contained" sx={{ mt: 4, px: 4 }}>
            Submit
          </Button>
        </Box>
      </Box>
    );
  };

  export default AddUserForm;
