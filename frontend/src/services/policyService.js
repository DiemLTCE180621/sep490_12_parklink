import api from './api';

const policyService = {
  
  async getActivePolicies() {
    return await api.get('/policies');
  },

  async getPolicyByTypeOrId(identifier) {
    return await api.get(`/policies/${identifier}`);
  },

  async getAllPoliciesAdmin() {
    return await api.get('/policies/admin/all');
  },

  async updatePolicy(id, payload) {
    return await api.put(`/policies/admin/${id}`, payload);
  }
};

export default policyService;
