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

/**
 * 8. [CUSTOMER] Gửi yêu cầu gia hạn hợp đồng thuê xe (Request lease extension)
 * @param {number|string} contractId - ID của hợp đồng
 * @param {Object} data - { extension_months, new_end_date, reason, vehicle_type, license_plate, customer_address, customer_phone }
 */
export const requestLeaseExtension = async (contractId, data) => {
  return await api.post(`/confirmation-records/${contractId}/extend`, data);
};

/**
 * 9. Xem chi tiết yêu cầu gia hạn của hợp đồng
 * @param {number|string} contractId - ID của hợp đồng
 */
export const getLeaseExtensionDetail = async (contractId) => {
  return await api.get(`/confirmation-records/${contractId}/extension-request`);
};

/**
 * 10. [CUSTOMER] Hủy yêu cầu gia hạn đang chờ duyệt (Cancel extension request)
 * @param {number|string} contractId - ID của hợp đồng
 */
export const cancelLeaseExtension = async (contractId) => {
  return await api.patch(`/confirmation-records/${contractId}/extension-request/cancel`);
};

/**
 * 11. [PROVIDER] Phản hồi yêu cầu gia hạn (Respond to lease extension: APPROVED / REJECTED)
 * @param {number|string} contractId - ID của hợp đồng
 * @param {Object} data - { status: 'APPROVED' | 'REJECTED', provider_note }
 */
export const respondToLeaseExtension = async (contractId, data) => {
  return await api.patch(`/confirmation-records/${contractId}/extension-request/respond`, data);
};

/**
 * 12. [CUSTOMER] Lấy danh sách các hợp đồng có yêu cầu gia hạn của mình
 */
export const getMyLeaseExtensions = async () => {
  return await api.get('/confirmation-records/extension-requests/my');
};

/**
 * 13. [CUSTOMER] Gửi yêu cầu chấm dứt hợp đồng / trả chỗ trước thời hạn (Request early termination)
 * @param {number|string} contractId - ID của hợp đồng
 * @param {Object} data - { termination_date, reason, bank_account_info }
 */
export const requestEarlyTermination = async (contractId, data) => {
  return await api.post(`/confirmation-records/${contractId}/terminate-request`, data);
};

/**
 * 14. [CUSTOMER] Hủy yêu cầu chấm dứt hợp đồng trước hạn đang chờ duyệt (Cancel termination request)
 * @param {number|string} contractId - ID của hợp đồng
 */
export const cancelEarlyTermination = async (contractId) => {
  return await api.patch(`/confirmation-records/${contractId}/termination-request/cancel`);
};

/**
 * 15. Xem chi tiết yêu cầu chấm dứt hợp đồng
 * @param {number|string} contractId - ID của hợp đồng
 */
export const getContractTerminationDetail = async (contractId) => {
  return await api.get(`/confirmation-records/${contractId}/termination-request`);
};

/**
 * 16. [PROVIDER] Xác nhận chấm dứt hợp đồng và thu hồi vị trí đỗ xe (Confirm contract termination & reclaim slot)
 * @param {number|string} contractId - ID của hợp đồng
 * @param {Object} data - { status: 'CONFIRMED' | 'REJECTED', provider_note, refund_amount }
 */
export const confirmContractTermination = async (contractId, data) => {
  return await api.patch(`/confirmation-records/${contractId}/confirm-termination`, data);
};

/**
 * 17. [CUSTOMER] Lấy danh sách hợp đồng có yêu cầu chấm dứt của mình
 */
export const getMyTerminationRequests = async () => {
  return await api.get('/confirmation-records/termination-requests/my');
};

/**
 * 18. [PROVIDER] Lấy danh sách hợp đồng có yêu cầu chấm dứt tại bãi của mình
 */
export const getProviderTerminationRequests = async () => {
  return await api.get('/confirmation-records/termination-requests/provider');
};


