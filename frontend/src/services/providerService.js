import api from './api';

const providerService = {
  async confirmPayment(facilityId) {
    return await api.put(`/provider/facilities/${facilityId}/payment-confirm`);
  }
};

export default providerService;
