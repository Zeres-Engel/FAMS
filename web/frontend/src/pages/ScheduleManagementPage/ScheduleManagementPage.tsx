import "./ScheduleManagementPage.scss";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { Calendar, momentLocalizer } from "react-big-calendar";
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
  FormHelperText,
} from "@mui/material";
import moment from "moment";
import LayoutComponent from "../../components/Layout/Layout";
import useScheduleManagementPageHook from "./useScheduleManagementPageHook";
import { useSelector } from "react-redux";
import { RootState } from "../../store/store";
import { ScheduleEvent } from "../../model/scheduleModels/scheduleModels.model";
import useAttendanceHook from "./hooks/useAttendanceHook";

// Import các component đã tách
import AttendanceView from "./components/AttendanceView";
import AddScheduleDialog from "./components/AddScheduleDialog";
import ArrangeScheduleDialog from "./components/ArrangeScheduleDialog";
import EditScheduleDialog from "./components/EditScheduleDialog";

// Import các config
import { calendarFormats, calendarComponents, slotConfig, eventPropGetter } from "./config/ScheduleConfig";

const localizer = momentLocalizer(moment);

// Interface cho SlotInfo
interface SlotInfo {
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  isExtraSlot: boolean;
}

const ScheduleManagementPage: React.FC = () => {
  const { state, handler } = useScheduleManagementPageHook();
  const attendanceHook = useAttendanceHook({ scheduleId: null });

  // Debug logs
  useEffect(() => {
    console.log("Academic years in component:", state.academicYears);
    console.log("Selected academic year:", state.selectedAcademicYear);
  }, [state.academicYears, state.selectedAcademicYear]);

  const isMobile = useMediaQuery("(max-width:600px)");
  const role = useSelector((state: RootState) => state.authUser.role);
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [openArrangementDialog, setOpenArrangementDialog] = useState(false);
  const [scheduleSuccess, setScheduleSuccess] = useState(false);
  const [scheduleMessage, setScheduleMessage] = useState("");
  
  // State cho events mới
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
  
  // State cho edit và delete event
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<ScheduleEvent | null>(null);
  
  // State cho semester
  const [semester, setSemester] = useState("Semester 1");
  const [semesterDateFrom, setSemesterDateFrom] = useState("");
  const [semesterDateTo, setSemesterDateTo] = useState("");
  const [semesterError, setSemesterError] = useState(false);
  const [dateFromError, setDateFromError] = useState(false);
  const [dateToError, setDateToError] = useState(false);
  const [academicYearError, setAcademicYearError] = useState(false);
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => currentYear - 5 + i); // Từ 5 năm trước đến 5 năm sau

  // State cho teachers
  const [directTeachers, setDirectTeachers] = useState<{ userId: string; fullName: string }[]>([]);

  // State cho slot info
  const [slotInfo, setSlotInfo] = useState<SlotInfo | null>(null);

  // Destructure từ attendance hook
  const { state: attendanceState, actions: attendanceActions } = attendanceHook;
  
  // Load Material Icons và fetch teachers
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

  // Effect để cập nhật Day of Week khi component mount hoặc openCreateDialog thay đổi
  useEffect(() => {
    if (openCreateDialog) {
      // Ngày mặc định là ngày hiện tại
      const selectedDate = newEvent.scheduleDate || new Date();
      
      // Xác định thứ trong tuần từ ngày đã chọn
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const dayOfWeek = days[selectedDate.getDay()];
      
      // Khởi tạo slotInfo ngay từ đầu
      setSlotInfo({
        dayOfWeek: dayOfWeek,
        startTime: newEvent.slotId ? (slotConfig.find(s => s.slotNumber === Number(newEvent.slotId))?.startTime || "") : "",
        endTime: newEvent.slotId ? (slotConfig.find(s => s.slotNumber === Number(newEvent.slotId))?.endTime || "") : "",
        isExtraSlot: newEvent.slotId === "11"
      });
    }
  }, [openCreateDialog, newEvent.scheduleDate, newEvent.slotId]);

  const handleSelectEvent = (event: ScheduleEvent) => {
    setSelectedEvent(event);
    setOpenEditDialog(true);
  };

  const handleSaveEvent = async (updatedEvent: ScheduleEvent) => {
    try {
      // Gọi API để cập nhật thông tin lịch học
      const response = await fetch(`http://fams.io.vn/api-nodejs/schedules/${updatedEvent.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedEvent),
      });

      if (!response.ok) {
        throw new Error('Failed to update schedule');
      }

      // Cập nhật state sau khi lưu thành công
      handler.setEventShow(updatedEvent);
      // Refresh danh sách events
      handler.handleSearch();
    } catch (error) {
      console.error('Error updating schedule:', error);
      alert('Failed to update schedule. Please try again.');
    }
  };

  const handleViewAttendance = (scheduleId: number) => {
    // Log thông tin về lịch học trước khi gọi API điểm danh
    console.log('Selected schedule ID for attendance:', scheduleId);
    console.log('Current event data:', selectedEvent);
    
    // Lấy dữ liệu từ API schedule để có thêm thông tin
    fetch(`http://fams.io.vn/api-nodejs/schedules/${scheduleId}`)
      .then(response => response.json())
      .then(scheduleData => {
        if (scheduleData.success && scheduleData.data) {
          console.log('Schedule details from API:', scheduleData.data);
          
          // Cập nhật eventShow với dữ liệu từ API
          if (selectedEvent) {
            const updatedEvent = {
              ...selectedEvent,
              className: scheduleData.data.className || selectedEvent.className,
              classId: scheduleData.data.classId || selectedEvent.classId
            };
            
            console.log('Updated event with className:', updatedEvent);
            handler.setEventShow(updatedEvent);
          }
        }
        
        // Gọi API điểm danh sau khi đã cập nhật thông tin
        attendanceHook.actions.fetchAttendanceData(scheduleId);
      })
      .catch(error => {
        console.error('Error fetching schedule details:', error);
        // Vẫn gọi API điểm danh ngay cả khi có lỗi
        attendanceHook.actions.fetchAttendanceData(scheduleId);
      });
  };

  // Handler cho việc xóa event
  const handleDeleteEvent = (scheduleId: number) => {
    console.log(`Deleting schedule with ID: ${scheduleId}`);
    
    // Gọi API xóa event từ useScheduleManagementPageHook trực tiếp
    import('axios').then(axios => {
      axios.default.delete(
        `http://fams.io.vn/api-nodejs/schedules/${scheduleId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json"
          }
        }
      )
      .then((response) => {
        console.log("Schedule deleted successfully", response.data);
        // Đóng dialog nếu đang mở
        setOpenEditDialog(false);
        // Refresh danh sách events
        handler.handleSearch();
      })
      .catch((error: Error) => {
        console.error("Error deleting schedule:", error);
      });
    });
  };

  return (
    <LayoutComponent
      pageHeader={role === "admin" ? "Schedule Management" : "Schedule Page"}
    >
      <Container maxWidth="xl" style={{ padding: "0", overflow: "hidden" }}>
        {attendanceState.viewMode === "calendar" ? (
          <Box className={state?.eventShow?.id !== 0 ? "schedule-Display" : ""}>
            <Paper elevation={3} sx={{ padding: "16px" }}>
              {/* Filter controls for different roles */}
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
                        options={[{ label: "All classes", value: "" }, ...state.classOptions]}
                        getOptionLabel={option => option.label}
                        value={
                          state.filters.class === "" 
                            ? { label: "All classes", value: "" } 
                            : state.classOptions.find(
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

                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={handler.handleSearch}
                        className="compact-search-button"
                        size="small"
                      >
                        Search
                      </Button>
                    </Box>
                  </Box>

                  {role === "admin" && (
                    <Box sx={{ display: "flex", gap: 2, mt: isMobile ? 2 : 0 }}>
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={() => {
                          // Khởi tạo ngày mặc định là ngày hiện tại
                          const today = new Date();
                          
                          // Reset form và thiết lập ngày mặc định
                          setNewEvent({
                            id: 0,
                            subject: "",
                            subjectId: 0,
                            title: "",
                            start: today,
                            end: today,
                            teacher: "",
                            classroomNumber: "",
                            classId: "",
                            scheduleDate: today,
                            slotId: "",
                            academicYear: "",
                          });
                          
                          // Xác định thứ trong tuần
                          const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                          const dayOfWeek = days[today.getDay()];
                          
                          // Đặt slotInfo với thứ đã xác định
                          setSlotInfo({
                            dayOfWeek: dayOfWeek,
                            startTime: "",
                            endTime: "",
                            isExtraSlot: false
                          });
                          
                          // Mở dialog
                          setOpenCreateDialog(true);
                        }}
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

              {/* Student view filters */}
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
                  {/* Student filter controls */}
                </Box>
              )}

              {/* Teacher view filters */}
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
                  {/* Teacher filter controls */}
                </Box>
              )}

              {/* Year filter and Calendar */}
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
                  style={{ height: "100%", width: "100%", overflow: "visible" }}
                  onSelectEvent={handleSelectEvent}
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

            {/* Event detail dialog */}

            {/* Add Schedule Dialog */}
            <AddScheduleDialog
              open={openCreateDialog}
              onClose={() => setOpenCreateDialog(false)}
              newEvent={newEvent}
              setNewEvent={setNewEvent}
              slotInfo={slotInfo}
              setSlotInfo={setSlotInfo}
              academicYears={state.academicYears}
              allClasses={state.allClasses}
              subjectState={state.subjectState}
              classrooms={state.classrooms}
              directTeachers={directTeachers}
              teachers={state.teachers}
              fetchAllTeachers={fetchAllTeachers}
              fetchClassesByAcademicYear={handler.fetchClassesByAcademicYear}
              addEvent={handler.addEvent}
            />

            {/* Arrange Schedule Dialog */}
            <ArrangeScheduleDialog
              open={openArrangementDialog}
              onClose={() => setOpenArrangementDialog(false)}
              semester={semester}
              setSemester={setSemester}
              semesterDateFrom={semesterDateFrom}
              setSemesterDateFrom={setSemesterDateFrom}
              semesterDateTo={semesterDateTo}
              setSemesterDateTo={setSemesterDateTo}
              semesterError={semesterError}
              setSemesterError={setSemesterError}
              dateFromError={dateFromError}
              setDateFromError={setDateFromError}
              dateToError={dateToError}
              setDateToError={setDateToError}
              academicYearError={academicYearError}
              setAcademicYearError={setAcademicYearError}
              setScheduleSuccess={setScheduleSuccess}
              setScheduleMessage={setScheduleMessage}
              academicYears={state.academicYears}
              selectedAcademicYear={state.selectedAcademicYear}
              handleAcademicYearChange={handler.handleAcademicYearChange}
            />
          </Box>
        ) : (
          <Paper elevation={3} sx={{ padding: "16px" }}>
            <AttendanceView 
              scheduleId={attendanceState.selectedScheduleId}
              subjectName={state.eventShow?.subject || ""}
              className={state.eventShow?.className || state.eventShow?.classId || ""}
              teacher={state.eventShow?.teacher || ""}
              date={state.eventShow?.start || new Date()}
              onBack={attendanceActions.handleBackToCalendar}
              attendanceData={attendanceState.attendanceData}
              loading={attendanceState.loading}
              error={attendanceState.error}
              setAttendanceData={(data) => {
                // Handle setting attendance data through the hook actions if needed
                console.log("AttendanceView is updating attendance data", data.length);
              }}
              onAttendanceUpdate={(data) => {
                console.log("AttendanceView triggered attendance update", data.length);
              }}
              fetchAttendanceData={attendanceActions.fetchAttendanceData}
            />
          </Paper>
        )}

        <EditScheduleDialog
          open={openEditDialog}
          onClose={() => setOpenEditDialog(false)}
          event={selectedEvent}
          onSave={handleSaveEvent}
          onViewAttendance={handleViewAttendance}
          onDelete={handleDeleteEvent}
          teachers={directTeachers}
          academicYears={state.academicYears}
          allClasses={state.allClasses}
          subjectState={state.subjectState}
          classrooms={state.classrooms}
        />
      </Container>
    </LayoutComponent>
  );
};

export default ScheduleManagementPage;
