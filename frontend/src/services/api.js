import axios from 'axios';

// Khởi tạo instance Axios dùng chung cho dự án Frontend
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor đính kèm Token xác thực vào Header Authorization trước mỗi request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('parklink_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor xử lý phản hồi lỗi toàn cục từ Backend
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message =
      error.response?.data?.message ||
      'Đã xảy ra lỗi kết nối tới máy chủ!';
    const errObj = new Error(message);
    errObj.errors = error.response?.data?.errors || [];
    return Promise.reject(errObj);
  }
);

export default api;
