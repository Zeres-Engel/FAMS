import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "../../services/axiosInstance";
import { showLoading, hideLoading } from "./loadingSlice";
import { addNotify } from "./notifySlice";

export interface Subject {
  id: string;
  subjectId: number;
  subjectName: string;
  description: string;
  isActive: boolean;
}

interface SubjectState {
  subjects: Subject[];
  loading: boolean;
  error: string | null;
}

const initialState: SubjectState = {
  subjects: [],
  loading: false,
  error: null,
};

export const fetchSubjects = createAsyncThunk(
  "subject/fetchSubjects",
  async (_, thunkAPI) => {
    try {
      thunkAPI.dispatch(showLoading());
      const response = await axiosInstance.get("/subjects");

      thunkAPI.dispatch(
        addNotify({
          type: "success",
          message: "Fetched subjects successfully",
          duration: 3000,
        })
      );

      return response.data.data;
    } catch (error: any) {
      thunkAPI.dispatch(
        addNotify({
          type: "error",
          message: "Failed to fetch subjects",
          duration: 3000,
        })
      );
      return thunkAPI.rejectWithValue(error.message);
    } finally {
      thunkAPI.dispatch(hideLoading());
    }
  }
);

const subjectSlice = createSlice({
  name: "subject",
  initialState,
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(fetchSubjects.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSubjects.fulfilled, (state, action) => {
        state.subjects = action.payload;
        state.loading = false;
      })
      .addCase(fetchSubjects.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export default subjectSlice.reducer;
