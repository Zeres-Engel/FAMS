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
  classes: ClassData[] | null; // kết quả sau khi search/filter
  allClasses: ClassData[] | null; // tất cả class fetch từ server
  loading: boolean;
  error: string | null;
}
interface EditClassPayload {
  id: string;
  className: string;
  homeroomTeacherId: string;
  grade: string;
  academicYear: string;
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
          homeroomTeacherId: element.homeroomTeacherId,
          createdAt: element.createdAt,
          updatedAt: element.updatedAt,
          academicYear: element.academicYear,
          batchId: element.batchId,
          name: element.className,
          classId: element.classId,
          studentNumber: element.studentNumber?.toString() || "0",
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
export const deleteClass = createAsyncThunk(
  "class/deleteClass",
  async (classId: string, thunkAPI) => {
    try {
      thunkAPI.dispatch(showLoading());
      await axiosInstance.delete(`/classes/${classId}`);
      thunkAPI.dispatch(
        addNotify({
          type: "success",
          message: "Class deleted successfully",
          duration: 3000,
        })
      );
      thunkAPI.dispatch(fetchClasses());
      return classId;
    } catch (error: any) {
      thunkAPI.dispatch(
        addNotify({
          type: "error",
          message: error?.response?.data?.error || "Failed to delete class",
          duration: 3000,
        })
      );
      return thunkAPI.rejectWithValue(error.message);
    } finally {
      thunkAPI.dispatch(hideLoading());
    }
  }
);
export const createClass = createAsyncThunk(
  "class/createClass",
  async (
    newClass: {
      className: string;
      homeroomTeacherId: string;
      grade: string | number;
      academicYear: string;
    },
    thunkAPI
  ) => {
    try {
      thunkAPI.dispatch(showLoading());
      const response = await axiosInstance.post("/classes", newClass);
      thunkAPI.dispatch(
        addNotify({
          type: "success",
          message: "Class created successfully",
          duration: 3000,
        })
      );
      const responseData = {
        ...response.data.data,
        studentNumber: response.data.data.studentNumber?.toString() || "0"
      };
      return responseData;
    } catch (error: any) {
      console.log(error);

      thunkAPI.dispatch(
        addNotify({
          type: "error",
          message: error?.response?.data?.error || "Failed to create class",
          duration: 3000,
        })
      );
      return thunkAPI.rejectWithValue(error.message);
    } finally {
      thunkAPI.dispatch(hideLoading());
    }
  }
);
export const editClass = createAsyncThunk(
  "class/editClass",
  async (data: EditClassPayload, thunkAPI) => {
    try {
      const { id, ...payload } = data;
      console.log("Class update API call with ID:", id);
      console.log("Class update payload:", JSON.stringify(payload));
      
      const response = await axiosInstance.put(`/classes/${id}`, payload);

      thunkAPI.dispatch(
        addNotify({
          type: "success",
          message: "Class updated successfully",
          duration: 3000,
        })
      );
      thunkAPI.dispatch(fetchClasses());
      return response.data;
    } catch (error: any) {
      console.error("Error updating class:", error.response?.data || error.message);
      thunkAPI.dispatch(
        addNotify({
          type: "error",
          message: error?.response?.data?.error || "Failed to update class",
          duration: 3000,
        })
      );
      return thunkAPI.rejectWithValue(error.message);
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
        homeroomTeacherId: element.homeroomTeacherId,
        createdAt: element.createdAt,
        updatedAt: element.updatedAt,
        academicYear: element.academicYear,
        batchId: element.batchId,
        name: element.className,
        studentNumber: element.studentNumber?.toString() || "0"
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
      if (filters.homeroomTeacherId)
        params.append("homeroomTeacherId", filters.homeroomTeacherId);
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
          homeroomTeacherId: element.homeroomTeacherId,
          createdAt: element.createdAt,
          updatedAt: element.updatedAt,
          academicYear: element.academicYear,
          batchId: element.batchId,
          name: element.className,
          studentNumber: element.studentNumber?.toString() || "0",
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
      })
      .addCase(createClass.fulfilled, (state, action) => {
        // optional: thêm class vừa tạo vào danh sách nếu cần
        if (state.allClasses) {
          state.allClasses = [...state.allClasses, action.payload];
        } else {
          state.allClasses = [action.payload];
        }
        state.loading = false;
        state.error = null;
      })
      .addCase(createClass.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(createClass.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(editClass.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(editClass.fulfilled, (state, action) => {
        state.loading = false;
        // Optionally update state.classList if needed
      })
      .addCase(editClass.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(deleteClass.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteClass.fulfilled, (state, action) => {
        state.loading = false;
        const deletedId = action.payload;
        state.allClasses =
          state.allClasses?.filter(cls => cls.id !== deletedId) || null;
        state.classes =
          state.classes?.filter(cls => cls.id !== deletedId) || null;
      })
      .addCase(deleteClass.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export default classSlice.reducer;
