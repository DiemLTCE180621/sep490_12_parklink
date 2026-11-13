import api from './api';

export const createConfirmationRecord = async (data) => {
  return await api.post('/confirmation-records', data);
};

export const getMyConfirmationRecords = async () => {
  return await api.get('/confirmation-records/my-records');
};

export const getProviderConfirmationRecords = async () => {
  return await api.get('/confirmation-records/provider-records');
};

export const getConfirmationRecordDetail = async (id) => {
  return await api.get(`/confirmation-records/${id}`);
};

export const acceptConfirmationRecord = async (id, data = {}) => {
  return await api.patch(`/confirmation-records/${id}/accept`, data);
};

export const getAdminConfirmationRecords = async (params = {}) => {
  return await api.get('/confirmation-records/admin/all', { params });
};

export const getProviderActiveCustomers = async (params = {}) => {
  return await api.get('/confirmation-records/provider/active-customers', { params });
};

export const requestLeaseExtension = async (contractId, data) => {
  return await api.post(`/confirmation-records/${contractId}/extend`, data);
};

export const getLeaseExtensionDetail = async (contractId) => {
  return await api.get(`/confirmation-records/${contractId}/extension-request`);
};

export const cancelLeaseExtension = async (contractId) => {
  return await api.patch(`/confirmation-records/${contractId}/extension-request/cancel`);
};

export const respondToLeaseExtension = async (contractId, data) => {
  return await api.patch(`/confirmation-records/${contractId}/extension-request/respond`, data);
};

export const getMyLeaseExtensions = async () => {
  return await api.get('/confirmation-records/extension-requests/my');
};

export const requestEarlyTermination = async (contractId, data) => {
  return await api.post(`/confirmation-records/${contractId}/terminate-request`, data);
};

export const cancelEarlyTermination = async (contractId) => {
  return await api.patch(`/confirmation-records/${contractId}/termination-request/cancel`);
};

export const getContractTerminationDetail = async (contractId) => {
  return await api.get(`/confirmation-records/${contractId}/termination-request`);
};

export const confirmContractTermination = async (contractId, data) => {
  return await api.patch(`/confirmation-records/${contractId}/confirm-termination`, data);
};

export const getMyTerminationRequests = async () => {
  return await api.get('/confirmation-records/termination-requests/my');
};

export const getProviderTerminationRequests = async () => {
  return await api.get('/confirmation-records/termination-requests/provider');
};
