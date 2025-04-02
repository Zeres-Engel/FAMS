import axios from 'axios';

const API_URL = 'http://localhost:3000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include token in the headers
api.interceptors.request.use(
  (config) => {
    const token = document.cookie
      .split('; ')
      .find(row => row.startsWith('jwtToken='))
      ?.split('=')[1];
    
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api; 