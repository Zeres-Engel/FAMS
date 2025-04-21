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
      <Paper
        elevation={3}
        sx={{
          p: 4,
          width: "100%",
          maxWidth: 800,
        }}
      >
        <Typography variant="h5" gutterBottom>
          Create Class
        </Typography>

        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <FormControl fullWidth>
            <InputLabel id="academicYear-select-label">School Year</InputLabel>
            <Select
              labelId="academicYear-select-label"
              id="academicYear-select"
              name="academicYear"
              value={state.form?.academicYear}
              label="academicYear"
              onChange={handler.handleSelectChange}
            >
              {handler.getAcademicYears(4).map(year => (
                <MenuItem key={year} value={year}>
                  {year}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth>
            <InputLabel id="grade-select-label">Grade</InputLabel>
            <Select
              labelId="grade-select-label"
              id="grade-select"
              name="grade"
              value={state.form?.grade}
              label="grade"
              onChange={handler.handleSelectChange}
            >
              <MenuItem value="10">10</MenuItem>
              <MenuItem value="11">11</MenuItem>
              <MenuItem value="12">12</MenuItem>
            </Select>
          </FormControl>
          <TextField
            fullWidth
            label="Class Name"
            name="className"
            value={state.form.className}
            onChange={handler.handleInputChange}
            error={Boolean(state.formErrors.className)}
            helperText={state.formErrors.className}
          />

          <TextField
            fullWidth
            label="Teacher ID"
            name="teacherId"
            value={state.form.teacherId}
            onChange={handler.handleInputChange}
            error={Boolean(state.formErrors.teacherId)}
            helperText={state.formErrors.teacherId}
          />
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
