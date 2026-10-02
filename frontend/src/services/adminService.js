import api from './api';

/**
 * Service gọi các API Admin trên Frontend
 * Tuân theo kiến trúc: Component → Service → API → Backend
 */
const adminService = {
  /**
   * M2-UC20: Lấy danh sách bãi đỗ xe đang chờ duyệt hoặc đang chuẩn bị
   */
  getPendingRegistrations: async () => {
    return await api.get('/admin/registrations/pending');
  },

  /**
   * M2-UC21 Bước 1: Duyệt sơ bộ → PREPARING (gửi mail chuẩn bị)
   * @param {number} id - ID của bãi đỗ xe
   */
  approveRegistration: async (id) => {
    return await api.put(`/admin/registrations/${id}/approve`);
  },

  /**
   * M2-UC21 Bước 2: Xác nhận hoàn tất → APPROVED (gửi QR thanh toán)
   * @param {number} id - ID của bãi đỗ xe
   */
  finalizeRegistration: async (id) => {
    return await api.put(`/admin/registrations/${id}/finalize`);
  },

  /**
   * M2-UC22: Từ chối đăng ký bãi đỗ xe
   * @param {number} id - ID của bãi đỗ xe cần từ chối
   * @param {string} reason - Lý do từ chối
   */
  rejectRegistration: async (id, reason) => {
    return await api.put(`/admin/registrations/${id}/reject`, { reason });
  },

  /**
   * Provider xác nhận đã thanh toán → Cơ sở tự động VISIBLE
   * @param {number} id - ID của bãi đỗ xe
   */
  confirmPayment: async (id) => {
    return await api.put(`/admin/registrations/${id}/payment-confirm`);
  },

  /**
   * UC-Admin: Lấy danh sách tài khoản người dùng
   * @param {object} params - { search, role, status, page, limit }
   */
  getUsersList: async (params = {}) => {
    return await api.get('/admin/users', { params });
  },

  /**
   * UC-Admin: Lấy chi tiết tài khoản người dùng theo ID
   * @param {number} id - ID của user
   */
  getUserDetails: async (id) => {
    return await api.get(`/admin/users/${id}`);
  }
};

export default adminService;
