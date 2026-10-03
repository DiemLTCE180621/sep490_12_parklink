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
  },

  /**
   * So sánh 2–4 bãi đỗ xe theo danh sách ID (Function 3.41)
   * @param {number[]} ids - Mảng 2–4 ID bãi đỗ xe
   */
  async compareFacilities(ids) {
    return await api.get('/facilities/compare', {
      params: { ids: ids.join(',') }
    });
  }
};

export default facilityService;
