import api from './api';

const providerService = {
  /**
   * Lấy thông tin chi tiết bãi đỗ xe của chính Provider (kèm số xe đang gửi & chỗ trống)
   */
  async getMyFacility() {
    return await api.get('/provider/my-facility');
  },

  /**
   * Xác nhận thanh toán phí nền tảng
   */
  async confirmPayment(facilityId) {
    return await api.put(`/provider/facilities/${facilityId}/payment-confirm`);
  },
  
  /**
   * Cập nhật thông tin bãi đỗ xe (sức chứa, giá thuê, trạng thái hiển thị)
   */
  async updateMyFacility(data) {
    return await api.put('/provider/my-facility', data);
  }
};

export default providerService;
