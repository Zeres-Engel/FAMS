import React from "react";
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
} from "@mui/material";
import moment from "moment";
import { ScheduleEvent } from "../../../model/scheduleModels/scheduleModels.model";
import { slotConfig } from "../config/ScheduleConfig";

interface SlotInfo {
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  isExtraSlot: boolean;
}

interface AddScheduleDialogProps {
  open: boolean;
  onClose: () => void;
  newEvent: ScheduleEvent;
  setNewEvent: React.Dispatch<React.SetStateAction<ScheduleEvent>>;
  slotInfo: SlotInfo | null;
  setSlotInfo: React.Dispatch<React.SetStateAction<SlotInfo | null>>;
  academicYears: string[];
  allClasses: any[];
  subjectState: any[];
  classrooms: any[];
  directTeachers: { userId: string; fullName: string }[];
  teachers: any[];
  fetchAllTeachers: () => void;
  fetchClassesByAcademicYear: (year: string) => Promise<any>;
  addEvent: (event: ScheduleEvent) => Promise<ScheduleEvent>;
}

const AddScheduleDialog: React.FC<AddScheduleDialogProps> = ({
  open,
  onClose,
  newEvent,
  setNewEvent,
  slotInfo,
  setSlotInfo,
  academicYears,
  allClasses,
  subjectState,
  classrooms,
  directTeachers,
  teachers,
  fetchAllTeachers,
  fetchClassesByAcademicYear,
  addEvent,
}) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle>Add new Schedule</DialogTitle>
      <DialogContent dividers>
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel id="academic-year-select-label">
            Academic Year
          </InputLabel>
          <Select
            labelId="academic-year-select-label"
            id="academic-year-select"
            value={newEvent.academicYear || ""}
            label="Academic Year"
            onChange={(e: SelectChangeEvent) => {
              const selectedYear = e.target.value;
              setNewEvent({
                ...newEvent,
                academicYear: selectedYear,
                classId: "", // Reset class when year changes
              });

              // Fetch classes for this academic year
              if (selectedYear) {
                // Using the new method to fetch classes by academic year
                fetchClassesByAcademicYear(selectedYear)
                  .then(classes => {
                    console.log(`Loaded ${classes.length} classes for academic year ${selectedYear}`);
                    // No need to update state here, we'll filter in the render
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
            value={newEvent.classId || ""}
            label="Class"
            onChange={(e: SelectChangeEvent) =>
              setNewEvent({
                ...newEvent,
                classId: e.target.value,
              })
            }
            disabled={!newEvent.academicYear} // Disable until academic year is selected
          >
            {/* Filter the classes based on the selected academic year */}
            {allClasses
              .filter(classData => classData.academicYear === newEvent.academicYear)
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
            value={newEvent.subjectId ? String(newEvent.subjectId) : ""}
            label="Subject"
            onChange={(e: SelectChangeEvent) => {
              const subjectId = Number(e.target.value);
              setNewEvent({
                ...newEvent,
                subjectId: subjectId,
              });

              // Fetch teachers for this subject
              if (subjectId) {
                fetch(
                  `http://fams.io.vn/api-nodejs/schedules/teachers-by-subject/${subjectId}`,
                  {
                    method: "GET",
                    headers: {
                      "Content-Type": "application/json",
                    },
                  }
                )
                  .then(response => {
                    if (!response.ok) {
                      console.error(
                        "Teacher API by subject response not OK:",
                        response.status,
                        response.statusText
                      );
                      throw new Error(
                        `HTTP error! Status: ${response.status}`
                      );
                    }
                    return response.json();
                  })
                  .then(data => {
                    if (
                      data.success &&
                      data.data &&
                      data.data.length > 0
                    ) {
                      console.log(
                        "Loaded teachers for subject:",
                        data.data.length
                      );
                      // setDirectTeachers(data.data);
                    } else {
                      console.error(
                        "API returned success: false or empty data",
                        data
                      );
                      // Fallback to using all teachers
                      console.log("Falling back to all teachers");
                      if (teachers && teachers.length > 0) {
                        // setDirectTeachers(teachers);
                      } else {
                        fetchAllTeachers();
                      }
                    }
                  })
                  .catch(error => {
                    console.error(
                      "Error fetching teachers for subject:",
                      error
                    );
                    // Fallback to using all teachers
                    console.log(
                      "Error occurred, falling back to all teachers"
                    );
                    if (teachers && teachers.length > 0) {
                      // setDirectTeachers(teachers);
                    } else {
                      fetchAllTeachers();
                    }
                  });
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
          value={moment(newEvent.scheduleDate || new Date()).format(
            "YYYY-MM-DD"
          )}
          onChange={(e) => {
            const selectedDate = new Date(e.target.value);
            
            // Cập nhật ngày cho sự kiện mới
            setNewEvent({
              ...newEvent,
              scheduleDate: selectedDate,
            });
            
            // Xác định thứ trong tuần từ ngày đã chọn - dùng tiếng Anh
            const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            const dayOfWeek = days[selectedDate.getDay()];
            
            // Cập nhật thông tin slot với day of week mới ngay lập tức
            setSlotInfo(prevSlotInfo => {
              // Cung cấp các giá trị mặc định nếu prevSlotInfo là null
              const dayOfWeekValue = dayOfWeek;
              const startTime = prevSlotInfo?.startTime || "";
              const endTime = prevSlotInfo?.endTime || "";
              const isExtraSlot = prevSlotInfo?.isExtraSlot || false;
              
              // Trả về đối tượng mới với tất cả các trường bắt buộc
              return {
                dayOfWeek: dayOfWeekValue,
                startTime,
                endTime,
                isExtraSlot
              };
            });
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
            value={newEvent.slotId || ""}
            label="Slot"
            onChange={(e: SelectChangeEvent) => {
              const selectedSlot = e.target.value;
              setNewEvent({
                ...newEvent,
                slotId: selectedSlot,
              });
              
              // Kiểm tra xem có phải Slot Extra hay không
              const isExtraSlot = Number(selectedSlot) === 11;
              
              // Get slot info from configuration
              const slotDetails = slotConfig.find(slot => slot.slotNumber === Number(selectedSlot));
              if (slotDetails) {
                // Set slot info
                setSlotInfo({
                  dayOfWeek: slotInfo?.dayOfWeek || "",
                  startTime: slotDetails.startTime,
                  endTime: slotDetails.endTime,
                  isExtraSlot: !!slotDetails.isExtra
                });
                
                // Update customStartTime and customEndTime for all slots
                setNewEvent(prev => ({
                  ...prev,
                  customStartTime: slotDetails.startTime,
                  customEndTime: slotDetails.endTime
                }));
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
        {(newEvent.scheduleDate) && (
          <Box sx={{ mt: 2, mb: 2, p: 2, bgcolor: '#f9f9f9', borderRadius: 1, border: '1px solid #eaeaea' }}>
            <TextField
              label="Day of Week"
              value={slotInfo?.dayOfWeek || ""}
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
                value={slotInfo?.startTime || ""}
                fullWidth
                margin="dense"
                disabled={!slotInfo?.isExtraSlot}
                type={slotInfo?.isExtraSlot ? "time" : "text"}
                InputProps={{
                  readOnly: !slotInfo?.isExtraSlot,
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
                  step: 300, // 5 minutes step
                  format: "24h" // Sử dụng định dạng 24h
                }}
                onChange={(e) => {
                  if (slotInfo?.isExtraSlot) {
                    setSlotInfo(prevSlotInfo => {
                      // Đảm bảo tất cả các trường bắt buộc
                      return {
                        dayOfWeek: prevSlotInfo?.dayOfWeek || "",
                        startTime: e.target.value,
                        endTime: prevSlotInfo?.endTime || "",
                        isExtraSlot: prevSlotInfo?.isExtraSlot || false
                      };
                    });
                    
                    // Cập nhật giờ bắt đầu tùy chỉnh
                    setNewEvent({
                      ...newEvent,
                      customStartTime: e.target.value
                    });
                  }
                }}
              />
              <TextField
                label="End Time"
                value={slotInfo?.endTime || ""}
                fullWidth
                margin="dense"
                disabled={!slotInfo?.isExtraSlot}
                type={slotInfo?.isExtraSlot ? "time" : "text"}
                InputProps={{
                  readOnly: !slotInfo?.isExtraSlot,
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
                  step: 300, // 5 minutes step
                  format: "24h" // Sử dụng định dạng 24h
                }}
                onChange={(e) => {
                  if (slotInfo?.isExtraSlot) {
                    setSlotInfo(prevSlotInfo => {
                      // Đảm bảo tất cả các trường bắt buộc
                      return {
                        dayOfWeek: prevSlotInfo?.dayOfWeek || "",
                        startTime: prevSlotInfo?.startTime || "",
                        endTime: e.target.value,
                        isExtraSlot: prevSlotInfo?.isExtraSlot || false
                      };
                    });
                    
                    // Cập nhật giờ kết thúc tùy chỉnh
                    setNewEvent({
                      ...newEvent,
                      customEndTime: e.target.value
                    });
                  }
                }}
              />
            </Box>
            {slotInfo?.isExtraSlot && (
              <Typography variant="caption" sx={{ display: 'block', mt: 1, color: 'text.secondary' }}>
                Please specify custom start and end times for this extra slot
              </Typography>
            )}
          </Box>
        )}
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel id="classroom-select-label">Classroom</InputLabel>
          <Select
            labelId="classroom-select-label"
            id="classroom-select"
            value={String(newEvent.classroomNumber || "")}
            label="Classroom"
            onChange={(e: SelectChangeEvent) =>
              setNewEvent({
                ...newEvent,
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
          <InputLabel id="new-event-teacher-label">Teacher</InputLabel>
          <Select
            labelId="new-event-teacher-label"
            id="new-event-teacher"
            value={newEvent.teacher || ""}
            label="Teacher"
            onChange={(e: SelectChangeEvent) =>
              setNewEvent({ ...newEvent, teacher: e.target.value })
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
          variant="contained"
          onClick={async () => {
            // For extra slot, ensure we have valid times
            if (newEvent.slotId === "11" && (!slotInfo?.startTime || !slotInfo?.endTime)) {
              alert("Please specify both start and end times for the extra slot");
              return;
            }
            
            // Create a copy of the newEvent with custom times if needed
            const eventToAdd = {...newEvent};
            if (slotInfo?.isExtraSlot) {
              eventToAdd.customStartTime = slotInfo.startTime;
              eventToAdd.customEndTime = slotInfo.endTime;
            }
            
            try {
              // Sử dụng await để đợi thêm event xong
              const createdEvent = await addEvent(eventToAdd);
              
              if (createdEvent && createdEvent.id) {
                // Đóng dialog khi thêm thành công
                onClose();
                
                // Reset form
                setNewEvent({
                  id: 0,
                  subject: "",
                  subjectId: 0,
                  title: "",
                  start: new Date(),
                  end: new Date(),
                  teacher: "",
                  classroomNumber: "",
                  classId: "",
                  scheduleDate: new Date(),
                  slotId: "",
                  academicYear: "",
                });
              }
            } catch (error) {
              // Xử lý lỗi nếu có
              console.error("Lỗi khi tạo lịch học:", error);
              
              // Xử lý error.message một cách an toàn
              let errorMessage = "Unknown error";
              if (error instanceof Error) {
                errorMessage = error.message;
              } else if (typeof error === 'object' && error !== null && 'message' in error) {
                errorMessage = (error as { message: string }).message;
              } else if (typeof error === 'string') {
                errorMessage = error;
              }
              
              console.error(`Lỗi khi tạo lịch học: ${errorMessage}`);
            }
          }}
        >
          Add
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

export default AddScheduleDialog; 