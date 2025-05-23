import axios from "axios";
import { getRefreshToken, setAccessToken, setRefreshToken } from "./tokenServices";
import { logout, setRole } from "../store/slices/authSlice";
import { Dispatch } from "redux";

// Gọi API để lấy accessToken mới
export const refreshAccessToken = async (dispatch: Dispatch) => {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  try {
    // Sử dụng URL đầy đủ và tham số đúng
    const response = await axios.post("http://fams.io.vn/api-nodejs/auth/refresh-token", {
      refreshToken: refreshToken,
    }, {
      withCredentials: true, // Bao gồm cookies nếu cần
      headers: {
        'Content-Type': 'application/json',
      }
    });

    // Kiểm tra cấu trúc phản hồi
    if (response.data && response.data.data) {
      const { accessToken, refreshToken: newRefreshToken, role } = response.data.data;

      // Lưu token
      setAccessToken(accessToken);
      setRefreshToken(newRefreshToken);
      if (role) {
        dispatch(setRole(role.toLowerCase())); // sử dụng dispatch truyền vào
      }

      return accessToken;
    } else {
      throw new Error("Invalid response structure");
    }
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