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
import { fetchClasses } from "../../store/slices/classSlice";
import { searchTeachers } from "../../store/slices/teacherSlice";
import { fetchClassrooms } from "../../store/slices/classroomSlice";
import { fetchSubjects } from "../../store/slices/subjectSlice";
import { useAppSelector } from "../../store/useStoreHook";
import { fetchClassesByUserId } from "../../store/slices/classByIdSlice";

const defaultEvent: ScheduleEvent = {
  id: 0,
  title: "",
  start: new Date(),
  end: new Date(),
  subject: "",
  teacher: "",
  classroomNumber: "",
};

function useScheduleManagementPageHook() {
  const dispatch = useDispatch<AppDispatch>();

  const [eventShow, setEventShow] = useState<ScheduleEvent>(defaultEvent);
  const [view, setView] = useState<View>("month");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isEditing, setIsEditing] = useState(false);
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
    userId: "",
    // academicYear: "",
    dateFrom: "",
    dateTo: "",
  });

  const schedules = useSelector((state: RootState) => state.schedule.schedules);
  const loading = useSelector((state: RootState) => state.schedule.loading);
  const error = useSelector((state: RootState) => state.schedule.error);
  const classes = useSelector((state: RootState) => state.class.allClasses);
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const teachers = useSelector((state: RootState) => state.teacher.teachers);
  const subjectState = useSelector(
    (state: RootState) => state.subject.subjects
  );
  const userData = useAppSelector(state => state.login.loginData);
  const classList = useSelector((state: RootState) => state.classById.classes);
  useEffect(() => {
    if (userData && classList.length === 0 && userData.role !== "admin") {
      dispatch(fetchClassesByUserId(userData?.userId));
    }
  }, [dispatch, userData, classList]);

  useEffect(() => {
    if (!subjectState || subjectState.length === 0) {
      dispatch(fetchSubjects() as any);
    }
  }, [dispatch, subjectState]);

  useEffect(() => {
    if (!teachers || teachers.length === 0) {
      dispatch(searchTeachers({ search: "", page: 1, limit: 100 }));
    }
  }, [teachers, dispatch]);

  useEffect(() => {
    if (!classes && userData && userData.role === "admin") {
      dispatch(fetchClasses());
    }
  }, [dispatch, classes, userData]);
  const classOptions =
    userData?.role === "admin"
      ? classes?.map(c => ({
          label: `${c.className} - ${c.academicYear}`,
          value: c.id,
        })) || []
      : classList?.map(c => ({
          label: `${c.className} - ${c.academicYear}`,
          value: `${c.classId}`,
        })) || [];
  const handleSearch = () => {
    const currentYear = new Date().getFullYear();

    const fromDate = filters.dateFrom || "";
    // new Date(`${currentYear}-01-01`).toISOString().split("T")[0];

    const toDate = filters.dateTo || "";
    // new Date(`${currentYear + 1}-12-31`).toISOString().split("T")[0];

    dispatch(
      fetchSchedules({
        classId: filters.class,
        userId: filters.userId,
        fromDate,
        toDate,
      })
    );
  };

  // function combineDateAndTime(dateString: string, timeString: string): Date {
  //   const datePart = new Date(dateString).toISOString().split("T")[0];
  //   return new Date(`${datePart}T${timeString}:00`);
  // }
  function combineDateAndTime(dateString: string, timeString: string): Date {
    const localDate = new Date(dateString); // vẫn giữ nguyên Date
    const [hours, minutes] = timeString.split(":").map(Number);

    localDate.setHours(hours);
    localDate.setMinutes(minutes);
    localDate.setSeconds(0);
    localDate.setMilliseconds(0);

    return new Date(localDate); // trả ra Local Time
  }
  const getAcademicYears = (range = 2) => {
    const currentYear = new Date().getFullYear();
    const startYear = currentYear - range;
    const endYear = currentYear + range;

    const years: string[] = [];
    for (let year = startYear; year <= endYear; year++) {
      years.push(`${year}-${year + 1}`);
    }
    return years;
  };
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

  const handleAddEvent = (newEvent: ScheduleEvent) => {
    const newId = events.length + 1;
    setEvents([...events, { ...newEvent, id: newId }]);
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
      loading,
      error,
      teachers,
      classrooms,
      subjectState,
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
      getAcademicYears,
      addEvent: handleAddEvent,
    },
  };
}

export default useScheduleManagementPageHook;
