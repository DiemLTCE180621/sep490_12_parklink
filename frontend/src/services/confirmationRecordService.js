import api from './api';

/**
 * Service phía Frontend gọi các API liên quan đến Biên bản xác nhận / Hợp đồng điện tử (Confirmation Record)
 */

/**
 * 1. [PROVIDER] Tạo Biên bản xác nhận điện tử cho Yêu cầu thuê xe đã được duyệt (Create e-confirmation record)
 * @param {Object} data - { reservation_id, agreed_price, payment_deadline_day, start_date, end_date, parking_spot, vehicle_type, license_plate, terms }
 */
export const createConfirmationRecord = async (data) => {
  return await api.post('/confirmation-records', data);
};

/**
 * 2. [CUSTOMER] Xem danh sách các Biên bản xác nhận điện tử của Khách hàng (View confirmation record list)
 */
export const getMyConfirmationRecords = async () => {
  return await api.get('/confirmation-records/my-records');
};

/**
 * 3. [PROVIDER] Xem danh sách các Biên bản xác nhận điện tử do Chủ bãi lập
 */
export const getProviderConfirmationRecords = async () => {
  return await api.get('/confirmation-records/provider-records');
};

/**
 * 4. Xem thông tin chi tiết của 1 Biên bản xác nhận điện tử
 * @param {number|string} id - ID của biên bản xác nhận
 */
export const getConfirmationRecordDetail = async (id) => {
  return await api.get(`/confirmation-records/${id}`);
};

/**
 * 5. [CUSTOMER] Chấp nhận / Ký Biên bản xác nhận điện tử (Accept confirmation record)
 * @param {number|string} id - ID của biên bản xác nhận
 * @param {Object} [data] - { customer_address, customer_id_card }
 */
export const acceptConfirmationRecord = async (id, data = {}) => {
  return await api.patch(`/confirmation-records/${id}/accept`, data);
};

/**
 * 6. [ADMIN] Xem toàn bộ Hợp đồng / Biên bản xác nhận trên nền tảng (View confirmation records on platform)
 * @param {Object} [params] - { search, status, facility_id, provider_id, customer_id, start_date, end_date, page, limit }
 */
export const getAdminConfirmationRecords = async (params = {}) => {
  return await api.get('/confirmation-records/admin/all', { params });
};

/**
 * 7. [PROVIDER] Xem danh sách khách hàng đang có hợp đồng hiệu lực tại cơ sở (View active customers at facility)
 * @param {Object} [params] - { facility_id, search, page, limit }
 */
export const getProviderActiveCustomers = async (params = {}) => {
  return await api.get('/confirmation-records/provider/active-customers', { params });
};

