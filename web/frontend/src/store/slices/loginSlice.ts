import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import {
  LoginForm,
  AuthTokens,
  LoginTest,
} from "../../model/loginModels/loginModels.model";
import { hideLoading, showLoading } from "./loadingSlice";
import { setRole } from "./authSlice";
import { saveTokens } from "../../services/tokenServices";
import axiosInstance from "../../services/axiosInstance";
import { addNotify } from "./notifySlice";

interface LoginResponse {
  userId: string;
  accessToken: string;
  refreshToken: string;
  role: string;
  email: string;
}
interface loginState {
  loginData: null | LoginResponse;
  loading: boolean;
  error: string | null;
}

const initialState: loginState = {
  loginData: null,
  loading: false,
  error: null,
};
export const loginRequest = createAsyncThunk(
  "login/requestLogin",
  async (loginData: LoginForm, thunkAPI) => {
    try {
      thunkAPI.dispatch(showLoading())
      const response = await axiosInstance.post(
        `/auth/login`,
        loginData
      );
      const formatLoginData: AuthTokens = {
        refreshToken: response.data.data?.refreshToken,
        accessToken: response?.data.data?.accessToken,
      };
      const sampleRole = response?.data.data?.role || "user" 
      saveTokens(formatLoginData.accessToken, formatLoginData.refreshToken)
      thunkAPI.dispatch(setRole(sampleRole))
      
      // Store user info in localStorage
      if (response.data.data) {
        const userData = {
          userId: response.data.data.userId || loginData.userId,
          fullName: response.data.data.fullName || response.data.data.name || loginData.userId,
          email: response.data.data.email || "",
          role: sampleRole
        };
        localStorage.setItem('user', JSON.stringify(userData));
        console.log('User data saved to localStorage:', userData);
      }
      
      thunkAPI.dispatch(
        addNotify({
          type: "success",
          message: "Login successful!",
          duration: 3000,
        })
      );

      return response.data.data;
    } catch (error: any) {
      thunkAPI.dispatch(hideLoading())
      console.log(error);
      
      thunkAPI.dispatch(
        addNotify({
          type: "error",
          message: 'Login Failed!',
          duration: 3000,
        })
      );
      return thunkAPI.rejectWithValue(error.message); 
    } finally {
      thunkAPI.dispatch(hideLoading());
    }
  }
);

const loginSlice = createSlice({
  name: "login",
  initialState,
  reducers: {
    handleLogout: state => {
      state.loginData = null;
      state.error = null;
      state.loading = false;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(loginRequest.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginRequest.fulfilled, (state, action) => {
        state.loginData = action.payload;
        state.loading = false;
        state.error = null;
      })
      .addCase(loginRequest.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});
export const { handleLogout } = loginSlice.actions; 
export default loginSlice.reducer;
