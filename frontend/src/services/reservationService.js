import api from './api';

/**
 * Service phía Frontend làm nhiệm vụ gọi các API liên quan đến Yêu cầu thuê đỗ xe (Reservation Request)
 */

/**
 * 1. Gửi Yêu cầu thuê bãi đỗ xe theo tháng (Send reservation request)
 * @param {Object} data - { facility_id, vehicle_info, desired_start_date }
 */
export const sendReservationRequest = async (data) => {
  return await api.post('/reservations', data);
};

/**
 * 2. Xem danh sách các Yêu cầu thuê xe của Khách hàng hiện tại (View reservation requests)
 */
export const getMyReservations = async () => {
  return await api.get('/reservations/my-requests');
};

/**
 * 3. Xem thông tin chi tiết của 1 Yêu cầu thuê xe (View detail reservation requests)
 * @param {number|string} id - ID của yêu cầu thuê
 */
export const getReservationDetail = async (id) => {
  return await api.get(`/reservations/${id}`);
};

/**
 * 4. Hủy Yêu cầu thuê xe đang chờ duyệt (Cancel pending reservation request)
 * @param {number|string} id - ID của yêu cầu thuê
 */
export const cancelReservationRequest = async (id) => {
  return await api.patch(`/reservations/${id}/cancel`);
};

/**
 * 5. Lấy danh sách bãi đỗ xe khả dụng để Customer lựa chọn đăng ký thuê
 */
export const getAvailableFacilities = async () => {
  return await api.get('/reservations/available-facilities');
};

/**
 * 6. [PROVIDER] Xem danh sách các Yêu cầu thuê xe của Khách hàng gửi tới bãi xe của Provider
 */
export const getProviderReservations = async () => {
  return await api.get('/reservations/provider-requests');
};

/**
 * 7. [PROVIDER] Chấp nhận Yêu cầu thuê xe (Accept reservation request)
 * @param {number|string} id - ID của yêu cầu thuê
 */
export const acceptReservation = async (id) => {
  return await api.patch(`/reservations/${id}/accept`);
};

/**
 * 8. [PROVIDER] Từ chối Yêu cầu thuê xe (Reject reservation request)
 * @param {number|string} id - ID của yêu cầu thuê
 */
export const rejectReservation = async (id) => {
  return await api.patch(`/reservations/${id}/reject`);
};

