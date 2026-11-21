import api from './api';

/**
 * Gọi API quản trị
 */
const adminService = {
  getDashboardOverview: async () => {
    return await api.get('/admin/dashboard/overview');
  },
  getDashboardPlatformFeeTransactionsByMonth: async (month) => {
    return await api.get(`/admin/dashboard/platform-fees/${month}`);
  },

  /**
   * Lấy cơ sở chờ duyệt và đang chuẩn bị
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
   * Duyệt sơ bộ và phân công khảo sát
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
   * Phê duyệt cơ sở và gửi mã QR thanh toán
   * @param {number} id - ID của bãi đỗ xe
   * @param {object} data - Dữ liệu kèm theo (VD: images)
   */
  finalizeRegistration: async (id, data) => {
    return await api.put(`/admin/registrations/${id}/finalize`, data);
  },

  /**
   * Từ chối đăng ký cơ sở
   * @param {number} id - ID của bãi đỗ xe cần từ chối
   * @param {string} reason - Lý do từ chối
   */
  rejectRegistration: async (id, reason) => {
    return await api.put(`/admin/registrations/${id}/reject`, { reason });
  },

  /**
   * Hiển thị cơ sở sau khi thanh toán
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
   * Khóa hoặc mở khóa cơ sở
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
  },

  /**
   * Lấy danh sách loại phương tiện
   * @param {object} params - { keyword, is_active }
   */
  getVehicleTypes: async (params = {}) => {
    return await api.get('/vehicle-types', { params });
  },

  /**
   * Tạo loại phương tiện
   * @param {object} data - { type_code, name, description, is_active }
   */
  createVehicleType: async (data) => {
    return await api.post('/vehicle-types', data);
  },

  /**
   * Cập nhật loại phương tiện
   * @param {number} id
   * @param {object} data
   */
  updateVehicleType: async (id, data) => {
    return await api.put(`/vehicle-types/${id}`, data);
  },

  /**
   * Vô hiệu hóa loại phương tiện
   * @param {number} id
   */
  deactivateVehicleType: async (id) => {
    return await api.patch(`/vehicle-types/${id}/deactivate`);
  },

  /**
   * Bật hoặc tắt loại phương tiện
   * @param {number} id
   */
  toggleVehicleTypeStatus: async (id) => {
    return await api.patch(`/vehicle-types/${id}/toggle-status`);
  },

  getProviderRevenueStatistics: async (params = {}) => {
    return await api.get('/admin/reports/provider-revenue', { params });
  },

  exportRevenueReport: async (params = {}) => {
    return await api.get('/admin/dashboard/export-revenue', {
      params,
      responseType: 'blob'
    });
  }
};

export default adminService;
