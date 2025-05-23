import axios from "axios";
import { getAccessToken, getRefreshToken, saveTokens, removeTokens } from "./tokenServices";

const axiosInstance = axios.create({
  baseURL: "http://fams.io.vn/api-nodejs",    
});

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

axiosInstance.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token: string) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return axiosInstance(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = getRefreshToken();
        const res = await axios.post("http://fams.io.vn/api-nodejs/auth/refresh-token", {
          refreshToken,
        });

        const { access_token, refresh_token } = res.data;
        saveTokens(access_token, refresh_token);

        axiosInstance.defaults.headers.common["Authorization"] = `Bearer ${access_token}`;
        processQueue(null, access_token);

        return axiosInstance(originalRequest);
      } catch (err) {
        processQueue(err, null);
        removeTokens();
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
