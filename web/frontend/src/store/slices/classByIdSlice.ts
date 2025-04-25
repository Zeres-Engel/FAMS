import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "../../services/axiosInstance";
import { showLoading, hideLoading } from "./loadingSlice";
import { addNotify } from "./notifySlice";

// Interface for each class item
export interface ClassById {
  classId: number;
  className: string;
  grade: number;
  homeroomTeacherId: string;
  academicYear: string;
  isActive: boolean;
  createdAt: string;
  id: string;
}

// State interface
interface ClassByIdState {
  classes: ClassById[];
  loading: boolean;
  error: string | null;
  role: string;
}

// Initial state
const initialState: ClassByIdState = {
  classes: [],
  loading: false,
  error: null,
  role: "",
};

// Thunk to fetch classes by user ID
export const fetchClassesByUserId = createAsyncThunk(
  "classById/fetchClassesByUserId",
  async (userId: string, thunkAPI) => {
    try {
      thunkAPI.dispatch(showLoading());
      const response = await axiosInstance.get(`/classes/user/${userId}`);

      thunkAPI.dispatch(
        addNotify({
          type: "success",
          message: "Fetched classes successfully",
          duration: 3000,
        })
      );

      return response.data;
    } catch (error: any) {
      thunkAPI.dispatch(
        addNotify({
          type: "error",
          message: "Failed to fetch classes",
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
const classByIdSlice = createSlice({
  name: "classById",
  initialState,
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(fetchClassesByUserId.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchClassesByUserId.fulfilled, (state, action) => {
        state.classes = action.payload.data;
        state.role = action.payload.role;
        state.loading = false;
      })
      .addCase(fetchClassesByUserId.rejected, (state, action) => {
        state.classes = []; // reset classes
        state.role = "";    // reset role
        state.loading = false;
        state.error = action.payload as string;
      });
  }  
});

export default classByIdSlice.reducer;
