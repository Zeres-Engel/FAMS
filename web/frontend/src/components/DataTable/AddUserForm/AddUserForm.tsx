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
  } = useAddUserFormHook();

  const form = watch();

  return (
    <Box
      component="form"
      onSubmit={handleSubmit(onSubmit)}
      sx={{ padding: 3, display: "flex", flexDirection: "column", gap: 2 }}
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

      {/* Teacher fields */}
      {userType === "teacher" && (
        <Box sx={{ display: "flex", gap: 2 }}>
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
        </Box>
      )}

      {/* Batch Year */}
      {/* <FormControl sx={{ maxWidth: 300 }} error={!!errors.batchYear}>
        <FormLabel>Batch Year</FormLabel>
        <Controller
          name="batchYear"
          control={control}
          rules={{ required: "Required" }}
          render={({ field }) => (
            <Select {...field}>
              {batchOptions.map(option => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </Select>
          )}
        />
        <FormHelperText>{errors.batchYear?.message}</FormHelperText>
      </FormControl> */}

      {/* Parent Section */}
      {userType === "student" && (
        <>
          <FormLabel sx={{ fontSize: 20, fontWeight: "bold" }}>
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
          sx={{ mt: 4, width: "fit-content", px: 4 }}
        >
          Submit
        </Button>
      </Box>
    </Box>
  );
};

export default AddUserForm;
