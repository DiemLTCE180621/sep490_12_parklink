import api from './api';

/**
 * Service gọi các API liên quan đến Nhân viên khảo sát thực địa (Field Inspector)
 * Tuân thủ kiến trúc Frontend: Component → Service → API → Backend
 */
const fieldInspectorService = {
  /**
   * UC-86: Tạo tài khoản Nhân viên khảo sát thực địa
   * @param {object} data - { email, full_name, phone_number }
   */
  createFieldInspector: async (data) => {
    return await api.post('/admin/field-inspectors', data);
  },

  /**
   * UC-87: Lấy danh sách tài khoản Nhân viên khảo sát thực địa
   * @param {object} params - { search, page, limit }
   */
  getFieldInspectors: async (params = {}) => {
    return await api.get('/admin/field-inspectors', { params });
  },

  /**
   * UC-88: Cập nhật thông tin Nhân viên khảo sát thực địa
   * @param {number} id 
   * @param {object} data - { full_name, phone_number, status }
   */
  updateFieldInspector: async (id, data) => {
    return await api.put(`/admin/field-inspectors/${id}`, data);
  }
};

export default fieldInspectorService;
