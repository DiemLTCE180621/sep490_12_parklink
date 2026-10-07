import api from './api';

const providerService = {
  async confirmPayment(facilityId) {
    return await api.put(`/provider/facilities/${facilityId}/payment-confirm`);
  },
  
  async updateMyFacility(data) {
    return await api.put('/provider/my-facility', data);
  }
};

export default providerService;
