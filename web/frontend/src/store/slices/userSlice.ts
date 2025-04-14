// userSlice.ts
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "../../services/axiosInstance";
import { hideLoading, showLoading } from "./loadingSlice";
import { SearchFilters, UserData } from "../../model/userModels/userDataModels.model";
import { AxiosResponse } from "axios";
import { formatDateTime } from "../../services/formatServices";

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
 function formatUsersFromResponse(responseData: any[]): UserData[] {
  return responseData.map((user: any): UserData => ({
    id: user.userId,
    username: user.username,
    email: user.email,
    backup_email: user.backup_email,
    role: user.role,
    createdAt: formatDateTime(user.createdAt),
    updatedAt: formatDateTime(user.updatedAt),
    phoneSub: user.details?.phone|| "None",
    classSubId: user.details?.className || "None",
    name: user.details?.fullName || "None",
    gradeSub: user.details?.grade || "None",
    details: user.details
      ? {
          studentId: user.details.studentId,
          firstName: user.details.firstName,
          lastName: user.details.lastName,
          fullName: user.details.fullName,
          phone: user.details.phone,
          dateOfBirth: user.details.dateOfBirth,
          address: user.details.address,
          classId: user.details.classId,
          batchId: user.details.batchId,
          className: user.details.className,
          grade: user.details.grade,
        }
      : undefined,
  }));
}
export const searchUsers = createAsyncThunk(
  "user/searchUsers",
  async (filters: SearchFilters, thunkAPI) => {
    try {
      thunkAPI.dispatch(showLoading());

      const params = {
        page: "1",
        search: filters.search || "",
        grade: filters.grade || "",
        roles: filters.roles?.join(",") || "",
        className: filters.className || "",
        limit: (filters.limit || 500).toString(),
        phone: filters.phone || "",
      };

      const query = new URLSearchParams(params).toString();
      const response = await axiosInstance.get(`/users?${query}`);
      return formatUsersFromResponse(response.data.data);
    } catch (error: any) {
      thunkAPI.dispatch(hideLoading());
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
      const response = await axiosInstance.get(`/users?page=1&search=&grade=&roles=&className=&limit=500&phone`);
      // const formattedUsers: UserData[] = response.data.data.map(
      //   (user: any) => ({
      //     id: user.userId,
      //     username: user.username,
      //     email: user.email,
      //     backup_email: user.backup_email,
      //     role: user.role,
      //     createdAt: user.createdAt,
      //     updatedAt: user.updatedAt,
      //     classSubId: user.details?.classId || "",
      //     name: user.details?.fullName || "", // fallback nếu không có details
      //     details: user.details
      //       ? {
      //           studentId: user.details.studentId,
      //           firstName: user.details.firstName,
      //           lastName: user.details.lastName,
      //           fullName: user.details.fullName,
      //           phone: user.details.phone,
      //           dateOfBirth: user.details.dateOfBirth,
      //           address: user.details.address,
      //           classId: user.details.classId,
      //           batchId: user.details.batchId,
      //           className: user.details.className,
      //           grade: user.details.grade,
      //         }
      //       : undefined,
      //   })
      // );
      // console.log(formatUsersFromResponse(response));

      return formatUsersFromResponse(response.data.data); // Trả về dữ liệu từ API
    } catch (error: any) {
      thunkAPI.dispatch(hideLoading());
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
      });
  },
});

export default userSlice.reducer;
