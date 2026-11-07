import api from './api';

let _cachedActiveTypes = [];

/**
 * Service giao tiếp với các API Quản lý Loại phương tiện (Vehicle Types) phía Backend
 * Tuân thủ quy tắc kiến trúc Frontend: Nơi DUY NHẤT chứa code gọi API cho Vehicle Types
 */
const vehicleTypeService = {
  /**
   * M2-UC99: Lấy danh sách loại phương tiện (dành cho Admin)
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
   * M2-UC99: Lấy chi tiết một loại phương tiện theo ID
   * @param {number} id - ID loại phương tiện
   */
  getVehicleTypeById: async (id) => {
    return await api.get(`/vehicle-types/${id}`);
  },

  /**
   * M2-UC98: Tạo mới loại phương tiện (Admin)
   * @param {Object} data - { type_code, name, description, is_active }
   */
  createVehicleType: async (data) => {
    return await api.post('/vehicle-types', data);
  },

  /**
   * M2-UC100: Cập nhật thông tin loại phương tiện (Admin)
   * @param {number} id - ID loại phương tiện
   * @param {Object} data - { type_code, name, description, is_active }
   */
  updateVehicleType: async (id, data) => {
    return await api.put(`/vehicle-types/${id}`, data);
  },

  /**
   * M2-UC101: Vô hiệu hóa loại phương tiện (Admin)
   * @param {number} id - ID loại phương tiện
   */
  deactivateVehicleType: async (id) => {
    return await api.patch(`/vehicle-types/${id}/deactivate`);
  },

  /**
   * Bật / Tắt kích hoạt loại phương tiện (Admin)
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
