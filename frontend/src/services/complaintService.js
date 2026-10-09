import api from './api';

const complaintService = {
  // Gửi khiếu nại mới
  submitComplaint: async (data) => {
    // data bao gồm: reservation_id, title, description
    const response = await api.post('/complaints', data);
    return response.data;
  },

  // Lấy danh sách khiếu nại của tôi
  getMyComplaints: async () => {
    const response = await api.get('/complaints/my-complaints');
    return response.data;
  },

  // Lấy danh sách khiếu nại liên quan đến cơ sở của Provider
  getProviderComplaints: async () => {
    const response = await api.get('/complaints/provider');
    return response.data;
  },

  // Lấy tất cả khiếu nại cho Admin
  getAllComplaints: async () => {
    const response = await api.get('/complaints/admin');
    return response.data;
  }
};

export default complaintService;
