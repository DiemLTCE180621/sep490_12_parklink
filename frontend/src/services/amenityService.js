import api from './api';

const amenityService = {
  getAmenities: async (params = {}) => {
    return await api.get('/amenities', { params });
  },

  getActiveAmenities: async () => {
    return await api.get('/amenities/active');
  },

  createAmenity: async (data) => {
    return await api.post('/amenities', data);
  },

  updateAmenity: async (id, data) => {
    return await api.put(`/amenities/${id}`, data);
  },

  toggleAmenityStatus: async (id) => {
    return await api.patch(`/amenities/${id}/toggle-status`);
  }
};

export default amenityService;

