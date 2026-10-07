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
   * UC Tương lai (Iter 4): Khóa / Mở khóa tài khoản người dùng
   * @param {number} id - ID của user
   */
  toggleUserStatus: async (id) => {
    return await api.put(`/admin/users/${id}/toggle-status`);
  }
};

export default userService;
