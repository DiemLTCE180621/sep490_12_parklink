import api from './api';

/**
 * Service giao tiếp API xác thực & quản trị bãi đỗ xe phía Frontend
 */
const authService = {
  /**
   * Lấy danh mục tiện ích toàn hệ thống từ bảng Amenity
   */
  async getAmenities() {
    return await api.get('/auth/amenities');
  },

  /**
   * UC01: Đăng ký Khách hàng (Sinh mật khẩu ngẫu nhiên gửi email)
   */
  async registerCustomer(customerData) {
    return await api.post('/auth/register/customer', customerData);
  },

  /**
   * UC02 / UC03: Đăng ký Provider & Cơ sở bãi đỗ xe (Tính phí 2tr/4tr theo slot)
   */
  async registerProvider(providerData) {
    return await api.post('/auth/register/provider', providerData);
  },

  /**
   * UC03: Đăng nhập
   */
  async login(credentials) {
    return await api.post('/auth/login', credentials);
  },

  /**
   * Đổi mật khẩu lần đầu hoặc cá nhân
   */
  async changePassword(passwordData) {
    return await api.post('/auth/change-password', passwordData);
  },
  /**
   * Quên mật khẩu: Yêu cầu gửi mã OTP qua Email
   */
  async requestPasswordReset(email) {
    return await api.post('/auth/forgot-password/request', { email });
  },

  /**
   * Quên mật khẩu: Xác thực OTP và đặt lại mật khẩu mới
   */
  async verifyAndResetPassword({ email, otpCode, newPassword }) {
    return await api.post('/auth/forgot-password/verify-reset', { email, otpCode, newPassword });
  },
  /**
   * UC05: Đăng xuất
   */
  async logout() {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      console.warn('Lỗi khi gọi API logout:', e);
    } finally {
      localStorage.removeItem('parklink_token');
    }
  },

  /**
   * UC07: Lấy thông tin tài khoản hiện tại từ backend
   */
  async getCurrentUser() {
    return await api.get('/auth/me');
  },

  async getProfile() {
    return await api.get('/auth/profile');
  },

  /**
   * UC08: Cập nhật thông tin cá nhân (Họ tên, SĐT)
   */
  async updateProfile(profileData) {
    return await api.put('/auth/profile', profileData);
  }
};

export default authService;
