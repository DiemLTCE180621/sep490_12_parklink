import api from './api';

const transactionService = {
  getHistory: (role, params) => api.get(`/${role === 'ADMIN' ? 'admin' : 'provider'}/transactions`, { params }),
};

export default transactionService;
