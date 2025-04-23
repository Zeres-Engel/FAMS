import "./ScheduleManagementPage.scss";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { Calendar, momentLocalizer } from "react-big-calendar";
import React, { useState } from "react";
import {
  Container,
  Typography,
  Paper,
  Box,
  Button,
  Autocomplete,
  TextField,
  useMediaQuery,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import moment from "moment";
import LayoutComponent from "../../components/Layout/Layout";
import useScheduleManagementPageHook from "./useScheduleManagementPageHook";
import { useSelector } from "react-redux";
import { RootState } from "../../store/store";

const localizer = momentLocalizer(moment);

const ScheduleManagementPage: React.FC = () => {
  const { state, handler } = useScheduleManagementPageHook();
  const isMobile = useMediaQuery("(max-width:600px)");
  const role = useSelector((state: RootState) => state.authUser.role);
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [openArrangementDialog, setOpenArrangementDialog] = useState(false);
  const [newEvent, setNewEvent] = useState({
    id: 0,
    subject: "",
    subjectId: 0,
    title: "",
    start: new Date(),
    end: new Date(),
    teacher: "",
    classroomNumber: "",
  });
  const [semester, setSemester] = useState("Semester 1");
  const [semesterDateFrom, setSemesterDateFrom] = useState("");
  const [semesterDateTo, setSemesterDateTo] = useState("");
  const [semesterError, setSemesterError] = useState(false);
  const [dateFromError, setDateFromError] = useState(false);
  const [dateToError, setDateToError] = useState(false);
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => currentYear - 5 + i); // Từ 5 năm trước đến 5 năm sau
  return (
    <LayoutComponent
      pageHeader={role === "admin" ? "Schedule Management" : "Schedule Page"}
    >
      <Container maxWidth="xl" style={{ padding: "16px" }}>
        <Box className={state?.eventShow?.id !== 0 ? "schedule-Display" : ""}>
          <Paper elevation={3} sx={{ padding: "16px" }}>
            {(role === "admin" || role === "supervisor") && (
              <Box
                sx={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 2,
                  mb: 2,
                  alignItems: "center",
                }}
              >
                <Box sx={{ flex: isMobile ? "1 1 100%" : "1 1 200px" }}>
                  <Autocomplete
                    disablePortal
                    options={state.classOptions}
                    getOptionLabel={option => option.label}
                    value={
                      state.classOptions.find(
                        opt => opt.value === state.filters.class
                      ) || null
                    }
                    onChange={(event, newValue) =>
                      handler.setFilters({
                        ...state.filters,
                        class: newValue?.value || "",
                      })
                    }
                    renderInput={params => (
                      <TextField {...params} label="Class" />
                    )}
                    fullWidth
                  />
                </Box>
                {/* <Box sx={{ flex: isMobile ? "1 1 100%" : "1 1 200px" }}> */}
                {/* <FormControl
                  fullWidth={isMobile}
                  sx={{ flex: isMobile ? "1 1 100%" : "1 1 200px" }}
                >
                  <InputLabel id="academicYear-select-label">
                    Academic Year
                  </InputLabel>
                  <Select
                    labelId="academicYear-select-label"
                    id="academicYear-select"
                    name="academicYear"
                    value={state.filters.academicYear}
                    label="academicYear"
                    onChange={event =>
                      handler.setFilters({
                        ...state.filters,
                        academicYear: event.target.value,
                      })
                    }
                  >
                    {handler.getAcademicYears(3).map(year => (
                      <MenuItem key={year} value={year}>
                        {year}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl> */}
                <Box sx={{ flex: isMobile ? "1 1 100%" : "1 1 200px" }}>
                  <TextField
                    label="Date From"
                    type="date"
                    InputLabelProps={{ shrink: true }}
                    fullWidth
                    value={state.filters.dateFrom || ""}
                    onChange={e =>
                      handler.setFilters({
                        ...state.filters,
                        dateFrom: e.target.value,
                      })
                    }
                  />
                </Box>

                <Box sx={{ flex: isMobile ? "1 1 100%" : "1 1 200px" }}>
                  <TextField
                    label="Date To"
                    type="date"
                    InputLabelProps={{ shrink: true }}
                    fullWidth
                    value={state.filters.dateTo || ""}
                    onChange={e =>
                      handler.setFilters({
                        ...state.filters,
                        dateTo: e.target.value,
                      })
                    }
                  />
                </Box>

                {/* </Box> */}

                <Box sx={{ flex: isMobile ? "1 1 100%" : "1 1 200px" }}>
                  <FormControl fullWidth>
                    <InputLabel id="filter-teacher-select-label">
                      Teacher
                    </InputLabel>
                    <Select
                      labelId="filter-teacher-select-label"
                      id="filter-teacher-select"
                      value={state.filters.userId}
                      label="Teacher"
                      onChange={e =>
                        handler.setFilters({
                          ...state.filters,
                          userId: e.target.value,
                        })
                      }
                    >
                      {state.teachers.map(teacher => (
                        <MenuItem key={teacher.userId} value={teacher.userId}>
                          {teacher.fullName} - {teacher.userId}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
                <Button variant="contained" onClick={handler.handleSearch}>
                  Search
                </Button>
              </Box>
            )}

            {role === "teacher" && (
              <Box
                sx={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 2,
                  mb: 2,
                  alignItems: "center",
                }}
              >
                <Box sx={{ flex: isMobile ? "1 1 100%" : "1 1 200px" }}>
                  <Autocomplete
                    disablePortal
                    options={state.classOptions}
                    getOptionLabel={option => option.label}
                    value={
                      state.classOptions.find(
                        opt => opt.value === state.filters.class
                      ) || null
                    }
                    onChange={(event, newValue) =>
                      handler.setFilters({
                        ...state.filters,
                        class: newValue?.value || "",
                      })
                    }
                    renderInput={params => (
                      <TextField {...params} label="Class" />
                    )}
                    fullWidth
                  />
                </Box>
                <Box sx={{ flex: isMobile ? "1 1 100%" : "1 1 200px" }}>
                  <TextField
                    label="Date From"
                    type="date"
                    InputLabelProps={{ shrink: true }}
                    fullWidth
                    value={state.filters.dateFrom || ""}
                    onChange={e =>
                      handler.setFilters({
                        ...state.filters,
                        dateFrom: e.target.value,
                      })
                    }
                  />
                </Box>

                <Box sx={{ flex: isMobile ? "1 1 100%" : "1 1 200px" }}>
                  <TextField
                    label="Date To"
                    type="date"
                    InputLabelProps={{ shrink: true }}
                    fullWidth
                    value={state.filters.dateTo || ""}
                    onChange={e =>
                      handler.setFilters({
                        ...state.filters,
                        dateTo: e.target.value,
                      })
                    }
                  />
                </Box>
                {/* <Box sx={{ flex: isMobile ? "1 1 100%" : "1 1 200px" }}> */}
                {/* <FormControl
                  fullWidth={isMobile}
                  sx={{ flex: isMobile ? "1 1 100%" : "1 1 200px" }}
                >
                  <InputLabel id="academicYear-select-label">
                    Academic Year
                  </InputLabel>
                  <Select
                    labelId="academicYear-select-label"
                    id="academicYear-select"
                    name="academicYear"
                    value={state.filters.academicYear}
                    label="academicYear"
                    onChange={event =>
                      handler.setFilters({
                        ...state.filters,
                        academicYear: event.target.value,
                      })
                    }
                  >
                    {handler.getAcademicYears(3).map(year => (
                      <MenuItem key={year} value={year}>
                        {year}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl> */}
                {/* </Box> */}
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handler.handleSearch}
                >
                  Search
                </Button>
                <Button
                  variant="contained"
                  onClick={handler.handleShowTeacherSchedule}
                >
                  Show My Schedule
                </Button>
              </Box>
            )}
            <FormControl size="small" sx={{ minWidth: 100, mr: 2, mb: 1 }}>
              <InputLabel id="year-select-label">Year</InputLabel>
              <Select
                labelId="year-select-label"
                value={state.currentDate.getFullYear()}
                label="Year"
                onChange={e => {
                  const newYear = Number(e.target.value);
                  const newDate = new Date(
                    newYear,
                    state.currentDate.getMonth(),
                    1
                  );
                  handler.handleSetDate(newDate);
                }}
              >
                {years.map(year => (
                  <MenuItem key={year} value={year}>
                    {year}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Calendar
              localizer={localizer}
              view={state.view}
              events={state.events}
              date={state.currentDate}
              startAccessor="start"
              endAccessor="end"
              min={new Date(0, 0, 0, 7, 0)} // 7:00 AM
              max={new Date(0, 0, 0, 17, 0)} // 5:00 PM
              views={["month", "week", "day"]}
              style={{ height: 600, width: "100%" }}
              onSelectEvent={handler.handleSelectEvent}
              onView={handler.handleSetView}
              onNavigate={handler.handleSetDate}
            />
            {role === "admin" && (
              <Box textAlign="center" mt={2}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => setOpenCreateDialog(true)}
                >
                  Add new Schedule
                </Button>
                <Box sx={{ mt: 4 }}>
                  <Typography variant="h6" gutterBottom textAlign="center">
                    New Schedule Arrangement
                  </Typography>
                  <Button
                    variant="contained"
                    color="primary"
                    sx={{ mt: 4 }}
                    onClick={() => setOpenArrangementDialog(true)}
                  >
                    Arrange Semester Schedule
                  </Button>
                </Box>
              </Box>
            )}
          </Paper>

          <Dialog
            open={state.eventShow?.id !== 0}
            onClose={() => {
              handler.setIsEditing(false);
              handler.handleSelectEvent();
            }}
            fullWidth
            maxWidth="sm"
          >
            <DialogTitle>Event Detail</DialogTitle>
            <DialogContent dividers>
              {state.isEditing ? (
                <>
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel id="subject-select-label">Subject</InputLabel>
                    <Select
                      labelId="subject-select-label"
                      id="subject-select"
                      value={state.eventShow?.subjectId || ""}
                      label="Subject"
                      onChange={e => {
                        const selectedSubject = state.subjectState.find(
                          s => s.subjectId === e.target.value
                        );
                        handler.setEventShow({
                          ...state.eventShow,
                          subjectId: selectedSubject?.subjectId,
                          subject: selectedSubject?.subjectName || "",
                        });
                      }}
                    >
                      {state.subjectState.map(subject => (
                        <MenuItem
                          key={subject.subjectId}
                          value={subject.subjectId}
                        >
                          {subject.subjectName}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <TextField
                    label="Topic"
                    fullWidth
                    sx={{ mb: 2 }}
                    value={state.eventShow?.title || ""}
                    onChange={e =>
                      handler.setEventShow({
                        ...state.eventShow,
                        title: e.target.value,
                      })
                    }
                  />
                  <TextField
                    label="Start"
                    type="datetime-local"
                    fullWidth
                    disabled={true}
                    sx={{ mb: 2 }}
                    value={moment(state.eventShow?.start).format(
                      "YYYY-MM-DDTHH:mm"
                    )}
                    onChange={e =>
                      handler.setEventShow({
                        ...state.eventShow,
                        start: new Date(e.target.value),
                      })
                    }
                  />
                  <TextField
                    label="End"
                    type="datetime-local"
                    fullWidth
                    disabled={true}
                    sx={{ mb: 2 }}
                    value={moment(state.eventShow?.end).format(
                      "YYYY-MM-DDTHH:mm"
                    )}
                    onChange={e =>
                      handler.setEventShow({
                        ...state.eventShow,
                        end: new Date(e.target.value),
                      })
                    }
                  />
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel id="classroom-select-label">
                      Classroom
                    </InputLabel>
                    <Select
                      labelId="classroom-select-label"
                      id="classroom-select"
                      value={state.eventShow?.classroomId}
                      label="Classroom"
                      onChange={e => {
                        const selectedRoom = state.classrooms.find(
                          room => room.classroomId === e.target.value
                        );
                        handler.setEventShow({
                          ...state.eventShow,
                          classroomNumber: selectedRoom?.classroomName,
                          classroomId: selectedRoom?.classroomId,
                        });
                      }}
                    >
                      {state.classrooms.map(room => (
                        <MenuItem
                          key={room.classroomId}
                          value={room.classroomId}
                        >
                          {room.classroomName}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel id="event-teacher-select-label">
                      Teacher
                    </InputLabel>
                    <Select
                      labelId="event-teacher-select-label"
                      id="event-teacher-select"
                      value={String(state.eventShow?.teacher || "")}
                      label="Teacher"
                      onChange={e =>
                        handler.setEventShow({
                          ...state.eventShow,
                          teacher: e.target.value,
                        })
                      }
                    >
                      {state.teachers.map(teacher => (
                        <MenuItem key={teacher.userId} value={teacher.userId}>
                          {teacher.fullName} - {teacher.userId}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </>
              ) : (
                <>
                  <Typography>
                    <strong>Subject:</strong> {state.eventShow?.subject}
                  </Typography>
                  <Typography>
                    <strong>Topic:</strong> {state.eventShow?.title || "N/A"}
                  </Typography>
                  <Typography>
                    <strong>Start:</strong>{" "}
                    {moment(state.eventShow?.start).format("YYYY-MM-DD HH:mm")}
                  </Typography>
                  <Typography>
                    <strong>End:</strong>{" "}
                    {moment(state.eventShow?.end).format("YYYY-MM-DD HH:mm")}
                  </Typography>
                  <Typography>
                    <strong>Classroom ID:</strong>{" "}
                    {state.eventShow?.classroomNumber || "N/A"}
                  </Typography>
                  <Typography>
                    <strong>Teacher:</strong> {state.eventShow?.teacher}
                  </Typography>
                </>
              )}
            </DialogContent>

            <DialogActions>
              {/* Nếu là admin thì có nút Edit/Delete */}
              {role === "admin" &&
                (state.isEditing ? (
                  <>
                    <Button
                      variant="contained"
                      onClick={handler.handleSaveEdit}
                    >
                      Save
                    </Button>
                    <Button
                      variant="outlined"
                      onClick={() => handler.setIsEditing(false)}
                    >
                      Cancel
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="contained"
                      onClick={() => handler.setIsEditing(true)}
                    >
                      Edit
                    </Button>
                    <Button variant="contained" color="error">
                      Delete
                    </Button>
                  </>
                ))}

              {/* Nếu là giáo viên thì có nút Check Attendance */}
              {role === "teacher" && (
                <Button variant="contained" color="secondary">
                  Check Attendance
                </Button>
              )}

              <Button
                variant="outlined"
                onClick={() => {
                  handler.setIsEditing(false);
                  handler.handleSelectEvent();
                }}
              >
                Close
              </Button>
            </DialogActions>
          </Dialog>
          {/* add new */}
          <Dialog
            open={openCreateDialog}
            onClose={() => setOpenCreateDialog(false)}
            fullWidth
            maxWidth="sm"
          >
            <DialogTitle>Add new Schedule</DialogTitle>
            <DialogContent dividers>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel id="subject-select-label">Subject</InputLabel>
                <Select
                  labelId="subject-select-label"
                  id="subject-select"
                  value={newEvent.subjectId}
                  label="Subject"
                  onChange={e =>
                    setNewEvent({
                      ...newEvent,
                      subjectId: Number(e.target.value),
                    })
                  }
                >
                  {state.subjectState.map(subject => (
                    <MenuItem key={subject.subjectId} value={subject.subjectId}>
                      {subject.subjectName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                label="Start"
                type="datetime-local"
                fullWidth
                sx={{ mb: 2 }}
                value={moment(newEvent.start).format("YYYY-MM-DDTHH:mm")}
                onChange={e =>
                  setNewEvent({ ...newEvent, start: new Date(e.target.value) })
                }
              />
              <TextField
                label="End"
                type="datetime-local"
                fullWidth
                sx={{ mb: 2 }}
                value={moment(newEvent.end).format("YYYY-MM-DDTHH:mm")}
                onChange={e =>
                  setNewEvent({ ...newEvent, end: new Date(e.target.value) })
                }
              />
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel id="classroom-select-label">Classroom</InputLabel>
                <Select
                  labelId="classroom-select-label"
                  id="classroom-select"
                  value={String(newEvent.classroomNumber || "")}
                  label="Classroom"
                  onChange={e =>
                    setNewEvent({
                      ...newEvent,
                      classroomNumber: e.target.value,
                    })
                  }
                >
                  {state.classrooms.map(room => (
                    <MenuItem key={room.classroomId} value={room.classroomId}>
                      {room.classroomName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel id="new-event-teacher-label">Teacher</InputLabel>
                <Select
                  labelId="new-event-teacher-label"
                  id="new-event-teacher"
                  value={newEvent.teacher || ""}
                  label="Teacher"
                  onChange={e =>
                    setNewEvent({ ...newEvent, teacher: e.target.value })
                  }
                >
                  {state.teachers.map(teacher => (
                    <MenuItem key={teacher.userId} value={teacher.userId}>
                      {teacher.fullName} - {teacher.userId}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </DialogContent>
            <DialogActions>
              <Button
                variant="contained"
                onClick={() => {
                  handler.addEvent(newEvent);
                  setOpenCreateDialog(false);
                  setNewEvent({
                    id: 0,
                    subject: "",
                    subjectId: 0,
                    title: "",
                    start: new Date(),
                    end: new Date(),
                    teacher: "",
                    classroomNumber: "",
                  });
                }}
              >
                Add
              </Button>
              <Button
                variant="outlined"
                onClick={() => setOpenCreateDialog(false)}
              >
                Cancel
              </Button>
            </DialogActions>
          </Dialog>
          {/* aragement schedule */}
          <Dialog
            open={openArrangementDialog}
            onClose={() => setOpenArrangementDialog(false)}
            fullWidth
            maxWidth="sm"
          >
            <DialogTitle>Arrange Semester Schedule</DialogTitle>
            <DialogContent dividers>
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 2,
                  mt: 1,
                }}
              >
                <TextField
                  select
                  label="Semester"
                  value={semester}
                  onChange={e => {
                    setSemester(e.target.value);
                    setSemesterError(false);
                  }}
                  SelectProps={{ native: true }}
                  required
                  error={semesterError}
                  helperText={semesterError ? "Please select a semester" : ""}
                  sx={{ width: "100%" }}
                >
                  <option value="">-- Select --</option>
                  <option value="Semester 1">Semester 1</option>
                  <option value="Semester 2">Semester 2</option>
                </TextField>

                <TextField
                  label="From Date"
                  type="date"
                  value={semesterDateFrom}
                  onChange={e => {
                    setSemesterDateFrom(e.target.value);
                    setDateFromError(false);
                  }}
                  required
                  InputLabelProps={{ shrink: true }}
                  error={dateFromError}
                  helperText={dateFromError ? "Please select a from date" : ""}
                />

                <TextField
                  label="To Date"
                  type="date"
                  value={semesterDateTo}
                  onChange={e => {
                    setSemesterDateTo(e.target.value);
                    setDateToError(false);
                  }}
                  required
                  InputLabelProps={{ shrink: true }}
                  error={dateToError}
                  helperText={dateToError ? "Please select a to date" : ""}
                />
              </Box>
            </DialogContent>
            <DialogActions>
              <Button
                variant="outlined"
                onClick={() => {
                  const hasError =
                    !semester || !semesterDateFrom || !semesterDateTo;
                  setSemesterError(!semester);
                  setDateFromError(!semesterDateFrom);
                  setDateToError(!semesterDateTo);

                  if (hasError) return;

                  console.log("Submitted arrangement:", {
                    semester,
                    from: semesterDateFrom,
                    to: semesterDateTo,
                  });

                  setOpenArrangementDialog(false);
                }}
              >
                Submit
              </Button>
              <Button
                variant="outlined"
                onClick={() => setOpenArrangementDialog(false)}
              >
                Cancel
              </Button>
            </DialogActions>
          </Dialog>
        </Box>
      </Container>
    </LayoutComponent>
  );
};

export default ScheduleManagementPage;
