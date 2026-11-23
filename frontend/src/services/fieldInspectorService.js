import api from './api';

const fieldInspectorService = {
  createFieldInspector: async (data) => {
    return await api.post('/admin/field-inspectors', data);
  },

  getFieldInspectors: async (params = {}) => {
    return await api.get('/admin/field-inspectors', { params });
  },

  updateFieldInspector: async (id, data) => {
    return await api.put(`/admin/field-inspectors/${id}`, data);
  },

  getActiveInspectors: async () => {
    return await api.get('/admin/field-inspectors/active');
  }
};

export default fieldInspectorService;
