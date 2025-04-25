import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { View } from "react-big-calendar";
import { ScheduleEvent } from "../../model/scheduleModels/scheduleModels.model";
import {
  fetchSchedules,
  Schedule,
  ScheduleAction,
  updateSchedule,
} from "../../store/slices/scheduleSlice";
import { AppDispatch, RootState } from "../../store/store";
import { fetchClassrooms } from "../../store/slices/classroomSlice";
import { fetchSubjects } from "../../store/slices/subjectSlice";
import axios from "axios";
import moment from "moment";

// Cấu hình axios để tự động follow redirects
axios.defaults.maxRedirects = 5;
axios.defaults.validateStatus = function (status) {
  return status >= 200 && status < 500; // Chấp nhận status code từ 200-499
};

const defaultEvent: ScheduleEvent = {
  id: 0,
  title: "",
  start: new Date(),
  end: new Date(),
  subject: "",
  teacher: "",
  classroomNumber: "",
};

interface ClassData {
  _id: string;
  className: string;
  grade: number;
  homeroomTeacherId: string;
  academicYear: string;
  createdAt: string;
  isActive: boolean;
  classId: number;
  id: string;
}

interface ClassesApiResponse {
  success: boolean;
  count: number;
  data: ClassData[];
}

interface SubjectData {
  _id: string;
  subjectId: number;
  subjectName: string;
  description: string;
  subjectType: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
  id: string;
}

interface SubjectsApiResponse {
  success: boolean;
  count: number;
  data: SubjectData[];
}

function useScheduleManagementPageHook() {
  const dispatch = useDispatch<AppDispatch>();

  const [eventShow, setEventShow] = useState<ScheduleEvent>(defaultEvent);
  const [view, setView] = useState<View>("week");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isEditing, setIsEditing] = useState(false);
  const [allClasses, setAllClasses] = useState<ClassData[]>([]);
  const [academicYears, setAcademicYears] = useState<string[]>([]);
  const [selectedAcademicYear, setSelectedAcademicYear] = useState("");
  const [allSubjects, setAllSubjects] = useState<SubjectData[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<number | null>(null);
  const [teachersList, setTeachersList] = useState<{userId: string, fullName: string}[]>([]);

  const classrooms = useSelector(
    (state: RootState) => state.classroom.classrooms
  );
  useEffect(() => {
    if (!classrooms || classrooms.length === 0) {
      dispatch(fetchClassrooms() as any);
    }
  }, [dispatch, classrooms]);
  
  const [filters, setFilters] = useState({
    class: "",
    academicYear: "",
    subjectId: null as number | null,
  });

  const schedules = useSelector((state: RootState) => state.schedule.schedules);
  const loading = useSelector((state: RootState) => state.schedule.loading);
  const error = useSelector((state: RootState) => state.schedule.error);
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const subjectState = useSelector((state: RootState) => state.subject.subjects);

  useEffect(() => {
    if (!subjectState || subjectState.length === 0) {
      dispatch(fetchSubjects() as any);
    }
  }, [dispatch,subjectState]);

  // Fetch classes from API
  const fetchClassesFromAPI = async () => {
    try {
      const response = await axios.get<ClassesApiResponse>("http://fams.io.vn/api-nodejs/classes");
      if (response.data.success) {
        // Sort classes by grade (10, 11, 12) and then by class name
        const sortedClasses = response.data.data.sort((a, b) => {
          // Extract grade number from className (e.g., "10A1" -> 10)
          const gradeA = parseInt(a.className.match(/\d+/)![0]);
          const gradeB = parseInt(b.className.match(/\d+/)![0]);
          
          if (gradeA !== gradeB) {
            return gradeA - gradeB; // Sort by grade number ascending
          }
          
          // If same grade, sort alphabetically
          return a.className.localeCompare(b.className);
        });
        
        setAllClasses(sortedClasses);
        
        // Extract unique academic years
        const uniqueYears = Array.from(new Set(response.data.data.map(cls => cls.academicYear)));
        setAcademicYears(uniqueYears);
        
        if (uniqueYears.length > 0) {
          setSelectedAcademicYear(uniqueYears[uniqueYears.length - 1]); // Select the most recent year by default
          setFilters(prev => ({...prev, academicYear: uniqueYears[uniqueYears.length - 1]}));
        }
      }
    } catch (error) {
      console.error("Error fetching classes:", error);
    }
  };

  // Fetch teachers from API
  const fetchTeachersFromAPI = async () => {
    try {
      console.log("Fetching teachers from API...");
      const response = await axios.get("http://fams.io.vn/api-nodejs/teachers/search?search=&page=1&limit=100");
      console.log("API Response:", response);
      if (response.data.success) {
        console.log("Fetched teachers:", response.data.data);
        // Override the teachers from Redux store with data from API
        const teachersFromAPI = response.data.data;
        setTeachersList(teachersFromAPI);
        console.log("Updated teachersList state:", teachersFromAPI);
      }
    } catch (error) {
      console.error("Error fetching teachers:", error);
    }
  };

  // Fetch subjects from API
  const fetchSubjectsFromAPI = async () => {
    try {
      const response = await axios.get<SubjectsApiResponse>("http://fams.io.vn/api-nodejs/subjects");
      if (response.data.success) {
        // Sort subjects alphabetically by name
        const sortedSubjects = response.data.data.sort((a, b) => 
          a.subjectName.localeCompare(b.subjectName)
        );
        setAllSubjects(sortedSubjects);
      }
    } catch (error) {
      console.error("Error fetching subjects:", error);
    }
  };

  useEffect(() => {
    fetchClassesFromAPI();
    fetchSubjectsFromAPI();
    fetchTeachersFromAPI();
  }, []);

  // Filter class options based on selected academic year
  const classOptions = allClasses
    .filter(c => !filters.academicYear || c.academicYear === filters.academicYear)
    .map(c => ({
      label: c.className,
      value: c.classId.toString(),
    }));

  // Create subject options
  const subjectOptions = [
    { label: "All Subjects", value: null },
    ...allSubjects.map(s => ({
      label: s.subjectName,
      value: s.subjectId,
    }))
  ];

  const handleSearch = () => {
    dispatch(
      fetchSchedules({
        classId: filters.class,
        userId: "",
        fromDate: "",
        toDate: "",
        subjectId: filters.subjectId || undefined,
      })
    );
  };

  function combineDateAndTime(dateString: string, timeString: string): Date {
    const localDate = new Date(dateString);
    const [hours, minutes] = timeString.split(":").map(Number);

    localDate.setHours(hours);
    localDate.setMinutes(minutes);
    localDate.setSeconds(0);
    localDate.setMilliseconds(0);

    return new Date(localDate);
  }
  
  useEffect(() => {
    if (schedules.length) {
      const mappedEvents: ScheduleEvent[] = schedules.map((item: Schedule) => ({
        id: Number(item.scheduleId),
        title: item.topic || `${item.subjectName} - slot ${item.SlotID}`,
        start: combineDateAndTime(item.sessionDate, item.startTime),
        end: combineDateAndTime(item.sessionDate, item.endTime),
        subjectName: item.subjectName || "",
        subject: item.subjectName || "",
        teacher: item.teacherUserId || "",
        classroomNumber: item.classroomNumber,
        classroomId: item.classroomId,
        subjectId: item.subjectId,
      }));
      setEvents(mappedEvents);
    }
  }, [schedules]);

  const handleSelectEvent = (event: ScheduleEvent = defaultEvent) => {
    console.log(event);
    setEventShow(event);
  };

  const handleSetView = (newView: View) => setView(newView);
  const handleSetDate = (newDate: Date) => setCurrentDate(newDate);

  const handleShowTeacherSchedule = () => {
    setEvents(prev => prev.filter(ev => ev.title.includes(filters.class)));
  };

  const handleSaveEdit = () => {
    setEvents(prev =>
      prev.map(ev => (ev.id === eventShow.id ? { ...eventShow } : ev))
    );
    const currentSchedule =
      (schedules.find(
        schedule => String(schedule.scheduleId) === String(eventShow.id)
      ) as Schedule) || ({} as Schedule);
    const updatedSchedule: ScheduleAction = {
      scheduleId: currentSchedule.scheduleId,
      semesterId: currentSchedule.semesterId || undefined,
      classId: String(currentSchedule.classId),
      subjectId: eventShow.subjectId,
      classroomId: eventShow.classroomId,
      teacherId: eventShow.teacher,
      topic: eventShow.title,
      sessionDate: new Date(currentSchedule?.sessionDate)
        .toISOString()
        .split("T")[0],
    };
    console.log("updatedSchedule", updatedSchedule);
    
    dispatch(updateSchedule(updatedSchedule));
    setIsEditing(false);
  };

  const handleAddEvent = async (newEvent: ScheduleEvent) => {
    try {
      console.log("Creating new schedule with data:", newEvent);
      
      // Chuẩn bị dữ liệu để gửi đến API
      const scheduleData = {
        classId: newEvent.classId,
        subjectId: newEvent.subjectId,
        scheduleDate: moment(newEvent.scheduleDate || new Date()).format('YYYY-MM-DD'),
        slotId: newEvent.slotId,
        classroomId: newEvent.classroomNumber,
        teacherId: newEvent.teacher
      };
      
      console.log("Sending data to API:", scheduleData);
      
      // Gọi API để tạo lịch học mới - không cần token
      const response = await axios.post('http://fams.io.vn/api-nodejs/schedules', scheduleData);
      
      console.log("API response:", response.data);
      
      if (response.data.success) {
        // Lấy thông tin slot để hiển thị đúng giờ bắt đầu và kết thúc
        let slotInfo = null;
        if (newEvent.slotId !== undefined) {
          slotInfo = await fetchSlotDetails(newEvent.slotId);
          console.log("Slot details:", slotInfo);
        }
        
        // Tạo dữ liệu hiển thị trên calendar
        const startTime = new Date(newEvent.scheduleDate || new Date());
        const endTime = new Date(newEvent.scheduleDate || new Date());
        
        if (slotInfo) {
          // Parse thời gian từ slot (ví dụ: "7:00" -> [7, 0])
          const startParts = slotInfo.startTime.split(':').map(Number);
          const endParts = slotInfo.endTime.split(':').map(Number);
          
          startTime.setHours(startParts[0], startParts[1], 0);
          endTime.setHours(endParts[0], endParts[1], 0);
        } else {
          // Fallback nếu không lấy được thông tin slot
          startTime.setHours(7, 0, 0);
          endTime.setHours(7, 50, 0);
        }
        
        // Tìm tên môn học từ subjectId
        const subject = subjectState.find(s => s.subjectId === newEvent.subjectId);
        
        // Thêm vào state để hiển thị
        setEvents([...events, {
          id: response.data.data.scheduleId,
          title: subject?.subjectName || "",
          start: startTime,
          end: endTime,
          subject: subject?.subjectName || "",
          teacher: newEvent.teacher,
          classroomNumber: newEvent.classroomNumber,
          classId: newEvent.classId,
          subjectId: newEvent.subjectId
        }]);

        // Generate attendance logs for all students and teacher
        generateAttendanceLogs(response.data.data.scheduleId, newEvent);
        
        // Hiển thị thông báo thành công
        alert('Tạo lịch học thành công!');
      }
    } catch (error: any) {
      console.error('Lỗi khi tạo lịch học:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Lỗi không xác định';
      alert(`Lỗi khi tạo lịch học: ${errorMessage}`);
    }
  };

  // Delete a schedule
  const handleDeleteEvent = async (scheduleId: number) => {
    try {
      console.log(`Deleting schedule with ID: ${scheduleId}`);
      
      // Call API to delete the schedule
      const response = await axios.delete(`http://fams.io.vn/api-nodejs/schedules/${scheduleId}`);
      
      console.log("Delete API response:", response.data);
      
      if (response.data.success) {
        // Remove from local state to update UI
        setEvents(prevEvents => prevEvents.filter(event => event.id !== scheduleId));
        
        // Show success message
        alert('Xóa lịch học thành công!');
      } else {
        alert(`Không thể xóa lịch học: ${response.data.message}`);
      }
    } catch (error: any) {
      console.error('Lỗi khi xóa lịch học:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Lỗi không xác định';
      alert(`Lỗi khi xóa lịch học: ${errorMessage}`);
    }
  };

  // Generate attendance logs for all students and teacher in a class
  const generateAttendanceLogs = async (scheduleId: number, eventData: ScheduleEvent) => {
    try {
      console.log(`Generating attendance logs for schedule ${scheduleId}, class ${eventData.classId}`);
      
      // Kiểm tra dữ liệu đầu vào
      if (!eventData.classId || !eventData.teacher || !eventData.subjectId || !eventData.classroomNumber) {
        console.error("Missing required data for generating attendance logs", eventData);
        return;
      }
      
      // 1. Get all students in the class
      const studentsResponse = await axios.get(`http://fams.io.vn/api-nodejs/students/class/${eventData.classId}`);
      
      if (!studentsResponse.data.success) {
        console.error("Failed to fetch students for class:", studentsResponse.data.message);
        return;
      }
      
      const students = studentsResponse.data.data;
      console.log(`Found ${students.length} students in class ${eventData.classId}`);
      
      // 2. Get teacher info
      const teacherResponse = await axios.get(`http://fams.io.vn/api-nodejs/teachers/detail/${eventData.teacher}`);
      
      if (!teacherResponse.data.success) {
        console.error("Failed to fetch teacher details:", teacherResponse.data.message);
        return;
      }
      
      const teacher = teacherResponse.data.data;
      
      // 3. Get subject info
      const subject = subjectState.find(s => s.subjectId === eventData.subjectId);
      
      // 4. Get class info to get className
      const classData = allClasses.find(c => c.classId.toString() === String(eventData.classId));
      
      // 5. Get classroom info
      const classroom = classrooms.find(c => c.classroomId.toString() === String(eventData.classroomNumber));
      
      // 6. Create attendance log for teacher
      const teacherAttendanceLog = {
        scheduleId: scheduleId,
        userId: teacher.userId,
        checkIn: null,
        note: "",
        status: "Not Now",
        semesterNumber: 1, // Default
        isActive: true,
        userRole: "teacher",
        teacherId: teacher.teacherId,
        teacherName: teacher.fullName,
        subjectId: eventData.subjectId,
        subjectName: subject?.subjectName || "",
        classId: Number(eventData.classId),
        className: classData?.className || "",
        classroomId: Number(eventData.classroomNumber),
        classroomName: classroom?.classroomName || ""
      };
      
      console.log("Creating teacher attendance log:", teacherAttendanceLog);
      try {
        // Thử nhiều endpoint có thể có
        try {
          const response = await axios.post('http://fams.io.vn/api-nodejs/attendance-logs', teacherAttendanceLog);
          console.log("Teacher attendance log created successfully:", response.data);
        } catch (err) {
          console.error("Failed with attendance-logs endpoint, trying alternative:", err);
          const response = await axios.post('http://fams.io.vn/api-nodejs/attendance', teacherAttendanceLog);
          console.log("Teacher attendance log created with alternative endpoint:", response.data);
        }
      } catch (err) {
        console.error("All attendance log creation attempts failed:", err);
      }
      
      // 7. Create attendance logs for each student
      for (const student of students) {
        const studentAttendanceLog = {
          scheduleId: scheduleId,
          userId: student.userId,
          checkIn: null,
          note: "",
          status: "Not Now",
          semesterNumber: 1, // Default
          isActive: true,
          userRole: "student",
          teacherId: teacher.teacherId,
          teacherName: teacher.fullName,
          subjectId: eventData.subjectId,
          subjectName: subject?.subjectName || "",
          classId: Number(eventData.classId),
          className: classData?.className || "",
          classroomId: Number(eventData.classroomNumber),
          classroomName: classroom?.classroomName || "",
          studentId: student.studentId,
          studentName: student.fullName
        };
        
        console.log(`Creating attendance log for student ${student.fullName}:`, studentAttendanceLog);
        try {
          // Thử nhiều endpoint có thể có
          try {
            const response = await axios.post('http://fams.io.vn/api-nodejs/attendance-logs', studentAttendanceLog);
            console.log(`Student ${student.fullName} attendance log created successfully:`, response.data);
          } catch (err) {
            console.error(`Failed with attendance-logs endpoint for student ${student.fullName}, trying alternative:`, err);
            const response = await axios.post('http://fams.io.vn/api-nodejs/attendance', studentAttendanceLog);
            console.log(`Student ${student.fullName} attendance log created with alternative endpoint:`, response.data);
          }
        } catch (err) {
          console.error(`All attendance log creation attempts failed for student ${student.fullName}:`, err);
        }
      }
      
      console.log(`Successfully created ${students.length + 1} attendance logs`);
      
    } catch (error: any) {
      console.error('Error generating attendance logs:', error);
      alert(`Sinh bản ghi điểm danh thất bại: ${error.message}`);
    }
  };

  const handleAcademicYearChange = (year: string) => {
    setSelectedAcademicYear(year);
    const newFilters = { ...filters, academicYear: year, class: "" };
    setFilters(newFilters);
  };

  const handleSubjectChange = (subjectId: number | null) => {
    setSelectedSubject(subjectId);
    setFilters(prev => ({...prev, subjectId}));
  };

  useEffect(() => {
    if (filters.class) {
      dispatch(
        fetchSchedules({
          classId: filters.class,
          userId: "",
          fromDate: "",
          toDate: "",
          subjectId: filters.subjectId || undefined,
        })
      );
    }
  }, [filters, dispatch]);

  // Fetch classes with academicYear
  const fetchClassesWithFilter = async (academicYear: string) => {
    try {
      const response = await axios.get(`http://fams.io.vn/api-nodejs/classes?academicYear=${academicYear}`);
      if (response.data.success) {
        const filteredClasses = response.data.data;
        return filteredClasses;
      }
      return [];
    } catch (error) {
      console.error("Error fetching classes by academic year:", error);
      return [];
    }
  };

  // Fetch teachers by subject
  const fetchTeachersBySubject = async (subjectId: number) => {
    try {
      const response = await axios.get(`http://fams.io.vn/api-nodejs/schedules/teachers-by-subject/${subjectId}`);
      if (response.data.success) {
        const filteredTeachers = response.data.data;
        return filteredTeachers;
      }
      return [];
    } catch (error) {
      console.error("Error fetching teachers by subject:", error);
      return [];
    }
  };

  // Fetch slot details
  const fetchSlotDetails = async (slotId: number | string) => {
    try {
      const response = await axios.get(`http://fams.io.vn/api-nodejs/schedules/slot-details/${slotId}`);
      if (response.data.success) {
        return response.data.data;
      }
      return null;
    } catch (error) {
      console.error("Error fetching slot details:", error);
      return null;
    }
  };

  return {
    state: {
      eventShow,
      isEditing,
      view,
      currentDate,
      events,
      filters,
      classOptions,
      academicYears,
      selectedAcademicYear,
      allSubjects,
      subjectOptions,
      selectedSubject,
      loading,
      error,
      teachers: teachersList,
      classrooms,
      subjectState,
      allClasses
    },
    handler: {
      setEventShow,
      setIsEditing,
      setFilters,
      handleSelectEvent,
      handleSetView,
      handleSetDate,
      handleSearch,
      handleShowTeacherSchedule,
      handleSaveEdit,
      handleAcademicYearChange,
      handleSubjectChange,
      addEvent: handleAddEvent,
      deleteEvent: handleDeleteEvent,
      generateAttendanceLogs
    },
  };
}

export default useScheduleManagementPageHook;
