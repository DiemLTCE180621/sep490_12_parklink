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
   * Lấy chi tiết hồ sơ đăng ký bãi đỗ xe theo ID
   * @param {number} id
   */
  getRegistrationDetails: async (id) => {
    return await api.get(`/admin/registrations/${id}`);
  },

  /**
   * M2-UC21 Bước 1: Duyệt sơ bộ → PREPARING & Giao việc cho Nhân viên khảo sát
   * @param {number} id - ID của bãi đỗ xe
   * @param {number|object} data - ID nhân viên hoặc object { inspector_id }
   */
  approveRegistration: async (id, data) => {
    const payload = typeof data === 'object' ? data : { inspector_id: data };
    return await api.put(`/admin/registrations/${id}/approve`, payload);
  },

  /**
   * Phân công hoặc đổi Nhân viên khảo sát thực địa
   * @param {number} id - ID của bãi đỗ xe
   * @param {number} inspectorId - ID nhân viên khảo sát
   */
  assignInspector: async (id, inspectorId) => {
    return await api.put(`/admin/registrations/${id}/assign-inspector`, {
      inspector_id: inspectorId,
    });
  },

  /**
   * M2-UC21 Bước 2: Xác nhận hoàn tất → APPROVED (gửi QR thanh toán)
   * @param {number} id - ID của bãi đỗ xe
   * @param {object} data - Dữ liệu kèm theo (VD: images)
   */
  finalizeRegistration: async (id, data) => {
    return await api.put(`/admin/registrations/${id}/finalize`, data);
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
   * Lấy danh sách tất cả bãi đỗ xe trên hệ thống (dành cho Admin)
   */
  getAllFacilities: async () => {
    return await api.get('/admin/facilities');
  },

  /**
   * Khóa / Mở khóa bãi đỗ xe
   * @param {number} id - ID của bãi đỗ xe
   */
  toggleLockFacility: async (id) => {
    return await api.put(`/admin/facilities/${id}/toggle-lock`);
  },

  /**
   * Cập nhật thông tin cơ sở
   * @param {number} id 
   * @param {object} data 
   */
  updateFacility: async (id, data) => {
    return await api.put(`/admin/facilities/${id}`, data);
  }
};

export default adminService;
