import api from './api';

const platformFeeService = {
  /**
   * UC: View Platform Fee (Administrator, Parking Provider)
   */
  getPlatformFees: async () => {
    return await api.get('/platform-fees');
  },

  /**
   * Lấy danh sách biểu phí đang hoạt động
   */
  getActiveFees: async () => {
    return await api.get('/platform-fees/active');
  },

  /**
   * UC: View Platform Fee Detail (Administrator, Parking Provider)
   */
  getPlatformFeeById: async (id) => {
    return await api.get(`/platform-fees/${id}`);
  },

  /**
   * UC: Create Platform Fee (Administrator)
   * @param {object} data - { name, min_slots, max_slots, fee_amount, description, is_active }
   */
  createPlatformFee: async (data) => {
    return await api.post('/platform-fees', data);
  },

  /**
   * UC: Update Platform Fee (Administrator)
   * @param {number} id - ID của gói biểu phí
   * @param {object} data - Dữ liệu cần cập nhật
   */
  updatePlatformFee: async (id, data) => {
    return await api.put(`/platform-fees/${id}`, data);
  },

  /**
   * UC: Activate/Deactivate Platform Fee (Administrator)
   * @param {number} id - ID của gói biểu phí
   */
  togglePlatformFeeStatus: async (id) => {
    return await api.patch(`/platform-fees/${id}/toggle-status`);
  },

  /**
   * UC-10: Tính phí nền tảng theo số slot (Administrator, Parking Provider)
   * @param {number} slots 
   */
  calculatePlatformFee: async (slots) => {
    return await api.get('/platform-fees/calculate', {
      params: { slots }
    });
  }
};

export default platformFeeService;
