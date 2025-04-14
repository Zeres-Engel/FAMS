import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { View } from "react-big-calendar";
import { ScheduleEvent } from "../../model/scheduleModels/scheduleModels.model";
import { fetchSchedules, Schedule } from "../../store/slices/scheduleSlice";
import { AppDispatch, RootState } from "../../store/store";
import { fetchClasses } from "../../store/slices/classSlice";

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
  const [filters, setFilters] = useState({ class: "", userId: "" });

  const schedules = useSelector((state: RootState) => state.schedule.schedules);
  const loading = useSelector((state: RootState) => state.schedule.loading);
  const error = useSelector((state: RootState) => state.schedule.error);
  const classes = useSelector((state: RootState) => state.class.classes);
  const [events, setEvents] = useState<ScheduleEvent[]>([]); // hiển thị tạm thời từ Redux

  // const classOptions = ["10A1", "10A2", "11B1", "12C1"];
  const classOptions = classes?.map(c => c.className) || [];
  useEffect(() => {
    if (!classes) {
      dispatch(fetchClasses());
    }
  }, [dispatch, classes]);
  // 👇 Handler để gọi API
  const handleSearch = () => {
    const fromDate = new Date();
    const toDate = new Date();
    toDate.setDate(toDate.getDate() + 14); // ví dụ: lấy 2 tuần tới

    dispatch(
      fetchSchedules({
        className: filters.class,
        userId: filters.userId,
        fromDate: fromDate.toISOString().split("T")[0],
        toDate: toDate.toISOString().split("T")[0],
      })
    );
  };
  function combineDateAndTime(dateString: string, timeString: string): Date {
    const datePart = new Date(dateString).toISOString().split("T")[0]; // "2025-04-18"
    return new Date(`${datePart}T${timeString}:00`); // ISO string: "2025-04-18T13:50:00"
  }
  // 👇 Log & set lại khi dữ liệu từ API thay đổi
  useEffect(() => {
    if (schedules.length) {
      console.log("Fetched schedules: ", schedules);

      const mappedEvents: ScheduleEvent[] = schedules.map((item: Schedule) => ({
        id: Number(item.slotId), // nếu cần duy nhất có thể dùng: Number(item.slotId + item.classId)
        title: item.topic || `${item.subjectName} - slot ${item.slotId}`,
        start: combineDateAndTime(
          item.sessionDate || item.sessionDate,
          item.startTime
        ),
        end: combineDateAndTime(
          item.sessionDate || item.sessionDate,
          item.endTime
        ),
        subject: item.subjectName || "",
        teacher: item.teacherId || "",
        classroomNumber:item.classroomNumber
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
      addEvent: handleAddEvent,
    },
  };
}

export default useScheduleManagementPageHook;
