import { useState } from "react";
import axios from "axios";

// Placeholder images
const DEFAULT_AVATAR = "https://cdn.pixabay.com/photo/2016/08/08/09/17/avatar-1577909_1280.png";
const DEFAULT_FACE = "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png";

// Định nghĩa interface giống với AttendanceDataItem trong AttendanceView.tsx
export interface AttendanceData {
  attendanceId: number;
  scheduleId: number;
  userId: string;
  checkIn: string | null;
  note: string;
  status: "Present" | "Absent" | "Late" | "Not Now";
  semesterNumber: number;  // Thêm trường bắt buộc này
  userRole: string;
  teacherId?: number;
  teacherName?: string;
  subjectId?: number;
  subjectName?: string;
  classId?: number;
  className?: string;
  studentId?: string | number;
  studentName?: string;
  classroomId?: number;
  classroomName?: string;
  user?: {
    avatar: string | null;
    userId: string;
  };
  checkInFace?: string;
  slotNumber?: number;
  dayOfWeek?: string;
  startTime?: string;
  endTime?: string;
  sessionDate?: string;
  topic?: string;
  checkInTime?: string | null;
  avatar?: string;
  notes?: string;
  fullName?: string;
  face?: string;
}

export interface UseAttendanceHookProps {
  scheduleId: number | null;
}

const useAttendanceHook = ({ scheduleId }: UseAttendanceHookProps) => {
  const [attendanceData, setAttendanceData] = useState<AttendanceData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"calendar" | "attendance">("calendar");
  const [selectedScheduleId, setSelectedScheduleId] = useState<number | null>(null);

  // Hàm kiểm tra URL hợp lệ
  const isValidImageUrl = (url: string | undefined | null): boolean => {
    if (!url) return false;
    return url.startsWith('http://') || url.startsWith('https://');
  };

  // Hàm lấy dữ liệu attendance từ API
  const fetchAttendanceData = async (scheduleId: number) => {
    setLoading(true);
    setError(null);
    
    try {
      // Thêm token xác thực từ localStorage nếu có
      const token = localStorage.getItem('token');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await axios.get(`http://fams.io.vn/api-nodejs/attendance/schedule/${scheduleId}`, {
        headers
      });
      
      if (response.data.success) {
        // Chuyển đổi dữ liệu API thành định dạng cần thiết
        const formattedData = response.data.data.map((item: any) => {
          // Xử lý dữ liệu avatar và check-in face
          const userAvatar = isValidImageUrl(item.user?.avatar) ? item.user?.avatar : DEFAULT_AVATAR;
          const checkInFaceImage = isValidImageUrl(item.checkInFace) ? item.checkInFace : null;
          
          return {
            attendanceId: item.attendanceId,
            scheduleId: item.scheduleId,
            userId: item.userId,
            studentId: item.studentId || "",
            studentName: item.studentName || (item.userRole === "student" ? item.fullName : ""),
            teacherId: item.teacherId,
            teacherName: item.teacherName,
            fullName: item.studentName || item.teacherName || item.fullName || "",
            userRole: item.userRole || "student",
            status: item.status || "Not Now",
            checkIn: item.checkIn,
            checkInTime: item.checkIn ? new Date(item.checkIn).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }) : null,
            note: item.note || "",
            notes: item.note || "",
            // Cập nhật các trường liên quan đến avatar và check-in face
            checkInFace: checkInFaceImage,
            avatar: userAvatar,
            face: userAvatar, // Thêm trường face để tương thích với AttendanceManagementPage
            user: {
              avatar: userAvatar,
              userId: item.userId
            },
            semesterNumber: item.semesterNumber || 1, // Đảm bảo luôn có giá trị
            classId: item.classId,
            className: item.className,
            subjectId: item.subjectId,
            subjectName: item.subjectName,
            classroomId: item.classroomId,
            classroomName: item.classroomName,
            // Thêm thông tin slot nếu có
            slotNumber: item.slotNumber || item.schedule?.slot?.slotNumber,
            dayOfWeek: item.dayOfWeek || item.schedule?.slot?.dayOfWeek,
            startTime: item.startTime || item.schedule?.slot?.startTime,
            endTime: item.endTime || item.schedule?.slot?.endTime,
            sessionDate: item.sessionDate || item.schedule?.sessionDate,
            topic: item.topic || item.schedule?.topic
          };
        });
        
        console.log("Formatted attendance data:", formattedData);
        setAttendanceData(formattedData);
        setSelectedScheduleId(scheduleId);
        setViewMode("attendance");
      } else {
        throw new Error(response.data.message || "Failed to fetch attendance data");
      }
    } catch (error: any) {
      console.error("Error fetching attendance data:", error);
      
      // Xử lý lỗi xác thực một cách cụ thể
      if (error.response && error.response.status === 401) {
        setError("Authentication required. Please log in to view attendance data.");
      } else {
        setError("Failed to load attendance data. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };
  
  // Hàm quay lại chế độ xem lịch
  const handleBackToCalendar = () => {
    setViewMode("calendar");
    setSelectedScheduleId(null);
  };

  // Hàm cập nhật trạng thái điểm danh của học sinh
  const updateAttendanceStatus = async (attendanceId: number, userId: string, scheduleId: number, status: "Present" | "Absent" | "Late" | "Not Now", note?: string) => {
    try {
      setLoading(true);
      
      const response = await axios.put(`http://fams.io.vn/api-nodejs/attendance/check-in`, {
        userId,
        scheduleId,
        status,
        note: note || ""
      });
      
      if (response.data.success) {
        // Cập nhật state local
        setAttendanceData((prevData: AttendanceData[]) => 
          prevData.map((item: AttendanceData) => 
            item.attendanceId === attendanceId 
              ? { 
                  ...item, 
                  status,
                  note: note || item.note,
                  notes: note || item.notes,
                  checkIn: status === "Present" ? new Date().toISOString() : item.checkIn,
                  checkInTime: status === "Present" ? new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }) : item.checkInTime
                }
              : item
          )
        );
        console.log("Attendance updated successfully:", response.data);
      } else {
        throw new Error(response.data.message || "Failed to update attendance");
      }
      
      setLoading(false);
      return true;
    } catch (error) {
      console.error("Error updating attendance status:", error);
      setError("Failed to update attendance. Please try again.");
      setLoading(false);
      return false;
    }
  };

  // Hàm lưu dữ liệu điểm danh (batch update)
  const saveAttendanceData = async () => {
    setLoading(true);
    try {
      // Chuẩn bị dữ liệu để gửi lên server
      const attendanceUpdates = attendanceData.map((item: AttendanceData) => ({
        attendanceId: item.attendanceId,
        scheduleId: item.scheduleId,
        userId: item.userId,
        status: item.status,
        note: item.note || item.notes || ""
      }));
      
      const response = await axios.post(`http://fams.io.vn/api-nodejs/attendance/batch-update`, {
        attendanceUpdates
      });
      
      if (response.data.success) {
        console.log("Attendance data saved successfully:", response.data);
        setLoading(false);
        return true;
      } else {
        throw new Error(response.data.message || "Failed to save attendance data");
      }
    } catch (error) {
      console.error("Error saving attendance data:", error);
      setError("Failed to save attendance data. Please try again.");
      setLoading(false);
      return false;
    }
  };

  return {
    state: {
      attendanceData,
      loading,
      error,
      viewMode,
      selectedScheduleId,
    },
    actions: {
      fetchAttendanceData,
      handleBackToCalendar,
      updateAttendanceStatus,
      saveAttendanceData,
      setViewMode,
      setSelectedScheduleId,
    },
  };
};

export default useAttendanceHook; 