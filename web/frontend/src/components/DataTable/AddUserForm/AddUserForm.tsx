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
  Select,
  MenuItem,
  FormHelperText,
} from "@mui/material";
import { Controller } from "react-hook-form";
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
      watch,
    },
    userType,
    handleUserTypeChange,
    onSubmit,
    batchOptions,
    avatarPreview,
    setAvatarPreview,
  } = useAddUserFormHook();

  const form = watch();

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

      {/* Name, Phone, Gender, DOB */}
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
        {userType === "teacher" && (
          <TextField
            label="Email"
            {...register("email", { 
              required: true,
              pattern: { 
                value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, 
                message: "Invalid email format" 
              } 
            })}
            error={!!errors.email}
            helperText={errors.email?.message}
          />
        )}
        {userType === "student" && (
          <TextField
            label="Backup Email"
            {...register("backup_email", { 
              pattern: { 
                value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, 
                message: "Invalid email format" 
              } 
            })}
            error={!!errors.backup_email}
            helperText={errors.backup_email?.message || "Optional backup email for student"}
          />
        )}
        <TextField
          label="Phone"
          {...register("phone", {
            required: "Required",
            pattern: { value: /^[0-9]+$/, message: "Numbers only" },
          })}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">+84</InputAdornment>
            ),
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
            onChange={e => {
              const file = e.target.files?.[0] || null;
              // Check file size - max 5MB
              if (file && file.size > 5 * 1024 * 1024) {
                alert("File size must be less than 5MB");
                return;
              }
              setValue("avatar", file);
              if (file) {
                setAvatarPreview(URL.createObjectURL(file));
              } else {
                setAvatarPreview(null);
              }
            }}
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
        {form.avatar && (
          <FormHelperText>Selected: {form.avatar.name}</FormHelperText>
        )}
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
                value={form.parentNames[index]}
                onChange={e => {
                  const copy = [...form.parentNames];
                  copy[index] = e.target.value;
                  setValue("parentNames", copy);
                }}
              />
              <TextField
                label={`Parent Phone ${index + 1}`}
                value={form.parentPhones[index]}
                onChange={e => {
                  const copy = [...form.parentPhones];
                  copy[index] = e.target.value.replace(/[^0-9]/g, "");
                  setValue("parentPhones", copy);
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">+84</InputAdornment>
                  ),
                }}
              />
              <TextField
                label={`Parent Career ${index + 1}`}
                value={form.parentCareers[index]}
                onChange={e => {
                  const copy = [...form.parentCareers];
                  copy[index] = e.target.value;
                  setValue("parentCareers", copy);
                }}
              />
              <TextField
                label={`Parent Email ${index + 1}`}
                value={form.parentEmails[index]}
                onChange={e => {
                  const copy = [...form.parentEmails];
                  copy[index] = e.target.value;
                  setValue("parentEmails", copy);
                }}
              />
              <FormControl>
                <FormLabel>{`Parent ${index + 1} Gender`}</FormLabel>
                <RadioGroup
                  row
                  value={form.parentGenders[index] ? "Male" : "Female"}
                  onChange={e => {
                    const copy = [...form.parentGenders];
                    copy[index] = e.target.value === "Male";
                    setValue("parentGenders", copy);
                  }}
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
