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
            label="Teacher Name"
            name="teacherName"
            value={state.form.teacherName}
            onChange={handler.handleInputChange}
            error={Boolean(state.formErrors.teacherName)}
            helperText={state.formErrors.teacherName}
          />
          <FormControl fullWidth>
            <InputLabel id="batch-select-label">Batch</InputLabel>
            <Select
              labelId="batch-select-label"
              id="batch-select"
              name="batch"
              value={state.form?.batch}
              label="Batch"
              onChange={handler.handleSelectChange}
            >
              <MenuItem value="10">10</MenuItem>
              <MenuItem value="11">11</MenuItem>
              <MenuItem value="12">12</MenuItem>
            </Select>
          </FormControl>
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
