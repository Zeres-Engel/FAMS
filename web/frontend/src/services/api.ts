import axios from 'axios';

// Determine the base URL based on environment
const getBaseUrl = () => {
  // When accessed through a domain, use relative path
  // This works for both development and production domains
  if (typeof window !== 'undefined' && window.location.host) {
    return '/api';
  }
  
  // Inside Docker container - fallback to nginx service name
  return 'http://nginx:80/api';
};

// Create an axios instance with default config
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || getBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
});

console.log('API Base URL:', api.defaults.baseURL);
console.log('API Version:', axios.VERSION);
console.log('Environment:', process.env.NODE_ENV);
console.log('REACT_APP_API_URL:', process.env.REACT_APP_API_URL);
console.log('Window location (if browser):', typeof window !== 'undefined' ? window.location.host : 'Not in browser');

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    console.log('Request:', config.method, config.url, config.baseURL);
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
      console.error('Failed request URL:', error.config.baseURL + error.config.url);
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
        
        const response = await axios.post(`${api.defaults.baseURL}/auth/refresh-token`, {
          refreshToken,
        });
        
        if (response.data.success) {
          // Save new tokens
          const { accessToken, refreshToken: newRefreshToken } = response.data.data;
          localStorage.setItem('accessToken', accessToken);
          localStorage.setItem('refreshToken', newRefreshToken);
          
          // Retry the original request
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
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