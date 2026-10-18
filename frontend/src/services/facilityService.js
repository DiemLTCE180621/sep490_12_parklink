import api from './api';

const facilityService = {
  /**
   * Tìm kiếm bãi đỗ xe theo từ khóa, vị trí và bộ lọc
   */
  async searchFacilities(params) {
    return await api.get('/facilities/search', { params });
  },

  /**
   * Lấy chi tiết một bãi đỗ xe
   */
  async getFacilityById(id) {
    return await api.get(`/facilities/${id}`);
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
  async compareFacilities(ids, location = null) {
    const params = { ids: ids.join(',') };
    if (Array.isArray(location) && location.length === 2) {
      params.lat = location[0];
      params.lng = location[1];
    }

    return await api.get('/facilities/compare', {
      params
    });
  },

  async getFacilityDetails(id) {
    return await api.get(`/facilities/${id}`);
  },

  async getFacilityAvailability(id) {
    return await api.get(`/facilities/${id}/availability`);
  }
};

export default facilityService;
