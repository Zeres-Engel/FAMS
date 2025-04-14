import axios from "axios";
import { getRefreshToken, setAccessToken, setRefreshToken } from "./tokenServices";
import { logout, setRole } from "../store/slices/authSlice";
import { Dispatch } from "redux";

const API_URL = "http://fams.io.vn/api-nodejs/auth/refresh-token"; // 🔁 Thay bằng URL thật

// Gọi API để lấy accessToken mới
export const refreshAccessToken = async (dispatch: Dispatch) => {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  try {
    const response = await axios.post(`${API_URL}`, {
      refreshToken: refreshToken,
    });

    const { accessToken, refreshToken: newRefreshToken, role } = response.data.data;

    // Lưu token
    setAccessToken(accessToken);
    setRefreshToken(newRefreshToken);
    if (role) {
      dispatch(setRole(role)); // sử dụng dispatch truyền vào
    }

    return accessToken;
  } catch (error) {
    console.error("Refresh token failed", error);
    clearAuth(dispatch);
    return null;
  }
};

export const clearAuth = (dispatch?: any) => {
  sessionStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  if (dispatch) dispatch(logout());
};

export const isAuthenticated = () => {
  return !!sessionStorage.getItem("accessToken");
};