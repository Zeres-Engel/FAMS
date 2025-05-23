import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Box,
  FormHelperText,
  SelectChangeEvent,
} from "@mui/material";
import axios from "axios";

interface ArrangeScheduleDialogProps {
  open: boolean;
  onClose: () => void;
  semester: string;
  setSemester: React.Dispatch<React.SetStateAction<string>>;
  semesterDateFrom: string;
  setSemesterDateFrom: React.Dispatch<React.SetStateAction<string>>;
  semesterDateTo: string;
  setSemesterDateTo: React.Dispatch<React.SetStateAction<string>>;
  semesterError: boolean;
  setSemesterError: React.Dispatch<React.SetStateAction<boolean>>;
  dateFromError: boolean;
  setDateFromError: React.Dispatch<React.SetStateAction<boolean>>;
  dateToError: boolean;
  setDateToError: React.Dispatch<React.SetStateAction<boolean>>;
  academicYearError: boolean;
  setAcademicYearError: React.Dispatch<React.SetStateAction<boolean>>;
  setScheduleSuccess: React.Dispatch<React.SetStateAction<boolean>>;
  setScheduleMessage: React.Dispatch<React.SetStateAction<string>>;
  academicYears: string[];
  selectedAcademicYear: string;
  handleAcademicYearChange: (year: string) => void;
}

const ArrangeScheduleDialog: React.FC<ArrangeScheduleDialogProps> = ({
  open,
  onClose,
  semester,
  setSemester,
  semesterDateFrom,
  setSemesterDateFrom,
  semesterDateTo,
  setSemesterDateTo,
  semesterError,
  setSemesterError,
  dateFromError,
  setDateFromError,
  dateToError,
  setDateToError,
  academicYearError,
  setAcademicYearError,
  setScheduleSuccess,
  setScheduleMessage,
  academicYears,
  selectedAcademicYear,
  handleAcademicYearChange,
}) => {
  // Format dates from yyyy-MM-dd to dd/MM/yyyy for the API
  const formatDateForAPI = (dateString: string) => {
    const [year, month, day] = dateString.split("-");
    return `${day}/${month}/${year}`;
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle>Arrange Schedule for Semester</DialogTitle>
      <DialogContent dividers>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 2,
            mt: 1,
          }}
        >
          <FormControl fullWidth sx={{ mb: 2 }} variant="outlined">
            <InputLabel id="arrange-academic-year-label">Academic Year</InputLabel>
            <Select
              labelId="arrange-academic-year-label"
              id="arrange-academic-year-select"
              value={selectedAcademicYear}
              onChange={(e: SelectChangeEvent) => {
                console.log("Academic Year selected:", e.target.value);
                handleAcademicYearChange(e.target.value);
                setAcademicYearError(false);
              }}
              required
              error={academicYearError}
              label="Academic Year"
            >
              {academicYears && academicYears.length > 0 ? (
                academicYears.map(year => (
                  <MenuItem key={year} value={year}>
                    {year}
                  </MenuItem>
                ))
              ) : (
                <MenuItem disabled>No academic years available</MenuItem>
              )}
            </Select>
            {academicYearError && <FormHelperText error>Please select an academic year</FormHelperText>}
          </FormControl>

          <FormControl fullWidth sx={{ mb: 2 }} variant="outlined">
            <InputLabel id="arrange-semester-label">Semester</InputLabel>
            <Select
              labelId="arrange-semester-label"
              id="arrange-semester-select"
              value={semester}
              onChange={(e: SelectChangeEvent) => {
                setSemester(e.target.value);
                setSemesterError(false);
              }}
              required
              error={semesterError}
              label="Semester"
            >
              <MenuItem value="Semester 1">Semester 1</MenuItem>
              <MenuItem value="Semester 2">Semester 2</MenuItem>
            </Select>
            {semesterError && <FormHelperText error>Please select a semester</FormHelperText>}
          </FormControl>

          <TextField
            label="From Date"
            type="date"
            value={semesterDateFrom}
            onChange={(e) => {
              setSemesterDateFrom(e.target.value);
              setDateFromError(false);
            }}
            required
            fullWidth
            sx={{ mb: 2 }}
            variant="outlined"
            InputLabelProps={{ 
              shrink: true,
              sx: { 
                backgroundColor: "#fff",
                px: 1
              }
            }}
            error={dateFromError}
            helperText={dateFromError ? "Please select a from date" : ""}
          />

          <TextField
            label="To Date"
            type="date"
            value={semesterDateTo}
            onChange={(e) => {
              setSemesterDateTo(e.target.value);
              setDateToError(false);
            }}
            required
            fullWidth
            sx={{ mb: 2 }}
            variant="outlined"
            InputLabelProps={{ 
              shrink: true,
              sx: { 
                backgroundColor: "#fff",
                px: 1
              }
            }}
            error={dateToError}
            helperText={dateToError ? "Please select a to date" : ""}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button
          variant="contained"
          color="primary"
          onClick={async () => {
            const hasError =
              !semester ||
              !semesterDateFrom ||
              !semesterDateTo ||
              !selectedAcademicYear;
            setSemesterError(!semester);
            setDateFromError(!semesterDateFrom);
            setDateToError(!semesterDateTo);
            setAcademicYearError(!selectedAcademicYear);

            if (hasError) return;

            // Parse semester number from the semester string
            const semesterNumber = semester === "Semester 1" ? 1 : 2;

            try {
              // Call the Python API to generate schedules
              const response = await axios.post(
                "http://fams.io.vn/api-python/schedules/generate",
                {
                  semesterNumber,
                  startDate: formatDateForAPI(semesterDateFrom),
                  endDate: formatDateForAPI(semesterDateTo),
                  academicYear: selectedAcademicYear,
                }
              );

              if (response.data.success) {
                // Hiển thị thông báo thành công
                setScheduleSuccess(true);
                setScheduleMessage(response.data.message || "Schedule generation started successfully");
                console.log(`${response.data.message}. The schedule generation is processing in the background.`);
                
                // Hiển thị thông báo trước khi đóng dialog
                setTimeout(() => {
                  onClose();
                  // Hiển thị thông báo dưới dạng alert sau khi đóng dialog
                  if (true) { // scheduleSuccess is set after this timeout
                    alert(response.data.message + ". The schedule generation is processing in the background.");
                  }
                }, 500);
              } else {
                // Hiển thị thông báo lỗi
                setScheduleSuccess(false);
                setScheduleMessage(response.data.message || "Failed to generate schedule");
                console.error("API Error:", response.data);
                onClose();
              }
            } catch (error) {
              // Hiển thị thông báo lỗi
              setScheduleSuccess(false);
              setScheduleMessage("Error connecting to server");
              console.error(
                "Error calling schedule generation API:",
                error
              );
              onClose();
            }
          }}
        >
          Submit
        </Button>
        <Button
          variant="outlined"
          onClick={onClose}
        >
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ArrangeScheduleDialog; 