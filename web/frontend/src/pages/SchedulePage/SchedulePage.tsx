import "./SchedulePage.scss";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { Calendar, momentLocalizer, View } from "react-big-calendar";
import React, { useState } from "react";
import {
  Container,
  Typography,
  Paper,
  Grid,
  Tooltip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  SelectChangeEvent,
} from "@mui/material";
import moment from "moment";
import LayoutComponent from "../../components/Layout/Layout";
import useSchedulePageHook from "./useSchedulePageHook";
import axios from "axios";

const localizer = momentLocalizer(moment);
const SchedulePage: React.FC = () => {
  const { state, handler } = useSchedulePageHook();
  
  // State for Arrange Semester Schedule dialog
  const [openArrangementDialog, setOpenArrangementDialog] = useState(false);
  const [academicYear, setAcademicYear] = useState("");
  const [semester, setSemester] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  
  // State for validation errors
  const [academicYearError, setAcademicYearError] = useState(false);
  const [semesterError, setSemesterError] = useState(false);
  const [fromDateError, setFromDateError] = useState(false);
  const [toDateError, setToDateError] = useState(false);
  
  // Get current year for academic year options
  const currentYear = new Date().getFullYear();
  const academicYears = [];
  for (let i = -2; i <= 2; i++) {
    const year = currentYear + i;
    academicYears.push(`${year}-${year + 1}`);
  }
  
  // Handle submit for schedule arrangement
  const handleArrangeScheduleSubmit = async () => {
    // Validate form
    const hasError = !academicYear || !semester || !fromDate || !toDate;
    setAcademicYearError(!academicYear);
    setSemesterError(!semester);
    setFromDateError(!fromDate);
    setToDateError(!toDate);
    
    if (hasError) return;
    
    // Parse semester number from the semester string
    const semesterNumber = semester === "1" ? 1 : 2;
    
    try {
      // Call the Python API to generate schedules
      const response = await axios.post(
        "http://fams.io.vn/api-python/schedules/generate",
        {
          semesterNumber,
          startDate: fromDate,
          endDate: toDate,
          academicYear: academicYear,
        }
      );
      
      if (response.data.success) {
        // Show success message
        alert(
          `${response.data.message}. The schedule generation is processing in the background.`
        );
      } else {
        // Show error message
        alert(`Failed: ${response.data.message}`);
        console.error("API Error:", response.data);
      }
    } catch (error) {
      console.error("Error calling schedule generation API:", error);
      alert(
        "An error occurred while arranging the schedule. Please try again later."
      );
    }
    
    // Close dialog
    setOpenArrangementDialog(false);
  };
  
  return (
    <LayoutComponent pageHeader="Schedule">
      <Container
        maxWidth="lg"
        style={{ padding: "16px" }}
        className="schedulePage-Container"
      >
        <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
          <Button
            variant="contained"
            color="primary"
            onClick={() => setOpenArrangementDialog(true)}
          >
            Arrange Semester Schedule
          </Button>
        </Box>
        
        <Box 
          sx={{ 
            display: "flex", 
            justifyContent: "center", 
            className: state?.eventShow?.id !== 0 ? "schedule-Display" : "" 
          }}
        >
          <Box sx={{ width: "100%" }}>
            <Paper elevation={3} sx={{ padding: "16px", overflowX: "auto" }}>
              <Calendar
                localizer={localizer}
                view={state.view}
                events={state.events}
                date={state.currentDate}
                startAccessor="start"
                endAccessor="end"
                views={["month", "week", "day"]}
                style={{ height: 600, width: "100%" }}
                onSelectEvent={handler.handleSelectEvent}
                onView={(newView) => {
                  handler.handleSetNewView(newView)
                }}
                onNavigate={(newDate)=>{
                  handler.handleSetNewViewDate(newDate)
                }}
              />
            </Paper>
          </Box>
        </Box>
        
        {state.eventShow?.id !== 0 && (
          <Box sx={{ width: { xs: "100%", md: "66.67%" } }} className="showEvent">
            <Typography variant="h4">EVENT</Typography>
            <Typography component="div">
              Event: {state.eventShow?.title}
            </Typography>
            <Typography component="div">
              Start: {moment(state.eventShow?.start).format("YYYY-MM-DD HH:mm")}
            </Typography>
            <Typography component="div">
              End: {moment(state.eventShow?.end).format("YYYY-MM-DD HH:mm")}
            </Typography>
            <Button
              variant="contained"
              onClick={() => handler.handleSelectEvent()}
            >
              Close
            </Button>
          </Box>
        )}
        
        {/* Arrange Semester Schedule Dialog */}
        <Dialog
          open={openArrangementDialog}
          onClose={() => setOpenArrangementDialog(false)}
          fullWidth
          maxWidth="sm"
        >
          <DialogTitle>Arrange Semester Schedule</DialogTitle>
          <DialogContent dividers>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
              <FormControl fullWidth error={academicYearError}>
                <InputLabel id="academic-year-select-label">Academic Year *</InputLabel>
                <Select
                  labelId="academic-year-select-label"
                  id="academic-year-select"
                  value={academicYear}
                  label="Academic Year *"
                  onChange={(e) => {
                    setAcademicYear(e.target.value);
                    setAcademicYearError(false);
                  }}
                >
                  {academicYears.map((year) => (
                    <MenuItem key={year} value={year}>
                      {year}
                    </MenuItem>
                  ))}
                </Select>
                {academicYearError && (
                  <Typography variant="caption" color="error">
                    Please select an academic year
                  </Typography>
                )}
              </FormControl>

              <FormControl fullWidth error={semesterError}>
                <InputLabel id="semester-select-label">Semester *</InputLabel>
                <Select
                  labelId="semester-select-label"
                  id="semester-select"
                  value={semester}
                  label="Semester *"
                  onChange={(e) => {
                    setSemester(e.target.value);
                    setSemesterError(false);
                  }}
                >
                  <MenuItem value="1">Semester 1</MenuItem>
                  <MenuItem value="2">Semester 2</MenuItem>
                </Select>
                {semesterError && (
                  <Typography variant="caption" color="error">
                    Please select a semester
                  </Typography>
                )}
              </FormControl>

              <TextField
                label="From Date *"
                type="date"
                value={fromDate}
                onChange={(e) => {
                  setFromDate(e.target.value);
                  setFromDateError(false);
                }}
                InputLabelProps={{ shrink: true }}
                error={fromDateError}
                helperText={fromDateError ? "Please select a start date" : ""}
                fullWidth
              />

              <TextField
                label="To Date *"
                type="date"
                value={toDate}
                onChange={(e) => {
                  setToDate(e.target.value);
                  setToDateError(false);
                }}
                InputLabelProps={{ shrink: true }}
                error={toDateError}
                helperText={toDateError ? "Please select an end date" : ""}
                fullWidth
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button variant="outlined" onClick={() => setOpenArrangementDialog(false)}>
              Cancel
            </Button>
            <Button variant="contained" color="primary" onClick={handleArrangeScheduleSubmit}>
              Submit
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </LayoutComponent>
  );
};

export default SchedulePage;
