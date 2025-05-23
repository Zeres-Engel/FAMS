import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "../../services/axiosInstance";
import { showLoading, hideLoading } from "./loadingSlice";
import { addNotify } from "./notifySlice";
import { AttendanceSearchParam } from "../../model/tableModels/tableDataModels.model";

// Interface cho mỗi attendance
export interface AttendanceResponse {
  attendanceId: number;
  scheduleId: number;
  avatar: string;
  checkInFace: string;
  userId: number;
  checkIn: string;
  note: string;
  status: string;
  studentName?: string;
  teacherName?: string;
  subjectName?:string;
  slotNumber?:string;
}

// State interface
interface AttendanceState {
  attendances: AttendanceResponse[];
  loading: boolean;
  error: string | null;
}

const initialState: AttendanceState = {
  attendances: [],
  loading: false,
  error: null,
};

// Thunk để fetch attendance theo userId
export const fetchAttendanceByUser = createAsyncThunk(
  "attendance/fetchByUser",
  async (
    {
      userId,
      subjectId,
      classId,
      teacherName,
      status,
      date,
      slotNumber,
      dateFrom,
      dateTo,
      page = 1,
      limit = 330,
    }: AttendanceSearchParam,
    thunkAPI
  ) => {
    try {
      thunkAPI.dispatch(showLoading());
      const params = {
        subjectId,
        classId,
        teacherName,
        status,
        date,
        dateFrom,
        dateTo,
        slotNumber,
        page,
        limit,
      };

      const response = await axiosInstance.get(`/attendance?userId=${userId}`, {
        params,
      });
      // const formattedData: AttendanceResponse[] = [];
      // for (let e = 0; e < response.data.data.length; e++) {
      //   const element = response.data.data[e];
      //   formattedData.push({
      //     attendanceId: element.attendanceId,
      //     scheduleId: element.scheduleId,
      //     avatar: element?.user.avatar,
      //     checkInFace: element.checkInFace,
      //     userId: element.userId,
      //     checkIn: element.checkIn,
      //     note: element.note,
      //     status: element.status,
      //     studentName:element.studentName,
      //     teacherName:element.teacherName
      //   });
      // }
      thunkAPI.dispatch(
        addNotify({
          type: "success",
          message: "Fetch Attendance data successfully",
          duration: 3000,
        })
      );

      return response.data;
    } catch (error: any) {
      thunkAPI.dispatch(
        addNotify({
          type: "error",
          message: "Failed to fetch Attendance data ",
          duration: 3000,
        })
      );
      return thunkAPI.rejectWithValue(error.message);
    } finally {
      thunkAPI.dispatch(hideLoading());
    }
  }
);
export const editAttendance = createAsyncThunk(
  "attendance/edit",
  async (
    {
      userId,
      scheduleId,
      status,
      note,
      checkInFace,
    }: {
      userId: string;
      scheduleId: number;
      status: string;
      note:string;
      checkInFace: string;
    },
    thunkAPI
  ) => {
    try {
      thunkAPI.dispatch(showLoading());

      const response = await axiosInstance.put(`/attendance/check-in`, {
        userId,
        scheduleId,
        status,
        note,
        checkInFace,
      });

      thunkAPI.dispatch(
        addNotify({
          type: "success",
          message: "Update attendance successfully",
          duration: 3000,
        })
      );

      return response.data;
    } catch (error: any) {
      thunkAPI.dispatch(
        addNotify({
          type: "error",
          message: "Failed to update attendance",
          duration: 3000,
        })
      );
      return thunkAPI.rejectWithValue(error.message);
    } finally {
      thunkAPI.dispatch(hideLoading());
    }
  }
);
// Slice
const attendanceSlice = createSlice({
  name: "attendance",
  initialState,
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(fetchAttendanceByUser.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAttendanceByUser.fulfilled, (state, action) => {
        state.attendances = action.payload.data;
        state.loading = false;
      })
      .addCase(fetchAttendanceByUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // 🔽 Thêm editAttendance cases
      .addCase(editAttendance.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(editAttendance.fulfilled, (state, action) => {
        const updated = action.payload.data;
        const index = state.attendances.findIndex(
          att =>
            att.userId.toString() === updated.userId.toString() &&
            att.scheduleId === updated.scheduleId
        );
        if (index !== -1) {
          state.attendances[index] = {
            ...state.attendances[index],
            ...updated,
          };
        }
        state.loading = false;
      })
      .addCase(editAttendance.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export default attendanceSlice.reducer;
