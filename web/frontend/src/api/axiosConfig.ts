import axios from 'axios';

// Create axios instance - sử dụng địa chỉ localhost của máy host thay vì container name
const api = axios.create({
  baseURL: 'http://localhost:3000/api', // Thay đổi từ backend:3000 thành localhost:3000
  timeout: 5000 // Thêm timeout để dễ phát hiện vấn đề kết nối
});

// Log requests để debug
api.interceptors.request.use(request => {
  console.log('Starting API Request:', request.url);
  return request;
});

// Log responses để debug
api.interceptors.response.use(
  response => {
    console.log('API Response Success:', response.status);
    return response;
  },
  error => {
    console.error('API Response Error:', error.response?.status, error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export default api; 