import api from './api';

const inspectorService = {
  getPreparingFacilities: async () => {
    return await api.get('/inspector/facilities/preparing');
  },

  getFacilityDetails: async (id) => {
    return await api.get(`/inspector/facilities/${id}`);
  },

  submitInspection: async (id, data) => {
    return await api.put(`/inspector/facilities/${id}/inspect`, data);
  },

  submitInspectionReport: async (id, data) => {
    return await api.put(`/inspector/facilities/${id}/inspect`, data);
  },
};

export default inspectorService;
