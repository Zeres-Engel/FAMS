import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "../../services/axiosInstance";
import { showLoading, hideLoading } from "./loadingSlice";
import { addNotify } from "./notifySlice";

export interface Classroom {
  id: string;
  classroomId: number;
  classroomName: string;
  roomNumber: string;
  building: string;
  roomName: string;
  capacity: number;
  location: string;
  isActive: boolean;
}

interface ClassroomState {
  classrooms: Classroom[];
  loading: boolean;
  error: string | null;
}

const initialState: ClassroomState = {
  classrooms: [],
  loading: false,
  error: null,
};

export const fetchClassrooms = createAsyncThunk(
  "classroom/fetchClassrooms",
  async (_, thunkAPI) => {
    try {
      thunkAPI.dispatch(showLoading());
      const response = await axiosInstance.get("/classrooms");

      thunkAPI.dispatch(
        addNotify({
          type: "success",
          message: "Fetched classrooms successfully",
          duration: 3000,
        })
      );

      return response.data.data;
    } catch (error: any) {
      thunkAPI.dispatch(
        addNotify({
          type: "error",
          message: "Failed to fetch classrooms",
          duration: 3000,
        })
      );
      return thunkAPI.rejectWithValue(error.message);
    } finally {
      thunkAPI.dispatch(hideLoading());
    }
  }
);

const classroomSlice = createSlice({
  name: "classroom",
  initialState,
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(fetchClassrooms.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchClassrooms.fulfilled, (state, action) => {
        state.classrooms = action.payload;
        state.loading = false;
      })
      .addCase(fetchClassrooms.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export default classroomSlice.reducer;
