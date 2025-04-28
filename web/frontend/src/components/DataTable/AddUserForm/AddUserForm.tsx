import React from "react";
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
import "./AddUserForm.scss";

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
    batchOptions,
    avatarPreview,
    setAvatarPreview,
  } = useAddUserFormHook();

  const avatar = useWatch({ control, name: "avatar" });
  const parentNames = useWatch({ control, name: "parentNames" });
  const parentPhones = useWatch({ control, name: "parentPhones" });
  const parentCareers = useWatch({ control, name: "parentCareers" });
  const parentEmails = useWatch({ control, name: "parentEmails" });
  const parentGenders = useWatch({ control, name: "parentGenders" });

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("File size must be less than 5MB");
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
    let updatedArray: string[] = [];
    switch (fieldName) {
      case "parentNames":
        updatedArray = [...(parentNames || [])];
        break;
      case "parentPhones":
        updatedArray = [...(parentPhones || [])];
        break;
      case "parentCareers":
        updatedArray = [...(parentCareers || [])];
        break;
      case "parentEmails":
        updatedArray = [...(parentEmails || [])];
        break;
    }
    updatedArray[index] = value;
    setValue(fieldName, updatedArray);
  };

  const handleParentGenderChange = (index: number, value: boolean) => {
    const updatedGenders = [...(parentGenders || [])];
    updatedGenders[index] = value;
    setValue("parentGenders", updatedGenders);
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit(onSubmit)}
      sx={{ padding: 3, display: "flex", flexDirection: "column", gap: 2 }}
      className="add-user-form"
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

      {/* Basic Information */}
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
                message: "Invalid email format",
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
                message: "Invalid email format",
              },
            })}
            error={!!errors.backup_email}
            helperText={errors.backup_email?.message || "Optional backup email"}
          />
        )}
        <TextField
          label="Phone"
          {...register("phone", {
            required: "Required",
            pattern: {
              value: /^[0-9]{9,11}$/,
              message: "Phone must be 9-11 digits",
            },
          })}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">+84</InputAdornment>
            ),
            inputProps: { maxLength: 11 },
          }}
          onInput={(e: React.ChangeEvent<HTMLInputElement>) => {
            e.target.value = e.target.value.replace(/[^0-9]/g, "").slice(0, 11);
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
        <TextField
          type="date"
          label="Date of Birth"
          InputLabelProps={{ shrink: true }}
          {...register("dateOfBirth", { required: "Required" })}
          error={!!errors.dateOfBirth}
          helperText={errors.dateOfBirth?.message}
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
        {avatarPreview && (
          <Box mt={1}>
            <img
              src={avatarPreview}
              alt="Avatar Preview"
              className="add-user-form__avatar-preview"
            />
          </Box>
        )}
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

      {/* Parent Section */}
      {userType === "student" && (
        <>
          <FormLabel className="add-user-form__section-title">
            Parent Section
          </FormLabel>
          {[0, 1].map(index => (
            <Box key={index} sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
              <TextField
                label={`Parent Name ${index + 1}`}
                value={parentNames?.[index] || ""}
                onChange={e =>
                  handleParentStringFieldChange(
                    "parentNames",
                    index,
                    e.target.value
                  )
                }
              />
              <TextField
                label={`Parent Phone ${index + 1}`}
                value={parentPhones?.[index] || ""}
                onChange={e => {
                  const cleanValue = e.target.value
                    .replace(/[^0-9]/g, "")
                    .slice(0, 11);
                  handleParentStringFieldChange(
                    "parentPhones",
                    index,
                    cleanValue
                  );
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">+84</InputAdornment>
                  ),
                  inputProps: { maxLength: 11 },
                }}
                error={
                  !!parentPhones?.[index] &&
                  !/^\d{9,11}$/.test(parentPhones[index] || "")
                }
                helperText={
                  parentPhones?.[index] &&
                  !/^\d{9,11}$/.test(parentPhones[index] || "")
                    ? "Phone must be 9-11 digits"
                    : "Optional"
                }
              />
              <TextField
                label={`Parent Career ${index + 1}`}
                value={parentCareers?.[index] || ""}
                onChange={e =>
                  handleParentStringFieldChange(
                    "parentCareers",
                    index,
                    e.target.value
                  )
                }
              />
              <TextField
                label={`Parent Email ${index + 1}`}
                value={parentEmails?.[index] || ""}
                onChange={e =>
                  handleParentStringFieldChange(
                    "parentEmails",
                    index,
                    e.target.value
                  )
                }
                error={
                  !!parentEmails?.[index] &&
                  !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(parentEmails[index] || "")
                }
                helperText={
                  parentEmails?.[index] &&
                  !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(parentEmails[index] || "")
                    ? "Invalid email format"
                    : "Optional"
                }
              />
              <FormControl>
                <FormLabel>{`Parent ${index + 1} Gender`}</FormLabel>
                <RadioGroup
                  row
                  value={parentGenders?.[index] ? "Male" : "Female"}
                  onChange={e =>
                    handleParentGenderChange(index, e.target.value === "Male")
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

      {/* Submit */}
      <Box display="flex" justifyContent="center">
        <Button
          type="submit"
          variant="contained"
          className="add-user-form__submit-button"
          sx={{ mt: 4, width: "fit-content", px: 4 }}
        >
          Submit
        </Button>
      </Box>
    </Box>
  );
};

export default AddUserForm;
