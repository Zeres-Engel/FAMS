// scheduleSlice.ts
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "../../services/axiosInstance";
import { showLoading, hideLoading } from "./loadingSlice";
import { addNotify } from "./notifySlice";

// Định nghĩa kiểu dữ liệu Schedule (bạn có thể điều chỉnh nếu cần chi tiết hơn)
export interface Schedule {
  scheduleId: string;
  semesterId: string | null;
  classId: number;
  subjectId: number;
  teacherId: string;
  classroomId: number;
  weekNumber: number;
  dayNumber: number;
  sessionDate: string; // ISO string
  sessionWeek: string;
  SlotID: string;
  dayOfWeek: string;
  startTime: string; // Format: "HH:mm"
  endTime: string;
  topic: string;
  subjectName: string;
  classroomNumber: string;

  // Các field phụ trợ cho calendar (Big Calendar)
  id?: number | string; // ID cho calendar event
  title?: string; // Title hiển thị
  start: Date | string;
  end: Date | string;
  subject?: string;
  teacher?: string;
  teacherUserId?: string;

}

export interface ScheduleAction {
  scheduleId?: string;      
  semesterId?: string;      
  semesterNumber?: string;  
  classId?: string;    
  subjectId?: number;       
  teacherId?: string;      
  classroomId?: number;    
  slotId?: string;         
  topic?: string;           
  sessionDate?: string;     
  isActive?: boolean;       
}
export interface ScheduleFilters {
  className?: string;
  userId?: string;
  teacherId?: string;
  classId?: string | number;
  subjectId?: string | number;
  fromDate: string;
  toDate: string;
  dayOfWeek?: string | number;
  slotId?: string | number;
  weekNumber?: string | number;
  semesterId?: string | number;
  studentId?: string;
}

interface ScheduleState {
  schedules: Schedule[];
  loading: boolean;
  error: string | null;
}

const initialState: ScheduleState = {
  schedules: [],
  loading: false,
  error: null,
};

export const fetchSchedules = createAsyncThunk(
  "schedule/fetchSchedules",
  async (filters: ScheduleFilters, thunkAPI) => {
    try {
      thunkAPI.dispatch(showLoading());

      const params = new URLSearchParams({
        className: filters.className ?? "",
        userId: filters.userId ?? "",
        teacherId: filters.teacherId ?? "",
        classId: filters.classId?.toString() ?? "",
        subjectId: filters.subjectId?.toString() ?? "",
        fromDate: filters.fromDate,
        toDate: filters.toDate,
        dayOfWeek: filters.dayOfWeek?.toString() ?? "",
        slotId: filters.slotId?.toString() ?? "",
        weekNumber: filters.weekNumber?.toString() ?? "",
        semesterId: filters.semesterId?.toString() ?? "",
        studentId: filters.studentId ?? "",
      }).toString();

      const response = await axiosInstance.get(`/schedules/all?${params}`);
      thunkAPI.dispatch(
        addNotify({
          type: "success",
          message: "Fetch schedule successful!",
          duration: 3000,
        })
      );
      return response.data.data; // Giả định API trả về mảng schedules
    } catch (error: any) {
      thunkAPI.dispatch(
        addNotify({
          type: "error",
          message: "Fetch schedule failed!",
          duration: 3000,
        })
      );
      return thunkAPI.rejectWithValue(error.message);
    } finally {
      thunkAPI.dispatch(hideLoading());
    }
  }
);
// Create Schedule Thunk
export const createSchedule = createAsyncThunk(
  "schedule/createSchedule",
  async (newSchedule: ScheduleAction, thunkAPI) => {
    try {
      thunkAPI.dispatch(showLoading());

      const response = await axiosInstance.post("/schedules", {
        semesterId: newSchedule.semesterId,
        semesterNumber: newSchedule.semesterNumber,
        classId: newSchedule.classId,
        subjectId: newSchedule.subjectId,
        teacherId: newSchedule.teacherId,
        classroomId: newSchedule.classroomId,
        slotId: newSchedule.slotId,
        topic: newSchedule.topic,
        sessionDate: newSchedule.sessionDate,
        isActive: true,
      });

      thunkAPI.dispatch(
        addNotify({
          type: "success",
          message: "Create schedule successful!",
          duration: 3000,
        })
      );

      return response.data; // Giả định API trả về dữ liệu lịch mới
    } catch (error: any) {
      thunkAPI.dispatch(
        addNotify({
          type: "error",
          message: "Create schedule failed!",
          duration: 3000,
        })
      );
      return thunkAPI.rejectWithValue(error.message);
    } finally {
      thunkAPI.dispatch(hideLoading());
    }
  }
);

// Update Schedule Thunk
export const updateSchedule = createAsyncThunk(
  "schedule/updateSchedule",
  async (updatedSchedule: ScheduleAction, thunkAPI) => {
    try {
      thunkAPI.dispatch(showLoading());

      const response = await axiosInstance.put(
        `/schedules/${updatedSchedule.scheduleId}`,
        {
          semesterId: updatedSchedule.semesterId,
          semesterNumber: updatedSchedule.semesterNumber,
          classId: updatedSchedule.classId,
          subjectId: updatedSchedule.subjectId,
          teacherId: updatedSchedule.teacherId,
          classroomId: updatedSchedule.classroomId,
          slotId: updatedSchedule.slotId,
          topic: updatedSchedule.topic,
          sessionDate: updatedSchedule.sessionDate,
          isActive: updatedSchedule.isActive,
        }
      );

      thunkAPI.dispatch(
        addNotify({
          type: "success",
          message: "Update schedule successful!",
          duration: 3000,
        })
      );

      return response.data; // Giả định API trả về dữ liệu lịch đã cập nhật
    } catch (error: any) {
      thunkAPI.dispatch(
        addNotify({
          type: "error",
          message: "Update schedule failed!",
          duration: 3000,
        })
      );
      return thunkAPI.rejectWithValue(error.message);
    } finally {
      thunkAPI.dispatch(hideLoading());
    }
  }
);

const scheduleSlice = createSlice({
  name: "schedule",
  initialState,
  reducers: {},
  extraReducers: builder => {
    builder
      // Fetch schedules
      .addCase(fetchSchedules.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSchedules.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        state.schedules = action.payload;
      })
      .addCase(fetchSchedules.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Create Schedule
      .addCase(createSchedule.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createSchedule.fulfilled, (state, action) => {
        state.loading = false;
        state.schedules.push(action.payload);
        state.error = null;
      })
      .addCase(createSchedule.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Update Schedule
      .addCase(updateSchedule.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateSchedule.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.schedules.findIndex(
          schedule => schedule.scheduleId === action.payload.scheduleId
        );
        if (index !== -1) {
          state.schedules[index] = action.payload;
        }
        state.error = null;
      })
      .addCase(updateSchedule.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export default scheduleSlice.reducer;
