import "./ScheduleManagementPage.scss";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { Calendar, momentLocalizer, Components } from "react-big-calendar";
import React, { useState, useEffect } from "react";
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
  SelectChangeEvent,
} from "@mui/material";
import moment from "moment";
import LayoutComponent from "../../components/Layout/Layout";
import useScheduleManagementPageHook from "./useScheduleManagementPageHook";
import { useSelector } from "react-redux";
import { RootState } from "../../store/store";
import { ScheduleEvent } from "../../model/scheduleModels/scheduleModels.model";
import axios from "axios";

const localizer = momentLocalizer(moment);

// Thêm định dạng hiển thị mới cho lịch
const calendarFormats = {
  monthHeaderFormat: "MMMM YYYY",
  dayHeaderFormat: "dddd, D MMMM YYYY",
  dayRangeHeaderFormat: ({ start, end }: { start: Date; end: Date }) =>
    `${moment(start).format("D MMMM")} - ${moment(end).format("D MMMM YYYY")}`,
  agendaHeaderFormat: ({ start, end }: { start: Date; end: Date }) =>
    `${moment(start).format("D MMMM")} - ${moment(end).format("D MMMM YYYY")}`,
  eventTimeRangeFormat: ({ start, end }: { start: Date; end: Date }) =>
    `${moment(start).format("HH:mm")} - ${moment(end).format("HH:mm")}`,
};

// Định nghĩa components tùy chỉnh cho events
const calendarComponents: Components<ScheduleEvent, object> = {
  event: (props: { event: ScheduleEvent }) => {
    const { event } = props;
    return (
      <div className="custom-event">
        <div className="event-title">{event.subject}</div>
        <div className="event-details">
          <div>Giáo viên: {event.teacher}</div>
          <div>Phòng: {event.classroomNumber}</div>
        </div>
      </div>
    );
  },
};

const ScheduleManagementPage: React.FC = () => {
  const { state, handler } = useScheduleManagementPageHook();

  // Add this line to debug teachers list
  console.log("Component received teachers:", state.teachers);

  const isMobile = useMediaQuery("(max-width:600px)");
  const role = useSelector((state: RootState) => state.authUser.role);
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [openArrangementDialog, setOpenArrangementDialog] = useState(false);
  const [newEvent, setNewEvent] = useState<ScheduleEvent>({
    id: 0,
    subject: "",
    subjectId: 0,
    title: "",
    start: new Date(),
    end: new Date(),
    teacher: "",
    classroomNumber: "",
    classId: "",
    scheduleDate: new Date(),
    slotId: "",
    academicYear: "",
  });
  const [semester, setSemester] = useState("Semester 1");
  const [semesterDateFrom, setSemesterDateFrom] = useState("");
  const [semesterDateTo, setSemesterDateTo] = useState("");
  const [semesterError, setSemesterError] = useState(false);
  const [dateFromError, setDateFromError] = useState(false);
  const [dateToError, setDateToError] = useState(false);
  const [academicYearError, setAcademicYearError] = useState(false);
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => currentYear - 5 + i); // Từ 5 năm trước đến 5 năm sau

  // Add state for teachers from direct API call
  const [directTeachers, setDirectTeachers] = useState<
    { userId: string; fullName: string }[]
  >([]);

  // Get access to all classes for filtering
  const { allClasses } = state;

  // Load Material Icons and fetch teachers directly
  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/icon?family=Material+Icons";
    document.head.appendChild(link);

    // Fetch teachers directly
    const fetchTeachers = async () => {
      try {
        console.log("Directly fetching teachers...");
        const response = await fetch(
          "http://fams.io.vn/api-nodejs/teachers/search?search=&page=1&limit=100",
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          console.error(
            "Teacher API response not OK:",
            response.status,
            response.statusText
          );
          const errorText = await response.text();
          console.error("Error response:", errorText);
          return;
        }

        const data = await response.json();
        console.log("Directly fetched teachers API response:", data);

        if (data.success) {
          console.log("Directly fetched teachers count:", data.data.length);
          setDirectTeachers(data.data);
        } else {
          console.error("API returned success: false", data);
        }
      } catch (error) {
        console.error("Error directly fetching teachers:", error);
      }
    };

    fetchTeachers();

    return () => {
      document.head.removeChild(link);
    };
  }, []);

  // Function to fetch all teachers for fallback
  const fetchAllTeachers = async () => {
    try {
      console.log("Fetching all teachers as fallback...");
      const response = await fetch(
        "http://fams.io.vn/api-nodejs/teachers/search?search=&page=1&limit=100",
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        console.error(
          "Teacher API response not OK:",
          response.status,
          response.statusText
        );
        return;
      }

      const data = await response.json();

      if (data.success && data.data) {
        console.log("Fallback: loaded all teachers, count:", data.data.length);
        setDirectTeachers(data.data);
      } else {
        console.error("Fallback API returned success: false", data);
      }
    } catch (error) {
      console.error("Error fetching all teachers as fallback:", error);
    }
  };

  // Thêm eventPropGetter để định dạng sự kiện
  const eventPropGetter = (event: ScheduleEvent) => {
    // Khởi tạo một giá trị dựa trên subject hoặc event.id để tạo màu nhất quán
    const colorBase = event.subjectId || event.id;
    // Tạo các màu pastel dựa trên subjectId
    const hue = (colorBase * 137) % 360; // Sử dụng phép nhân với số nguyên tố để tạo sự phân bố đều
    const saturation = 65;
    const lightness = 75;

    return {
      style: {
        backgroundColor: `hsl(${hue}, ${saturation}%, ${lightness}%)`,
        color: "#333",
        borderRadius: "4px",
        border: "1px solid rgba(0,0,0,0.1)",
        boxShadow: "none",
        padding: "4px 6px",
      },
    };
  };

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
                  justifyContent: "space-between",
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 2,
                    alignItems: "center",
                  }}
                >
                  <Box
                    sx={{
                      flex: isMobile ? "1 1 100%" : "auto",
                      minWidth: "180px",
                    }}
                  >
                    <FormControl fullWidth>
                      <InputLabel id="academic-year-select-label">
                        Academic Year
                      </InputLabel>
                      <Select
                        labelId="academic-year-select-label"
                        id="academic-year-select"
                        value={state.selectedAcademicYear}
                        label="Academic Year"
                        onChange={e =>
                          handler.handleAcademicYearChange(e.target.value)
                        }
                      >
                        {state.academicYears.map(year => (
                          <MenuItem key={year} value={year}>
                            {year}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Box>

                  <Box
                    sx={{
                      flex: isMobile ? "1 1 100%" : "auto",
                      minWidth: "180px",
                    }}
                  >
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

                  <Box
                    sx={{
                      flex: isMobile ? "1 1 100%" : "auto",
                      minWidth: "180px",
                    }}
                  >
                    <FormControl fullWidth>
                      <InputLabel id="subject-select-label">Subject</InputLabel>
                      <Select
                        labelId="subject-select-label"
                        id="subject-select"
                        value={state.filters.subjectId || ""}
                        label="Subject"
                        onChange={e => {
                          const value =
                            e.target.value === ""
                              ? null
                              : Number(e.target.value);
                          handler.handleSubjectChange(value);
                        }}
                      >
                        <MenuItem value="">All Subjects</MenuItem>
                        {state.allSubjects.map(subject => (
                          <MenuItem
                            key={subject.subjectId}
                            value={subject.subjectId}
                          >
                            {subject.subjectName}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Box>
                </Box>

                {role === "admin" && (
                  <Box sx={{ display: "flex", gap: 2, mt: isMobile ? 2 : 0 }}>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={() => setOpenCreateDialog(true)}
                      startIcon={<span className="material-icons">add</span>}
                      sx={{
                        borderRadius: "8px",
                        textTransform: "none",
                        fontWeight: 500,
                      }}
                    >
                      Add Schedule
                    </Button>
                    <Button
                      variant="outlined"
                      color="primary"
                      onClick={() => setOpenArrangementDialog(true)}
                      startIcon={<span className="material-icons">event</span>}
                      sx={{
                        borderRadius: "8px",
                        textTransform: "none",
                        fontWeight: 500,
                      }}
                    >
                      Arrange Schedule
                    </Button>
                  </Box>
                )}
              </Box>
            )}
            {role === "student" && (
              <Box
                sx={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 2,
                  mb: 2,
                  alignItems: "center",
                }}
              >
                <Box
                  sx={{
                    flex: isMobile ? "1 1 100%" : "auto",
                    minWidth: "180px",
                  }}
                >
                  <FormControl fullWidth>
                    <InputLabel id="academic-year-student-select-label">
                      Academic Year
                    </InputLabel>
                    <Select
                      labelId="academic-year-student-select-label"
                      id="academic-year-student-select"
                      value={state.selectedAcademicYear}
                      label="Academic Year"
                      onChange={e =>
                        handler.handleAcademicYearChange(e.target.value)
                      }
                    >
                      {state.academicYears.map(year => (
                        <MenuItem key={year} value={year}>
                          {year}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>

                <Box
                  sx={{
                    flex: isMobile ? "1 1 100%" : "auto",
                    minWidth: "180px",
                  }}
                >
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
              </Box>
            )}
            {role === "parent" && (
              <Box
                sx={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 2,
                  mb: 2,
                  alignItems: "center",
                }}
              >
                <Box
                  sx={{
                    flex: isMobile ? "1 1 100%" : "auto",
                    minWidth: "180px",
                  }}
                >
                  <Autocomplete
                    disablePortal
                    options={state.studentOptions} // bạn cần chuẩn bị mảng này
                    getOptionLabel={option => option.label}
                    value={
                      state.studentOptions.find(
                        opt => opt.value === state.filters.studentId
                      ) || null
                    }
                    onChange={(event, newValue) => {
                      handler.setFilters({
                        ...state.filters,
                        studentId: newValue?.value || "",
                      });
                      if (newValue?.value === "hungdnst2") {
                        handler.setFilters({
                          ...state.filters,
                          class: "17",
                        });
                      }
                    }}
                    renderInput={params => (
                      <TextField {...params} label="Student ID" />
                    )}
                    fullWidth
                  />
                </Box>
                <Box
                  sx={{
                    flex: isMobile ? "1 1 100%" : "auto",
                    minWidth: "180px",
                  }}
                >
                  <FormControl fullWidth>
                    <InputLabel id="academic-year-student-select-label">
                      Academic Year
                    </InputLabel>
                    <Select
                      labelId="academic-year-student-select-label"
                      id="academic-year-student-select"
                      value={state.selectedAcademicYear}
                      label="Academic Year"
                      onChange={e =>
                        handler.handleAcademicYearChange(e.target.value)
                      }
                    >
                      {state.academicYears.map(year => (
                        <MenuItem key={year} value={year}>
                          {year}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>

                <Box
                  sx={{
                    flex: isMobile ? "1 1 100%" : "auto",
                    minWidth: "180px",
                  }}
                >
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
                <Box
                  sx={{
                    flex: isMobile ? "1 1 100%" : "auto",
                    minWidth: "180px",
                  }}
                >
                  <FormControl fullWidth>
                    <InputLabel id="academic-year-teacher-select-label">
                      Academic Year
                    </InputLabel>
                    <Select
                      labelId="academic-year-teacher-select-label"
                      id="academic-year-teacher-select"
                      value={state.selectedAcademicYear}
                      label="Academic Year"
                      onChange={e =>
                        handler.handleAcademicYearChange(e.target.value)
                      }
                    >
                      {state.academicYears.map(year => (
                        <MenuItem key={year} value={year}>
                          {year}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>

                <Box
                  sx={{
                    flex: isMobile ? "1 1 100%" : "auto",
                    minWidth: "180px",
                  }}
                >
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

                <Box
                  sx={{
                    flex: isMobile ? "1 1 100%" : "auto",
                    minWidth: "180px",
                  }}
                >
                  <FormControl fullWidth>
                    <InputLabel id="subject-teacher-select-label">
                      Subject
                    </InputLabel>
                    <Select
                      labelId="subject-teacher-select-label"
                      id="subject-teacher-select"
                      value={state.filters.subjectId || ""}
                      label="Subject"
                      onChange={e => {
                        const value =
                          e.target.value === "" ? null : Number(e.target.value);
                        handler.handleSubjectChange(value);
                      }}
                    >
                      <MenuItem value="">All Subjects</MenuItem>
                      {state.allSubjects.map(subject => (
                        <MenuItem
                          key={subject.subjectId}
                          value={subject.subjectId}
                        >
                          {subject.subjectName}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>

                <Button
                  variant="outlined"
                  onClick={handler.handleShowTeacherSchedule}
                  startIcon={<span className="material-icons">person</span>}
                  sx={{
                    height: "56px",
                    borderRadius: "8px",
                    textTransform: "none",
                    fontWeight: 500,
                  }}
                >
                  My Schedule
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
            <Box
              sx={{
                mt: 2,
                height: "calc(100vh - 150px)",
                minHeight: "900px",
                overflowY: "auto",
              }}
            >
              <Calendar
                localizer={localizer}
                view={state.view}
                events={state.events}
                date={state.currentDate}
                startAccessor="start"
                endAccessor="end"
                min={new Date(0, 0, 0, 7, 0)} // 7:00 AM
                max={new Date(0, 0, 0, 19, 0)} // 7:00 PM
                views={["month", "week", "day"]}
                style={{ height: "100%", width: "100%" }}
                onSelectEvent={handler.handleSelectEvent}
                onView={handler.handleSetView}
                onNavigate={handler.handleSetDate}
                eventPropGetter={eventPropGetter}
                formats={calendarFormats}
                components={calendarComponents}
                popup
                selectable
                toolbar={true}
                defaultView="week"
                step={60}
                timeslots={1}
                showMultiDayTimes={true}
                dayLayoutAlgorithm="no-overlap"
              />
            </Box>
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
                    <Button
                      variant="contained"
                      color="error"
                      onClick={() => {
                        if (
                          window.confirm(
                            `Bạn có chắc chắn muốn xóa lịch học này không?`
                          )
                        ) {
                          handler.deleteEvent(state.eventShow?.id);
                          handler.handleSelectEvent();
                        }
                      }}
                    >
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
                <InputLabel id="academic-year-select-label">
                  Academic Year
                </InputLabel>
                <Select
                  labelId="academic-year-select-label"
                  id="academic-year-select"
                  value={newEvent.academicYear || ""}
                  label="Academic Year"
                  onChange={e => {
                    const selectedYear = e.target.value;
                    setNewEvent({
                      ...newEvent,
                      academicYear: selectedYear,
                      classId: "", // Reset class when year changes
                    });

                    // Fetch classes for this academic year
                    fetch(
                      `http://fams.io.vn/api-nodejs/classes?academicYear=${selectedYear}`,
                      {
                        method: "GET",
                        headers: {
                          "Content-Type": "application/json",
                        },
                      }
                    )
                      .then(response => {
                        if (!response.ok) {
                          throw new Error(
                            `HTTP error! Status: ${response.status}`
                          );
                        }
                        return response.json();
                      })
                      .then(data => {
                        if (data.success) {
                          console.log(
                            `Loaded ${data.data.length} classes for year ${selectedYear}`
                          );
                          // We will filter classes in the component based on this academicYear
                        }
                      })
                      .catch(error => {
                        console.error(
                          "Error fetching classes for academic year:",
                          error
                        );
                      });
                  }}
                >
                  {state.academicYears.map(year => (
                    <MenuItem key={year} value={year}>
                      {year}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel id="class-select-label">Class</InputLabel>
                <Select
                  labelId="class-select-label"
                  id="class-select"
                  value={newEvent.classId || ""}
                  label="Class"
                  onChange={e =>
                    setNewEvent({
                      ...newEvent,
                      classId: e.target.value,
                    })
                  }
                  disabled={!newEvent.academicYear} // Disable until academic year is selected
                >
                  {state.classOptions
                    .filter(classOption => {
                      // Only show classes for selected academic year
                      const classData = allClasses.find(
                        c => c.classId.toString() === classOption.value
                      );
                      return (
                        classData &&
                        classData.academicYear === newEvent.academicYear
                      );
                    })
                    .map(classOption => (
                      <MenuItem
                        key={classOption.value}
                        value={classOption.value}
                      >
                        {classOption.label}
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>

              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel id="subject-select-label">Subject</InputLabel>
                <Select
                  labelId="subject-select-label"
                  id="subject-select"
                  value={newEvent.subjectId || ""}
                  label="Subject"
                  onChange={e => {
                    const subjectId = Number(e.target.value);
                    setNewEvent({
                      ...newEvent,
                      subjectId: subjectId,
                    });

                    // Fetch teachers for this subject
                    if (subjectId) {
                      fetch(
                        `http://fams.io.vn/api-nodejs/schedules/teachers-by-subject/${subjectId}`,
                        {
                          method: "GET",
                          headers: {
                            "Content-Type": "application/json",
                          },
                        }
                      )
                        .then(response => {
                          if (!response.ok) {
                            console.error(
                              "Teacher API by subject response not OK:",
                              response.status,
                              response.statusText
                            );
                            throw new Error(
                              `HTTP error! Status: ${response.status}`
                            );
                          }
                          return response.json();
                        })
                        .then(data => {
                          if (
                            data.success &&
                            data.data &&
                            data.data.length > 0
                          ) {
                            console.log(
                              "Loaded teachers for subject:",
                              data.data.length
                            );
                            setDirectTeachers(data.data);
                          } else {
                            console.error(
                              "API returned success: false or empty data",
                              data
                            );
                            // Fallback to using all teachers
                            console.log("Falling back to all teachers");
                            if (state.teachers && state.teachers.length > 0) {
                              setDirectTeachers(state.teachers);
                            } else {
                              fetchAllTeachers();
                            }
                          }
                        })
                        .catch(error => {
                          console.error(
                            "Error fetching teachers for subject:",
                            error
                          );
                          // Fallback to using all teachers
                          console.log(
                            "Error occurred, falling back to all teachers"
                          );
                          if (state.teachers && state.teachers.length > 0) {
                            setDirectTeachers(state.teachers);
                          } else {
                            fetchAllTeachers();
                          }
                        });
                    }
                  }}
                >
                  {state.subjectState.map(subject => (
                    <MenuItem key={subject.subjectId} value={subject.subjectId}>
                      {subject.subjectName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel id="date-select-label">Date</InputLabel>
                <TextField
                  type="date"
                  fullWidth
                  value={moment(newEvent.scheduleDate || new Date()).format(
                    "YYYY-MM-DD"
                  )}
                  onChange={e =>
                    setNewEvent({
                      ...newEvent,
                      scheduleDate: new Date(e.target.value),
                    })
                  }
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              </FormControl>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel id="slot-select-label">Slot</InputLabel>
                <Select
                  labelId="slot-select-label"
                  id="slot-select"
                  value={newEvent.slotId || ""}
                  label="Slot"
                  onChange={e =>
                    setNewEvent({
                      ...newEvent,
                      slotId: e.target.value,
                    })
                  }
                >
                  {Array.from({ length: 10 }, (_, i) => i + 1).map(slot => (
                    <MenuItem key={slot} value={slot}>
                      Slot {slot}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
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
                  {(directTeachers.length > 0
                    ? directTeachers
                    : state.teachers
                  ).map(teacher => (
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
                    classId: "",
                    scheduleDate: new Date(),
                    slotId: "",
                    academicYear: "",
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
                  label="Academic Year"
                  value={state.selectedAcademicYear}
                  onChange={e => {
                    handler.handleAcademicYearChange(e.target.value);
                    setAcademicYearError(false);
                  }}
                  required
                  error={academicYearError}
                  helperText={
                    academicYearError ? "Please select an academic year" : ""
                  }
                  sx={{ width: "100%" }}
                >
                  <option value="">-- Select --</option>
                  {state.academicYears.map(year => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </TextField>

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
                onClick={async () => {
                  const hasError =
                    !semester ||
                    !semesterDateFrom ||
                    !semesterDateTo ||
                    !state.selectedAcademicYear;
                  setSemesterError(!semester);
                  setDateFromError(!semesterDateFrom);
                  setDateToError(!semesterDateTo);
                  setAcademicYearError(!state.selectedAcademicYear);

                  if (hasError) return;

                  // Parse semester number from the semester string
                  const semesterNumber = semester === "Semester 1" ? 1 : 2;

                  // Format dates from yyyy-MM-dd to dd/MM/yyyy for the API
                  const formatDateForAPI = (dateString: string) => {
                    const [year, month, day] = dateString.split("-");
                    return `${day}/${month}/${year}`;
                  };

                  try {
                    // Call the Python API to generate schedules
                    const response = await axios.post(
                      "http://fams.io.vn/api-python/api/schedules/generate",
                      {
                        semesterNumber,
                        startDate: formatDateForAPI(semesterDateFrom),
                        endDate: formatDateForAPI(semesterDateTo),
                        academicYear: state.selectedAcademicYear,
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
                    console.error(
                      "Error calling schedule generation API:",
                      error
                    );
                    alert(
                      "An error occurred while arranging the schedule. Please try again later."
                    );
                  }

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
