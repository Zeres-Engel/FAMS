import axios from 'axios';

// Determine the base URL based on environment
const getBaseUrl = () => {
  // For production use domain directly
  if (typeof window !== 'undefined' && window.location.hostname === 'fams.io.vn') {
    return 'http://fams.io.vn/api';
  }
  
  // For development
  return 'http://fams.io.vn/api';
};

// Create an axios instance with default config
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || getBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Include cookies in cross-site requests
});

console.log('API Base URL:', api.defaults.baseURL);
console.log('API Version:', axios.VERSION);
console.log('Environment:', process.env.NODE_ENV);
console.log('REACT_APP_API_URL:', process.env.REACT_APP_API_URL);
console.log('Window location (if browser):', typeof window !== 'undefined' ? window.location.host : 'Not in browser');

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    console.log('Request:', config.method, config.url);
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for token refresh
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    console.error('Response error:', error.message);
    if (error.config) {
      console.error('Failed request URL:', error.config.url);
    }
    
    const originalRequest = error.config;
    
    // If error is 401 and not already retrying
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Try to refresh the token
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }
        
        // Use direct axios call instead of api instance to avoid circular interceptors
        const response = await axios.post('http://fams.io.vn/api-nodejs/auth/refresh-token', {
          refreshToken,
        });
        
        if (response.data && response.data.data) {
          // Save new tokens
          const { accessToken, refreshToken: newRefreshToken } = response.data.data;
          localStorage.setItem('accessToken', accessToken);
          localStorage.setItem('refreshToken', newRefreshToken);
          
          // Retry the original request
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return axios(originalRequest);
        } else {
          throw new Error('Invalid refresh token response');
        }
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        // If refresh fails, redirect to login
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

export default api; 