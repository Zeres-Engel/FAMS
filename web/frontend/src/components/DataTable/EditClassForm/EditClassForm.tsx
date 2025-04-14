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
            value={state.editingClass?.className}
            onChange={handler.handleEditClassChange}
          />
          <TextField
            fullWidth
            label="Teacher ID"
            name="teacherId"
            value={state.editingClass?.teacherId}
            onChange={handler.handleEditClassChange}
          />
          <FormControl fullWidth>
            <InputLabel id="batch-select-label">Batch</InputLabel>
            <Select
              labelId="batch-select-label"
              id="batch-select"
              name="batch"
              value={state.editingClass?.batch}
              label="Batch"
              onChange={handler.handleSelectChange}
            >
              <MenuItem value="10">10</MenuItem>
              <MenuItem value="11">11</MenuItem>
              <MenuItem value="12">12</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={() => onSave(state.editingClass)}
          variant="contained"
          color="primary"
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}
