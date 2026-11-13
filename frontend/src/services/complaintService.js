import api from './api';

const complaintService = {
  submitComplaint: async (data) => {
    const response = await api.post('/complaints', data);
    return response.data;
  },

  getMyComplaints: async () => {
    const response = await api.get('/complaints/my-complaints');
    return response.data;
  },

  getProviderComplaints: async () => {
    const response = await api.get('/complaints/provider');
    return response.data;
  },

  getAllComplaints: async () => {
    const response = await api.get('/complaints/admin');
    return response.data;
  },

  replyToComplaint: async (id, data) => {
    const response = await api.post(`/complaints/${id}/reply`, data);
    return response.data;
  },

  // Admin chuyển tiếp khiếu nại cho Chủ bãi xe
  forwardToProvider: async (id, data) => {
    const payload = typeof data === 'object' && data !== null ? data : { note: data };
    const response = await api.post(`/complaints/${id}/forward`, payload);
    return response.data;
  },

  // Chuyển cấp khiếu nại lên Admin 
  escalateComplaint: async (id, reason) => {
    const response = await api.post(`/complaints/${id}/escalate`, { reason });
    return response.data;
  },

  // Cập nhật trạng thái khiếu nại (Admin & Provider)
  updateComplaintStatus: async (id, data) => {
    const payload = typeof data === 'object' && data !== null ? data : { status: data };
    const response = await api.patch(`/complaints/${id}/status`, payload);
    return response.data;
  },

  updateComplaintStatusByAdmin: async (id, data) => {
    const payload = typeof data === 'object' && data !== null ? data : { status: data };
    const response = await api.patch(`/complaints/admin/${id}/status`, payload);
    return response.data;
  },

  getComplaintById: async (id) => {
    const response = await api.get(`/complaints/${id}`);
    return response.data;
  }
};

export default complaintService;
