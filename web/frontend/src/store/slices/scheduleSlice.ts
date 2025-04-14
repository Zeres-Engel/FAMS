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
  subjectId: string;
  teacherId: string;
  classroomId: string;
  weekNumber: number;
  dayNumber: number;
  sessionDate: string; // ISO string
  sessionWeek: string;
  slotId: string;
  dayOfWeek: string;
  startTime: string; // Format: "HH:mm"
  endTime: string;
  topic: string;
  subjectName: string;
  classroomNumber: string;

  // Các field phụ trợ cho calendar (Big Calendar)
  id?: number | string;  // ID cho calendar event
  title?: string;        // Title hiển thị
  start: Date | string;
  end: Date | string;
  subject?: string;
  teacher?: string;
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

const scheduleSlice = createSlice({
  name: "schedule",
  initialState,
  reducers: {},
  extraReducers: builder => {
    builder
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
      });
  },
});

export default scheduleSlice.reducer;
