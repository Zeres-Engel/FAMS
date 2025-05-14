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

// Thêm interface để lưu trữ pagination
interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

interface UserState {
  user: null | UserData[];
  loading: boolean;
  error: string | null;
  pagination: PaginationInfo | null; // Thêm trường pagination vào state
}

const initialState: UserState = {
  user: null,
  loading: false,
  error: null,
  pagination: null, // Khởi tạo giá trị cho pagination
};

function normalizeGender(gender: any): Gender | undefined {
  if (gender === true || gender === "Male") return "Male";
  if (gender === false || gender === "Female") return "Female";
  return undefined;
}
function formatUsersFromResponse(responseData: any[]): UserData[] {
  return responseData.map((user: any): UserData => {
    const isStudent = user.role.toLowerCase() === "student";
    const isParent = user.role.toLowerCase() === "parent";
    const isTeacher = user.role.toLowerCase() === "teacher";

    const details = isStudent ? user.details : user;

    return {
      id: user.userId || user._id,
      username: user.username,
      email: user.email,
      backup_email: user.backup_email ?? "",
      role: user.role.toLowerCase(),
      createdAt: formatDateTime(user.createdAt),
      updatedAt: formatDateTime(user.updatedAt),
      gender: normalizeGender(details?.gender),
      name: user?.details?.fullName || "",
      TeacherDOB: isTeacher ? user?.details.dateOfBirth : "",
      teacherId: isTeacher ? user?.details.teacherId : "",
      teacherFirstName: isTeacher ? user?.firstName : "",
      teacherLastName: isTeacher ? user?.lastName : "",
      TeacherMajor: isTeacher ? user?.details.major : "",
      TeacherWeeklyCapacity: isTeacher ? user?.details.weeklyCapacity : "",
      parentCareer: isParent ? user?.details?.career : "",
      parentEmail: isParent ? user?.email : "",
      parentAddr: isParent ? user?.address : "",
      parentDob: isParent ? user?.dateOfBirth : "",
      // Chỉ có học sinh mới có phụ huynh
      Parent: isStudent ? user.details?.parents || [] : [],
      avatar: user.avatar || "",
      // Thông tin phụ hiển thị bảng
      phoneSub: user?.details?.phone || "None",

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
      TeacherAddress: isTeacher ? user?.details.address : "",
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
            classes: details?.classes || [],
          }
        : undefined,

      // Thêm classTeacher nếu là giáo viên
      classTeacher:
        isTeacher && Array.isArray(user?.details.classes)
          ? user?.details.classes
          : [],
    };
  });
}

export const deleteUser = createAsyncThunk(
  "user/deleteUser",
  async (username: string | number | undefined, thunkAPI) => {
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
    parentEmails,
    classId,
    gender,
    dob,
    ...rest
  } = data;

  // Xử lý thông tin phụ huynh
  const parents = (parentNames || [])
    .map((name, index) => {
      // Xử lý gender đúng cách
      let parentGender: boolean;
      if (typeof parentGenders?.[index] === "boolean") {
        // Chuyển thành so sánh đúng - sử dụng Boolean để đảm bảo kết quả là boolean
        parentGender = Boolean(parentGenders[index]);
      } else if (parentGenders?.[index] === "Male") {
        parentGender = true;
      } else if (parentGenders?.[index] === "Female") {
        parentGender = false;
      } else {
        parentGender = index === 0; // Mặc định: bố = true, mẹ = false
      }

      return {
        fullName: name?.trim() || "",
        phone: parentPhones?.[index] || "",
        career: parentCareers?.[index] || "",
        gender: parentGender,
        email: parentEmails?.[index] || "",
      };
    })
    .filter(p => p.fullName !== "");

  // Xử lý thông tin lớp học
  let classIds: number[] = [];
  if (Array.isArray(classId) && classId.length > 0) {
    // Nếu là mảng object
    if (typeof classId[0] === 'object' && classId[0] !== null) {
      classIds = classId
        .map(cls => {
          if (typeof cls.classId === 'number') return cls.classId;
          if (typeof cls.classId === 'string') {
            const num = parseInt(cls.classId, 10);
            return isNaN(num) ? null : num;
          }
          return null;
        })
        .filter((id): id is number => id !== null);
    } else {
      // Nếu là mảng số hoặc chuỗi
      classIds = classId
        .map(id => {
          if (typeof id === 'number') return id;
          if (typeof id === 'string') {
            const num = parseInt(id, 10);
            return isNaN(num) ? null : num;
          }
          return null;
        })
        .filter((id): id is number => id !== null);
    }
  }

  // Convert gender sang chuỗi đúng format
  let genderStr: string;
  if (typeof gender === 'boolean') {
    genderStr = gender ? "Male" : "Female";
  } else if (gender === "Male" || gender === "Female") {
    genderStr = gender;
  } else {
    // Mặc định
    genderStr = "Male";
  }

  // Format ngày sinh đúng định dạng
  const dateOfBirth = dob || "";

  // Đảm bảo fullName có giá trị
  const fullName = rest.fullName || `${rest.firstName || ""} ${rest.lastName || ""}`.trim();

  // Format dữ liệu theo chuẩn API
  return {
    fullName,
    backup_email: rest.email || "",
    phone: rest.phone || "",
    gender: genderStr,
    dateOfBirth,
    address: rest.address || "",
    classIds,
    parentNames: parents.map(p => p.fullName),
    parentCareers: parents.map(p => p.career),
    parentPhones: parents.map(p => p.phone),
    parentGenders: parents.map(p => p.gender),
    parentEmails: parents.map(p => p.email)
  };
}
export const updateStudent = createAsyncThunk(
  "user/updateStudent",
  async (payload: { id: string; data: Partial<EditUserForm> }, thunkAPI) => {
    try {
      console.log("Cập nhật student - ID:", payload.id);
      console.log("Dữ liệu gốc:", JSON.stringify(payload.data, null, 2));
      
      const formattedData = normalizeStudentData(payload.data);
      console.log("Dữ liệu đã format theo API:", JSON.stringify(formattedData, null, 2));
      
      thunkAPI.dispatch(showLoading());
      const response = await axiosInstance.put(
        `/users/update/${payload.id}`,
        formattedData
      );

      console.log("Kết quả API trả về:", response.data);
      
      // Kết hợp dữ liệu đã gửi đi và dữ liệu trả về để có thông tin đầy đủ
      // Điều này giúp hiển thị ngay dữ liệu mới mà không cần refresh
      const updatedData = {
        ...response.data,
        name: formattedData.fullName,
        email: response.data.email || "",
        backup_email: formattedData.backup_email,
        phoneSub: formattedData.phone,
        gender: formattedData.gender,
        details: {
          ...response.data.details,
          fullName: formattedData.fullName,
          firstName: payload.data.firstName,
          lastName: payload.data.lastName,
          phone: formattedData.phone,
          dateOfBirth: formattedData.dateOfBirth,
          address: formattedData.address,
          classes: formattedData.classIds
        }
      };

      thunkAPI.dispatch(
        addNotify({
          type: "success",
          message: "Update student successful!",
          duration: 3000,
        })
      );
      
      return updatedData;
    } catch (error: any) {
      console.error("Lỗi cập nhật student:", error);
      console.error("Chi tiết lỗi:", error.response?.data || error.message);
      
      thunkAPI.dispatch(hideLoading());
      thunkAPI.dispatch(
        addNotify({
          type: "error",
          message: error.response?.data?.message || "Update student failed!",
          duration: 5000,
        })
      );
      return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
    } finally {
      thunkAPI.dispatch(hideLoading());
    }
  }
);
export const updateTeacher = createAsyncThunk(
  "user/updateTeacher",
  async (payload: { id: string; data: Partial<EditTeacherForm> }, thunkAPI) => {
    try {
      console.log("Cập nhật teacher - ID:", payload.id);
      console.log("Dữ liệu gốc:", JSON.stringify(payload.data, null, 2));
      
      thunkAPI.dispatch(showLoading());
      const response = await axiosInstance.put(
        `/users/update/${payload.id}`,
        payload.data
      );

      console.log("Kết quả API trả về:", response.data);
      
      thunkAPI.dispatch(
        addNotify({
          type: "success",
          message: "Update Teacher successful!",
          duration: 3000,
        })
      );
      return response.data; // Trả lại teacher đã update
    } catch (error: any) {
      console.error("Lỗi cập nhật teacher:", error);
      console.error("Chi tiết lỗi:", error.response?.data || error.message);
      
      thunkAPI.dispatch(hideLoading());
      thunkAPI.dispatch(
        addNotify({
          type: "error",
          message: error.response?.data?.message || "Update Teacher failed!",
          duration: 3000,
        })
      );
      return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
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

      // Đảm bảo luôn loại bỏ supervisor khỏi roles 
      // Không quan tâm có filter hay không, luôn chỉ sử dụng student, teacher, parent
      const validRoles = ["student", "teacher", "parent"];
      const roles = filters.roles?.filter(role => validRoles.includes(role)) || validRoles;

      // Use explicit empty string instead of default year to respect API behavior
      const params = {
        page: (filters.page || 1).toString(),
        academicYear: filters.academicYear || "", // Changed to empty string instead of default
        search: filters.search || "",
        grade: filters.grade || "",
        roles: roles.join(","),
        className: filters.className || "",
        limit: (filters.limit || 10).toString(),
        phone: filters.phone || "",
      };

      console.log("Search users API call with params:", params);
      const query = new URLSearchParams(params).toString();
      const response = await axiosInstance.get(`/users?${query}`);
      
      // Filter out any admin users that might still be returned
      const filteredUsers = response.data.data.filter((user: any) => user.role !== "admin");
      
      // Trả về cả dữ liệu users và thông tin phân trang
      return {
        users: formatUsersFromResponse(filteredUsers),
        pagination: response.data.pagination
      };
    } catch (error: any) {
      console.log(error);

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
      const filterCreate: SearchFilters={
        search:response?.data?.data?.user?.userId
      }
      thunkAPI.dispatch(searchUsers(filterCreate))
      
      return response.data.data;
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

// Thêm action thunk mới để hỗ trợ phân trang
export const fetchUserPaginated = createAsyncThunk(
  "user/fetchUserPaginated",
  async (filters: SearchFilters, thunkAPI) => {
    try {
      thunkAPI.dispatch(showLoading());

      // Đảm bảo luôn loại bỏ supervisor khỏi roles
      // Không quan tâm có filter hay không, luôn chỉ sử dụng student, teacher, parent
      const validRoles = ["student", "teacher", "parent"];
      const roles = filters.roles?.filter(role => validRoles.includes(role)) || validRoles;

      const params: Record<string, string> = {
        page: (filters.page || 1).toString()
      };

      // Chỉ thêm params khi có giá trị
      if (filters.academicYear) params.academicYear = filters.academicYear;
      if (filters.search) params.search = filters.search;
      if (filters.grade) params.grade = filters.grade;
      if (filters.className) params.className = filters.className;
      if (filters.limit) params.limit = filters.limit.toString();
      if (filters.phone) params.phone = filters.phone;

      // Roles luôn được thêm nhưng chỉ bao gồm student, teacher, parent
      params.roles = roles.join(",");

      const query = new URLSearchParams(params).toString();

      console.log("Fetch paginated users API call with params:", params);
      const response = await axiosInstance.get(`/users?${query}`);
      
      // Filter out any admin users that might still be returned
      const filteredUsers = response.data.data.filter((user: any) => user.role !== "admin");
      
      // Không hiển thị thông báo thành công khi phân trang để tránh spam
      return {
        users: formatUsersFromResponse(filteredUsers),
        pagination: response.data.pagination // Lấy thông tin phân trang từ response
      };
    } catch (error: any) {
      console.log(error);
      thunkAPI.dispatch(hideLoading());
      thunkAPI.dispatch(
        addNotify({
          type: "error",
          message: "Load User Failed!",
          duration: 3000,
        })
      );
      return thunkAPI.rejectWithValue(error.message);
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
        state.user = action.payload.users;
        state.pagination = action.payload.pagination;
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
          
          // Tìm người dùng trong state để cập nhật
          const index = state.user.findIndex(u => u.id === updatedUser.userId || u.id === updatedUser.id);
          
          if (index !== -1) {
            // Bảo toàn tất cả các trường bắt buộc từ details hiện tại
            const updatedDetails = {
              studentId: state.user[index].details?.studentId || "",
              firstName: state.user[index].details?.firstName || "",
              lastName: state.user[index].details?.lastName || "",
              fullName: state.user[index].details?.fullName || "",
              phone: state.user[index].details?.phone || "",
              dateOfBirth: state.user[index].details?.dateOfBirth || "",
              address: state.user[index].details?.address || "",
              classId: state.user[index].details?.classId || 0,
              batchId: state.user[index].details?.batchId || 0,
              className: state.user[index].details?.className || "",
              grade: state.user[index].details?.grade || "",
              classes: state.user[index].details?.classes || [],
            };
            
            // Cập nhật các trường từ dữ liệu mới
            if (updatedUser.details?.fullName) updatedDetails.fullName = updatedUser.details.fullName;
            if (updatedUser.details?.firstName) updatedDetails.firstName = updatedUser.details.firstName;
            if (updatedUser.details?.lastName) updatedDetails.lastName = updatedUser.details.lastName;
            if (updatedUser.details?.phone) updatedDetails.phone = updatedUser.details.phone;
            if (updatedUser.details?.dateOfBirth) updatedDetails.dateOfBirth = updatedUser.details.dateOfBirth;
            if (updatedUser.details?.address) updatedDetails.address = updatedUser.details.address;
            if (updatedUser.details?.classes) updatedDetails.classes = updatedUser.details.classes;
            
            // Cập nhật dữ liệu ngay lập tức không cần refresh
            state.user[index] = {
              ...state.user[index],
              name: updatedUser.name || state.user[index].name,
              email: updatedUser.email || state.user[index].email,
              backup_email: updatedUser.backup_email || state.user[index].backup_email,
              gender: updatedUser.gender || state.user[index].gender,
              phoneSub: updatedUser.phoneSub || state.user[index].phoneSub,
              updatedAt: new Date().toISOString(),
              details: updatedDetails,
              Parent: updatedUser.Parent || state.user[index].Parent,
            };
            
            console.log("Dữ liệu người dùng đã được cập nhật trong state:", state.user[index]);
          } else {
            console.warn("Không tìm thấy người dùng để cập nhật trong state. ID:", updatedUser.id || updatedUser.userId);
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
      })
      .addCase(fetchUserPaginated.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserPaginated.fulfilled, (state, action) => {
        state.user = action.payload.users;
        state.pagination = action.payload.pagination;
        state.loading = false;
        state.error = null;
      })
      .addCase(fetchUserPaginated.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export default userSlice.reducer;
