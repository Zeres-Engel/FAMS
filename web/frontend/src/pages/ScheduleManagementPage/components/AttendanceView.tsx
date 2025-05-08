import React, { useState, useRef } from "react";
import {
  Box,
  Typography,
  Button,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Avatar,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  CircularProgress,
  Grid,
  Tooltip,
  Checkbox,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import moment from "moment";
import { AttendanceData } from "../hooks/useAttendanceHook";

// Sử dụng lại type từ hook để đảm bảo tương thích
type AttendanceDataItem = AttendanceData;

// Placeholder images
const DEFAULT_AVATAR =
  "https://cdn.pixabay.com/photo/2016/08/08/09/17/avatar-1577909_1280.png";
const DEFAULT_FACE =
  "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png";

export interface AttendanceViewProps {
  scheduleId: number | null;
  subjectName: string;
  className: string;
  teacher: string;
  date: Date;
  onBack: () => void;
  attendanceData: AttendanceData[];
  loading?: boolean;
  error?: string | null;
  setAttendanceData?: React.Dispatch<React.SetStateAction<AttendanceData[]>>;
  onAttendanceUpdate?: (updatedAttendance: AttendanceData[]) => void;
  fetchAttendanceData?: (scheduleId: number) => Promise<void>;
}

const AttendanceView: React.FC<AttendanceViewProps> = ({
  scheduleId,
  subjectName,
  className,
  teacher,
  date,
  onBack,
  attendanceData,
  loading = false,
  error = null,
  setAttendanceData,
  onAttendanceUpdate,
  fetchAttendanceData,
}) => {
  const [tabValue, setTabValue] = useState(0);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [currentAttendance, setCurrentAttendance] =
    useState<AttendanceDataItem | null>(null);
  const [editStatus, setEditStatus] = useState<
    "Present" | "Absent" | "Late" | "Not Now"
  >("Not Now");
  const [editNote, setEditNote] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showFaceDialog, setShowFaceDialog] = useState(false);
  const [selectedFaceImage, setSelectedFaceImage] = useState<string | null>(
    null
  );
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [editedAttendanceId, setEditedAttendanceId] = useState<any>({
    scheduleId: "",
    userId: "",
  });

  // Tham chiếu đến hàng vừa chỉnh sửa
  const editedRowRef = useRef<HTMLTableRowElement | null>(null);
  // Updated refresh function to use the hook's fetchAttendanceData
  const refreshAttendanceData = async () => {
    if (!scheduleId) return;

    try {
      // Show loading state
      setIsRefreshing(true);

      if (fetchAttendanceData) {
        // Use the same function that initially loaded the attendance data
        console.log(
          `Using hook's fetchAttendanceData for schedule ${scheduleId}...`
        );
        await fetchAttendanceData(scheduleId);
        console.log(editedAttendanceId);
        
        setTimeout(() => {
          if (editedRowRef.current) {
            editedRowRef.current.scrollIntoView({
              behavior: "smooth",
              block: "center",
            });
          }
        }, 200);
        console.log("Attendance data refreshed successfully via hook function");
      } else {
        // Fallback to the old implementation if fetchAttendanceData is not provided
        console.log(
          "fetchAttendanceData not provided, using fallback implementation"
        );

        // Show loading state if setAttendanceData is available
        if (typeof setAttendanceData === "function") {
          // Create a temporary loading state by marking all records as "loading"
          const loadingData = attendanceData.map(item => ({
            ...item,
            isRefreshing: true,
          }));
          setAttendanceData(loadingData as any);
        }

        // Prepare headers
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
        };

        // Only add token if it exists
        const token = localStorage.getItem("token");
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }

        console.log(
          `Fetching fresh attendance data for schedule ${scheduleId}...`
        );
        const response = await fetch(
          `http://fams.io.vn/api-nodejs/attendance/schedule/${scheduleId}`,
          {
            headers,
          }
        );

        const data = await response.json();

        if (data.success && data.data) {
          console.log(
            "Fresh attendance data received:",
            data.data.length,
            "records"
          );
          // Update local state directly with fresh data from API
          if (typeof setAttendanceData === "function") {
            setAttendanceData(data.data);
          }

          if (typeof onAttendanceUpdate === "function") {
            onAttendanceUpdate(data.data);
          }

          console.log("Attendance data refreshed successfully");
        } else {
          console.error("API returned success=false or no data:", data);
        }
      }
    } catch (error) {
      console.error("Error refreshing attendance data:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleEditClick = (attendance: AttendanceDataItem) => {
    setCurrentAttendance(attendance);
    setEditStatus(attendance.status);
    setEditNote(attendance.note || "");
    setEditedAttendanceId({
      scheduleId: attendance.scheduleId,
      userId: attendance.userId,
    });
    console.log(attendance);

    setEditDialogOpen(true);
  };

  const handleCloseEditDialog = () => {
    setEditDialogOpen(false);
    setCurrentAttendance(null);
  };

  const handleViewFace = (faceImageUrl: string | undefined) => {
    if (faceImageUrl) {
      setSelectedFaceImage(faceImageUrl);
      setShowFaceDialog(true);
    }
  };

  const handleCloseFaceDialog = () => {
    setShowFaceDialog(false);
    setSelectedFaceImage(null);
  };

  const handleSaveAttendance = async () => {
    if (!currentAttendance) return;

    setIsSubmitting(true);

    try {
      // Ensure status is a valid type
      const typedStatus = editStatus as
        | "Present"
        | "Absent"
        | "Late"
        | "Not Now";

      // Prepare headers
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      // Only add token if it exists
      const token = localStorage.getItem("token");
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      // Immediately update the UI for better responsiveness
      const updatedAttendanceData = attendanceData.map(item =>
        item.attendanceId === currentAttendance?.attendanceId
          ? {
              ...item,
              status: typedStatus,
              note: editNote,
              notes: editNote,
              checkInTime: item.checkIn
                ? new Date(item.checkIn).toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: false,
                  })
                : item.checkInTime,
            }
          : item
      ) as AttendanceData[];

      // Update UI immediately
      if (typeof setAttendanceData === "function") {
        setAttendanceData(updatedAttendanceData);
      }

      if (typeof onAttendanceUpdate === "function") {
        onAttendanceUpdate(updatedAttendanceData);
      }

      // Gọi API để cập nhật trạng thái điểm danh
      const response = await fetch(
        `http://fams.io.vn/api-nodejs/attendance/check-in`,
        {
          method: "PUT",
          headers,
          body: JSON.stringify({
            userId: currentAttendance.userId,
            scheduleId: currentAttendance.scheduleId,
            status: typedStatus,
            note: editNote,
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        // Đóng dialog
        setEditDialogOpen(false);
        setCurrentAttendance(null);
        console.log("Attendance updated successfully:", data);

        // Refresh data from API immediately to get the latest data
        setTimeout(() => {
          console.log(
            "Refreshing attendance data from API after successful update..."
          );
          refreshAttendanceData();
        }, 300); // Small delay to ensure server has processed the update
      } else {
        throw new Error(data.message || "Failed to update attendance");
      }
    } catch (error) {
      console.error("Error updating attendance:", error);
      alert("Failed to update attendance. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "present":
        return "success";
      case "late":
        return "warning";
      case "absent":
        return "error";
      default:
        return "default";
    }
  };

  const getStudentsList = () => {
    const students = attendanceData.filter(item => item.userRole === "student");
    // console.log("Students list:", students);
    return students;
  };

  const getTeachersList = () => {
    const teachers = attendanceData.filter(
      item =>
        item.userRole === "teacher" ||
        item.userRole?.toLowerCase() === "teacher"
    );
    console.log("Teachers list:", teachers);
    return teachers;
  };

  const getPresentCount = () => {
    return attendanceData.filter(
      item => item.status.toLowerCase() === "present"
    ).length;
  };

  const getLateCount = () => {
    return attendanceData.filter(item => item.status.toLowerCase() === "late")
      .length;
  };

  const getAbsentCount = () => {
    return attendanceData.filter(item => item.status.toLowerCase() === "absent")
      .length;
  };

  const getNotNowCount = () => {
    return attendanceData.filter(
      item => item.status.toLowerCase() === "not now"
    ).length;
  };

  // Hàm kiểm tra URL hợp lệ và đảm bảo trả về string
  const isValidImageUrl = (url: string | undefined | null): boolean => {
    if (!url) return false;
    return url.startsWith("http://") || url.startsWith("https://");
  };

  // Hàm lấy avatar URL với kiểu trả về chắc chắn là string
  const getImageUrl = (
    url: string | undefined | null,
    defaultUrl: string
  ): string => {
    if (!url || !isValidImageUrl(url)) return defaultUrl;
    return url;
  };

  // Render trạng thái loading
  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          p: 3,
        }}
      >
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ mt: 2 }}>
        Loading attendance data...
        </Typography>
      </Box>
    );
  }

  // Render lỗi nếu có
  if (error) {
    return (
      <Box sx={{ textAlign: "center", p: 3 }}>
        <Typography variant="h6" color="error" gutterBottom>
          {error}
        </Typography>
        <Button
          variant="contained"
          onClick={onBack}
          startIcon={<ArrowBackIcon />}
          sx={{ mt: 2 }}
        >
          Quay lại lịch
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ width: "100%" }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          mb: 2,
        }}
      >
        <Box sx={{ maxWidth: "80%" }}>
          <Typography variant="h5" component="h2" gutterBottom>
            Attendance Management
          </Typography>
          <Box
            sx={{ display: "flex", flexDirection: "column", gap: 0.5, mb: 1 }}
          >
            <Typography variant="subtitle1">
              <strong>Subject:</strong>{" "}
              {attendanceData.length > 0 && attendanceData[0].subjectName
                ? attendanceData[0].subjectName
                : subjectName}
            </Typography>
            <Typography variant="subtitle1">
              <strong>Class:</strong>{" "}
              {attendanceData.length > 0 && attendanceData[0].className
                ? attendanceData[0].className
                : className}
            </Typography>
          </Box>

          <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
            <Typography variant="subtitle2">
              <strong>Teacher:</strong>{" "}
              {attendanceData.length > 0 && attendanceData[0].teacherName
                ? attendanceData[0].teacherName
                : teacher}{" "}
              |<strong> Date:</strong> {moment(date).format("DD/MM/YYYY")}
              {attendanceData.length > 0 && (
                <>
                  {attendanceData[0].slotNumber && (
                    <>
                      {" "}
                      | <strong>Slot:</strong> {attendanceData[0].slotNumber} (
                      {attendanceData[0].startTime} -{" "}
                      {attendanceData[0].endTime})
                    </>
                  )}
                  {attendanceData[0].topic && (
                    <>
                      {" "}
                      | <strong>Topic:</strong> {attendanceData[0].topic}
                    </>
                  )}
                  {attendanceData[0].dayOfWeek && (
                    <>
                      {" "}
                      | <strong>Day:</strong> {attendanceData[0].dayOfWeek}
                    </>
                  )}
                  {attendanceData[0].classroomName && (
                    <>
                      {" "}
                      | <strong>Room:</strong> {attendanceData[0].classroomName}
                    </>
                  )}
                </>
              )}
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Present:{" "}
            <strong style={{ color: "#4caf50" }}>{getPresentCount()}</strong> |
            Late: <strong style={{ color: "#ff9800" }}>{getLateCount()}</strong>{" "}
            | Absent:{" "}
            <strong style={{ color: "#f44336" }}>{getAbsentCount()}</strong> |
            Not Marked: <strong>{getNotNowCount()}</strong> | Total Students:{" "}
            <strong>{getStudentsList().length}</strong>
          </Typography>
        </Box>
        <Button
          variant="outlined"
          color="primary"
          startIcon={<span className="material-icons">arrow_back</span>}
          onClick={onBack}
        >
          Back to Schedule
        </Button>
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 2 }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="Student Attendance" />
          <Tab label="Teacher Attendance" />
          <Tab label="Statistics" />
        </Tabs>
      </Box>

      {tabValue === 0 && (
        <>
          {/* Batch action buttons */}
          <Box
            sx={{
              mb: 2,
              display: "flex",
              gap: 2,
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <Typography variant="body2" color="text.secondary">
              Total students: <strong>{getStudentsList().length}</strong>
            </Typography>
          </Box>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>User Avatar</TableCell>
                  <TableCell>Check-in Face</TableCell>
                  <TableCell>User ID</TableCell>
                  <TableCell>Full Name</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Check-in Time</TableCell>
                  <TableCell>Notes</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {getStudentsList().length > 0 ? (
                  getStudentsList().map(student => (
                    <TableRow
                      key={student.attendanceId}
                      ref={
                        student.scheduleId === editedAttendanceId.scheduleId &&
                        student?.userId === editedAttendanceId.userId
                          ? editedRowRef
                          : null
                      }
                    >
                      <TableCell>
                        <Tooltip title="View user avatar">
                          <Avatar
                            src={getImageUrl(
                              student.user?.avatar,
                              DEFAULT_AVATAR
                            )}
                            alt={student.studentName || "User Avatar"}
                            sx={{ width: 40, height: 40, cursor: "pointer" }}
                            onClick={() =>
                              handleViewFace(
                                getImageUrl(
                                  student.user?.avatar,
                                  DEFAULT_AVATAR
                                )
                              )
                            }
                          />
                        </Tooltip>
                      </TableCell>
                      <TableCell>
                        {isValidImageUrl(student.checkInFace) ? (
                          <Tooltip title="View check-in face">
                            <Avatar
                              src={getImageUrl(
                                student.checkInFace,
                                DEFAULT_AVATAR
                              )}
                              alt="Check-in Face"
                              sx={{ width: 40, height: 40, cursor: "pointer" }}
                              onClick={() =>
                                handleViewFace(student.checkInFace as string)
                              }
                            />
                          </Tooltip>
                        ) : (
                          <Tooltip title="No check-in face available">
                            <Avatar
                              src={DEFAULT_FACE}
                              alt="No face data"
                              sx={{
                                width: 40,
                                height: 40,
                                opacity: 0.6,
                                cursor: "pointer",
                              }}
                              onClick={() => handleViewFace(DEFAULT_FACE)}
                            />
                          </Tooltip>
                        )}
                      </TableCell>
                      <TableCell>{student.userId}</TableCell>
                      <TableCell>
                        {student.fullName || student.studentName}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={student.status}
                          color={getStatusColor(student.status) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {student.checkIn
                          ? moment(student.checkIn).format(
                              "HH:mm:ss DD/MM/YYYY"
                            )
                          : "-"}
                      </TableCell>
                      <TableCell>{student.note || "-"}</TableCell>
                      <TableCell>
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handleEditClick(student)}
                        >
                          <span className="material-icons">edit</span>
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      <Typography variant="body1" sx={{ py: 2 }}>
                        No student attendance data available.
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}

      {tabValue === 1 && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>User Avatar</TableCell>
                <TableCell>Check-in Face</TableCell>
                <TableCell>User ID</TableCell>
                <TableCell>Full Name</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Check-in Time</TableCell>
                <TableCell>Notes</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {attendanceData.length > 0 ? (
                getTeachersList().map(teacher => (
                  <TableRow key={teacher.attendanceId}>
                    <TableCell>
                      <Tooltip title="View user avatar">
                        <Avatar
                          src={getImageUrl(
                            teacher.user?.avatar,
                            DEFAULT_AVATAR
                          )}
                          alt={teacher.teacherName || "User Avatar"}
                          sx={{ width: 40, height: 40, cursor: "pointer" }}
                          onClick={() =>
                            handleViewFace(
                              getImageUrl(teacher.user?.avatar, DEFAULT_AVATAR)
                            )
                          }
                        />
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      {isValidImageUrl(teacher.checkInFace) ? (
                        <Tooltip title="View check-in face">
                          <Avatar
                            src={getImageUrl(
                              teacher.checkInFace,
                              DEFAULT_AVATAR
                            )}
                            alt="Check-in Face"
                            sx={{ width: 40, height: 40, cursor: "pointer" }}
                            onClick={() =>
                              handleViewFace(teacher.checkInFace as string)
                            }
                          />
                        </Tooltip>
                      ) : (
                        <Tooltip title="No check-in face available">
                          <Avatar
                            src={DEFAULT_FACE}
                            alt="No face data"
                            sx={{
                              width: 40,
                              height: 40,
                              opacity: 0.6,
                              cursor: "pointer",
                            }}
                            onClick={() => handleViewFace(DEFAULT_FACE)}
                          />
                        </Tooltip>
                      )}
                    </TableCell>
                    <TableCell>{teacher.userId}</TableCell>
                    <TableCell>
                      {teacher.fullName || teacher.teacherName}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={teacher.status}
                        color={getStatusColor(teacher.status) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {teacher.checkIn
                        ? moment(teacher.checkIn).format("HH:mm:ss DD/MM/YYYY")
                        : "-"}
                    </TableCell>
                    <TableCell>{teacher.note || "-"}</TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => handleEditClick(teacher)}
                      >
                        <span className="material-icons">edit</span>
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    <Typography variant="body1" sx={{ py: 2 }}>
                      No teacher attendance data available.
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {tabValue === 2 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Attendance Statistics
          </Typography>
          <Box sx={{ display: "flex", gap: 3, mb: 3, flexWrap: "wrap" }}>
            <Box
              sx={{
                p: 2,
                bgcolor: "success.light",
                borderRadius: 2,
                minWidth: "150px",
                flex: 1,
              }}
            >
              <Typography variant="h4" align="center">
                {getPresentCount()}
              </Typography>
              <Typography variant="body1" align="center">
                Present
              </Typography>
            </Box>
            <Box
              sx={{
                p: 2,
                bgcolor: "warning.light",
                borderRadius: 2,
                minWidth: "150px",
                flex: 1,
              }}
            >
              <Typography variant="h4" align="center">
                {getLateCount()}
              </Typography>
              <Typography variant="body1" align="center">
                Late
              </Typography>
            </Box>
            <Box
              sx={{
                p: 2,
                bgcolor: "error.light",
                borderRadius: 2,
                minWidth: "150px",
                flex: 1,
              }}
            >
              <Typography variant="h4" align="center">
                {getAbsentCount()}
              </Typography>
              <Typography variant="body1" align="center">
                Absent
              </Typography>
            </Box>
            <Box
              sx={{
                p: 2,
                bgcolor: "grey.300",
                borderRadius: 2,
                minWidth: "150px",
                flex: 1,
              }}
            >
              <Typography variant="h4" align="center">
                {getNotNowCount()}
              </Typography>
              <Typography variant="body1" align="center">
                Not Now
              </Typography>
            </Box>
          </Box>

          <Typography variant="h6" gutterBottom>
            Attendance Rate
          </Typography>
          <Box sx={{ mb: 3 }}>
            <Typography variant="body1">
              Present Rate:{" "}
              {attendanceData.length > 0
                ? ((getPresentCount() / attendanceData.length) * 100).toFixed(2)
                : 0}
              %
            </Typography>
            <Typography variant="body1">
              Late Rate:{" "}
              {attendanceData.length > 0
                ? ((getLateCount() / attendanceData.length) * 100).toFixed(2)
                : 0}
              %
            </Typography>
            <Typography variant="body1">
              Absent Rate:{" "}
              {attendanceData.length > 0
                ? ((getAbsentCount() / attendanceData.length) * 100).toFixed(2)
                : 0}
              %
            </Typography>
            <Typography variant="body1">
              Not Checked Rate:{" "}
              {attendanceData.length > 0
                ? ((getNotNowCount() / attendanceData.length) * 100).toFixed(2)
                : 0}
              %
            </Typography>
          </Box>
        </Paper>
      )}

      {/* Edit Attendance Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={handleCloseEditDialog}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Edit Attendance</DialogTitle>
        <DialogContent>
          {currentAttendance && (
            <Box
              sx={{ display: "flex", flexDirection: "column", gap: 2, py: 2 }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Box sx={{ textAlign: "center" }}>
                  <Avatar
                    src={getImageUrl(
                      currentAttendance.user?.avatar,
                      DEFAULT_AVATAR
                    )}
                    alt={
                      currentAttendance.fullName ||
                      currentAttendance.studentName ||
                      currentAttendance.teacherName ||
                      "User"
                    }
                    sx={{
                      width: 60,
                      height: 60,
                      cursor: "pointer",
                      mx: "auto",
                    }}
                    onClick={() =>
                      handleViewFace(
                        getImageUrl(
                          currentAttendance.user?.avatar,
                          DEFAULT_AVATAR
                        )
                      )
                    }
                  />
                  <Typography variant="caption">Profile</Typography>
                </Box>

                <Box sx={{ textAlign: "center" }}>
                  <Avatar
                    src={
                      isValidImageUrl(currentAttendance.checkInFace)
                        ? getImageUrl(
                            currentAttendance.checkInFace,
                            DEFAULT_FACE
                          )
                        : DEFAULT_FACE
                    }
                    alt="Check-in Face"
                    sx={{
                      width: 60,
                      height: 60,
                      cursor: "pointer",
                      opacity: isValidImageUrl(currentAttendance.checkInFace)
                        ? 1
                        : 0.6,
                      mx: "auto",
                    }}
                    onClick={() =>
                      handleViewFace(
                        isValidImageUrl(currentAttendance.checkInFace)
                          ? currentAttendance.checkInFace
                          : DEFAULT_FACE
                      )
                    }
                  />
                  <Typography variant="caption">Checkin Face</Typography>
                </Box>

                <Box>
                  <Typography variant="body2">
                    <strong>User ID:</strong> {currentAttendance.userId}
                  </Typography>
                  <Typography variant="body2">
                    <strong>User Name:</strong>{" "}
                    {currentAttendance.fullName ||
                      currentAttendance.studentName ||
                      currentAttendance.teacherName}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Schedule ID:</strong> {currentAttendance.scheduleId}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Checkin:</strong> {currentAttendance.checkInTime}
                  </Typography>
                </Box>
              </Box>

              <FormControl fullWidth size="small">
                <InputLabel id="status-select-label">Status</InputLabel>
                <Select
                  labelId="status-select-label"
                  value={editStatus}
                  label="Status"
                  onChange={e =>
                    setEditStatus(
                      e.target.value as
                        | "Present"
                        | "Absent"
                        | "Late"
                        | "Not Now"
                    )
                  }
                >
                  <MenuItem value="Present">Present</MenuItem>
                  <MenuItem value="Late">Late</MenuItem>
                  <MenuItem value="Absent">Absent</MenuItem>
                  <MenuItem value="Not Now">Not Now</MenuItem>
                </Select>
              </FormControl>

              <TextField
                label="Note"
                multiline
                rows={2}
                value={editNote}
                onChange={e => setEditNote(e.target.value)}
                fullWidth
                size="small"
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEditDialog} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            onClick={handleSaveAttendance}
            variant="contained"
            color="primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? <CircularProgress size={20} /> : "Save"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Face Image Dialog */}
      <Dialog
        open={showFaceDialog}
        onClose={handleCloseFaceDialog}
        maxWidth="md"
      >
        <DialogTitle>Face Image</DialogTitle>
        <DialogContent>
          {selectedFaceImage && (
            <Box sx={{ display: "flex", justifyContent: "center", p: 2 }}>
              <img
                src={selectedFaceImage}
                alt="Face"
                style={{
                  maxWidth: "100%",
                  maxHeight: "70vh",
                  objectFit: "contain",
                }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseFaceDialog}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AttendanceView;
