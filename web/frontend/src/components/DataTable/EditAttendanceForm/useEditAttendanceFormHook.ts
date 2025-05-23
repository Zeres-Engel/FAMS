import { SelectChangeEvent } from "@mui/material";
import { useState } from "react";

export default function useEditAttendanceFormHook(initialData: {
  attendanceId: number;
  scheduleId: number;
  userId: string;
  fullName: string;
  face: string | null;
  checkin: string;
  status: string;
  note: string;
  checkinFace: string;
}) {
  const [data, setData] = useState(initialData);

  const handleStatusChange = (event: SelectChangeEvent<string>) => {
    const { value } = event.target;
    setData(prev => ({
      ...prev,
      status: value,
    }));
  };
  const handleNoteChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = event.target;
    setData(prev => ({
      ...prev,
      note: value,
    }));
  };
  return {
    state: { data },
    handler: {
      handleStatusChange,
      handleNoteChange
    },
  };
}
