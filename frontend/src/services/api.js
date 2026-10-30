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
    const resData = error.response?.data;
    const errorsList = resData?.errors && Array.isArray(resData.errors) && resData.errors.length > 0
      ? resData.errors
      : [];

    const primaryMessage = errorsList.length > 0
      ? errorsList[0]
      : (resData?.message || 'Đã xảy ra lỗi kết nối tới máy chủ!');

    // Tự động đá phiên đăng nhập nếu mật khẩu bị đặt lại hoặc tài khoản bị khóa
    if (
      (error.response?.status === 401 && resData?.code === 'PASSWORD_RESET_FORCE_LOGOUT') ||
      (error.response?.status === 403 && resData?.code === 'ACCOUNT_BLOCKED')
    ) {
      localStorage.removeItem('parklink_token');
      sessionStorage.setItem('force_logout_notice', primaryMessage);
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login?reason=force_logout';
      }
    }

    const errObj = new Error(primaryMessage);
    errObj.response = error.response;
    errObj.errors = errorsList;
    errObj.status = error.response?.status;
    return Promise.reject(errObj);
  }
);

export default api;
