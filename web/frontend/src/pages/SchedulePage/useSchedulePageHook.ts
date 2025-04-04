import { useState } from "react";
import { ScheduleEvent } from "../../model/scheduleModels/scheduleModels.model";
import { View } from "react-big-calendar";

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
  const [events, setEvents] = useState([
    {
      id: 1,
      title: "Họp với Team",
      start: new Date(2025, 3, 2, 10, 0), // 5 April 2024, 10:00 AM
      end: new Date(2025, 3, 2, 12, 0), // 12:00 PM
    },
    {
      id: 2,
      title: "Ăn trưa với khách hàng",
      start: new Date(2025, 3, 3, 13, 0), // 6 April 2024, 1:00 PM
      end: new Date(2025, 3, 3, 14, 0), // 2:00 PM
    },
  ]);
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
