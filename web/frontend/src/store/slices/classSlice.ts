// classSlice.ts
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "../../services/axiosInstance";
import { showLoading, hideLoading } from "./loadingSlice";
import { addNotify } from "./notifySlice";
import {
  ClassData,
  SearchClassFilters,
} from "../../model/classModels/classModels.model";

interface ClassState {
  classes: ClassData[] | null;       // kết quả sau khi search/filter
  allClasses: ClassData[] | null;    // tất cả class fetch từ server
  loading: boolean;
  error: string | null;
}

const initialState: ClassState = {
  classes: null,
  allClasses: null,
  loading: false,
  error: null,
};
export const fetchClasses = createAsyncThunk(
  "class/fetchClasses",
  async (_, thunkAPI) => {
    try {
      thunkAPI.dispatch(showLoading());
      const response = await axiosInstance.get("/classes");
      thunkAPI.dispatch(
        addNotify({
          type: "success",
          message: "Fetched all classes successfully",
          duration: 3000,
        })
      );
      const formattedData: ClassData[] = [];
      for (let e = 0; e < response.data.data.length; e++) {
        const element = response.data.data[e];
        formattedData.push({
          _id: element.classId,
          id: element.classId,
          className: element.className,
          grade: element.grade,
          homeroomTeacherd: element.homeroomTeacherId,
          createdAt: element.createdAt,
          updatedAt: element.updatedAt,
          academicYear: element.academicYear,
          batchId: element.batchId,
          name: element.className,
        });
      }
      return formattedData;
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

export const searchClassById = createAsyncThunk(
  "class/searchClassById",
  async (classId: string, thunkAPI) => {
    try {
      thunkAPI.dispatch(showLoading());
      const response = await axiosInstance.get(`/classes/${classId}`);
      thunkAPI.dispatch(
        addNotify({
          type: "success",
          message: "Fetched class by ID successfully",
          duration: 3000,
        })
      );

      const element = response.data.data;
      const formattedClass: ClassData = {
        _id: element.classId,
        id: element.classId,
        className: element.className,
        grade: element.grade,
        homeroomTeacherd: element.homeroomTeacherId,
        createdAt: element.createdAt,
        updatedAt: element.updatedAt,
        academicYear: element.academicYear,
        batchId: element.batchId,
        name: element.className,
      };

      return [formattedClass]; // return as array to be consistent with `classes` type
    } catch (error: any) {
      thunkAPI.dispatch(
        addNotify({
          type: "error",
          message: "Failed to fetch class by ID",
          duration: 3000,
        })
      );
      return thunkAPI.rejectWithValue(error.message);
    } finally {
      thunkAPI.dispatch(hideLoading());
    }
  }
);

export const searchClasses = createAsyncThunk(
  "class/searchClasses",
  async (filters: SearchClassFilters, thunkAPI) => {
    try {
      thunkAPI.dispatch(showLoading());
      const params = new URLSearchParams();
      if (filters.search) params.append("search", filters.search);
      if (filters.grade) params.append("grade", filters.grade);
      if (filters.homeroomTeacherd)
        params.append("homeroomTeacherd", filters.homeroomTeacherd);
      if (filters.academicYear)
        params.append("academicYear", filters.academicYear);

      const response = await axiosInstance.get(`/classes?${params.toString()}`);
      thunkAPI.dispatch(
        addNotify({
          type: "success",
          message: "Searched classes successfully",
          duration: 3000,
        })
      );

      const formattedData: ClassData[] = response.data.data.map(
        (element: any) => ({
          _id: element.classId,
          id: element.classId,
          className: element.className,
          grade: element.grade,
          homeroomTeacherd: element.homeroomTeacherId,
          createdAt: element.createdAt,
          updatedAt: element.updatedAt,
          academicYear: element.academicYear,
          batchId: element.batchId,
          name: element.className,
        })
      );

      return formattedData;
    } catch (error: any) {
      thunkAPI.dispatch(
        addNotify({
          type: "error",
          message: "Failed to search classes",
          duration: 3000,
        })
      );
      return thunkAPI.rejectWithValue(error.message);
    } finally {
      thunkAPI.dispatch(hideLoading());
    }
  }
);

const classSlice = createSlice({
  name: "class",
  initialState,
  reducers: {},
  extraReducers: builder => {
    builder
    .addCase(fetchClasses.fulfilled, (state, action) => {
      state.allClasses = action.payload;
      state.classes = action.payload; // hoặc null nếu muốn tách hoàn toàn
      state.loading = false;
      state.error = null;
    })
      .addCase(fetchClasses.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchClasses.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(searchClassById.fulfilled, (state, action) => {
        state.classes = action.payload;
        state.loading = false;
        state.error = null;
      })
      .addCase(searchClassById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(searchClassById.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(searchClasses.fulfilled, (state, action) => {
        state.classes = action.payload;
        state.loading = false;
        state.error = null;
      })
      .addCase(searchClasses.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(searchClasses.pending, state => {
        state.loading = true;
        state.error = null;
      });
  },
});

export default classSlice.reducer;
