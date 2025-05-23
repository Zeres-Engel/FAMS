import moment from "moment";
import { Components } from "react-big-calendar";
import { ScheduleEvent } from "../../../model/scheduleModels/scheduleModels.model";

// Định dạng hiển thị cho lịch
export const calendarFormats = {
  monthHeaderFormat: "MMMM YYYY",
  dayHeaderFormat: "dddd, D MMMM YYYY",
  dayRangeHeaderFormat: ({ start, end }: { start: Date; end: Date }) =>
    `${moment(start).format("D MMMM")} - ${moment(end).format("D MMMM YYYY")}`,
  agendaHeaderFormat: ({ start, end }: { start: Date; end: Date }) =>
    `${moment(start).format("D MMMM")} - ${moment(end).format("D MMMM YYYY")}`,
  eventTimeRangeFormat: ({ start, end }: { start: Date; end: Date }) =>
    `${moment(start).format("HH:mm")} - ${moment(end).format("HH:mm")}`,
};

// Status badge styles based on attendance status
const getStatusStyle = (status?: string) => {
  if (!status) return {};
  
  switch (status.toLowerCase()) {
    case 'present':
      return { 
        backgroundColor: '#4caf50', 
        color: 'white',
        boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
        border: '1px solid rgba(255,255,255,0.2)'
      };
    case 'late':
      return { 
        backgroundColor: '#ff9800', 
        color: 'white',
        boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
        border: '1px solid rgba(255,255,255,0.2)'
      };
    case 'absent':
      return { 
        backgroundColor: '#f44336', 
        color: 'white',
        boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
        border: '1px solid rgba(255,255,255,0.2)'
      };
    default:
      return { 
        backgroundColor: '#9e9e9e', 
        color: 'white',
        boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
        border: '1px solid rgba(255,255,255,0.2)'
      };
  }
};

// Components tùy chỉnh cho events
export const calendarComponents: Components<ScheduleEvent, object> = {
  event: (props: { event: ScheduleEvent }) => {
    const { event } = props;
    const hasAttendance = 'attendanceStatus' in event;
    
    return (
      <div className="custom-event">
        <div className="event-header">
          <div className="event-title">{event.subject} - {event.className}</div>
          {hasAttendance && (
            <div 
              className="attendance-badge" 
              style={{
                ...getStatusStyle(event.attendanceStatus),
                padding: '2px 6px',
                borderRadius: '12px',
                fontSize: '10px',
                fontWeight: 'bold',
                display: 'inline-block',
                marginLeft: '4px',
                letterSpacing: '0.5px',
                textTransform: 'uppercase',
                textShadow: '0px 1px 1px rgba(0,0,0,0.2)'
              }}
            >
              {event.attendanceStatus || 'N/A'}
            </div>
          )}
        </div>
        <div className="event-details">
          <div>Giáo viên: {event.teacher}</div>
          <div>Phòng: {event.classroomNumber}</div>
        </div>
      </div>
    );
  },
};

// Cấu hình các slot thời gian
export const slotConfig = [
  { slotNumber: 1, startTime: "07:00", endTime: "07:50" },
  { slotNumber: 2, startTime: "07:50", endTime: "08:35" },
  { slotNumber: 3, startTime: "08:50", endTime: "09:35" },
  { slotNumber: 4, startTime: "09:40", endTime: "10:25" },
  { slotNumber: 5, startTime: "10:30", endTime: "11:15" },
  { slotNumber: 6, startTime: "13:00", endTime: "13:50" },
  { slotNumber: 7, startTime: "13:50", endTime: "14:35" },
  { slotNumber: 8, startTime: "14:40", endTime: "15:25" },
  { slotNumber: 9, startTime: "15:30", endTime: "16:15" },
  { slotNumber: 10, startTime: "16:20", endTime: "17:05" },
  { slotNumber: 11, startTime: "", endTime: "", isExtra: true },
];

// Hàm tạo màu cho events
export const eventPropGetter = (event: ScheduleEvent) => {
  // Khởi tạo một giá trị dựa trên subject hoặc event.id để tạo màu nhất quán
  const colorBase = event.subjectId || event.id;
  // Tạo các màu pastel dựa trên subjectId
  const hue = (colorBase * 137) % 360; // Sử dụng phép nhân với số nguyên tố để tạo sự phân bố đều
  const saturation = 65;
  const lightness = 75;

  return {
    style: {
      backgroundColor: `hsl(${hue}, ${saturation}%, ${lightness}%)`,
      color: "#333",
      borderRadius: "4px",
      border: "1px solid rgba(0,0,0,0.1)",
      boxShadow: "none",
      padding: "4px 6px",
    },
  };
}; 