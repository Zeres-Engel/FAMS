import { useState, useEffect } from "react";
import { ScheduleEvent } from "../../model/scheduleModels/scheduleModels.model";
// Comment out the problematic imports temporarily until we install the packages
// import { View } from "react-big-calendar";
// import moment from "moment";
import { scheduleAPI, authAPI } from "../../api/apiService";

// Define View type locally to avoid dependency error
type View = 'month' | 'week' | 'day' | 'agenda';

function useSchedulePageHook() {
  const defaultEvent: ScheduleEvent = {
    id: 0,
    title: "Sự kiện mặc định",
    start: new Date(),
    end: new Date(),
  };

  const [eventShow, setEventShow] = useState<ScheduleEvent>(defaultEvent);
  const [view, setView] = useState<View>("month");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [userId, setUserId] = useState<string>("");
  const [userRole, setUserRole] = useState<string>("");

  // Fetch user profile and schedule data
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setIsLoading(true);
        const response = await authAPI.getProfile();
        
        if (response.data.success) {
          const { userId, role } = response.data.data;
          setUserId(userId);
          setUserRole(role);
          
          // Fetch schedule based on user role
          await fetchSchedule(userId, role);
        }
      } catch (error: any) {
        setError(error.response?.data?.message || "Không thể tải lịch học");
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  // Function to fetch schedule based on user role
  const fetchSchedule = async (id: string, role: string) => {
    try {
      let response;
      
      if (role === "Student") {
        response = await scheduleAPI.getStudentSchedule(id);
      } else if (role === "Teacher") {
        response = await scheduleAPI.getTeacherSchedule(id);
      } else {
        // Default mock data for admin or other roles
        setEvents([
          {
            id: 1,
            title: "Họp với giáo viên",
            start: new Date(2025, 3, 2, 10, 0),
            end: new Date(2025, 3, 2, 12, 0),
          },
          {
            id: 2,
            title: "Khai giảng học kỳ mới",
            start: new Date(2025, 3, 3, 13, 0),
            end: new Date(2025, 3, 3, 14, 0),
          },
        ]);
        return;
      }
      
      if (response && response.data.success) {
        // Transform schedule data to calendar events
        const scheduleEvents = response.data.data.map((item: any) => ({
          id: item.scheduleId,
          title: item.subject ? `${item.subject.name} - ${item.classroom?.name || 'Phòng chưa xác định'}` : 'Giờ trống',
          // Using date strings directly since moment is not available
          start: new Date(`${item.dayOfWeek} ${item.startTime}`),
          end: new Date(`${item.dayOfWeek} ${item.endTime}`),
          resource: item
        }));
        
        setEvents(scheduleEvents);
      }
    } catch (error: any) {
      setError(error.response?.data?.message || "Không thể tải lịch học");
    }
  };

  const handleSelectEvent = (event: ScheduleEvent = defaultEvent) => {
    setEventShow(event);
  };
  
  const handleSetNewView = (newView: View = 'month') => {
    setView(newView);
  };
  
  const handleSetNewViewDate = (newDate: Date = new Date()) => {
    setCurrentDate(newDate);
  };
  
  const state = { events, eventShow, view, currentDate, isLoading, error };
  const handler = { handleSelectEvent, handleSetNewView, handleSetNewViewDate };
  return { state, handler };
}

export default useSchedulePageHook;
