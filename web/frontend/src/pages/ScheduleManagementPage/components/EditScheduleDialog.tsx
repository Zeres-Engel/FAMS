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
  Dialog as ConfirmDialog,
  DialogTitle as ConfirmDialogTitle,
  DialogContent as ConfirmDialogContent,
  DialogContentText,
  DialogActions as ConfirmDialogActions,
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
  onDelete: (scheduleId: number) => void;
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
  onDelete,
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
  
  // State cho confirm dialog khi xóa
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  // Mở confirm dialog khi nhấn nút Delete
  const handleDeleteClick = () => {
    setConfirmDeleteOpen(true);
  };

  // Đóng confirm dialog
  const handleCloseConfirmDelete = () => {
    setConfirmDeleteOpen(false);
  };

  // Xác nhận xóa và gọi API
  const handleConfirmDelete = () => {
    if (editedEvent && editedEvent.id) {
      console.log(`Confirming delete for schedule ID: ${editedEvent.id}`);
      onDelete(editedEvent.id);
      setConfirmDeleteOpen(false);
      onClose(); // Đóng dialog sau khi xác nhận xóa
    } else {
      console.error("Cannot delete: Missing schedule ID");
    }
  };

  // Tìm slot dựa trên startTime và endTime
  const findSlotFromTimes = (startTime: string, endTime: string): string => {
    // Tìm slot tương ứng từ slotConfig thay vì dùng SlotTimeMapping
    const matchedSlot = slotConfig.find(
      slot => slot.startTime === startTime && slot.endTime === endTime
    );
    
    // Nếu tìm thấy, trả về số slot
    if (matchedSlot) {
      return String(matchedSlot.slotNumber);
    }
    
    // Nếu không tìm thấy, đặt là slot extra (11)
    return "11";
  };

  useEffect(() => {
    if (event) {
      console.log("API Event data received:", JSON.stringify(event, null, 2));
      
      // Handle the case where event might come from the API with different field names
      const scheduleId = (event as any).scheduleId || event.id;
      const teacherId = (event as any).teacherUserId || (event as any).teacherId || event.teacher;
      const classroomId = (event as any).classroomId || (event as any).classroomNumber || event.classroomNumber;
      const sessionDate = (event as any).sessionDate || (event as any).SessionDate || event.scheduleDate;
      const startTimeVal = (event as any).startTime || event.customStartTime || "";
      const endTimeVal = (event as any).endTime || event.customEndTime || "";
      const dayOfWeekVal = (event as any).dayOfWeek || "";
      
      // Ưu tiên sử dụng slotNumber trực tiếp từ API
      let slotNumberVal = (event as any).slotNumber;
      
      // Nếu không có slotNumber, thử lấy từ slotId
      if (!slotNumberVal) {
        const apiSlotId = (event as any).slotId || (event as any).SlotID || event.slotId;
        slotNumberVal = apiSlotId;
      }
      
      // Nếu vẫn không có, tìm slot dựa trên thời gian
      if (!slotNumberVal && startTimeVal && endTimeVal) {
        const matchedSlot = slotConfig.find(
          slot => slot.startTime === startTimeVal && slot.endTime === endTimeVal
        );
        slotNumberVal = matchedSlot?.slotNumber || 11; // 11 là slot extra
      }
      
      console.log(`Resolved slot information: slotNumber=${slotNumberVal}, time=${startTimeVal}-${endTimeVal}`);
      
      // Explicitly check all possible keys for academicYear and classId from API
      let academicYearVal = "";
      if (typeof (event as any).academicYear === "string") {
        academicYearVal = (event as any).academicYear;
        console.log("Found academicYear in API:", academicYearVal);
      }
      
      let classIdVal = "";
      if ((event as any).classId !== undefined) {
        classIdVal = String((event as any).classId);
        console.log("Found classId in API:", classIdVal);
      }
      
      let classNameVal = (event as any).className || "";
      let subjectIdVal = (event as any).subjectId;
      
      console.log("Critical values extracted:", {
        scheduleId,
        academicYearVal,
        classIdVal,
        classNameVal,
        slotNumberVal,
        dayOfWeekVal,
        startTimeVal,
        endTimeVal
      });

      // Create the updated event object with explicitly set values
      const updatedEvent = {
        id: scheduleId,
        title: (event as any).title || (event as any).subject || "",
        start: new Date(),
        end: new Date(),
        subject: (event as any).subject || (event as any).subjectName || "",
        academicYear: academicYearVal,
        classId: classIdVal,
        subjectId: subjectIdVal,
        teacher: teacherId || "",
        classroomNumber: classroomId || "",
        scheduleDate: sessionDate ? new Date(sessionDate) : new Date(),
        slotId: String(slotNumberVal),
        customStartTime: startTimeVal,
        customEndTime: endTimeVal,
        className: classNameVal,
      };

      console.log("Setting editedEvent:", updatedEvent);
      setEditedEvent(updatedEvent);
      
      // Force update for class dropdown when academicYear is available
      if (academicYearVal) {
        fetchClassesByAcademicYear(academicYearVal)
          .then(classes => {
            console.log(`Loaded ${classes.length} classes for academic year ${academicYearVal}`);
          })
          .catch(error => {
            console.error("Error loading classes for academic year:", error);
          });
      }
      
      // Calculate day of week if not provided in API
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const scheduleDate = sessionDate ? new Date(sessionDate) : new Date();
      const calculatedDayOfWeek = days[scheduleDate.getDay()];
      
      // Find slot details
      const slotDetails = slotConfig.find(slot => slot.slotNumber === slotNumberVal);
      console.log("Slot details:", slotDetails);
      
      setSlotInfo({
        dayOfWeek: dayOfWeekVal || calculatedDayOfWeek,
        startTime: startTimeVal || (slotDetails?.startTime || ""),
        endTime: endTimeVal || (slotDetails?.endTime || ""),
        isExtraSlot: slotNumberVal === "11" || (slotDetails?.isExtra || false)
      });

      if (subjectIdVal) {
        fetchTeachersBySubject(subjectIdVal);
      }
    }
  }, [event, academicYears, allClasses]);

  useEffect(() => {
    if (editedEvent && open) {
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
        console.log("Falling back to all teachers");
        if (teachers && teachers.length > 0) {
          setDirectTeachers(teachers);
        }
      }
    } catch (error) {
      console.error("Error fetching teachers for subject:", error);
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

  const getClassNameFromId = (classId: string) => {
    const classObj = allClasses.find(c => String(c.classId) === String(classId));
    return classObj ? classObj.className : '';
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Edit Schedule</DialogTitle>
      <DialogContent dividers>
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel id="academic-year-select-label">Academic Year</InputLabel>
          <Select
            labelId="academic-year-select-label"
            id="academic-year-select"
            value={editedEvent?.academicYear || ""}
            label="Academic Year"
            onChange={(e: SelectChangeEvent) => {
              const selectedYear = e.target.value;
              console.log("Changing academicYear to:", selectedYear);
              setEditedEvent(prev => ({
                ...prev!,
                academicYear: selectedYear,
                classId: "",
              }));

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
            {(() => {
              // Debug output outside of JSX
              console.log("Academic Years in dropdown:", academicYears);
              console.log("Current selected academicYear:", editedEvent?.academicYear);
              
              // Prepare menu items
              const menuItems = [];
              
              // If academicYears array is empty, add the current value to ensure it's visible
              if (academicYears.length === 0 && editedEvent?.academicYear) {
                menuItems.push(
                  <MenuItem key={editedEvent.academicYear} value={editedEvent.academicYear}>
                    {editedEvent.academicYear}
                  </MenuItem>
                );
              }
              
              // Add all available academic years
              academicYears.forEach(year => {
                menuItems.push(
                  <MenuItem key={year} value={year}>
                    {year}
                  </MenuItem>
                );
              });
              
              return menuItems;
            })()}
          </Select>
        </FormControl>

        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel id="class-select-label">Class</InputLabel>
          <Select
            labelId="class-select-label"
            id="class-select"
            value={editedEvent?.classId || ""}
            label="Class"
            onChange={(e: SelectChangeEvent) => {
              console.log("Changing classId to:", e.target.value);
              setEditedEvent(prev => ({
                ...prev!,
                classId: e.target.value,
                className: getClassNameFromId(e.target.value),
              }))
            }}
            disabled={!editedEvent?.academicYear}
          >
            {(() => {
              // Debug output outside of JSX
              console.log("Classes filtered by academicYear:", 
                allClasses.filter(classData => classData.academicYear === editedEvent?.academicYear)
                  .map(c => ({id: c.classId, name: c.className})));
              console.log("Current selected classId:", editedEvent?.classId);
              
              // Prepare menu items
              const menuItems = [];
              
              // If no matching classes found but we have a classId, add current class to ensure it's visible
              if (allClasses.filter(classData => classData.academicYear === editedEvent?.academicYear).length === 0 && 
                 editedEvent?.classId && editedEvent?.className) {
                menuItems.push(
                  <MenuItem key={editedEvent.classId} value={editedEvent.classId.toString()}>
                    {editedEvent.className}
                  </MenuItem>
                );
              }
              
              // Add all available classes for selected academic year
              allClasses
                .filter(classData => classData.academicYear === editedEvent?.academicYear)
                .forEach(classData => {
                  menuItems.push(
                    <MenuItem
                      key={classData.classId}
                      value={classData.classId.toString()}
                    >
                      {classData.className}
                    </MenuItem>
                  );
                });
              
              return menuItems;
            })()}
          </Select>
        </FormControl>

        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel id="subject-select-label">Subject</InputLabel>
          <Select
            labelId="subject-select-label"
            id="subject-select"
            value={editedEvent?.subjectId ? String(editedEvent.subjectId) : ""}
            label="Subject"
            onChange={(e: SelectChangeEvent) => {
              const subjectId = Number(e.target.value);
              setEditedEvent(prev => ({
                ...prev!,
                subjectId: subjectId,
              }));

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
          value={moment(editedEvent?.scheduleDate || new Date()).format("YYYY-MM-DD")}
          onChange={(e) => {
            const selectedDate = new Date(e.target.value);
            
            setEditedEvent(prev => ({
              ...prev!,
              scheduleDate: selectedDate,
            }));
            
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
            value={editedEvent?.slotId ? String(editedEvent.slotId) : ""}
            label="Slot"
            onChange={(e: SelectChangeEvent) => {
              const selectedSlot = e.target.value;
              console.log("Changing slotId to:", selectedSlot);
              
              setEditedEvent({
                ...editedEvent,
                slotId: selectedSlot,
              });
              
              const isExtraSlot = Number(selectedSlot) === 11;
              
              const slotDetails = slotConfig.find(slot => slot.slotNumber === Number(selectedSlot));
              console.log("Selected slot details:", slotDetails);
              
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
                    slotId: selectedSlot,
                    customStartTime: slotDetails.startTime,
                    customEndTime: slotDetails.endTime
                  });
                }
              }
            }}
          >
            {(() => {
              // Debug output outside of JSX
              console.log("Available slots:", slotConfig.map(s => ({number: s.slotNumber, extra: s.isExtra})));
              console.log("Current selected slotId:", editedEvent?.slotId);
              
              // Prepare menu items
              const menuItems = [];
              
              // If no matching slot found but we have a slotId, add current slot to ensure it's visible
              if (!slotConfig.some(slot => String(slot.slotNumber) === String(editedEvent?.slotId)) && 
                  editedEvent?.slotId) {
                menuItems.push(
                  <MenuItem key={editedEvent.slotId} value={String(editedEvent.slotId)}>
                    {Number(editedEvent.slotId) === 11 ? "Slot Extra (Custom)" : `Slot ${editedEvent.slotId}`}
                  </MenuItem>
                );
              }
              
              // Add all available slots
              slotConfig.forEach(slot => {
                menuItems.push(
                  <MenuItem key={slot.slotNumber} value={slot.slotNumber}>
                    {slot.isExtra ? "Slot Extra (Custom)" : `Slot ${slot.slotNumber}`}
                  </MenuItem>
                );
              });
              
              return menuItems;
            })()}
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
          onClick={handleDeleteClick} 
          variant="outlined" 
          color="error"
          size="medium"
          sx={{ 
            marginRight: 'auto',
            textTransform: 'none',
            fontWeight: 400,
            fontSize: '0.875rem'
          }} 
        >
          Delete
        </Button>
        <Button 
          onClick={() => {
            if (editedEvent.slotId === "11" && (!slotInfo.startTime || !slotInfo.endTime)) {
              alert("Please specify both start and end times for the extra slot");
              return;
            }
            
            const eventToUpdate = {...editedEvent};
            if (slotInfo.isExtraSlot) {
              eventToUpdate.customStartTime = slotInfo.startTime;
              eventToUpdate.customEndTime = slotInfo.endTime;
            }
            
            if (eventToUpdate.classId) {
              eventToUpdate.className = getClassNameFromId(String(eventToUpdate.classId));
            }
            
            onSave(eventToUpdate);
          }} 
          variant="contained"
          size="medium"
          sx={{ textTransform: 'none', fontWeight: 500 }}
        >
          Save Changes
        </Button>
        <Button
          variant="contained"
          color="secondary"
          size="medium"
          sx={{ textTransform: 'none', fontWeight: 500 }}
          onClick={() => {
            onClose();
            onViewAttendance(editedEvent.id);
          }}
        >
          View Attendance
        </Button>
        <Button
          variant="outlined"
          size="medium"
          sx={{ textTransform: 'none', fontWeight: 400 }}
          onClick={onClose}
        >
          Cancel
        </Button>
      </DialogActions>

      {/* Confirm Dialog for Delete */}
      <ConfirmDialog
        open={confirmDeleteOpen}
        onClose={handleCloseConfirmDelete}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '8px'
          }
        }}
      >
        <ConfirmDialogTitle sx={{ 
          fontSize: '1.1rem', 
          fontWeight: 500,
          padding: '16px 24px'
        }}>
          Confirm Delete
        </ConfirmDialogTitle>
        <ConfirmDialogContent>
          <DialogContentText sx={{ 
            fontSize: '0.9rem',
            color: 'text.primary',
            lineHeight: 1.5
          }}>
            Are you sure you want to delete this schedule? This action cannot be undone.
            <Box sx={{ mt: 1, opacity: 0.8 }}>
              <Typography variant="body2" component="span" sx={{ fontWeight: 500 }}>
                Note:
              </Typography>{' '}
              All attendance logs associated with this schedule will also be deleted.
            </Box>
          </DialogContentText>
        </ConfirmDialogContent>
        <ConfirmDialogActions sx={{ padding: '16px 24px' }}>
          <Button 
            onClick={handleCloseConfirmDelete} 
            variant="outlined"
            size="medium"
            sx={{ textTransform: 'none', fontWeight: 400 }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleConfirmDelete} 
            variant="contained" 
            color="error"
            size="medium"
            sx={{ textTransform: 'none', fontWeight: 500 }}
          >
            Delete
          </Button>
        </ConfirmDialogActions>
      </ConfirmDialog>
    </Dialog>
  );
};

export default EditScheduleDialog;