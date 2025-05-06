import { useState } from "react";

export interface AttendanceData {
  studentId: string;
  fullName: string;
  status: "Present" | "Absent" | "Late";
  checkInTime?: string;
  notes?: string;
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

  // Hàm lấy dữ liệu attendance từ API
  const fetchAttendanceData = async (scheduleId: number) => {
    setLoading(true);
    setError(null);
    
    try {
      // Trong thực tế sẽ gọi API
      // const response = await axios.get(`http://fams.io.vn/api-nodejs/attendances/schedule/${scheduleId}`);
      // if (response.data.success) {
      //   setAttendanceData(response.data.data);
      // }
      
      // Dữ liệu mẫu
      const sampleData: AttendanceData[] = [
        { studentId: 'ST001', fullName: 'Nguyen Van A', status: 'Present', checkInTime: '07:15', notes: '' },
        { studentId: 'ST002', fullName: 'Tran Thi B', status: 'Late', checkInTime: '07:30', notes: 'Bus delay' },
        { studentId: 'ST003', fullName: 'Le Van C', status: 'Absent', checkInTime: '', notes: 'Sick leave' },
        { studentId: 'ST004', fullName: 'Pham Thi D', status: 'Present', checkInTime: '07:10', notes: '' },
        { studentId: 'ST005', fullName: 'Hoang Van E', status: 'Present', checkInTime: '07:05', notes: '' },
      ];
      
      // Giả lập độ trễ của network
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setAttendanceData(sampleData);
      setSelectedScheduleId(scheduleId);
      setViewMode("attendance");
      setLoading(false);
    } catch (error) {
      console.error("Error fetching attendance data:", error);
      setError("Failed to load attendance data. Please try again.");
      setLoading(false);
    }
  };
  
  // Hàm quay lại chế độ xem lịch
  const handleBackToCalendar = () => {
    setViewMode("calendar");
    setSelectedScheduleId(null);
  };

  // Hàm cập nhật trạng thái điểm danh của học sinh
  const updateAttendanceStatus = (studentId: string, status: "Present" | "Absent" | "Late", notes?: string) => {
    setAttendanceData(prevData => 
      prevData.map(student => 
        student.studentId === studentId 
          ? { 
              ...student, 
              status,
              notes: notes || student.notes,
              checkInTime: status === "Present" ? new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }) : student.checkInTime
            }
          : student
      )
    );
  };

  // Hàm lưu dữ liệu điểm danh
  const saveAttendanceData = async () => {
    setLoading(true);
    try {
      // Mô phỏng API call
      // const response = await axios.post(`http://fams.io.vn/api-nodejs/attendances/schedule/${selectedScheduleId}`, {
      //   attendanceData
      // });
      
      // Giả lập độ trễ của network
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log("Attendance data saved", attendanceData);
      setLoading(false);
      return true;
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