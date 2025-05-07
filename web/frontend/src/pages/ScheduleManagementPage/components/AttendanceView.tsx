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
  Checkbox
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import moment from "moment";
import { AttendanceData } from "../hooks/useAttendanceHook";

// Sử dụng lại type từ hook để đảm bảo tương thích
type AttendanceDataItem = AttendanceData;

// Placeholder images
const DEFAULT_AVATAR = "https://cdn.pixabay.com/photo/2016/08/08/09/17/avatar-1577909_1280.png";
const DEFAULT_FACE = "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png";

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
  onAttendanceUpdate
}) => {
  const [tabValue, setTabValue] = useState(0);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [currentAttendance, setCurrentAttendance] = useState<AttendanceDataItem | null>(null);
  const [editStatus, setEditStatus] = useState<"Present" | "Absent" | "Late" | "Not Now">("Not Now");
  const [editNote, setEditNote] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showFaceDialog, setShowFaceDialog] = useState(false);
  const [selectedFaceImage, setSelectedFaceImage] = useState<string | null>(null);
  const [isSubmittingBatch, setIsSubmittingBatch] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState<number[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [webcamOpen, setWebcamOpen] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const webcamRef = useRef<any>(null);
  
  // Add refreshAttendanceData function
  const refreshAttendanceData = async () => {
    if (!scheduleId) return;
    
    try {
      // Show loading state
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      
      // Only add token if it exists
      const token = localStorage.getItem('token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(`http://fams.io.vn/api-nodejs/attendance/schedule/${scheduleId}`, {
        headers
      });
      
      const data = await response.json();
      
      if (data.success && data.data) {
        // Update local state directly with fresh data from API
        if (typeof setAttendanceData === 'function') {
          setAttendanceData(data.data);
        }
        
        if (typeof onAttendanceUpdate === 'function') {
          onAttendanceUpdate(data.data);
        }
        
        console.log("Attendance data refreshed successfully");
      }
    } catch (error) {
      console.error("Error refreshing attendance data:", error);
    }
  };
  
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleEditClick = (attendance: AttendanceDataItem) => {
    setCurrentAttendance(attendance);
    setEditStatus(attendance.status);
    setEditNote(attendance.note || "");
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
      const typedStatus = editStatus as "Present" | "Absent" | "Late" | "Not Now";
      
      // Prepare headers
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      
      // Only add token if it exists
      const token = localStorage.getItem('token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      // Gọi API để cập nhật trạng thái điểm danh
      const response = await fetch(`http://fams.io.vn/api-nodejs/attendance/check-in`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          userId: currentAttendance.userId,
          scheduleId: currentAttendance.scheduleId,
          status: typedStatus,
          note: editNote
        })
      });

      const data = await response.json();
      
      if (data.success) {
        // Cập nhật dữ liệu local trực tiếp với dữ liệu trả về từ API
        const updatedAttendanceData = attendanceData.map(item => 
          item.attendanceId === currentAttendance.attendanceId
            ? {
                ...item,
                ...data.data, // Sử dụng dữ liệu từ server
                status: typedStatus,
                note: editNote,
                notes: editNote, // Cập nhật cả trường notes để đảm bảo nhất quán
                checkIn: data.data.checkIn || item.checkIn,
                checkInTime: data.data.checkIn ? new Date(data.data.checkIn).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }) : item.checkInTime
              }
            : item
        ) as AttendanceData[];
        
        // Cập nhật state thông qua các callback có sẵn
        if (typeof setAttendanceData === 'function') {
          setAttendanceData(updatedAttendanceData);
        }
        
        // Hoặc sử dụng callback riêng nếu có
        if (typeof onAttendanceUpdate === 'function') {
          onAttendanceUpdate(updatedAttendanceData);
        }
        
        console.log("Attendance updated successfully:", data);
        
        // Hiển thị thông báo thành công
        alert("Attendance updated successfully");
        
        // Đóng dialog
        setEditDialogOpen(false);
        setCurrentAttendance(null);
        
        // Không cần gọi refreshAttendanceData vì đã cập nhật trực tiếp
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
      case 'present':
        return 'success';
      case 'late':
        return 'warning';
      case 'absent':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStudentsList = () => {
    return attendanceData.filter(item => item.userRole === 'student');
  };
  
  const getTeachersList = () => {
    return attendanceData.filter(item => item.userRole === 'teacher');
  };

  const getPresentCount = () => {
    return attendanceData.filter(item => item.status.toLowerCase() === 'present').length;
  };
  
  const getLateCount = () => {
    return attendanceData.filter(item => item.status.toLowerCase() === 'late').length;
  };
  
  const getAbsentCount = () => {
    return attendanceData.filter(item => item.status.toLowerCase() === 'absent').length;
  };
  
  const getNotNowCount = () => {
    return attendanceData.filter(item => item.status.toLowerCase() === 'not now').length;
  };

  // Hàm kiểm tra URL hợp lệ và đảm bảo trả về string
  const isValidImageUrl = (url: string | undefined | null): boolean => {
    if (!url) return false;
    return url.startsWith('http://') || url.startsWith('https://');
  };

  // Hàm lấy avatar URL với kiểu trả về chắc chắn là string
  const getImageUrl = (url: string | undefined | null, defaultUrl: string): string => {
    if (!url || !isValidImageUrl(url)) return defaultUrl;
    return url;
  };

  // Handle checkbox selection for individual students
  const handleSelectStudent = (attendanceId: number) => {
    setSelectedStudents(prev => {
      if (prev.includes(attendanceId)) {
        return prev.filter(id => id !== attendanceId);
      } else {
        return [...prev, attendanceId];
      }
    });
  };

  // Handle select all checkbox
  const handleSelectAll = () => {
    setSelectAll(!selectAll);
    if (!selectAll) {
      // Select all student IDs
      const allStudentIds = getStudentsList().map(student => student.attendanceId);
      setSelectedStudents(allStudentIds);
    } else {
      // Deselect all
      setSelectedStudents([]);
    }
  };

  // Function to mark all students as present
  const handleMarkAllPresent = async () => {
    if (window.confirm("Are you sure you want to mark all students as present?")) {
      await handleBatchUpdateStatus("Present");
    }
  };

  // Function to mark all students as absent
  const handleMarkAllAbsent = async () => {
    if (window.confirm("Are you sure you want to mark all students as absent?")) {
      await handleBatchUpdateStatus("Absent");
    }
  };

  // Function to mark selected students with specific status
  const handleMarkSelected = async (status: "Present" | "Absent" | "Late" | "Not Now") => {
    if (selectedStudents.length === 0) {
      alert("Please select at least one student");
      return;
    }
    
    if (window.confirm(`Are you sure you want to mark ${selectedStudents.length} selected students as ${status}?`)) {
      await handleBatchUpdateStatus(status, selectedStudents);
    }
  };

  // Batch update attendance status
  const handleBatchUpdateStatus = async (status: "Present" | "Absent" | "Late" | "Not Now", studentIds?: number[]) => {
    setIsSubmittingBatch(true);
    
    try {
      // Get students to update (either selected or all)
      const studentsToUpdate = studentIds 
        ? getStudentsList().filter(student => studentIds.includes(student.attendanceId)) 
        : getStudentsList();
      
      if (studentsToUpdate.length === 0) {
        alert("No students to update");
        setIsSubmittingBatch(false);
        return;
      }
      
      // Prepare updates array
      const attendanceUpdates = studentsToUpdate.map(student => ({
        attendanceId: student.attendanceId,
        userId: student.userId,
        scheduleId: student.scheduleId,
        status,
        note: `Batch updated to ${status} on ${new Date().toLocaleString()}`,
        checkIn: status === 'Present' || status === 'Late' ? new Date().toISOString() : null
      }));
      
      // Prepare headers
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      
      // Only add token if it exists
      const token = localStorage.getItem('token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      // Call batch update API
      const response = await fetch(`http://fams.io.vn/api-nodejs/attendance/batch-update`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ attendanceUpdates })
      });

      const data = await response.json();
      
      if (data.success) {
        // Create new array for updated attendance data
        const newAttendanceData = [...attendanceData];
        
        // Update each item that was changed using the data returned from the API
        if (data.data && data.data.updated && Array.isArray(data.data.updated)) {
          data.data.updated.forEach((updatedItem: {
            attendanceId?: number;
            userId?: string;
            scheduleId?: number;
            status?: "Present" | "Absent" | "Late" | "Not Now";
            note?: string;
            checkIn?: string | null;
          }) => {
            const index = newAttendanceData.findIndex(item => 
              item.attendanceId === updatedItem.attendanceId || 
              (item.userId === updatedItem.userId && item.scheduleId === updatedItem.scheduleId)
            );
            
            if (index !== -1) {
              newAttendanceData[index] = {
                ...newAttendanceData[index],
                ...updatedItem,
                status: updatedItem.status || status,
                note: updatedItem.note || `Batch updated to ${status}`,
                notes: updatedItem.note || `Batch updated to ${status}`,
                checkIn: updatedItem.checkIn || (status === 'Present' || status === 'Late' ? new Date().toISOString() : null),
                checkInTime: updatedItem.checkIn ? new Date(updatedItem.checkIn).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }) : null
              };
            }
          });
        } else {
          // Fallback to original update method if no updated data returned
          attendanceUpdates.forEach(update => {
            const index = newAttendanceData.findIndex(item => item.attendanceId === update.attendanceId);
            if (index !== -1) {
              newAttendanceData[index] = {
                ...newAttendanceData[index],
                status: update.status,
                note: update.note,
                notes: update.note, // Update both note fields
                checkIn: update.checkIn,
                checkInTime: update.checkIn ? new Date(update.checkIn).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }) : null
              };
            }
          });
        }
        
        // Cập nhật state thông qua các callback có sẵn
        if (typeof setAttendanceData === 'function') {
          setAttendanceData(newAttendanceData as AttendanceData[]);
        }
        
        // Hoặc sử dụng callback riêng nếu có
        if (typeof onAttendanceUpdate === 'function') {
          onAttendanceUpdate(newAttendanceData as AttendanceData[]);
        }
        
        // Show success message
        alert(`Successfully updated ${data.data?.updated?.length || attendanceUpdates.length} attendance records`);
        
        // Clear selections
        setSelectedStudents([]);
        setSelectAll(false);
        
        // Không cần gọi refreshAttendanceData vì đã cập nhật trực tiếp
      } else {
        throw new Error(data.message || "Failed to update attendance");
      }
    } catch (error) {
      console.error("Error updating attendance:", error);
      alert("Failed to update attendance. Please try again.");
    } finally {
      setIsSubmittingBatch(false);
    }
  };

  // Toggle webcam dialog
  const handleToggleWebcam = () => {
    setWebcamOpen(!webcamOpen);
    setCapturedImage(null);
  };

  // Capture image from webcam
  const handleCaptureImage = () => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      setCapturedImage(imageSrc);
    }
  };

  // Use captured image for check-in
  const handleUseImage = () => {
    if (!capturedImage || !currentAttendance) return;
    
    // Update dialog UI with captured image
    setWebcamOpen(false);
    
    // Here we'll implement the API call to update the check-in with face image
    handleSaveAttendanceWithFace(capturedImage);
  };

  // Cancel webcam capture
  const handleCancelCapture = () => {
    setCapturedImage(null);
    setWebcamOpen(false);
  };

  // Save attendance with face image
  const handleSaveAttendanceWithFace = async (faceImage: string) => {
    if (!currentAttendance) return;
    
    setIsSubmitting(true);
    
    try {
      // Ensure status is properly typed
      const typedStatus = editStatus as "Present" | "Absent" | "Late" | "Not Now";
      
      // Prepare headers
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      
      // Only add token if it exists
      const token = localStorage.getItem('token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      // Gọi API để cập nhật trạng thái điểm danh với ảnh khuôn mặt
      const response = await fetch(`http://fams.io.vn/api-nodejs/attendance/check-in`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          userId: currentAttendance.userId,
          scheduleId: currentAttendance.scheduleId,
          status: typedStatus,
          note: editNote,
          checkInFace: faceImage
        })
      });

      const data = await response.json();
      
      if (data.success) {
        // Cập nhật dữ liệu local trực tiếp từ response API
        const updatedAttendanceData = attendanceData.map(item => 
          item.attendanceId === currentAttendance.attendanceId
            ? {
                ...item,
                ...data.data, // Sử dụng dữ liệu từ server
                status: typedStatus,
                note: editNote,
                notes: editNote,
                checkInFace: faceImage,
                checkIn: data.data.checkIn || item.checkIn,
                checkInTime: data.data.checkIn ? new Date(data.data.checkIn).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }) : item.checkInTime
              }
            : item
        ) as AttendanceData[];
        
        // Cập nhật state
        if (typeof setAttendanceData === 'function') {
          setAttendanceData(updatedAttendanceData);
        }
        
        if (typeof onAttendanceUpdate === 'function') {
          onAttendanceUpdate(updatedAttendanceData);
        }
        
        console.log("Attendance with face updated successfully:", data);
        
        // Hiển thị thông báo thành công
        alert("Attendance with face image updated successfully");
        
        // Đóng dialog
        setEditDialogOpen(false);
        setCurrentAttendance(null);
        
        // Không cần gọi refreshAttendanceData vì đã cập nhật trực tiếp
      } else {
        throw new Error(data.message || "Failed to update attendance with face");
      }
    } catch (error) {
      console.error("Error updating attendance with face:", error);
      alert("Failed to update attendance with face. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render trạng thái loading
  if (loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 3 }}>
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Đang tải dữ liệu điểm danh...
        </Typography>
      </Box>
    );
  }

  // Render lỗi nếu có
  if (error) {
    return (
      <Box sx={{ textAlign: 'center', p: 3 }}>
        <Typography variant="h6" color="error" gutterBottom>
          {error}
        </Typography>
        <Button variant="contained" onClick={onBack} startIcon={<ArrowBackIcon />} sx={{ mt: 2 }}>
          Quay lại lịch
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box>
          <Typography variant="h5" component="h2" gutterBottom>
            Attendance Management
          </Typography>
          <Typography variant="subtitle1" gutterBottom>
            Subject: {subjectName} | Class: {className}
          </Typography>
          <Typography variant="subtitle2" gutterBottom>
            Teacher: {teacher} | Date: {moment(date).format('DD/MM/YYYY')}
            {attendanceData.length > 0 && attendanceData[0].slotNumber && (
              <> | Slot: {attendanceData[0].slotNumber} ({attendanceData[0].startTime} - {attendanceData[0].endTime})</>
            )}
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

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="Student Attendance" />
          <Tab label="Teacher Attendance" />
          <Tab label="Statistics" />
        </Tabs>
      </Box>

      {tabValue === 0 && (
        <>
          {/* Batch action buttons */}
          <Box sx={{ mb: 2, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            <Button 
              variant="contained" 
              color="success" 
              onClick={handleMarkAllPresent}
              disabled={isSubmittingBatch || getStudentsList().length === 0}
            >
              {isSubmittingBatch ? <CircularProgress size={24} /> : 'Mark All Present'}
            </Button>
            
            <Button 
              variant="contained" 
              color="error" 
              onClick={handleMarkAllAbsent}
              disabled={isSubmittingBatch || getStudentsList().length === 0}
            >
              {isSubmittingBatch ? <CircularProgress size={24} /> : 'Mark All Absent'}
            </Button>
            
            <FormControl sx={{ minWidth: 150 }}>
              <InputLabel id="mark-selected-label">With Selected</InputLabel>
              <Select
                labelId="mark-selected-label"
                label="With Selected"
                value=""
                disabled={isSubmittingBatch || selectedStudents.length === 0}
                onChange={(e) => handleMarkSelected(e.target.value as "Present" | "Absent" | "Late" | "Not Now")}
              >
                <MenuItem value="Present">Mark Present</MenuItem>
                <MenuItem value="Late">Mark Late</MenuItem>
                <MenuItem value="Absent">Mark Absent</MenuItem>
                <MenuItem value="Not Now">Mark Not Now</MenuItem>
              </Select>
            </FormControl>
            
            <Typography variant="body2" color="text.secondary">
              {selectedStudents.length} of {getStudentsList().length} students selected
            </Typography>
          </Box>
          
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={selectAll}
                      onChange={handleSelectAll}
                      disabled={isSubmittingBatch}
                    />
                  </TableCell>
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
                  getStudentsList().map((student) => (
                    <TableRow key={student.attendanceId}>
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={selectedStudents.includes(student.attendanceId)}
                          onChange={() => handleSelectStudent(student.attendanceId)}
                          disabled={isSubmittingBatch}
                        />
                      </TableCell>
                      <TableCell>
                        <Tooltip title="View user avatar">
                          <Avatar 
                            src={getImageUrl(student.user?.avatar, DEFAULT_AVATAR)} 
                            alt={student.studentName || "User Avatar"} 
                            sx={{ width: 40, height: 40, cursor: 'pointer' }}
                            onClick={() => handleViewFace(getImageUrl(student.user?.avatar, DEFAULT_AVATAR))}
                          />
                        </Tooltip>
                      </TableCell>
                      <TableCell>
                        {isValidImageUrl(student.checkInFace) ? (
                          <Tooltip title="View check-in face">
                            <Avatar 
                              src={getImageUrl(student.checkInFace, DEFAULT_AVATAR)} 
                              alt="Check-in Face" 
                              sx={{ width: 40, height: 40, cursor: 'pointer' }}
                              onClick={() => handleViewFace(student.checkInFace as string)}
                            />
                          </Tooltip>
                        ) : (
                          <Tooltip title="No check-in face available">
                          <Avatar 
                                src={DEFAULT_FACE}
                                alt="No face data" 
                                sx={{ width: 40, height: 40, opacity: 0.6, cursor: 'pointer' }}
                                onClick={() => handleViewFace(DEFAULT_FACE)}
                          />
                          </Tooltip>
                        )}
                      </TableCell>
                      <TableCell>{student.userId}</TableCell>
                      <TableCell>{student.fullName || student.studentName}</TableCell>
                      <TableCell>
                        <Chip 
                          label={student.status} 
                          color={getStatusColor(student.status) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {student.checkIn ? moment(student.checkIn).format('HH:mm:ss DD/MM/YYYY') : '-'}
                      </TableCell>
                      <TableCell>{student.note || '-'}</TableCell>
                      <TableCell>
                        <IconButton size="small" color="primary" onClick={() => handleEditClick(student)}>
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
              {getTeachersList().length > 0 ? (
                getTeachersList().map((teacher) => (
                  <TableRow key={teacher.attendanceId}>
                    <TableCell>
                      <Tooltip title="View user avatar">
                        <Avatar 
                          src={getImageUrl(teacher.user?.avatar, DEFAULT_AVATAR)} 
                          alt={teacher.teacherName || "User Avatar"} 
                          sx={{ width: 40, height: 40, cursor: 'pointer' }}
                          onClick={() => handleViewFace(getImageUrl(teacher.user?.avatar, DEFAULT_AVATAR))}
                        />
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      {isValidImageUrl(teacher.checkInFace) ? (
                        <Tooltip title="View check-in face">
                          <Avatar 
                            src={getImageUrl(teacher.checkInFace, DEFAULT_AVATAR)} 
                            alt="Check-in Face" 
                            sx={{ width: 40, height: 40, cursor: 'pointer' }}
                            onClick={() => handleViewFace(teacher.checkInFace as string)}
                          />
                        </Tooltip>
                      ) : (
                        <Tooltip title="No check-in face available">
                      <Avatar 
                            src={DEFAULT_FACE}
                            alt="No face data" 
                            sx={{ width: 40, height: 40, opacity: 0.6, cursor: 'pointer' }}
                            onClick={() => handleViewFace(DEFAULT_FACE)}
                      />
                        </Tooltip>
                      )}
                    </TableCell>
                    <TableCell>{teacher.userId}</TableCell>
                    <TableCell>{teacher.fullName || teacher.teacherName}</TableCell>
                    <TableCell>
                      <Chip 
                        label={teacher.status} 
                        color={getStatusColor(teacher.status) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {teacher.checkIn ? moment(teacher.checkIn).format('HH:mm:ss DD/MM/YYYY') : '-'}
                    </TableCell>
                    <TableCell>{teacher.note || '-'}</TableCell>
                    <TableCell>
                      <IconButton size="small" color="primary" onClick={() => handleEditClick(teacher)}>
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
          <Typography variant="h6" gutterBottom>Attendance Statistics</Typography>
          <Box sx={{ display: 'flex', gap: 3, mb: 3, flexWrap: 'wrap' }}>
            <Box sx={{ p: 2, bgcolor: 'success.light', borderRadius: 2, minWidth: '150px', flex: 1 }}>
              <Typography variant="h4" align="center">
                {getPresentCount()}
              </Typography>
              <Typography variant="body1" align="center">Present</Typography>
            </Box>
            <Box sx={{ p: 2, bgcolor: 'warning.light', borderRadius: 2, minWidth: '150px', flex: 1 }}>
              <Typography variant="h4" align="center">
                {getLateCount()}
              </Typography>
              <Typography variant="body1" align="center">Late</Typography>
            </Box>
            <Box sx={{ p: 2, bgcolor: 'error.light', borderRadius: 2, minWidth: '150px', flex: 1 }}>
              <Typography variant="h4" align="center">
                {getAbsentCount()}
              </Typography>
              <Typography variant="body1" align="center">Absent</Typography>
            </Box>
            <Box sx={{ p: 2, bgcolor: 'grey.300', borderRadius: 2, minWidth: '150px', flex: 1 }}>
              <Typography variant="h4" align="center">
                {getNotNowCount()}
              </Typography>
              <Typography variant="body1" align="center">Not Now</Typography>
            </Box>
          </Box>

          <Typography variant="h6" gutterBottom>Attendance Rate</Typography>
          <Box sx={{ mb: 3 }}>
            <Typography variant="body1">
              Present Rate: {attendanceData.length > 0 ? ((getPresentCount() / attendanceData.length) * 100).toFixed(2) : 0}%
            </Typography>
            <Typography variant="body1">
              Late Rate: {attendanceData.length > 0 ? ((getLateCount() / attendanceData.length) * 100).toFixed(2) : 0}%
            </Typography>
            <Typography variant="body1">
              Absent Rate: {attendanceData.length > 0 ? ((getAbsentCount() / attendanceData.length) * 100).toFixed(2) : 0}%
            </Typography>
            <Typography variant="body1">
              Not Checked Rate: {attendanceData.length > 0 ? ((getNotNowCount() / attendanceData.length) * 100).toFixed(2) : 0}%
            </Typography>
          </Box>
        </Paper>
      )}

      {/* Edit Attendance Dialog */}
      <Dialog open={editDialogOpen} onClose={handleCloseEditDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Attendance</DialogTitle>
        <DialogContent>
          {currentAttendance && (
            <Box sx={{ pt: 2 }}>
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid sx={{ gridColumn: '1 / 2' }}>
                  <Typography variant="subtitle2" gutterBottom>Profile Image</Typography>
                  <Avatar 
                    src={getImageUrl(currentAttendance.user?.avatar, DEFAULT_AVATAR)} 
                    alt={currentAttendance.fullName || currentAttendance.studentName || currentAttendance.teacherName || "User"} 
                    sx={{ width: 80, height: 80, cursor: 'pointer' }}
                    onClick={() => handleViewFace(getImageUrl(currentAttendance.user?.avatar, DEFAULT_AVATAR))}
                  />
                </Grid>
                <Grid sx={{ gridColumn: '2 / 3' }}>
                  <Typography variant="subtitle2" gutterBottom>Check-in Face Image</Typography>
                  {capturedImage || isValidImageUrl(currentAttendance.checkInFace) ? (
                    <Avatar 
                      src={capturedImage || getImageUrl(currentAttendance.checkInFace, DEFAULT_FACE)} 
                      alt="Check-in Face" 
                      sx={{ width: 80, height: 80, cursor: 'pointer' }}
                      onClick={() => handleViewFace(capturedImage || currentAttendance.checkInFace as string)}
                    />
                  ) : (
                    <Avatar 
                      src={DEFAULT_FACE}
                      alt="No face data" 
                      sx={{ width: 80, height: 80, opacity: 0.6, cursor: 'pointer' }}
                      onClick={() => handleViewFace(DEFAULT_FACE)}
                    />
                  )}
                  <IconButton 
                    color="primary"
                    onClick={handleToggleWebcam}
                    size="small"
                    sx={{ mt: 1 }}
                  >
                    <span className="material-icons">photo_camera</span>
                  </IconButton>
                </Grid>
              </Grid>
              
                <Box>
                  <Typography variant="h6">
                    {currentAttendance.fullName || currentAttendance.studentName || currentAttendance.teacherName}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    User ID: {currentAttendance.userId}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Role: {currentAttendance.userRole}
                  </Typography>
                {currentAttendance.className && (
                  <Typography variant="body2" color="textSecondary">
                    Class: {currentAttendance.className}
                  </Typography>
                )}
              </Box>

              <FormControl fullWidth margin="normal">
                <InputLabel id="status-select-label">Attendance Status</InputLabel>
                <Select
                  labelId="status-select-label"
                  value={editStatus}
                  label="Attendance Status"
                  onChange={(e) => setEditStatus(e.target.value as "Present" | "Absent" | "Late" | "Not Now")}
                >
                  <MenuItem value="Present">Present</MenuItem>
                  <MenuItem value="Late">Late</MenuItem>
                  <MenuItem value="Absent">Absent</MenuItem>
                  <MenuItem value="Not Now">Not Now</MenuItem>
                </Select>
              </FormControl>

              <TextField
                label="Notes"
                multiline
                rows={3}
                value={editNote}
                onChange={(e) => setEditNote(e.target.value)}
                fullWidth
                margin="normal"
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEditDialog} disabled={isSubmitting}>Cancel</Button>
          <Button 
            onClick={handleSaveAttendance} 
            variant="contained" 
            color="primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? <CircularProgress size={24} /> : 'Save'}
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
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
              <img 
                src={selectedFaceImage} 
                alt="Face" 
                style={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain' }} 
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseFaceDialog}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Webcam Dialog */}
      <Dialog open={webcamOpen} onClose={handleCancelCapture} maxWidth="sm" fullWidth>
        <DialogTitle>Capture Face Image</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 2 }}>
            {!capturedImage ? (
              <>
                {/* Show webcam component when available */}
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Please align your face in the center of the camera
                </Typography>
                <Box sx={{ width: '100%', height: 300, bgcolor: 'grey.300', display: 'flex', justifyContent: 'center', alignItems: 'center', mb: 2 }}>
                  {/* This is just a placeholder for the Webcam component */}
                  {/* In a real implementation, you would import and use a webcam component like react-webcam */}
                  <Typography>Camera preview would appear here</Typography>
                  {/* Example of how to use react-webcam:
                  <Webcam
                    audio={false}
                    ref={webcamRef}
                    screenshotFormat="image/jpeg"
                    width="100%"
                    height={300}
                    videoConstraints={{ facingMode: "user" }}
                  />
                  */}
                </Box>
                <Button 
                  variant="contained" 
                  color="primary" 
                  onClick={handleCaptureImage}
                >
                  Capture Photo
                </Button>
              </>
            ) : (
              <>
                {/* Show captured image */}
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Review your photo
                </Typography>
                <Box sx={{ width: '100%', mb: 2 }}>
                  <img 
                    src={capturedImage} 
                    alt="Captured face" 
                    style={{ width: '100%', maxHeight: '300px', objectFit: 'contain' }} 
                  />
                </Box>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button 
                    variant="outlined" 
                    onClick={() => setCapturedImage(null)}
                  >
                    Retake Photo
                  </Button>
                  <Button 
                    variant="contained" 
                    color="primary" 
                    onClick={handleUseImage}
                  >
                    Use This Photo
                  </Button>
                </Box>
              </>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelCapture}>Cancel</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AttendanceView; 