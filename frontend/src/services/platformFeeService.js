import api from './api';

const platformFeeService = {
  /**
   * Lấy danh sách phí nền tảng
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
   * Lấy chi tiết phí nền tảng
   */
  getPlatformFeeById: async (id) => {
    return await api.get(`/platform-fees/${id}`);
  },

  /**
   * Tạo phí nền tảng
   * @param {object} data - { name, min_slots, max_slots, fee_amount, description, is_active }
   */
  createPlatformFee: async (data) => {
    return await api.post('/platform-fees', data);
  },

  /**
   * Cập nhật phí nền tảng
   * @param {number} id - ID của gói biểu phí
   * @param {object} data - Dữ liệu cần cập nhật
   */
  updatePlatformFee: async (id, data) => {
    return await api.put(`/platform-fees/${id}`, data);
  },

  /**
   * Bật hoặc tắt phí nền tảng
   * @param {number} id - ID của gói biểu phí
   */
  togglePlatformFeeStatus: async (id) => {
    return await api.patch(`/platform-fees/${id}/toggle-status`);
  },

  /**
   * Tính phí nền tảng theo số chỗ đỗ
   * @param {number} slots 
   */
  calculatePlatformFee: async (slots) => {
    return await api.get('/platform-fees/calculate', {
      params: { slots }
    });
  }
};

export default platformFeeService;
