import api from './api';

/**
 * Service gọi các API Quản lý Tài khoản Người dùng (User Management) trên Frontend
 * Tuân theo kiến trúc: Component → userService → API → Backend (userRoutes)
 */
const userService = {
  /**
   * UC11: Lấy danh sách tài khoản người dùng
   * @param {object} params - { search, role, status, page, limit }
   */
  getUsersList: async (params = {}) => {
    return await api.get('/admin/users', { params });
  },

  /**
   * UC12: Lấy chi tiết tài khoản người dùng theo ID
   * @param {number} id - ID của user
   */
  getUserDetails: async (id) => {
    return await api.get(`/admin/users/${id}`);
  },

  /**
   * UC13: Admin cập nhật thông tin người dùng (Họ và tên, SĐT)
   * @param {number} id - ID của user
   * @param {object} data - { full_name, phone_number }
   */
  updateUser: async (id, data) => {
    return await api.put(`/admin/users/${id}`, data);
  },

  /**
   * UC10: Admin cưỡng chế đặt lại mật khẩu cho người dùng
   * @param {number} id - ID của user
   */
  forceResetPassword: async (id) => {
    return await api.post(`/admin/users/${id}/reset-password`);
  },

  /**
   * UC14 & UC15: Khóa / Mở khóa tài khoản người dùng
   * @param {number} id - ID của user
   */
  toggleUserStatus: async (id) => {
    return await api.put(`/admin/users/${id}/toggle-status`);
  }
};

export default userService;
