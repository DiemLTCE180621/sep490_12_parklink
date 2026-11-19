import api from './api';

const transactionService = {
  getHistory: (role, params, signal) => api.get(`/${role === 'ADMIN' ? 'admin' : 'provider'}/transactions`, { params, signal }),
};

export default transactionService;
