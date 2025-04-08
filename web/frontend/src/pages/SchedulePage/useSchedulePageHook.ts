import { useState, useEffect } from "react";
import { ScheduleEvent } from "../../model/scheduleModels/scheduleModels.model";
import { View } from "react-big-calendar";
import { getUserSchedule, convertScheduleToEvents } from "../../services/scheduleService";

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
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSchedule = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await getUserSchedule();
        if (response.success && response.data.schedules) {
          const calendarEvents = convertScheduleToEvents(response.data.schedules);
          setEvents(calendarEvents);
        } else {
          setError("Failed to fetch schedule data");
        }
      } catch (error) {
        console.error("Error fetching schedule:", error);
        setError("An error occurred while fetching your schedule");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSchedule();
  }, []);

  const handleSelectEvent = (event: ScheduleEvent = defaultEvent) => {
    setEventShow(event);
  };
  
  const handleSetNewView = (newView: View = 'month') => {
    setView(newView)
  }
  
  const handleSetNewViewDate = (newDate: Date = new Date()) => {
    setCurrentDate(newDate)
  }
  
  const state = { events, eventShow, view, currentDate, isLoading, error };
  const handler = { handleSelectEvent, handleSetNewView, handleSetNewViewDate };
  return { state, handler };
}

export default useSchedulePageHook;
