import { useState } from "react";
import { ScheduleEvent } from "../../model/scheduleModels/scheduleModels.model";
import { View } from "react-big-calendar";

function useSchedulePageHook() {
  const defaultEvent: ScheduleEvent = {
    id: 0,
    title: "Sự kiện mặc định",
    start: new Date(),
    end: new Date(),
    subject: "",   // 👈 Thêm field subject
    teacher: "",   // 👈 Thêm field teacher
  };
  const [eventShow, setEventShow] = useState<ScheduleEvent>(defaultEvent);
  const [view, setView] = useState<View>("month");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const handleSelectEvent = (event: ScheduleEvent = defaultEvent) => {
    setEventShow(event);
  };
  const handleSetNewView = (newView: View = 'month') => {
    setView(newView)
  }
  const handleSetNewViewDate = (newDate: Date = new Date()) => {
    setCurrentDate(newDate)
  }
  const state = { events, eventShow,view,currentDate };
  const handler = { handleSelectEvent,handleSetNewView,handleSetNewViewDate };
  return { state, handler };
}
export default useSchedulePageHook;
