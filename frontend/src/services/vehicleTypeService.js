import api from './api';

let _cachedActiveTypes = [];

/**
 * Gọi API loại phương tiện
 */
const vehicleTypeService = {
  /**
   * Lấy danh sách loại phương tiện
   * @param {Object} params - { keyword, is_active }
   */
  getVehicleTypes: async (params = {}) => {
    return await api.get('/vehicle-types', { params });
  },

  /**
   * Lấy danh sách các loại phương tiện đang hoạt động (Active) từ Database
   */
  getActiveVehicleTypes: async () => {
    const res = await api.get('/vehicle-types/active');
    const list = res?.data || res || [];
    if (Array.isArray(list)) {
      _cachedActiveTypes = list;
    }
    return res;
  },

  /**
   * Lấy chi tiết loại phương tiện
   * @param {number} id - ID loại phương tiện
   */
  getVehicleTypeById: async (id) => {
    return await api.get(`/vehicle-types/${id}`);
  },

  /**
   * Tạo loại phương tiện
   * @param {Object} data - { type_code, name, description, is_active }
   */
  createVehicleType: async (data) => {
    return await api.post('/vehicle-types', data);
  },

  /**
   * Cập nhật loại phương tiện
   * @param {number} id - ID loại phương tiện
   * @param {Object} data - { type_code, name, description, is_active }
   */
  updateVehicleType: async (id, data) => {
    return await api.put(`/vehicle-types/${id}`, data);
  },

  /**
   * Vô hiệu hóa loại phương tiện
   * @param {number} id - ID loại phương tiện
   */
  deactivateVehicleType: async (id) => {
    return await api.patch(`/vehicle-types/${id}/deactivate`);
  },

  /**
   * Bật hoặc tắt loại phương tiện
   * @param {number} id - ID loại phương tiện
   */
  toggleVehicleTypeStatus: async (id) => {
    return await api.patch(`/vehicle-types/${id}/toggle-status`);
  },

  /**
   * Lấy danh sách loại phương tiện đang được cache trong phiên
   */
  getCachedActiveTypes: () => _cachedActiveTypes,

  /**
   * Tìm tên hiển thị của mã loại xe từ cache database
   * @param {string} typeCode 
   */
  getLabelByCode: (typeCode) => {
    if (!typeCode) return '';
    const found = _cachedActiveTypes.find(v => v.type_code === typeCode);
    return found ? found.name : typeCode;
  }
};

export default vehicleTypeService;
