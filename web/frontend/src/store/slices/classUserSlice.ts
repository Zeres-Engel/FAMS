import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "../../services/axiosInstance";
import { showLoading, hideLoading } from "./loadingSlice";
import { addNotify } from "./notifySlice";
import { ClassStudent } from "../../model/tableModels/tableDataModels.model";

interface ClassUserState {
  students: ClassStudent[];
  loading: boolean;
  error: string | null;
}

const initialState: ClassUserState = {
  students: [],
  loading: false,
  error: null,
};

export const getClassUsers = createAsyncThunk(
  "classUser/getClassUsers",
  async (classId: number, thunkAPI) => {
    try {
      thunkAPI.dispatch(showLoading());
      const response = await axiosInstance.get(`/classes/${classId}/students`);

      thunkAPI.dispatch(
        addNotify({
          type: "success",
          message: "Fetched student successfully",
          duration: 3000,
        })
      );

      return response.data.data  
    } catch (error: any) {
      thunkAPI.dispatch(
        addNotify({
          type: "error",
          message: "Fetched student failed",
          duration: 3000,
        })
      );
      return thunkAPI.rejectWithValue(error.message);
    } finally {
      thunkAPI.dispatch(hideLoading());
    }
  }
);

const classUserSlice = createSlice({
  name: "classUser",
  initialState,
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(getClassUsers.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getClassUsers.fulfilled, (state, action) => {
        state.students = action.payload;
        state.loading = false;
      })
      .addCase(getClassUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export default classUserSlice.reducer;
