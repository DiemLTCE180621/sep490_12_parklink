import api from './api';

export const sendReservationRequest = async (data) => {
  return await api.post('/reservations', data);
};

export const getMyReservations = async () => {
  return await api.get('/reservations/my-requests');
};

export const getReservationDetail = async (id) => {
  return await api.get(`/reservations/${id}`);
};

export const cancelReservationRequest = async (id) => {
  return await api.patch(`/reservations/${id}/cancel`);
};

export const getAvailableFacilities = async () => {
  return await api.get('/reservations/available-facilities');
};

export const getProviderReservations = async () => {
  return await api.get('/reservations/provider-requests');
};

export const acceptReservation = async (id) => {
  return await api.patch(`/reservations/${id}/accept`);
};

export const rejectReservation = async (id) => {
  return await api.patch(`/reservations/${id}/reject`);
};
