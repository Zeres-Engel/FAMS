import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
} from "@mui/material";
import React from "react";
import { editClassForm } from "../../../model/tableModels/tableDataModels.model";
import useEditClassFormHook from "./useEditClassFormHook";

interface EditClassFormProps {
  open: boolean;
  onClose: () => void;
  onSave: (editClassForm: editClassForm) => void;
  formData: editClassForm;
}

export default function EditClassForm({
  open,
  onClose,
  onSave,
  formData,
}: EditClassFormProps) {
  const { state, handler } = useEditClassFormHook(formData);

  const handleSubmit = () => {
    if (handler.validateForm()) {
      onSave(state.editingClass);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      BackdropProps={{
        sx: {
          backgroundColor: "rgba(0, 0, 0, 0.2)",
        },
      }}
    >
      <DialogTitle>Edit Class</DialogTitle>
      <DialogContent dividers>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <TextField
            fullWidth
            label="Class Name"
            name="className"
            value={state.editingClass.className}
            onChange={handler.handleEditClassChange}
            error={!!state.formErrors.className}
            helperText={state.formErrors.className}
          />

          <FormControl
            fullWidth
            error={!!state.formErrors.teacherId}
          >
            <InputLabel id="teacher-select-label">Teacher</InputLabel>
            <Select
              labelId="teacher-select-label"
              id="teacherId"
              name="teacherId"
              value={state.editingClass.teacherId}
              label="Teacher"
              onChange={handler.handleSelectChange}
            >
              {state.teachers.map(teacher => (
                <MenuItem key={teacher.userId} value={teacher.userId}>
                  {teacher.fullName} - {teacher.userId}
                </MenuItem>
              ))}
            </Select>
            <FormHelperText>{state.formErrors.teacherId}</FormHelperText>
          </FormControl>

          <FormControl
            fullWidth
            error={!!state.formErrors.grade}
          >
            <InputLabel id="grade-select-label">Grade</InputLabel>
            <Select
              labelId="grade-select-label"
              id="grade-select"
              name="grade"
              value={state.editingClass.grade}
              label="Grade"
              onChange={handler.handleSelectChange}
            >
              <MenuItem value="10">10</MenuItem>
              <MenuItem value="11">11</MenuItem>
              <MenuItem value="12">12</MenuItem>
            </Select>
            <FormHelperText>{state.formErrors.grade}</FormHelperText>
          </FormControl>

          <FormControl
            fullWidth
            error={!!state.formErrors.academicYear}
          >
            <InputLabel id="academicYear-select-label">School Year</InputLabel>
            <Select
              labelId="academicYear-select-label"
              id="academicYear-select"
              name="academicYear"
              value={state.editingClass.academicYear}
              disabled={true}
              label="Academic Year"
              onChange={handler.handleSelectChange}
            >
              {handler
                .getAcademicYears(3, state.editingClass.academicYear)
                .map(year => (
                  <MenuItem key={year} value={year}>
                    {year}
                  </MenuItem>
                ))}
            </Select>
            <FormHelperText>{state.formErrors.academicYear}</FormHelperText>
          </FormControl>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          color="primary"
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}
