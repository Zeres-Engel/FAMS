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
import { useAppSelector } from "../../store/useStoreHook";
import { fetchClassesByUserId } from "../../store/slices/classByIdSlice";

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

// Interface for teacher data structure
interface TeacherData {
  userId: string;
  fullName: string;
  teacherId?: number;
}

function useScheduleManagementPageHook() {
  const dispatch = useDispatch<AppDispatch>();
  const fakeStudentOptions = [
    { label: "Đặng Ngọc Hưng - hungdnst2", value: "hungdnst2" },
    { label: "Nguyễn Phước Thành - thanhnpst1", value: "thanhnpst1" },
  ];
  const [studentOptions,setStudentOptions] = useState(fakeStudentOptions)
  const [eventShow, setEventShow] = useState<ScheduleEvent>(defaultEvent);
  const [view, setView] = useState<View>("week");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isEditing, setIsEditing] = useState(false);
  const [allClasses, setAllClasses] = useState<ClassData[]>([]);
  const [academicYears, setAcademicYears] = useState<string[]>([]);
  const [selectedAcademicYear, setSelectedAcademicYear] = useState("");
  const [allSubjects, setAllSubjects] = useState<SubjectData[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<number | null>(null);
  const [teachersList, setTeachersList] = useState<TeacherData[]>([]);
  const classList = useSelector((state: RootState) => state.classById.classes);
  const userData = useAppSelector(state => state.login.loginData);
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
    studentId: ""
  });
  const handleSearch = () => {
    const params: any = {
      userId: "",
      fromDate: "",
      toDate: "",
    };
    
    // Chỉ thêm classId khi không phải tùy chọn "All classes"
    if (filters.class !== "") {
      params.classId = filters.class;
    }
    
    // Thêm subjectId nếu có
    if (filters.subjectId) {
      params.subjectId = filters.subjectId;
    }
    
    dispatch(fetchSchedules(params));
  };

  useEffect(() => {
    if (userData && classList.length === 0 && userData?.role === "student") {
      dispatch(fetchClassesByUserId(userData?.userId));
    }
  }, [dispatch, userData, classList]);
  useEffect(()=>{
    if(userData?.role === "student" && classList.length){
      setAllClasses(
        classList.map(cls => ({
          _id: cls.id || "",
          className: cls.className,
          grade: cls.grade,
          homeroomTeacherId: cls.homeroomTeacherId,
          academicYear: cls.academicYear,
          createdAt: cls.createdAt || "",
          isActive: cls.isActive,
          classId: cls.classId,
          id: cls.id || "",
        }))
      );

      // Extract unique academic years
      const uniqueYears = Array.from(
        new Set(classList.map(cls => cls.academicYear))
      );
      setAcademicYears(uniqueYears);

      if (uniqueYears.length > 0) {
        setSelectedAcademicYear(uniqueYears[uniqueYears.length - 1]); // Select the most recent year by default
        setFilters(prev => ({
          ...prev,
          academicYear: uniqueYears[uniqueYears.length - 1],
        }));
      }
    }
  },[classList, userData?.role])
  const schedules = useSelector((state: RootState) => state.schedule.schedules);
  const loading = useSelector((state: RootState) => state.schedule.loading);
  const error = useSelector((state: RootState) => state.schedule.error);
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const subjectState = useSelector(
    (state: RootState) => state.subject.subjects
  );

  useEffect(() => {
    if (!subjectState || subjectState.length === 0) {
      dispatch(fetchSubjects() as any);
    }
  }, [dispatch, subjectState]);

  // Fetch classes from API
  const fetchClassesFromAPI = async () => {
    try {
      const response = await axios.get<ClassesApiResponse>(
        "http://fams.io.vn/api-nodejs/classes"
      );
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

        // Extract unique academic years and sort them
        const uniqueYears = getUniqueAcademicYears(sortedClasses);
        setAcademicYears(uniqueYears);

        if (uniqueYears.length > 0) {
          // Chọn năm học gần đây nhất làm mặc định
          setSelectedAcademicYear(uniqueYears[0]); 
          setFilters(prev => ({
            ...prev,
            academicYear: uniqueYears[0],
          }));
        }
      }
    } catch (error) {
      console.error("Error fetching classes:", error);
    }
  };

  // Hàm trích xuất các academicYear duy nhất từ danh sách lớp học và sắp xếp theo thứ tự mới nhất trước
  const getUniqueAcademicYears = (classes: ClassData[]): string[] => {
    // Lấy tất cả các năm học duy nhất từ danh sách lớp
    const uniqueYearsSet = new Set(classes.map(cls => cls.academicYear));
    const uniqueYears = Array.from(uniqueYearsSet);
    
    // Sắp xếp năm học theo thứ tự giảm dần (mới nhất lên đầu)
    return uniqueYears.sort((a, b) => {
      // Trích xuất năm kết thúc để so sánh (vd: "2022-2023" -> 2023)
      const endYearA = parseInt(a.split('-')[1]);
      const endYearB = parseInt(b.split('-')[1]);
      return endYearB - endYearA; // Sắp xếp giảm dần
    });
  };

  // Fetch teachers from API
  const fetchTeachersFromAPI = async () => {
    try {
      console.log("Fetching teachers from API...");
      const response = await axios.get<{success: boolean, data: TeacherData[]}>(
        "http://fams.io.vn/api-nodejs/teachers/search?search=&page=1&limit=100"
      );
      console.log("API Response:", response);
      if (response.data.success) {
        console.log("Fetched teachers:", response.data.data);
        // Kiểm tra xem API có trả về teacherId không
        const hasTeacherId = response.data.data.length > 0 && response.data.data[0].hasOwnProperty('teacherId');
        console.log("API response includes teacherId:", hasTeacherId);
        
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
      const response = await axios.get<SubjectsApiResponse>(
        "http://fams.io.vn/api-nodejs/subjects"
      );
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
    
    // Sử dụng dữ liệu academicYears từ allClasses nếu có
    if (allClasses.length > 0 && academicYears.length === 0) {
      // Lấy và cập nhật academicYears từ allClasses hiện có
      const years = getUniqueAcademicYears(allClasses);
      if (years.length > 0) {
        setAcademicYears(years);
        setSelectedAcademicYear(years[0]);
      }
    } 
    // Chỉ tạo năm học mặc định nếu không có dữ liệu từ API
    else if (academicYears.length === 0) {
      const currentYear = new Date().getFullYear();
      const defaultYears = [
        `${currentYear-1}-${currentYear}`,
        `${currentYear}-${currentYear+1}`, 
        `${currentYear+1}-${currentYear+2}`
      ];
      
      setAcademicYears(defaultYears);
      setSelectedAcademicYear(defaultYears[1]); // Năm hiện tại làm mặc định
    }
    
    // Load lịch học khi component được mount
    const params: any = {
      userId: "",
      fromDate: "",
      toDate: "",
    };
    dispatch(fetchSchedules(params));
  }, []);

  // Filter class options based on selected academic year
  const classOptions = userData?.role !== "student" ? allClasses
    .filter(
      c => !filters.academicYear || c.academicYear === filters.academicYear
    )
    .map(c => ({
      label: c.className,
      value: c.classId.toString(),
    })) : classList.filter(
      c => !filters.academicYear || c.academicYear === filters.academicYear
    )
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
    })),
  ];

  function combineDateAndTime(dateString: string, timeString: string): Date {
    if (!dateString || !timeString) {
      console.error("Invalid dateString or timeString:", { dateString, timeString });
      return new Date(); // Trả về ngày hiện tại nếu dữ liệu không hợp lệ
    }
  
    const localDate = new Date(dateString);
    const [hours, minutes] = timeString.split(":").map(Number);
  
    if (isNaN(hours) || isNaN(minutes)) {
      console.error("Invalid time format:", timeString);
      return new Date(); // Trả về ngày hiện tại nếu định dạng thời gian không hợp lệ
    }
  
    localDate.setHours(hours);
    localDate.setMinutes(minutes);
    localDate.setSeconds(0);
    localDate.setMilliseconds(0);
  
    return new Date(localDate);
  }

  useEffect(() => {
    if (schedules.length) {
      const mappedEvents: ScheduleEvent[] = schedules.map((item: Schedule) => {
        const start = combineDateAndTime(item.sessionDate, item.startTime || "00:00");
        const end = combineDateAndTime(item.sessionDate, item.endTime || "00:00");
  
        // In dữ liệu response từ API để debug
        console.log("API Schedule data:", {
          id: item.scheduleId,
          slotNumber: item.slotNumber,
          slotId: item.SlotID,
          startTime: item.startTime,
          endTime: item.endTime,
        });
  
        return {
          id: Number(item.scheduleId),
          title: item.topic || `${item.subjectName} - slot ${item.slotNumber || item.SlotID}`,
          start,
          end,
          subjectName: item.subjectName || "",
          subject: item.subjectName || "",
          teacher: item.teacherUserId || "",
          classroomNumber: item.classroomNumber,
          classroomId: item.classroomId,
          subjectId: item.subjectId,
          academicYear: item.academicYear,
          classId: item.classId.toString(),
          className: item.className,
          slotNumber: item.slotNumber, // Sử dụng trực tiếp slotNumber từ API
          slotId: item.slotNumber ? String(item.slotNumber) : String(item.SlotID), // Sử dụng slotNumber nếu có, nếu không dùng SlotID
          customStartTime: item.startTime,
          customEndTime: item.endTime,
        };
      });
      
      console.log("Mapped events from API:", mappedEvents);
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
      classId: String(eventShow.classId),
      subjectId: eventShow.subjectId,
      classroomId: eventShow.classroomId,
      teacherId: eventShow.teacher,
      topic: eventShow.title,
      sessionDate: new Date(currentSchedule?.sessionDate)
        .toISOString()
        .split("T")[0],
      slotId: eventShow.slotId?.toString(),
      // Thêm thông tin cho custom time slots nếu cần
      ...(eventShow.customStartTime && eventShow.customEndTime ? { 
        customStartTime: eventShow.customStartTime,
        customEndTime: eventShow.customEndTime 
      } : {})
    };
    console.log("updatedSchedule", updatedSchedule);

    dispatch(updateSchedule(updatedSchedule));
    setIsEditing(false);
  };

  // Hàm lấy thông tin chi tiết về giáo viên từ API
  const getTeacherDetails = async (userId: string) => {
    try {
      console.log(`Fetching details for teacher userId: ${userId}`);
      const response = await axios.get(
        `http://fams.io.vn/api-nodejs/users/teacher/${userId}`
      );
      console.log("Teacher details response:", response.data);
      
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      return null;
    } catch (error) {
      console.error(`Error fetching teacher details for ${userId}:`, error);
      return null;
    }
  };

  // Thêm hàm fetchSlotDetails vào hook
  const fetchSlotDetails = async (slotId: number | string) => {
    try {
      const response = await axios.get(
        `http://fams.io.vn/api-nodejs/schedules/slots/${slotId}`
      );
      if (response.data.success) {
        return response.data.data;
      }
      return null;
    } catch (error) {
      console.error(`Error fetching slot details for ${slotId}:`, error);
      return null;
    }
  };

  // Sửa hàm để kiểm tra và xử lý undefined
  const createSlotIfNotExists = async (
    slotNumber: number | string,
    dayOfWeek: string,
    startTime: string,
    endTime: string,
    isExtra: boolean = false
  ) => {
    try {
      if (!slotNumber) {
        console.error("Cannot create slot: slotNumber is required");
        return null;
      }

      console.log(`Creating new slot: ${slotNumber} for ${dayOfWeek}`);
      
      // Chuẩn bị dữ liệu slot mới
      const slotData = {
        slotNumber: Number(slotNumber),
        slotName: isExtra ? "Slot Extra" : `Slot ${slotNumber}`,
        dayOfWeek: dayOfWeek,
        startTime: startTime,
        endTime: endTime,
        isActive: true
      };
      
      // Gọi API để tạo slot mới
      const response = await axios.post(
        "http://fams.io.vn/api-nodejs/schedules/slots",
        slotData,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`
          }
        }
      );
      
      if (response.data.success) {
        console.log("New slot created successfully:", response.data.data);
        return response.data.data;
      } else {
        console.error("Failed to create new slot:", response.data.message);
        return null;
      }
    } catch (error) {
      console.error("Error creating new slot:", error);
      return null;
    }
  };

  // Sửa hàm handleAddEvent để trả về event đã tạo
  const handleAddEvent = async (newEvent: ScheduleEvent): Promise<ScheduleEvent> => {
    try {
      console.log("Creating new schedule with data:", newEvent);
      
      // Tìm giáo viên trong danh sách để lấy teacherId
      const teacher = teachersList.find(t => t.userId === newEvent.teacher);
      
      // Lấy thông tin ngày và thứ
      const selectedDate = newEvent.scheduleDate || new Date();
      const dayOfWeek = moment(selectedDate).format('dddd');
      
      // Tìm thông tin classroom để lấy classroomNumber
      const classroom = classrooms.find(c => c.classroomId.toString() === String(newEvent.classroomNumber));
      
      // Xử lý thời gian bắt đầu và kết thúc
      const startTime = newEvent.customStartTime || "17:00";
      const endTime = newEvent.customEndTime || "19:00";
      
      // Chuẩn bị dữ liệu để gửi đến API
      const scheduleData: any = {
        semesterId: newEvent.semesterId || 1,
        semesterNumber: newEvent.semesterNumber || 1,
        classId: newEvent.classId,
        subjectId: newEvent.subjectId,
        classroomId: newEvent.classroomNumber,
        teacherUserId: newEvent.teacher,
        topic: newEvent.title || `Buổi học ${newEvent.slotNumber || newEvent.slotId || ''}`,
        sessionDate: moment(selectedDate).format("YYYY-MM-DD"),
        dayOfWeek: dayOfWeek,
        slotNumber: newEvent.slotNumber || Number(newEvent.slotId) || 1, // Ưu tiên slotNumber, nhưng cũng có thể lấy từ slotId
        startTime: startTime,
        endTime: endTime
      };
      
      // Log the time values for debugging
      console.log("Time values for API request:", {
        slotNumber: scheduleData.slotNumber,
        providedStartTime: newEvent.customStartTime,
        providedEndTime: newEvent.customEndTime,
        usedStartTime: scheduleData.startTime,
        usedEndTime: scheduleData.endTime
      });
      
      console.log("Sending data to API:", scheduleData);

      // Gọi API để tạo lịch học mới
      const response = await axios.post(
        "http://fams.io.vn/api-nodejs/schedules",
        scheduleData,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`
          }
        }
      );

      console.log("API response:", response.data);

      if (response.data.success) {
        // Tìm tên môn học từ subjectId
        const subject = subjectState.find(s => s.subjectId === newEvent.subjectId);

        // Tạo đối tượng Date cho start và end với ngày và giờ chính xác
        const startDate = new Date(newEvent.scheduleDate || new Date());
        const endDate = new Date(newEvent.scheduleDate || new Date());
        
        // Phân tích giờ từ startTime và endTime
        const [startHour, startMinute] = startTime.split(':').map(Number);
        const [endHour, endMinute] = endTime.split(':').map(Number);
        
        // Đặt giờ cho startDate và endDate
        startDate.setHours(startHour, startMinute, 0, 0);
        endDate.setHours(endHour, endMinute, 0, 0);

        // Tạo event mới với scheduleId từ API response
        const createdEvent: ScheduleEvent = {
          id: response.data.data.schedule.scheduleId,
          title: subject?.subjectName || newEvent.title || "",
          start: startDate,
          end: endDate,
          subject: subject?.subjectName || "",
          teacher: newEvent.teacher,
          classroomNumber: classroom?.classroomName || "",
          classId: newEvent.classId,
          subjectId: newEvent.subjectId,
        };

        // Thêm vào state để hiển thị
        setEvents([...events, createdEvent]);

        // Trả về event với scheduleId đã cập nhật
        return createdEvent;
      } else {
        throw new Error(response.data.message || "Tạo lịch học thất bại");
      }
    } catch (error: any) {
      console.error("Lỗi khi tạo lịch học:", error);
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        "Lỗi không xác định";
      throw new Error(`Lỗi khi tạo lịch học: ${errorMessage}`);
    }
  };

  // Sửa hàm handleDeleteEvent để đảm bảo xóa cả AttendanceLog
  const handleDeleteEvent = async (scheduleId: number) => {
    try {
      console.log(`Deleting schedule with ID: ${scheduleId}`);

      // Kiểm tra scheduleId hợp lệ
      if (!scheduleId) {
        console.error("Invalid scheduleId:", scheduleId);
        return;
      }

      // Call API to delete the schedule (API đã xử lý việc xóa AttendanceLog liên quan)
      const response = await axios.delete(
        `http://fams.io.vn/api-nodejs/schedules/${scheduleId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json"
          }
        }
      );

      console.log("Delete API response:", response.data);

      if (response.data.success) {
        // Log thông tin về số bản ghi AttendanceLog đã bị xóa
        const logsDeleted = response.data.data?.attendanceLogsDeleted || 0;
        console.log(`Deleted ${logsDeleted} attendance logs`);
        
        // Remove from local state to update UI
        setEvents(prevEvents =>
          prevEvents.filter(event => event.id !== scheduleId)
        );
      } else {
        // Nếu API trả về lỗi
        console.error(`Không thể xóa lịch học: ${response.data.message || "Lỗi không xác định"}`);
      }
    } catch (error: any) {
      console.error("Lỗi khi xóa lịch học:", error);
      
      // Thông báo lỗi chi tiết hơn bằng console.error thay vì alert
      const errorStatus = error?.response?.status;
      const errorMessage = error?.response?.data?.message || error?.message || "Lỗi không xác định";
      
      if (errorStatus === 404) {
        console.error(`Không tìm thấy lịch học với ID ${scheduleId}. Có thể lịch học đã bị xóa trước đó.`);
      } else {
        console.error(`Lỗi khi xóa lịch học (${errorStatus}): ${errorMessage}`);
      }
    }
  };

  // Generate attendance logs for all students and teacher in a class
  const generateAttendanceLogs = async (
    scheduleId: number,
    eventData: ScheduleEvent
  ) => {
    try {
      console.log(
        `Generating attendance logs for schedule ${scheduleId}, class ${eventData.classId}`
      );

      // Kiểm tra dữ liệu đầu vào
      if (
        !eventData.classId ||
        !eventData.teacher ||
        !eventData.subjectId ||
        !eventData.classroomNumber
      ) {
        console.error(
          "Missing required data for generating attendance logs",
          eventData
        );
        return;
      }

      // 1. Get all students in the class
      const studentsResponse = await axios.get(
        `http://fams.io.vn/api-nodejs/students/class/${eventData.classId}`
      );

      if (!studentsResponse.data.success) {
        console.error(
          "Failed to fetch students for class:",
          studentsResponse.data.message
        );
        return;
      }

      const students = studentsResponse.data.data;
      console.log(
        `Found ${students.length} students in class ${eventData.classId}`
      );

      // 2. Get teacher info
      const teacherResponse = await axios.get(
        `http://fams.io.vn/api-nodejs/teachers/detail/${eventData.teacher}`
      );

      if (!teacherResponse.data.success) {
        console.error(
          "Failed to fetch teacher details:",
          teacherResponse.data.message
        );
        return;
      }

      const teacher = teacherResponse.data.data;

      // 3. Get subject info
      const subject = subjectState.find(
        s => s.subjectId === eventData.subjectId
      );

      // 4. Get class info to get className
      const classData = allClasses.find(
        c => c.classId.toString() === String(eventData.classId)
      );

      // 5. Get classroom info
      const classroom = classrooms.find(
        c => c.classroomId.toString() === String(eventData.classroomNumber)
      );

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
        classroomName: classroom?.classroomName || "",
      };

      console.log("Creating teacher attendance log:", teacherAttendanceLog);
      try {
        // Thử nhiều endpoint có thể có
        try {
          const response = await axios.post(
            "http://fams.io.vn/api-nodejs/attendance-logs",
            teacherAttendanceLog
          );
          console.log(
            "Teacher attendance log created successfully:",
            response.data
          );
        } catch (err) {
          console.error(
            "Failed with attendance-logs endpoint, trying alternative:",
            err
          );
          const response = await axios.post(
            "http://fams.io.vn/api-nodejs/attendance",
            teacherAttendanceLog
          );
          console.log(
            "Teacher attendance log created with alternative endpoint:",
            response.data
          );
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
          studentName: student.fullName,
        };

        console.log(
          `Creating attendance log for student ${student.fullName}:`,
          studentAttendanceLog
        );
        try {
          // Thử nhiều endpoint có thể có
          try {
            const response = await axios.post(
              "http://fams.io.vn/api-nodejs/attendance-logs",
              studentAttendanceLog
            );
            console.log(
              `Student ${student.fullName} attendance log created successfully:`,
              response.data
            );
          } catch (err) {
            console.error(
              `Failed with attendance-logs endpoint for student ${student.fullName}, trying alternative:`,
              err
            );
            const response = await axios.post(
              "http://fams.io.vn/api-nodejs/attendance",
              studentAttendanceLog
            );
            console.log(
              `Student ${student.fullName} attendance log created with alternative endpoint:`,
              response.data
            );
          }
        } catch (err) {
          console.error(
            `All attendance log creation attempts failed for student ${student.fullName}:`,
            err
          );
        }
      }

      console.log(
        `Successfully created ${students.length + 1} attendance logs`
      );
    } catch (error: any) {
      console.error("Error generating attendance logs:", error);
      alert(`Sinh bản ghi điểm danh thất bại: ${error.message}`);
    }
  };

  const handleAcademicYearChange = (year: string) => {
    console.log("Changing academic year to:", year);
    
    // Nếu là giá trị trống, gán lại giá trị mặc định
    if (!year) {
      const currentYear = new Date().getFullYear();
      const defaultYear = `${currentYear}-${currentYear+1}`;
      console.log("Empty year provided, using default:", defaultYear);
      year = defaultYear;
    }
    
    setSelectedAcademicYear(year);
    const newFilters = { ...filters, academicYear: year, class: "" };
    setFilters(newFilters);
    
    // Nếu đang chọn năm học cho lịch, tìm các lớp thuộc năm đó
    fetchClassesWithFilter(year);
  };

  const handleSubjectChange = (subjectId: number | null) => {
    setSelectedSubject(subjectId);
    setFilters(prev => ({ ...prev, subjectId }));
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
  const fetchClassesWithFilter = async (academicYear: string, callback?: (classes: ClassData[]) => void) => {
    try {
      const response = await axios.get(
        `http://fams.io.vn/api-nodejs/classes?academicYear=${academicYear}`
      );
      if (response.data.success) {
        const filteredClasses = response.data.data;
        if (callback) {
          callback(filteredClasses);
        }
        return filteredClasses;
      }
      return [];
    } catch (error) {
      console.error("Error fetching classes by academic year:", error);
      return [];
    }
  };

  // Fetch classes by academic year specifically for the add schedule dialog
  const fetchClassesByAcademicYear = async (academicYear: string) => {
    try {
      console.log(`Fetching classes for academic year: ${academicYear}`);
      const response = await axios.get(
        `http://fams.io.vn/api-nodejs/classes?academicYear=${academicYear}`
      );
      
      if (response.data.success) {
        console.log(`Found ${response.data.data.length} classes for year ${academicYear}`);
        return response.data.data;
      }
      return [];
    } catch (error) {
      console.error("Error fetching classes for academic year:", error);
      return [];
    }
  };

  // Fetch teachers by subject
  const fetchTeachersBySubject = async (subjectId: number) => {
    try {
      const response = await axios.get(
        `http://fams.io.vn/api-nodejs/schedules/teachers-by-subject/${subjectId}`
      );
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
      allClasses,
      studentOptions
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
      generateAttendanceLogs,
      fetchClassesByAcademicYear,
      fetchSlotDetails,
    },
  };
}

export default useScheduleManagementPageHook;