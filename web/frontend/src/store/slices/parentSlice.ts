import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axiosInstance from "../../services/axiosInstance";

interface StudentInfo {
  studentId: string;
  fullName: string;
  classHistory: Array<{
    className: string;
    grade: number;
    academicYear: string;
  }>;
  email: string;
  phone: string;
  dateOfBirth: string;
}

export interface ParentProfile {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  dateOfBirth: string;
  gender: string;
  address: string;
  phone: string;
  role: string;
  avatarUrl: string;
  students: StudentInfo[];
}

interface ParentState {
  data: any;
  loading: boolean;
  error: string | null;
}

const initialState: ParentState = {
  data: null,
  loading: false,
  error: null,
};

export const fetchParentProfile = createAsyncThunk(
  "parent/fetchProfile",
  async (userId: string, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get(
        `/users/details/${userId}`
      );
      if (res.data.success && res.data.data) {
        return res.data.data as ParentProfile;
      }
      return rejectWithValue("No parent data found");
    } catch (err: any) {
      return rejectWithValue(err.message || "Failed to fetch parent profile");
    }
  }
);

const parentSlice = createSlice({
  name: "parent",
  initialState,
  reducers: {
    clearParentProfile(state) {
      state.data = null;
      state.error = null;
      state.loading = false;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(fetchParentProfile.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchParentProfile.fulfilled, (state, action: PayloadAction<ParentProfile>) => {
        state.data = action.payload;
        state.loading = false;
      })
      .addCase(fetchParentProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearParentProfile } = parentSlice.actions;
export default parentSlice.reducer;