import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "../../services/axiosInstance";
import { showLoading, hideLoading } from "./loadingSlice";
import { addNotify } from "./notifySlice";

export interface Teacher {
  userId: string;
  fullName: string;
}

interface TeacherState {
  teachers: Teacher[];
  loading: boolean;
  error: string | null;
}

const initialState: TeacherState = {
  teachers: [],
  loading: false,
  error: null,
};

export const searchTeachers = createAsyncThunk(
  "teacher/searchTeachers",
  async (
    {
      search = "",
      page = 1,
      limit = 100,
      isNotify = false
    }: { search?: string; page?: number; limit?: number, isNotify?:boolean },
    thunkAPI
  ) => {
    try {
      thunkAPI.dispatch(showLoading());
      const response = await axiosInstance.get(
        `/teachers/search?search=${search}&page=${page}&limit=${limit}`
      );
      if(!isNotify){
      thunkAPI.dispatch(
        addNotify({
          type: "success",
          message: "Fetched teachers successfully",
          duration: 3000,
        })
      );
    }
      return response.data.data as Teacher[];
    } catch (error: any) {
      thunkAPI.dispatch(
        addNotify({
          type: "error",
          message: "Failed to fetch teachers",
          duration: 3000,
        })
      );
      return thunkAPI.rejectWithValue(error.message);
    } finally {
      thunkAPI.dispatch(hideLoading());
    }
  }
);

const teacherSlice = createSlice({
  name: "teacher",
  initialState,
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(searchTeachers.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(searchTeachers.fulfilled, (state, action) => {
        state.teachers = action.payload;
        state.loading = false;
      })
      .addCase(searchTeachers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export default teacherSlice.reducer;
