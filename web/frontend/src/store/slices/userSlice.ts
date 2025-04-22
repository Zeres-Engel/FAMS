// userSlice.ts
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "../../services/axiosInstance";
import { hideLoading, showLoading } from "./loadingSlice";
import {
  CreateUserPayload,
  Gender,
  SearchFilters,
  UserData,
} from "../../model/userModels/userDataModels.model";
import { AxiosResponse } from "axios";
import { formatDateTime } from "../../services/formatServices";
import { addNotify } from "./notifySlice";
import {
  EditTeacherForm,
  EditUserForm,
} from "../../model/tableModels/tableDataModels.model";

interface UserState {
  user: null | UserData[];
  loading: boolean;
  error: string | null;
}
const initialState: UserState = {
  user: null,
  loading: false,
  error: null,
};
function normalizeGender(gender: any): Gender | undefined {
  if (gender === true || gender === "Male") return "Male";
  if (gender === false || gender === "Female") return "Female";
  return undefined;
}
function formatUsersFromResponse(responseData: any[]): UserData[] {
  return responseData.map((user: any): UserData => {
    const isStudent = user.role === "student";
    const details = isStudent ? user.details : user;

    return {
      id: user.userId || user._id,
      username: user.username,
      email: user.email,
      backup_email: user.backup_email ?? "",
      role: user.role,
      createdAt: formatDateTime(user.createdAt),
      updatedAt: formatDateTime(user.updatedAt),
      gender: normalizeGender(details?.gender),
      name: details?.fullName || "",
      TeacherDOB: !isStudent ? user?.dateOfBirth : "",
      teacherId: !isStudent ? user.teacherId : "",
      teacherFirstName: !isStudent ? user.firstName : "",
      teacherLastName: !isStudent ? user.lastName : "",
      TeacherMajor: !isStudent ? user.major : "",
      TeacherWeeklyCapacity: !isStudent ? user.weeklyCapacity : "",
      parentCareer: !isStudent ? user.career : "",
      parentEmail: !isStudent ? user.email : "",
      parentAddr: !isStudent ? user.address : "",
      parentDob: !isStudent ? user.dateOfBirth : "",
      // Chỉ có học sinh mới có phụ huynh
      Parent: isStudent ? user.details?.parents || [] : [],

      // Thông tin phụ hiển thị bảng
      phoneSub: details?.phone || "None",

      // 🟡 Đối với học sinh: classId, giáo viên: tên các lớp được nối lại
      classSubId: isStudent
        ? details?.className
        : Array.isArray(user.classesName)
        ? user.classesName.join(", ")
        : "None",

      gradeSub: isStudent
        ? details?.grade || "None"
        : Array.isArray(user.grades)
        ? user.grades.join(", ")
        : "None",
        TeacherAddress : !isStudent ? user?.address : "",
      // Thông tin chi tiết học sinh
      details: isStudent
        ? {
            studentId: details?.studentId ?? "",
            firstName: details?.firstName ?? "",
            lastName: details?.lastName ?? "",
            fullName: details?.fullName ?? "",
            phone: details?.phone ?? "",
            dateOfBirth: details?.dateOfBirth ?? "",
            address: details?.address ?? "",
            classId: details?.classId ?? 0,
            batchId: details?.batchId ?? 0,
            className: details?.className ?? "",
            grade: details?.grade ?? "",
          }
        : undefined,

      // Thêm classTeacher nếu là giáo viên
      classTeacher:
      user.role === "teacher" && Array.isArray(user.classes)
        ? user.classes.map((cls: any) => cls.classId)
        : [],
    };
  });
}

export const createUser = createAsyncThunk(
  "user/createUser",
  async (userData: CreateUserPayload, thunkAPI) => {
    try {
      thunkAPI.dispatch(showLoading());
      
      // Check if we have an avatar file to handle
      const hasAvatar = userData.avatar instanceof File;
      
      let response;
      
      if (hasAvatar) {
        // Create FormData to handle file upload
        const formData = new FormData();
        
        // Add all form fields to FormData
        Object.keys(userData).forEach((key) => {
          const k = key as keyof CreateUserPayload;
          const value = userData[k];
          
          if (key === 'avatar') {
            if (value instanceof File) {
              // Check file size before adding
              if (value.size > 5 * 1024 * 1024) {
                throw new Error("Avatar file size must be less than 5MB");
              }
              formData.append('avatar', value);
            }
          } else if (Array.isArray(value)) {
            formData.append(key, JSON.stringify(value));
          } else if (value !== null && value !== undefined) {
            formData.append(key, value.toString());
          }
        });
        
        // Use FormData for the API call
        response = await axiosInstance.post("/users/create", formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
      } else {
        // Regular JSON API call without file upload
        response = await axiosInstance.post("/users/create", userData);
      }
      
      thunkAPI.dispatch(
        addNotify({
          type: "success",
          message: `${userData.role === 'teacher' ? 'Teacher' : 'Student'} created successfully!`,
          duration: 3000,
        })
      );
      return response.data;
    } catch (error: any) {
      thunkAPI.dispatch(hideLoading());
      
      // Get detailed error message
      const errorMessage = error.response?.data?.message || error.message || 'User creation failed';
      
      thunkAPI.dispatch(
        addNotify({
          type: "error",
          message: errorMessage,
          duration: 5000,
        })
      );
      console.error("User creation error:", error);
      return thunkAPI.rejectWithValue(errorMessage);
    } finally {
      thunkAPI.dispatch(hideLoading());
    }
  }
);
export const deleteUser = createAsyncThunk(
  "user/deleteUser",
  async (username: string|number|undefined, thunkAPI) => {
    try {
      thunkAPI.dispatch(showLoading());
      const response = await axiosInstance.delete(`/users/${username}`);
      thunkAPI.dispatch(
        addNotify({
          type: "success",
          message: "Delete user successful!",
          duration: 3000,
        })
      );
      return username; // Trả lại username để xóa khỏi Redux state
    } catch (error: any) {
      thunkAPI.dispatch(
        addNotify({
          type: "error",
          message: "Delete user failed!",
          duration: 3000,
        })
      );
      return thunkAPI.rejectWithValue(error.message);
    } finally {
      thunkAPI.dispatch(hideLoading());
    }
  }
);

function normalizeStudentData(data: Partial<EditUserForm>) {
  const {
    parentNames,
    parentPhones,
    parentCareers,
    parentGenders,
    classId,
    ...rest
  } = data;

  const cleanedParents = (parentNames || [])
    .map((name, index) => ({
      name: name.trim(),
      phone: parentPhones?.[index] || "",
      career: parentCareers?.[index] || "",
      gender: parentGenders?.[index],
    }))
    .filter(p => p.name !== "");

  return {
    ...rest,
    classId: Array.isArray(classId) ? classId[0] : classId,
    parentNames: cleanedParents.map(p => p.name),
    parentPhones: cleanedParents.map(p => p.phone),
    parentCareers: cleanedParents.map(p => p.career),
    parentGenders: cleanedParents.map(p => p.gender),
  };
}
export const updateStudent = createAsyncThunk(
  "user/updateStudent",
  async (payload: { id: string; data: Partial<EditUserForm> }, thunkAPI) => {
    try {
      const formattedData = normalizeStudentData(payload.data);
      thunkAPI.dispatch(showLoading());
      const response = await axiosInstance.put(
        `/students/${payload.id}`,
        formattedData
      );

      thunkAPI.dispatch(
        addNotify({
          type: "success",
          message: "Update student successful!",
          duration: 3000,
        })
      );
      return response.data; // Trả lại student đã update
    } catch (error: any) {
      thunkAPI.dispatch(hideLoading());
      thunkAPI.dispatch(
        addNotify({
          type: "error",
          message: "Update student failed!",
          duration: 3000,
        })
      );
      return thunkAPI.rejectWithValue(error.message);
    } finally {
      thunkAPI.dispatch(hideLoading());
    }
  }
);
export const updateTeacher = createAsyncThunk(
  "user/updateTeacher",
  async (payload: { id: string; data: Partial<EditTeacherForm> }, thunkAPI) => {
    try {
      thunkAPI.dispatch(showLoading());
      const response = await axiosInstance.put(
        `/teachers/${payload.id}`,
        payload.data
      );

      thunkAPI.dispatch(
        addNotify({
          type: "success",
          message: "Update Teacher successful!",
          duration: 3000,
        })
      );
      return response.data; // Trả lại student đã update
    } catch (error: any) {
      thunkAPI.dispatch(hideLoading());
      thunkAPI.dispatch(
        addNotify({
          type: "error",
          message: "Update Teacher failed!",
          duration: 3000,
        })
      );
      return thunkAPI.rejectWithValue(error.message);
    } finally {
      thunkAPI.dispatch(hideLoading());
    }
  }
);
export const searchUsers = createAsyncThunk(
  "user/searchUsers",
  async (filters: SearchFilters, thunkAPI) => {
    try {
      thunkAPI.dispatch(showLoading());

      const params = {
        page: "1",
        academicYear: filters.academicYear || "",
        search: filters.search || "",
        grade: filters.grade || "",
        roles: filters.roles?.join(",") || "",
        className: filters.className || "",
        limit: (filters.limit || 100).toString(),
        phone: filters.phone || "",
      };

      const query = new URLSearchParams(params).toString();
      const response = await axiosInstance.get(`/users?${query}`);
      thunkAPI.dispatch(
        addNotify({
          type: "success",
          message: "Search User successful!",
          duration: 3000,
        })
      );
      return formatUsersFromResponse(response.data.data);
    } catch (error: any) {
      thunkAPI.dispatch(hideLoading());
      thunkAPI.dispatch(
        addNotify({
          type: "error",
          message: "Search User Failed!",
          duration: 3000,
        })
      );
      return thunkAPI.rejectWithValue(error.message);
    } finally {
      thunkAPI.dispatch(hideLoading());
    }
  }
);

export const fetchUser = createAsyncThunk(
  "user/fetchUser",
  async (_, thunkAPI) => {
    try {
      thunkAPI.dispatch(showLoading());
      const response = await axiosInstance.get(
        `/users?page=1&search=&grade=&roles=&className=&limit=500&phone`
      );
      thunkAPI.dispatch(
        addNotify({
          type: "success",
          message: "Fetch User successful!",
          duration: 3000,
        })
      );
      return formatUsersFromResponse(response.data.data); // Trả về dữ liệu từ API
    } catch (error: any) {
      thunkAPI.dispatch(hideLoading());
      thunkAPI.dispatch(
        addNotify({
          type: "error",
          message: "Fetch User Failed!",
          duration: 3000,
        })
      );
      return thunkAPI.rejectWithValue(error.message); // Nếu có lỗi, trả về message lỗi
    } finally {
      thunkAPI.dispatch(hideLoading());
    }
  }
);

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(fetchUser.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUser.fulfilled, (state, action) => {
        state.user = action.payload;
        state.loading = false;
        state.error = null;
      })
      .addCase(fetchUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string; // Lưu lỗi vào state nếu có
      })
      .addCase(searchUsers.fulfilled, (state, action) => {
        state.user = action.payload;
        state.loading = false;
        state.error = null;
      })
      .addCase(searchUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(createUser.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createUser.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;

        if (state.user) {
          state.user.push(action.payload);
        }
      })
      .addCase(createUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(updateStudent.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;

        if (state.user) {
          const updatedUser = action.payload;
          const index = state.user.findIndex(u => u.id === updatedUser.userId);
          if (index !== -1) {
            state.user[index] = {
              ...state.user[index],
              ...updatedUser,
              details: {
                ...state.user[index].details,
                ...updatedUser.details,
              },
            };
          }
        }
      })
      .addCase(updateStudent.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(updateStudent.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateTeacher.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;

        if (state.user) {
          const updatedTeacher = action.payload;
          const index = state.user.findIndex(
            u => u.id === updatedTeacher.userId
          );
          if (index !== -1) {
            state.user[index] = {
              ...state.user[index],
              ...updatedTeacher,
              teacherId:
                updatedTeacher.teacherId ?? state.user[index].teacherId,
              teacherFirstName:
                updatedTeacher.firstName ?? state.user[index].teacherFirstName,
              teacherLastName:
                updatedTeacher.lastName ?? state.user[index].teacherLastName,
              TeacherMajor:
                updatedTeacher.major ?? state.user[index].TeacherMajor,
              TeacherWeeklyCapacity:
                updatedTeacher.WeeklyCapacity ??
                state.user[index].TeacherWeeklyCapacity,
            };
          }
        }
      })
      .addCase(updateTeacher.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(updateTeacher.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteUser.fulfilled, (state, action) => {
        if (state.user) {
          state.user = state.user.filter(
            user => user.username !== action.payload
          );
        }
        state.loading = false;
        state.error = null;
      })
      .addCase(deleteUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(deleteUser.pending, state => {
        state.loading = true;
        state.error = null;
      });
  },
});

export default userSlice.reducer;
