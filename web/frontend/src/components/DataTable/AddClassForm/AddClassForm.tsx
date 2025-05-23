import React from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import useAddClassFormHook from "./useAddClassFormHook";

export default function AddClassForm(): React.JSX.Element {
  const { state, handler } = useAddClassFormHook();

  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      sx={{ mt: 4, px: 2 }}
    >
      <Paper elevation={3} sx={{ p: 4, width: "100%", maxWidth: 800 }}>
        <Typography variant="h5" gutterBottom>
          Create Class
        </Typography>

        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {/* Academic Year */}
          <FormControl
            fullWidth
            required
            error={Boolean(state.formErrors.academicYear)}
          >
            <InputLabel id="academicYear-select-label">
              Academic Year
            </InputLabel>
            <Select
              labelId="academicYear-select-label"
              id="academicYear-select"
              name="academicYear"
              value={state.form.academicYear}
              label="Academic Year"
              onChange={handler.handleSelectChange}
            >
              {handler.getAcademicYears(4).map(year => (
                <MenuItem key={year} value={year}>
                  {year}
                </MenuItem>
              ))}
            </Select>
            {state.formErrors.academicYear && (
              <Typography variant="caption" color="error" sx={{ ml: 2 }}>
                {state.formErrors.academicYear}
              </Typography>
            )}
          </FormControl>

          {/* Grade */}
          <FormControl fullWidth required>
            <InputLabel id="grade-select-label">Grade</InputLabel>
            <Select
              labelId="grade-select-label"
              id="grade-select"
              name="grade"
              value={state.form.grade}
              label="Grade"
              onChange={handler.handleSelectChange}
            >
              <MenuItem value="10">10</MenuItem>
              <MenuItem value="11">11</MenuItem>
              <MenuItem value="12">12</MenuItem>
            </Select>
          </FormControl>

          {/* Class Name */}
          <TextField
            required
            fullWidth
            label="Class Name"
            name="className"
            value={state.form.className}
            onChange={handler.handleInputChange}
            error={Boolean(state.formErrors.className)}
            helperText={state.formErrors.className}
          />

          {/* Teacher */}
          <FormControl
            fullWidth
            required
            error={Boolean(state.formErrors.teacherId)}
          >
            <InputLabel id="teacher-select-label">Teacher</InputLabel>
            <Select
              labelId="teacher-select-label"
              id="teacher-select"
              name="teacherId"
              value={state.form.teacherId}
              label="Teacher"
              onChange={handler.handleSelectChange}
            >
              {state.teachers.map(teacher => (
                <MenuItem key={teacher.userId} value={teacher.userId}>
                  {teacher.fullName} - {teacher.userId}
                </MenuItem>
              ))}
            </Select>
            {state.formErrors.teacherId && (
              <Typography variant="caption" color="error" sx={{ ml: 2 }}>
                {state.formErrors.teacherId}
              </Typography>
            )}
          </FormControl>

          {/* Submit Button */}
          <Button
            variant="contained"
            color="primary"
            onClick={handler.handleSubmit}
            sx={{ alignSelf: "flex-end", mt: 2 }}
          >
            Create
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}
