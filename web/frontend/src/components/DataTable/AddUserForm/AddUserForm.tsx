import React from "react";
import {
  Box,
  Typography,
  TextField,
  RadioGroup,
  FormControlLabel,
  Radio,
  Button,
  FormLabel,
  Paper,
} from "@mui/material";
import useAddUserFormHook from "./useAddUserFormHook";
import "./AddUserForm.scss";

function AddUserForm(): React.JSX.Element {
  const { state, handler } = useAddUserFormHook();

  return (
    <Paper elevation={3} sx={{ p: 4, mt: 2 }}>
      <Typography variant="h5" gutterBottom>
        Create User
      </Typography>

      {/* User Type Selection */}
      <FormLabel component="legend" sx={{ mb: 1 }}>
        Select User Type
      </FormLabel>
      <RadioGroup
        row
        value={state.userType}
        onChange={handler.handleUserTypeChange}
        sx={{ mb: 3 }}
      >
        <FormControlLabel value="student" control={<Radio />} label="Student" />
        <FormControlLabel value="teacher" control={<Radio />} label="Teacher" />
      </RadioGroup>

      {/* Form Inputs */}
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
        {/* Common fields */}
        <Box sx={{ flex: "1 1 300px" }}>
          <TextField
            fullWidth
            label="Full Name"
            name="fullName"
            value={state.form.fullName}
            onChange={handler.handleInputChange}
            error={Boolean(state.formErrors.fullName)}
            helperText={state.formErrors.fullName}
          />
        </Box>
        <Box sx={{ flex: "1 1 300px" }}>
          <TextField
            fullWidth
            label="Phone"
            name="phone"
            value={state.form.phone}
            onChange={handler.handleInputChange}
            error={Boolean(state.formErrors.phone)}
            helperText={state.formErrors.phone}
          />
        </Box>
        <Box
          sx={{
            flex: "1 1 300px",
            display: "flex",
            alignItems: "center",
            gap: 2,
          }}
        >
          <FormLabel>Gender</FormLabel>
          <RadioGroup
            row
            name="gender"
            value={state.form.gender}
            onChange={handler.handleInputChange}
          >
            <FormControlLabel value="1" control={<Radio />} label="Male" />
            <FormControlLabel value="2" control={<Radio />} label="Female" />
          </RadioGroup>
        </Box>
        {state.formErrors.gender && (
          <Typography variant="caption" color="error" sx={{ ml: 1 }}>
            {state.formErrors.gender}
          </Typography>
        )}

        <Box sx={{ flex: "1 1 300px" }}>
          <TextField
            fullWidth
            label="Date of Birth"
            name="dob"
            type="date"
            InputLabelProps={{ shrink: true }}
            value={state.form.dob}
            onChange={handler.handleInputChange}
            error={Boolean(state.formErrors.dob)}
            helperText={state.formErrors.dob}
          />
        </Box>
        <Box sx={{ flex: "1 1 100%" }}>
          <TextField
            fullWidth
            label="Address"
            name="address"
            value={state.form.address}
            onChange={handler.handleInputChange}
            error={Boolean(state.formErrors.address)}
            helperText={state.formErrors.address}
          />
        </Box>

        {/* Student Fields */}
        {state.userType === "student" && (
          <>
            <Box sx={{ flex: "1 1 300px" }}>
              <TextField
                fullWidth
                label="Parent Names"
                name="parentNames"
                value={state.form.parentNames}
                onChange={handler.handleInputChange}
                error={Boolean(state.formErrors.parentNames)}
                helperText={state.formErrors.parentNames}
              />
            </Box>
            <Box sx={{ flex: "1 1 300px" }}>
              <TextField
                fullWidth
                label="Careers"
                name="careers"
                value={state.form.careers}
                onChange={handler.handleInputChange}
                error={Boolean(state.formErrors.careers)}
                helperText={state.formErrors.careers}
              />
            </Box>
            <Box sx={{ flex: "1 1 300px" }}>
              <TextField
                fullWidth
                label="Parent Phones"
                name="parentPhones"
                value={state.form.parentPhones}
                onChange={handler.handleInputChange}
                error={Boolean(state.formErrors.parentPhones)}
                helperText={state.formErrors.parentPhones}
              />
            </Box>
            <Box
              sx={{
                flex: "1 1 300px",
                display: "flex",
                alignItems: "center",
                gap: 2,
              }}
            >
              <FormLabel>Parent Genders</FormLabel>
              <RadioGroup
                row
                name="parentGenders"
                value={state.form.parentGenders}
                onChange={handler.handleInputChange}
              >
                <FormControlLabel value="1" control={<Radio />} label="Male" />
                <FormControlLabel
                  value="2"
                  control={<Radio />}
                  label="Female"
                />
              </RadioGroup>
            </Box>
            {state.formErrors.parentGenders && (
              <Typography variant="caption" color="error" sx={{ ml: 1 }}>
                {state.formErrors.parentGenders}
              </Typography>
            )}
          </>
        )}

        {/* Teacher Fields */}
        {state.userType === "teacher" && (
          <>
            <Box sx={{ flex: "1 1 300px" }}>
              <TextField
                fullWidth
                label="Major"
                name="major"
                value={state.form.major}
                onChange={handler.handleInputChange}
                error={Boolean(state.formErrors.major)}
                helperText={state.formErrors.major}
              />
            </Box>
            <Box sx={{ flex: "1 1 300px" }}>
              <TextField
                fullWidth
                label="Weekly Capacity"
                name="weeklyCapacity"
                value={state.form.weeklyCapacity}
                onChange={handler.handleInputChange}
                error={Boolean(state.formErrors.weeklyCapacity)}
                helperText={state.formErrors.weeklyCapacity}
              />
            </Box>
          </>
        )}
      </Box>

      {/* Submit Button */}
      <Box sx={{ mt: 4 }}>
        <Button
          variant="contained"
          color="primary"
          onClick={handler.handleSubmit}
        >
          Create
        </Button>
      </Box>
    </Paper>
  );
}

export default AddUserForm;
