import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Avatar,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
} from "@mui/material";
import React from "react";
import useEditAttendanceFormHook from "./useEditAttendanceFormHook";

interface AttendanceFormProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  formData: {
    attendanceId: number;
    scheduleId: number;
    userId: number;
    fullName: string;
    face: string | null;
    checkin: string;
    status: string;
    note: string;
    checkinFace: string;
  };
}

export default function EditAttendanceForm({
  open,
  onClose,
  onSave,
  formData,
}: AttendanceFormProps) {
  const { state, handler } = useEditAttendanceFormHook(formData);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      BackdropProps={{
        sx: {
          backgroundColor: "rgba(0, 0, 0, 0.2)",
        },
      }}
    >
      <DialogTitle>Edit Attendance</DialogTitle>
      <DialogContent dividers>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 4 }}>
            {/* Fullname Avatar */}
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <Avatar
                alt={state.data.fullName}
                src={state.data.face ?? undefined}
                sx={{ width: 64, height: 64 }}
              />
              <Typography variant="caption" sx={{ mt: 1 }}>
                Profile
              </Typography>
            </Box>

            {/* Checkin Face Avatar (giống src face luôn nếu bạn không có ảnh riêng) */}
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <Avatar
                alt="Checkin Face"
                src={state.data.face ?? undefined}
                sx={{ width: 64, height: 64 }}
              />
              <Typography variant="caption" sx={{ mt: 1 }}>
                Checkin Face
              </Typography>
            </Box>

            {/* Info Texts */}
            <Box>
              <Typography variant="subtitle1">{state.data.fullName}</Typography>
              <Typography variant="body2" color="text.secondary">
                User ID: {state.data.userId}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Schedule ID: {state.data.scheduleId}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Checkin:{" "}
                {new Date(state.data.checkin).toLocaleString("en-GB", {
                  hour12: false,
                  year: "numeric",
                  month: "2-digit",
                  day: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Typography>
            </Box>
          </Box>

          <FormControl fullWidth>
            <InputLabel id="status-select-label">Status</InputLabel>
            <Select
              labelId="status-select-label"
              id="status-select"
              name="status"
              value={state.data.status}
              label="Status"
              onChange={handler.handleStatusChange}
            >
              <MenuItem value="Present">Present</MenuItem>
              <MenuItem value="Absent">Absent</MenuItem>
              <MenuItem value="Late">Late</MenuItem>
            </Select>
          </FormControl>
          <TextField
            fullWidth
            label="Note"
            name="note"
            multiline
            minRows={2}
            value={state.data.note || ""}
            onChange={handler.handleNoteChange}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={() => onSave(state.data)}
          variant="contained"
          color="primary"
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}
