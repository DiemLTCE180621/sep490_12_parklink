import api from './api';

const inspectorService = {
  /**
   * Lấy danh sách bãi đỗ xe đang chờ khảo sát
   */
  getPreparingFacilities: async () => {
    return await api.get('/inspector/facilities/preparing');
  },

  /**
   * Submit kết quả khảo sát
   * @param {number} id 
   * @param {object} data - { capacity, images }
   */
  submitInspection: async (id, data) => {
    return await api.put(`/inspector/facilities/${id}/inspect`, data);
  }
};

export default inspectorService;
