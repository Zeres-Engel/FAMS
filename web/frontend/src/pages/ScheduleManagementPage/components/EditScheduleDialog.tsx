import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Box,
  Typography,
  SelectChangeEvent,
} from '@mui/material';
import { ScheduleEvent } from '../../../model/scheduleModels/scheduleModels.model';
import moment from 'moment';
import { slotConfig } from '../config/ScheduleConfig';

interface SlotInfo {
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  isExtraSlot: boolean;
}

interface EditScheduleDialogProps {
  open: boolean;
  onClose: () => void;
  event: ScheduleEvent | null;
  onSave: (updatedEvent: ScheduleEvent) => void;
  onViewAttendance: (scheduleId: number) => void;
  teachers: { userId: string; fullName: string }[];
  academicYears: string[];
  allClasses: any[];
  subjectState: any[];
  classrooms: any[];
}

const EditScheduleDialog: React.FC<EditScheduleDialogProps> = ({
  open,
  onClose,
  event,
  onSave,
  onViewAttendance,
  teachers,
  academicYears,
  allClasses,
  subjectState,
  classrooms,
}) => {
  const [editedEvent, setEditedEvent] = useState<ScheduleEvent | null>(null);
  const [slotInfo, setSlotInfo] = useState<SlotInfo>({
    dayOfWeek: '',
    startTime: '',
    endTime: '',
    isExtraSlot: false
  });
  const [directTeachers, setDirectTeachers] = useState<{ userId: string; fullName: string }[]>(teachers);

  useEffect(() => {
    if (event) {
      setEditedEvent(event);
      
      // Xác định thứ trong tuần từ ngày đã chọn
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const scheduleDate = event.scheduleDate || new Date();
      const dayOfWeek = days[scheduleDate.getDay()];
      
      // Lấy thông tin slot từ slotConfig
      const slotDetails = slotConfig.find(slot => slot.slotNumber === Number(event.slotId));
      
      // Khởi tạo slotInfo với thông tin từ event
      setSlotInfo({
        dayOfWeek: dayOfWeek,
        startTime: event.customStartTime || (slotDetails?.startTime || ""),
        endTime: event.customEndTime || (slotDetails?.endTime || ""),
        isExtraSlot: event.slotId === "11"
      });

      // Nếu có subjectId, fetch teachers cho subject này
      if (event.subjectId) {
        fetchTeachersBySubject(event.subjectId);
      }
    }
  }, [event]);

  useEffect(() => {
    if (editedEvent && open) {
      // Đảm bảo slotInfo luôn được cập nhật khi dialog mở
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const scheduleDate = editedEvent.scheduleDate || new Date();
      const dayOfWeek = days[scheduleDate.getDay()];
      
      if (!slotInfo.dayOfWeek) {
        setSlotInfo(prevState => ({
          ...prevState,
          dayOfWeek: dayOfWeek
        }));
      }
    }
  }, [editedEvent, open, slotInfo]);

  const fetchTeachersBySubject = async (subjectId: number) => {
    try {
      const response = await fetch(
        `http://fams.io.vn/api-nodejs/schedules/teachers-by-subject/${subjectId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        console.error(
          "Teacher API by subject response not OK:",
          response.status,
          response.statusText
        );
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      if (data.success && data.data && data.data.length > 0) {
        console.log("Loaded teachers for subject:", data.data.length);
        setDirectTeachers(data.data);
      } else {
        console.error("API returned success: false or empty data", data);
        // Fallback to using all teachers
        console.log("Falling back to all teachers");
        if (teachers && teachers.length > 0) {
          setDirectTeachers(teachers);
        }
      }
    } catch (error) {
      console.error("Error fetching teachers for subject:", error);
      // Fallback to using all teachers
      if (teachers && teachers.length > 0) {
        setDirectTeachers(teachers);
      }
    }
  };

  const fetchClassesByAcademicYear = async (year: string) => {
    try {
      const response = await fetch(
        `http://fams.io.vn/api-nodejs/classes?academicYear=${year}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error("Error loading classes for academic year:", error);
      return [];
    }
  };

  if (!editedEvent) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Edit Schedule</DialogTitle>
      <DialogContent dividers>
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel id="academic-year-select-label">Academic Year</InputLabel>
          <Select
            labelId="academic-year-select-label"
            id="academic-year-select"
            value={editedEvent.academicYear || ""}
            label="Academic Year"
            onChange={(e: SelectChangeEvent) => {
              const selectedYear = e.target.value;
              setEditedEvent({
                ...editedEvent,
                academicYear: selectedYear,
                classId: "", // Reset class when year changes
              });

              // Fetch classes for this academic year
              if (selectedYear) {
                fetchClassesByAcademicYear(selectedYear)
                  .then(classes => {
                    console.log(`Loaded ${classes.length} classes for academic year ${selectedYear}`);
                  })
                  .catch(error => {
                    console.error("Error loading classes for academic year:", error);
                  });
              }
            }}
          >
            {academicYears.map(year => (
              <MenuItem key={year} value={year}>
                {year}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel id="class-select-label">Class</InputLabel>
          <Select
            labelId="class-select-label"
            id="class-select"
            value={editedEvent.classId || ""}
            label="Class"
            onChange={(e: SelectChangeEvent) =>
              setEditedEvent({
                ...editedEvent,
                classId: e.target.value,
              })
            }
            disabled={!editedEvent.academicYear} // Disable until academic year is selected
          >
            {/* Filter the classes based on the selected academic year */}
            {allClasses
              .filter(classData => classData.academicYear === editedEvent.academicYear)
              .map(classData => (
                <MenuItem
                  key={classData.classId}
                  value={classData.classId.toString()}
                >
                  {classData.className}
                </MenuItem>
              ))}
          </Select>
        </FormControl>

        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel id="subject-select-label">Subject</InputLabel>
          <Select
            labelId="subject-select-label"
            id="subject-select"
            value={editedEvent.subjectId ? String(editedEvent.subjectId) : ""}
            label="Subject"
            onChange={(e: SelectChangeEvent) => {
              const subjectId = Number(e.target.value);
              setEditedEvent({
                ...editedEvent,
                subjectId: subjectId,
              });

              // Fetch teachers for this subject
              if (subjectId) {
                fetchTeachersBySubject(subjectId);
              }
            }}
          >
            {subjectState.map(subject => (
              <MenuItem key={subject.subjectId} value={subject.subjectId}>
                {subject.subjectName}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          type="date"
          label="Date"
          value={moment(editedEvent.scheduleDate || new Date()).format("YYYY-MM-DD")}
          onChange={(e) => {
            const selectedDate = new Date(e.target.value);
            
            setEditedEvent({
              ...editedEvent,
              scheduleDate: selectedDate,
            });
            
            const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            const dayOfWeek = days[selectedDate.getDay()];
            
            setSlotInfo(prevSlotInfo => ({
              ...prevSlotInfo,
              dayOfWeek: dayOfWeek,
            }));
          }}
          fullWidth
          margin="normal"
          InputLabelProps={{ shrink: true }}
        />

        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel id="slot-select-label">Slot</InputLabel>
          <Select
            labelId="slot-select-label"
            id="slot-select"
            value={editedEvent.slotId ? String(editedEvent.slotId) : ""}
            label="Slot"
            onChange={(e: SelectChangeEvent) => {
              const selectedSlot = e.target.value;
              setEditedEvent({
                ...editedEvent,
                slotId: selectedSlot,
              });
              
              const isExtraSlot = Number(selectedSlot) === 11;
              
              const slotDetails = slotConfig.find(slot => slot.slotNumber === Number(selectedSlot));
              if (slotDetails) {
                setSlotInfo({
                  dayOfWeek: slotInfo.dayOfWeek,
                  startTime: slotDetails.startTime,
                  endTime: slotDetails.endTime,
                  isExtraSlot: !!slotDetails.isExtra
                });
                
                if (editedEvent) {
                  setEditedEvent({
                    ...editedEvent,
                    customStartTime: slotDetails.startTime,
                    customEndTime: slotDetails.endTime
                  });
                }
              }
            }}
          >
            {slotConfig.map(slot => (
              <MenuItem key={slot.slotNumber} value={slot.slotNumber}>
                {slot.isExtra ? "Slot Extra (Custom)" : `Slot ${slot.slotNumber}`}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Box sx={{ mt: 2, mb: 2, p: 2, bgcolor: '#f9f9f9', borderRadius: 1, border: '1px solid #eaeaea' }}>
          <TextField
            label="Day of Week"
            value={slotInfo.dayOfWeek || ""}
            fullWidth
            margin="dense"
            disabled
            InputProps={{
              readOnly: true,
              sx: { 
                backgroundColor: 'white',
                '&.Mui-disabled': {
                  color: '#1976d2',
                  fontWeight: 500,
                  opacity: 0.9
                }
              }
            }}
            sx={{ mb: 2 }}
          />
          
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              label="Start Time"
              value={slotInfo.startTime || ""}
              fullWidth
              margin="dense"
              disabled={!slotInfo.isExtraSlot}
              type={slotInfo.isExtraSlot ? "time" : "text"}
              InputProps={{
                readOnly: !slotInfo.isExtraSlot,
                sx: { 
                  backgroundColor: 'white',
                  '&.Mui-disabled': {
                    color: '#1976d2',
                    fontWeight: 500,
                    opacity: 0.9
                  }
                }
              }}
              inputProps={{
                step: 300,
                format: "24h"
              }}
              onChange={(e) => {
                if (slotInfo.isExtraSlot && editedEvent) {
                  setSlotInfo(prevSlotInfo => ({
                    ...prevSlotInfo,
                    startTime: e.target.value,
                  }));
                  
                  setEditedEvent({
                    ...editedEvent,
                    customStartTime: e.target.value
                  });
                }
              }}
            />
            <TextField
              label="End Time"
              value={slotInfo.endTime || ""}
              fullWidth
              margin="dense"
              disabled={!slotInfo.isExtraSlot}
              type={slotInfo.isExtraSlot ? "time" : "text"}
              InputProps={{
                readOnly: !slotInfo.isExtraSlot,
                sx: { 
                  backgroundColor: 'white',
                  '&.Mui-disabled': {
                    color: '#1976d2',
                    fontWeight: 500,
                    opacity: 0.9
                  }
                }
              }}
              inputProps={{
                step: 300,
                format: "24h"
              }}
              onChange={(e) => {
                if (slotInfo.isExtraSlot && editedEvent) {
                  setSlotInfo(prevSlotInfo => ({
                    ...prevSlotInfo,
                    endTime: e.target.value,
                  }));
                  
                  setEditedEvent({
                    ...editedEvent,
                    customEndTime: e.target.value
                  });
                }
              }}
            />
          </Box>
          {slotInfo.isExtraSlot && (
            <Typography variant="caption" sx={{ display: 'block', mt: 1, color: 'text.secondary' }}>
              Please specify custom start and end times for this extra slot
            </Typography>
          )}
        </Box>

        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel id="classroom-select-label">Classroom</InputLabel>
          <Select
            labelId="classroom-select-label"
            id="classroom-select"
            value={String(editedEvent.classroomNumber || "")}
            label="Classroom"
            onChange={(e: SelectChangeEvent) =>
              setEditedEvent({
                ...editedEvent,
                classroomNumber: e.target.value,
              })
            }
          >
            {classrooms.map(room => (
              <MenuItem key={room.classroomId} value={room.classroomId}>
                {room.classroomName}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel id="teacher-select-label">Teacher</InputLabel>
          <Select
            labelId="teacher-select-label"
            id="teacher-select"
            value={editedEvent.teacher || ""}
            label="Teacher"
            onChange={(e: SelectChangeEvent) =>
              setEditedEvent({ ...editedEvent, teacher: e.target.value })
            }
          >
            {(directTeachers.length > 0
              ? directTeachers
              : teachers
            ).map(teacher => (
              <MenuItem key={teacher.userId} value={teacher.userId}>
                {teacher.fullName} - {teacher.userId}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </DialogContent>
      <DialogActions>
        <Button 
          onClick={() => {
            // For extra slot, ensure we have valid times
            if (editedEvent.slotId === "11" && (!slotInfo.startTime || !slotInfo.endTime)) {
              alert("Please specify both start and end times for the extra slot");
              return;
            }
            
            // Create a copy of the editedEvent with custom times if needed
            const eventToUpdate = {...editedEvent};
            if (slotInfo.isExtraSlot) {
              eventToUpdate.customStartTime = slotInfo.startTime;
              eventToUpdate.customEndTime = slotInfo.endTime;
            }
            
            onSave(eventToUpdate);
          }} 
          variant="contained"
        >
          Save Changes
        </Button>
        <Button
          variant="contained"
          color="secondary"
          onClick={() => {
            onClose(); // Đóng dialog trước
            onViewAttendance(editedEvent.id);
          }}
        >
          View Attendance
        </Button>
        <Button
          variant="outlined"
          onClick={onClose}
        >
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditScheduleDialog; 