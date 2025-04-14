import api from './api';

// Types for API responses
interface ScheduleItem {
  _id: string;
  scheduleId: number;
  semesterId: string;
  classId: number;
  subjectId: number;
  teacherId: number;
  classroomId: number;
  WeekNumber: number;
  DayNumber: number;
  SessionDate: string;
  SlotID: number;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
}

interface ScheduleResponse {
  success: boolean;
  message: string;
  data: {
    schedules: ScheduleItem[];
    student?: {
      studentId: number;
      fullName: string;
      classId: number;
    };
    semester?: {
      semesterId: string;
      semesterName: string;
      startDate: string;
      endDate: string;
    } | null;
    user?: any;
    role?: string;
  };
}

// Get schedule for the current logged-in user
export const getUserSchedule = async (): Promise<ScheduleResponse> => {
  try {
    const response = await api.get('/schedule/me');
    return response.data;
  } catch (error) {
    console.error('Error fetching user schedule:', error);
    throw error;
  }
};

// Get student schedule (only for student users)
export const getStudentSchedule = async (): Promise<ScheduleResponse> => {
  try {
    const response = await api.get('/schedule/student');
    return response.data;
  } catch (error) {
    console.error('Error fetching student schedule:', error);
    throw error;
  }
};

// Convert schedule data to calendar events format
export const convertScheduleToEvents = (schedules: ScheduleItem[]) => {
  return schedules.map(schedule => {
    // Parse the date and time strings
    const sessionDate = schedule.SessionDate;
    const startTimeString = schedule.startTime;
    const endTimeString = schedule.endTime;
    
    // Create Date objects for start and end
    const [startHour, startMinute] = startTimeString.split(':').map(Number);
    const [endHour, endMinute] = endTimeString.split(':').map(Number);
    
    const startDate = new Date(sessionDate);
    startDate.setHours(startHour, startMinute, 0);
    
    const endDate = new Date(sessionDate);
    endDate.setHours(endHour, endMinute, 0);
    
    // Get subject info for the title
    // In a real app, you might want to fetch subject names from the backend
    return {
      id: schedule.scheduleId,
      title: `Subject ID: ${schedule.subjectId} (Room: ${schedule.classroomId})`,
      start: startDate,
      end: endDate,
      resource: schedule // Keep the original data for reference
    };
  });
}; 