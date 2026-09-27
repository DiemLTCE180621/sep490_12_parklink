import api from './api';

const facilityService = {
  /**
   * Tìm kiếm bãi đỗ xe theo từ khóa, vị trí và bộ lọc
   */
  async searchFacilities(params) {
    return await api.get('/facilities/search', { params });
  },

  /**
   * Lấy danh sách tiện ích
   */
  async getAllAmenities() {
    return await api.get('/facilities/amenities');
  }
};

export default facilityService;
