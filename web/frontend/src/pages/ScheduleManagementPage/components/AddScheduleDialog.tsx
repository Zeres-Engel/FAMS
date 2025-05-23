import React, { useState, useEffect } from "react";
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
  FormHelperText,
  Autocomplete,
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

interface ClassData {
  _id?: string;
  className: string;
  grade?: number;
  homeroomTeacherId?: string;
  academicYear?: string;
  createdAt?: string;
  isActive?: boolean;
  classId: number;
  id?: string;
}

interface ClassOption {
  label: string;
  value: string;
  grade?: number;
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
  // Form validation state
  const [errors, setErrors] = useState({
    academicYear: false,
    classId: false,
    subjectId: false,
    teacher: false,
    classroomNumber: false,
    slotId: false,
    startTime: false,
    endTime: false,
    scheduleDate: false
  });
  
  // State để lưu danh sách lớp theo năm học
  const [classOptions, setClassOptions] = useState<ClassOption[]>([]);
  
  // Khởi tạo ngày và thời gian khi dialog mở
  useEffect(() => {
    if (open) {
      const today = new Date();
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const dayOfWeek = days[today.getDay()];
      
      // Format giờ hiện tại theo định dạng HH:MM
      const currentHour = today.getHours().toString().padStart(2, '0');
      const currentMinute = today.getMinutes().toString().padStart(2, '0');
      const currentTime = `${currentHour}:${currentMinute}`;
      
      // Ước tính thời gian kết thúc (1 giờ sau thời gian hiện tại)
      const endHour = (today.getHours() + 1).toString().padStart(2, '0');
      const endTime = `${endHour}:${currentMinute}`;
      
      console.log("[INIT DIALOG] Initializing with today's date and current time");
      
      // Cập nhật tất cả các giá trị mặc định khi dialog mở
      setNewEvent((prev: ScheduleEvent) => {
        const updatedEvent = {
          ...prev,
          scheduleDate: today,
          slotId: "11", // Mặc định chọn Slot Extra
          slotNumber: 11, // Đồng bộ slotNumber với slotId
          customStartTime: currentTime,
          customEndTime: endTime
        };
        console.log("[INIT DIALOG] Initial event data:", updatedEvent);
        return updatedEvent;
      });
      
      // Thiết lập thông tin slot ban đầu với Slot Extra
      const initialSlotInfo = {
        dayOfWeek: dayOfWeek,
        startTime: currentTime,
        endTime: endTime,
        isExtraSlot: true // Đặt là true để có thể chỉnh sửa thời gian ngay lập tức
      };
      console.log("[INIT DIALOG] Setting initial slot info:", initialSlotInfo);
      
      // Đảm bảo setSlotInfo hoàn thành trước khi component re-render
      setTimeout(() => {
        setSlotInfo(initialSlotInfo);
        console.log("[INIT DIALOG - AFTER TIMEOUT] SlotInfo initialized:", initialSlotInfo);
      }, 0);
      
      // Xóa lỗi liên quan đến slot và thời gian
      setErrors(prev => ({
        ...prev,
        slotId: false,
        startTime: false,
        endTime: false,
        scheduleDate: false
      }));
    }
  }, [open, setNewEvent, setSlotInfo]);

  // Log slot config để debug
  useEffect(() => {
    if (open) {
      console.log("Available slots in AddScheduleDialog:", slotConfig);
      console.log("Current slotInfo:", slotInfo);
      console.log("Current newEvent:", newEvent);
    }
  }, [open, slotInfo, newEvent]);
  
  // Validate all form fields
  const validateForm = () => {
    const newErrors = {
      academicYear: !newEvent.academicYear,
      classId: !newEvent.classId,
      subjectId: !newEvent.subjectId,
      teacher: !newEvent.teacher,
      classroomNumber: !newEvent.classroomNumber,
      slotId: !newEvent.slotId,
      startTime: newEvent.slotId === "11" && !slotInfo?.startTime,
      endTime: newEvent.slotId === "11" && !slotInfo?.endTime,
      scheduleDate: !newEvent.scheduleDate
    };
    
    setErrors(newErrors);
    
    // Return true if form is valid (no errors)
    return !Object.values(newErrors).some(error => error);
  };

  // Hàm xử lý khi thay đổi ngày
  const handleDateChange = (date: Date | null) => {
    if (date) {
      console.log("Date changed to:", date);
      
      // Lấy thứ trong tuần từ ngày đã chọn
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const dayOfWeek = days[date.getDay()];
      
      // Cập nhật ngày và thứ trong tuần
      setNewEvent({
        ...newEvent,
        scheduleDate: date
      });
      
      // Giữ nguyên thông tin start/end time hiện tại nếu đã có
      const currentStartTime = slotInfo?.startTime || "";
      const currentEndTime = slotInfo?.endTime || "";
      const isCurrentExtraSlot = slotInfo?.isExtraSlot || false;
      
      // Cập nhật thông tin slot với thứ trong tuần mới
      setSlotInfo({
        dayOfWeek: dayOfWeek,
        startTime: currentStartTime,
        endTime: currentEndTime,
        isExtraSlot: isCurrentExtraSlot
      });
      
      console.log("Updated slot info after date change:", {
        dayOfWeek,
        startTime: currentStartTime,
        endTime: currentEndTime,
        isExtraSlot: isCurrentExtraSlot
      });
    }
  };

  // Debug status của các input
  useEffect(() => {
    console.log("Current slotInfo in AddScheduleDialog:", {
      slotInfo,
      isExtraSlot: slotInfo?.isExtraSlot,
      timeFieldsDisabled: !(slotInfo?.isExtraSlot),
      slotId: newEvent.slotId,
      currentDate: newEvent.scheduleDate
    });
  }, [slotInfo, newEvent.slotId, newEvent.scheduleDate]);

  // Lấy danh sách lớp khi thay đổi academic year
  const loadClassesByAcademicYear = async (year: string) => {
    try {
      const classes = await fetchClassesByAcademicYear(year);
      console.log(`Loaded ${classes.length} classes for academic year ${year}`);
      
      // Chuyển đổi dữ liệu lớp thành options cho dropdown
      const options = classes.map((cls: ClassData) => ({
        label: cls.className,
        value: cls.classId.toString(),
        grade: cls.grade || 0
      }));
      
      // Sắp xếp các lớp theo thứ tự khối lớp từ cao xuống thấp
      const sortedOptions = options.sort((a: ClassOption, b: ClassOption) => {
        // Sắp xếp theo khối lớp (nếu có)
        if ('grade' in a && 'grade' in b) {
          return (b.grade ?? 0) - (a.grade ?? 0); // Sử dụng nullish coalescing để tránh undefined
        }
        // Nếu không có grade, sắp xếp theo tên
        return a.label.localeCompare(b.label);
      });
      
      setClassOptions(sortedOptions);
    } catch (error) {
      console.error("Error loading classes for academic year:", error);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle>Add new Schedule</DialogTitle>
      <DialogContent dividers>
        <FormControl fullWidth sx={{ mb: 3 }} error={errors.academicYear}>
          <InputLabel id="academic-year-select-label">
            Academic Year *
          </InputLabel>
          <Select
            labelId="academic-year-select-label"
            id="academic-year-select"
            value={newEvent.academicYear || ""}
            label="Academic Year *"
            onChange={(e: SelectChangeEvent) => {
              const selectedYear = e.target.value;
              setNewEvent({
                ...newEvent,
                academicYear: selectedYear,
                classId: "", // Reset class when year changes
              });
              
              // Clear validation error
              setErrors(prev => ({...prev, academicYear: false}));

              // Fetch classes for this academic year
              if (selectedYear) {
                loadClassesByAcademicYear(selectedYear);
              }
            }}
          >
            {academicYears.map((year: string) => (
              <MenuItem key={year} value={year}>
                {year}
              </MenuItem>
            ))}
          </Select>
          {errors.academicYear && <FormHelperText>Academic Year is required</FormHelperText>}
        </FormControl>

        <FormControl fullWidth sx={{ mb: 3 }} error={errors.classId}>
          <Autocomplete
            id="class-select-autocomplete"
            options={classOptions}
            getOptionLabel={(option: ClassOption) => option.label}
            value={classOptions.find(opt => opt.value === newEvent.classId) || null}
            onChange={(_event, newValue: ClassOption | null) => {
              setNewEvent({
                ...newEvent,
                classId: newValue?.value || "",
              });
              
              // Clear validation error
              setErrors(prev => ({...prev, classId: false}));
            }}
            disabled={!newEvent.academicYear} // Disable until academic year is selected
            renderInput={(params) => (
              <TextField 
                {...params} 
                label="Class *" 
                error={errors.classId}
                helperText={errors.classId ? "Class is required" : ""}
              />
            )}
          />
        </FormControl>

        <FormControl fullWidth sx={{ mb: 3 }} error={errors.subjectId}>
          <InputLabel id="subject-select-label">Subject *</InputLabel>
          <Select
            labelId="subject-select-label"
            id="subject-select"
            value={newEvent.subjectId ? String(newEvent.subjectId) : ""}
            label="Subject *"
            onChange={(e: SelectChangeEvent) => {
              const subjectId = Number(e.target.value);
              setNewEvent({
                ...newEvent,
                subjectId: subjectId,
              });
              
              // Clear validation error
              setErrors(prev => ({...prev, subjectId: false}));

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
            {subjectState.map((subject: any) => (
              <MenuItem key={subject.subjectId} value={subject.subjectId}>
                {subject.subjectName}
              </MenuItem>
            ))}
          </Select>
          {errors.subjectId && <FormHelperText>Subject is required</FormHelperText>}
        </FormControl>
        <TextField
          label="Date"
          type="date"
          required
          fullWidth
          margin="normal"
          sx={{ mb: 2 }}
          value={newEvent.scheduleDate ? new Date(newEvent.scheduleDate).toISOString().split('T')[0] : ''}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            const dateValue = e.target.value;
            const date = dateValue ? new Date(dateValue) : null;
            handleDateChange(date);
          }}
          InputLabelProps={{ shrink: true }}
          error={!!errors.scheduleDate}
          helperText={errors.scheduleDate}
        />
        <FormControl fullWidth sx={{ mb: 3 }} error={errors.slotId}>
          <InputLabel id="slot-select-label">Slot *</InputLabel>
          <Select
            labelId="slot-select-label"
            id="slot-select"
            value={newEvent.slotId ? String(newEvent.slotId) : ""}
            label="Slot *"
            onChange={(e: SelectChangeEvent) => {
              const selectedSlot = e.target.value;
              console.log("Selected slot:", selectedSlot);
              
              // Clear validation errors
              setErrors(prev => ({
                ...prev, 
                slotId: false,
                startTime: false,
                endTime: false
              }));
              
              // Kiểm tra xem có phải Slot Extra hay không
              const slotNumber = Number(selectedSlot);
              const isExtraSlot = slotNumber === 11;
              console.log("[SELECT CHANGE] Is Extra Slot?", isExtraSlot);
              
              // QUAN TRỌNG: Luôn đặt giá trị isExtraSlot trong slotInfo dựa trên slot đã chọn
              const currentSlotInfo = slotInfo || { dayOfWeek: "", startTime: "", endTime: "", isExtraSlot: false };
              if (currentSlotInfo.isExtraSlot !== isExtraSlot) {
                console.log(`[SELECT CHANGE] Updating isExtraSlot from ${currentSlotInfo.isExtraSlot} to ${isExtraSlot}`);
              }
              
              // Tìm thông tin slot từ slotConfig
              const slotDetails = slotConfig.find(slot => slot.slotNumber === slotNumber);
              console.log("[SELECT CHANGE] Found slot details:", slotDetails);
              
              // Giữ lại giá trị ngày đã chọn
              const currentDate = newEvent.scheduleDate;
              console.log("[SELECT CHANGE] Current selected date (preserving):", currentDate);
              
              // Cập nhật slotId trong newEvent, giữ nguyên scheduleDate
              setNewEvent(prev => ({
                ...prev,
                slotId: selectedSlot,
                slotNumber: Number(selectedSlot), // Đồng bộ slotNumber với slotId
                scheduleDate: currentDate, // Giữ nguyên ngày đã chọn
              }));
              
              if (slotDetails) {
                // Lấy thứ trong tuần từ ngày đã chọn hoặc giữ nguyên giá trị hiện tại
                let dayOfWeekValue = currentSlotInfo.dayOfWeek || "";
                
                // Nếu có ngày, tính lại day of week từ ngày
                if (currentDate) {
                  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                  dayOfWeekValue = days[new Date(currentDate).getDay()];
                  console.log("[SELECT CHANGE] Recalculated day of week from date:", dayOfWeekValue);
                }
                
                if (isExtraSlot) {
                  // ĐẶC BIỆT XỬ LÝ CHO SLOT EXTRA
                  console.log("[SELECT CHANGE] Setting up Extra slot with current time");
                  
                  // Lấy giờ hiện tại cho Extra slot
                  const now = new Date();
                  const currentHour = now.getHours().toString().padStart(2, '0');
                  const currentMinute = now.getMinutes().toString().padStart(2, '0');
                  const currentTime = `${currentHour}:${currentMinute}`;
                  
                  // Ước tính thời gian kết thúc (1 giờ sau thời gian hiện tại)
                  const endHour = (now.getHours() + 1).toString().padStart(2, '0');
                  const endTime = `${endHour}:${currentMinute}`;
                  
                  // QUAN TRỌNG: Đặt isExtraSlot thành true
                  const updatedSlotInfo = {
                    dayOfWeek: dayOfWeekValue,
                    startTime: currentTime,
                    endTime: endTime,
                    isExtraSlot: true // Luôn đặt true cho Slot Extra
                  };
                  console.log("[SELECT CHANGE] Setting slot info for Extra slot:", updatedSlotInfo);
                  
                  // ĐẢM BẢO setSlotInfo được gọi trước khi component re-render
                  setTimeout(() => {
                    setSlotInfo(updatedSlotInfo);
                    console.log("[SELECT CHANGE - AFTER TIMEOUT] SlotInfo updated to:", updatedSlotInfo);
                  }, 0);
                  
                  // Set current time for custom input
                  setNewEvent(prev => ({
                    ...prev,
                    customStartTime: currentTime,
                    customEndTime: endTime,
                    scheduleDate: currentDate, // Bảo đảm ngày không bị mất
                  }));
                } else {
                  // XỬ LÝ CHO SLOT THƯỜNG
                  console.log("[SELECT CHANGE] Setting up regular slot with times:", slotDetails.startTime, slotDetails.endTime);
                  
                  // QUAN TRỌNG: Đặt isExtraSlot thành false
                  const updatedSlotInfo = {
                    dayOfWeek: dayOfWeekValue,
                    startTime: slotDetails.startTime,
                    endTime: slotDetails.endTime,
                    isExtraSlot: false // Luôn đặt false cho slot thường 
                  };
                  console.log("[SELECT CHANGE] Setting slot info for regular slot:", updatedSlotInfo);
                  setSlotInfo(updatedSlotInfo);
                  
                  // Update times for regular slot
                  setNewEvent(prev => ({
                    ...prev,
                    customStartTime: slotDetails.startTime,
                    customEndTime: slotDetails.endTime,
                    scheduleDate: currentDate, // Bảo đảm ngày không bị mất
                  }));
                }
              }
            }}
          >
            {slotConfig.map((slot: any) => (
              <MenuItem key={slot.slotNumber} value={slot.slotNumber}>
                {slot.isExtra ? "Slot Extra (Custom)" : `Slot ${slot.slotNumber}`}
              </MenuItem>
            ))}
          </Select>
          {errors.slotId && <FormHelperText>Slot is required</FormHelperText>}
        </FormControl>
        
        <Box sx={{ mt: 0, mb: 3, p: 2, bgcolor: '#f9f9f9', borderRadius: 1, border: '1px solid #eaeaea' }}>
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
              label="Start Time *"
              value={slotInfo?.startTime || ""}
              fullWidth
              margin="dense"
              disabled={Number(newEvent.slotId) !== 11}
              type="time"
              InputProps={{
                readOnly: Number(newEvent.slotId) !== 11,
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
              }}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                const newStartTime = e.target.value;
                console.log("New start time:", newStartTime);
                
                // Clear validation error
                setErrors(prev => ({...prev, startTime: false}));
                
                // Kiểm tra trực tiếp nếu đang ở Slot Extra
                const isCurrentlyExtraSlot = Number(newEvent.slotId) === 11;
                console.log("isCurrentlyExtraSlot when changing start time:", isCurrentlyExtraSlot);
                
                if (isCurrentlyExtraSlot) {
                  setSlotInfo(prevSlotInfo => {
                    // Đảm bảo tất cả các trường bắt buộc
                    return {
                      dayOfWeek: prevSlotInfo?.dayOfWeek || "",
                      startTime: newStartTime,
                      endTime: prevSlotInfo?.endTime || "",
                      isExtraSlot: true
                    };
                  });
                  
                  // Cập nhật giờ bắt đầu tùy chỉnh
                  setNewEvent(prev => ({
                    ...prev,
                    customStartTime: newStartTime,
                    scheduleDate: prev.scheduleDate // Bảo tồn ngày đã chọn
                  }));
                }
              }}
              error={errors.startTime}
              helperText={errors.startTime ? "Start time is required" : ""}
            />
            <TextField
              label="End Time *"
              value={slotInfo?.endTime || ""}
              fullWidth
              margin="dense"
              disabled={Number(newEvent.slotId) !== 11}
              type="time"
              InputProps={{
                readOnly: Number(newEvent.slotId) !== 11,
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
              }}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                const newEndTime = e.target.value;
                console.log("New end time:", newEndTime);
                
                // Clear validation error
                setErrors(prev => ({...prev, endTime: false}));
                
                // Kiểm tra trực tiếp nếu đang ở Slot Extra
                const isCurrentlyExtraSlot = Number(newEvent.slotId) === 11;
                console.log("isCurrentlyExtraSlot when changing end time:", isCurrentlyExtraSlot);
                
                if (isCurrentlyExtraSlot) {
                  setSlotInfo(prevSlotInfo => {
                    // Đảm bảo tất cả các trường bắt buộc
                    return {
                      dayOfWeek: prevSlotInfo?.dayOfWeek || "",
                      startTime: prevSlotInfo?.startTime || "",
                      endTime: newEndTime,
                      isExtraSlot: true
                    };
                  });
                  
                  // Cập nhật giờ kết thúc tùy chỉnh
                  setNewEvent(prev => ({
                    ...prev,
                    customEndTime: newEndTime,
                    scheduleDate: prev.scheduleDate // Bảo tồn ngày đã chọn
                  }));
                }
              }}
              error={errors.endTime}
              helperText={errors.endTime ? "End time is required" : ""}
            />
          </Box>
          {slotInfo?.isExtraSlot && (
            <Typography variant="caption" sx={{ display: 'block', mt: 1, color: 'text.secondary' }}>
              Please specify custom start and end times for this extra slot
            </Typography>
          )}
        </Box>
        
        <FormControl fullWidth sx={{ mb: 3 }} error={errors.classroomNumber}>
          <InputLabel id="classroom-select-label">Classroom *</InputLabel>
          <Select
            labelId="classroom-select-label"
            id="classroom-select"
            value={String(newEvent.classroomNumber || "")}
            label="Classroom *"
            onChange={(e: SelectChangeEvent) => {
              setNewEvent({
                ...newEvent,
                classroomNumber: e.target.value,
              });
              
              // Clear validation error
              setErrors(prev => ({...prev, classroomNumber: false}));
            }}
          >
            {classrooms.map((room: any) => (
              <MenuItem key={room.classroomId} value={room.classroomId}>
                {room.classroomName}
              </MenuItem>
            ))}
          </Select>
          {errors.classroomNumber && <FormHelperText>Classroom is required</FormHelperText>}
        </FormControl>
        <FormControl fullWidth sx={{ mb: 3 }} error={errors.teacher}>
          <InputLabel id="new-event-teacher-label">Teacher *</InputLabel>
          <Select
            labelId="new-event-teacher-label"
            id="new-event-teacher"
            value={newEvent.teacher || ""}
            label="Teacher *"
            onChange={(e: SelectChangeEvent) => {
              setNewEvent({ ...newEvent, teacher: e.target.value });
              
              // Clear validation error
              setErrors(prev => ({...prev, teacher: false}));
            }}
          >
            {(directTeachers.length > 0
              ? directTeachers
              : teachers
            ).map((teacher: any) => (
              <MenuItem key={teacher.userId} value={teacher.userId}>
                {teacher.fullName} - {teacher.userId}
              </MenuItem>
            ))}
          </Select>
          {errors.teacher && <FormHelperText>Teacher is required</FormHelperText>}
        </FormControl>
      </DialogContent>
      <DialogActions>
        <Button
          variant="contained"
          onClick={async () => {
            // Validate all form fields
            if (!validateForm()) {
              alert("Please fill in all required fields");
              return;
            }
            
            console.log("Submitting form with data:", newEvent);
            console.log("Slot info:", slotInfo);
            
            // Create a copy of the newEvent with custom times if needed
            const eventToAdd = {...newEvent};
            
            // Đảm bảo ngày được cài đặt chính xác
            if (!eventToAdd.scheduleDate) {
              console.error("Missing schedule date, using today as fallback");
              eventToAdd.scheduleDate = new Date();
            }
            
            // Đảm bảo thời gian được cài đặt chính xác dựa vào loại slot
            if (slotInfo?.isExtraSlot) {
              console.log("Using custom time for Extra slot");
              eventToAdd.customStartTime = slotInfo.startTime;
              eventToAdd.customEndTime = slotInfo.endTime;
            } else if (slotInfo) {
              // Đối với slot thường, sử dụng thời gian từ cấu hình
              console.log("Using predefined time for regular slot");
              eventToAdd.customStartTime = slotInfo.startTime;
              eventToAdd.customEndTime = slotInfo.endTime;
            }
            
            console.log("Final event data to submit:", eventToAdd);
            
            try {
              // Sử dụng await để đợi thêm event xong
              const createdEvent = await addEvent(eventToAdd);
              
              if (createdEvent && createdEvent.id) {
                console.log("Event created successfully:", createdEvent);
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
              console.error("Error adding event:", error);
              // Display error to user
              alert(`Failed to create schedule: ${error}`);
            }
          }}
          sx={{ fontWeight: 'normal', textTransform: 'none' }}
        >
          Add
        </Button>
        <Button variant="outlined" onClick={onClose}>
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddScheduleDialog; 