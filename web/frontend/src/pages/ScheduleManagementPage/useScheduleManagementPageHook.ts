import { useState } from "react";
import { ScheduleEvent } from "../../model/scheduleModels/scheduleModels.model";
import { View } from "react-big-calendar";

const defaultEvent: ScheduleEvent = {
  id: 0,
  title: "",
  start: new Date(),
  end: new Date(),
  subject: "",
  teacher: "",
};

function useScheduleManagementPageHook() {
  const [eventShow, setEventShow] = useState<ScheduleEvent>(defaultEvent);
  const [view, setView] = useState<View>("month");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isEditing, setIsEditing] = useState(false);

  const [events, setEvents] = useState<ScheduleEvent[]>([
    {
      id: 1,
      title: "Toán - 4 tiết",
      start: new Date(2025, 3, 14, 7, 0),
      end: new Date(2025, 3, 14, 11, 0),
      subject: "Toán",
      teacher: "Thầy Nam",
    },
    {
      id: 2,
      title: "Văn - 3 tiết",
      start: new Date(2025, 3, 14, 13, 0),
      end: new Date(2025, 3, 14, 15, 30),
      subject: "Văn",
      teacher: "Cô Lan",
    },
    {
      id: 3,
      title: "Lý - 2 tiết",
      start: new Date(2025, 3, 17, 7, 0),
      end: new Date(2025, 3, 17, 9, 0),
      subject: "Vật Lý",
      teacher: "Thầy Hưng",
    },
    {
      id: 4,
      title: "Hóa - 4 tiết",
      start: new Date(2025, 3, 15, 13, 0),
      end: new Date(2025, 3, 15, 17, 0),
      subject: "Hóa",
      teacher: "Cô Mai",
    },
    {
      id: 5,
      title: "Sinh - 2 tiết",
      start: new Date(2025, 3, 19, 7, 0),
      end: new Date(2025, 3, 19, 9, 0),
      subject: "Sinh",
      teacher: "Cô Hương",
    },
    {
      id: 6,
      title: "Sử - 1 tiết",
      start: new Date(2025, 3, 20, 7, 0),
      end: new Date(2025, 3, 20, 8, 0),
      subject: "Lịch Sử",
      teacher: "Thầy Phúc",
    },
  ]);

  const [filters, setFilters] = useState({ class: "", userId: "" });

  const classOptions = ["10A1", "10A2", "11B1", "12C1"];

  const handleSelectEvent = (event: ScheduleEvent = defaultEvent) => {
    setEventShow(event);
  };

  const handleSetView = (newView: View) => setView(newView);

  const handleSetDate = (newDate: Date) => setCurrentDate(newDate);

  const handleSearch = () => {
    console.log("Searching for", filters);
    setEvents((prev) =>
      prev.filter(
        (ev) =>
          (!filters.class || ev.title.includes(filters.class)) &&
          (!filters.userId || ev.teacher.includes(filters.userId))
      )
    );
  };

  const handleShowTeacherSchedule = () => {
    setEvents((prev) =>
      prev.filter((ev) => ev.title.includes(filters.class))
    );
  };

  const handleSaveEdit = () => {
    setEvents((prev) =>
      prev.map((ev) => (ev.id === eventShow.id ? { ...eventShow } : ev))
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
