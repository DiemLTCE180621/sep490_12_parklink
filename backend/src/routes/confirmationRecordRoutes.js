const express = require('express');
const router = express.Router();

const confirmationRecordController = require('../controllers/confirmationRecordController');
const { authenticateToken, authorizeRoles } = require('../middlewares/authMiddleware');
const {
  validateCreateConfirmationRecord,
  validateAdminQueryConfirmationRecords,
  validateProviderActiveCustomersQuery,
  validateRequestLeaseExtension,
  validateRespondLeaseExtension,
  validateRequestEarlyTermination,
  validateConfirmContractTermination
} = require('../validations/confirmationRecordValidation');

/**
 * Route: POST /api/confirmation-records
 * 1. [PROVIDER] Create e-confirmation record (Tạo biên bản xác nhận / hợp đồng điện tử)
 */
router.post(
  '/',
  authenticateToken,
  authorizeRoles('PROVIDER'),
  validateCreateConfirmationRecord,
  confirmationRecordController.createConfirmationRecord
);

/**
 * Route: GET /api/confirmation-records/my-records
 * 2. [CUSTOMER] View confirmation record list (Xem danh sách biên bản xác nhận của khách hàng)
 */
router.get(
  '/my-records',
  authenticateToken,
  authorizeRoles('CUSTOMER'),
  confirmationRecordController.getMyConfirmationRecords
);

/**
 * Route: GET /api/confirmation-records/provider-records
 * [PROVIDER] Xem danh sách biên bản xác nhận điện tử do bãi xe lập
 */
router.get(
  '/provider-records',
  authenticateToken,
  authorizeRoles('PROVIDER'),
  confirmationRecordController.getProviderConfirmationRecords
);

/**
 * UC-57: Route: GET /api/confirmation-records/admin/all
 * [ADMIN] View confirmation records on platform (Admin xem toàn bộ hợp đồng thuê trên hệ thống)
 */
router.get(
  '/admin/all',
  authenticateToken,
  authorizeRoles('ADMIN'),
  validateAdminQueryConfirmationRecords,
  confirmationRecordController.getAllConfirmationRecords
);

/**
 * UC-58: Route: GET /api/confirmation-records/provider/active-customers
 * [PROVIDER] View active customers at facility (Chủ bãi xem danh sách khách hàng đang có hợp đồng hiệu lực tại cơ sở)
 */
router.get(
  '/provider/active-customers',
  authenticateToken,
  authorizeRoles('PROVIDER'),
  validateProviderActiveCustomersQuery,
  confirmationRecordController.getActiveCustomersAtFacility
);

/**
 * Route: GET /api/confirmation-records/extension-requests/my
 * [CUSTOMER] Khách hàng xem danh sách hợp đồng có yêu cầu gia hạn của mình
 */
router.get(
  '/extension-requests/my',
  authenticateToken,
  authorizeRoles('CUSTOMER'),
  confirmationRecordController.getMyLeaseExtensions
);

/**
 * Route: GET /api/confirmation-records/extension-requests/provider
 * [PROVIDER] Chủ bãi xem danh sách hợp đồng có yêu cầu gia hạn tại cơ sở của mình
 */
router.get(
  '/extension-requests/provider',
  authenticateToken,
  authorizeRoles('PROVIDER'),
  confirmationRecordController.getProviderLeaseExtensions
);

/**
 * Route: POST /api/confirmation-records/extension-request
 * [CUSTOMER] Request lease extension (Khách hàng gửi yêu cầu gia hạn với contract_id trong body)
 */
router.post(
  '/extension-request',
  authenticateToken,
  authorizeRoles('CUSTOMER'),
  validateRequestLeaseExtension,
  confirmationRecordController.requestLeaseExtension
);

/**
 * Route: GET /api/confirmation-records/termination-requests/my
 * [CUSTOMER] Khách hàng xem danh sách hợp đồng có yêu cầu chấm dứt của mình
 */
router.get(
  '/termination-requests/my',
  authenticateToken,
  authorizeRoles('CUSTOMER'),
  confirmationRecordController.getMyTerminationRequests
);

/**
 * Route: GET /api/confirmation-records/termination-requests/provider
 * [PROVIDER] Chủ bãi xem danh sách hợp đồng có yêu cầu chấm dứt tại cơ sở của mình
 */
router.get(
  '/termination-requests/provider',
  authenticateToken,
  authorizeRoles('PROVIDER'),
  confirmationRecordController.getProviderTerminationRequests
);

/**
 * Route: POST /api/confirmation-records/termination-request
 * [CUSTOMER & PROVIDER] Request early termination (Gửi yêu cầu chấm dứt với contract_id trong body)
 */
router.post(
  '/termination-request',
  authenticateToken,
  authorizeRoles('CUSTOMER', 'PROVIDER'),
  validateRequestEarlyTermination,
  confirmationRecordController.requestEarlyTermination
);

/**
 * Route: GET /api/confirmation-records/:id
 * Xem thông tin chi tiết một Biên bản xác nhận điện tử
 */
router.get(
  '/:id',
  authenticateToken,
  confirmationRecordController.getConfirmationRecordById
);

/**
 * Route: POST /api/confirmation-records/:id/extend & POST /api/confirmation-records/:id/extension-request
 * [CUSTOMER] Request lease extension (Khách hàng gửi yêu cầu gia hạn thời gian thuê đỗ xe)
 */
router.post(
  '/:id/extend',
  authenticateToken,
  authorizeRoles('CUSTOMER'),
  validateRequestLeaseExtension,
  confirmationRecordController.requestLeaseExtension
);

router.post(
  '/:id/extension-request',
  authenticateToken,
  authorizeRoles('CUSTOMER'),
  validateRequestLeaseExtension,
  confirmationRecordController.requestLeaseExtension
);

/**
 * Route: GET /api/confirmation-records/:id/extension-request
 * Xem thông tin chi tiết yêu cầu gia hạn của hợp đồng
 */
router.get(
  '/:id/extension-request',
  authenticateToken,
  confirmationRecordController.getLeaseExtensionDetail
);

/**
 * Route: PATCH & PUT /api/confirmation-records/:id/extension-request/cancel
 * [CUSTOMER] Khách hàng hủy yêu cầu gia hạn hợp đồng đang chờ duyệt (PENDING)
 */
router.patch(
  '/:id/extension-request/cancel',
  authenticateToken,
  authorizeRoles('CUSTOMER'),
  confirmationRecordController.cancelLeaseExtension
);

router.put(
  '/:id/extension-request/cancel',
  authenticateToken,
  authorizeRoles('CUSTOMER'),
  confirmationRecordController.cancelLeaseExtension
);

/**
 * Route: PATCH & PUT /api/confirmation-records/:id/extension-request/respond
 * [PROVIDER] Chủ bãi phản hồi yêu cầu gia hạn hợp đồng (APPROVED / REJECTED)
 */
router.patch(
  '/:id/extension-request/respond',
  authenticateToken,
  authorizeRoles('PROVIDER'),
  validateRespondLeaseExtension,
  confirmationRecordController.respondToLeaseExtension
);

router.put(
  '/:id/extension-request/respond',
  authenticateToken,
  authorizeRoles('PROVIDER'),
  validateRespondLeaseExtension,
  confirmationRecordController.respondToLeaseExtension
);

/**
 * Route: POST /api/confirmation-records/:id/terminate-request & POST /api/confirmation-records/:id/termination-request
 * [CUSTOMER & PROVIDER] Request early termination (Gửi yêu cầu chấm dứt hợp đồng / trả chỗ trước thời hạn)
 */
router.post(
  '/:id/terminate-request',
  authenticateToken,
  authorizeRoles('CUSTOMER', 'PROVIDER'),
  validateRequestEarlyTermination,
  confirmationRecordController.requestEarlyTermination
);

router.post(
  '/:id/termination-request',
  authenticateToken,
  authorizeRoles('CUSTOMER', 'PROVIDER'),
  validateRequestEarlyTermination,
  confirmationRecordController.requestEarlyTermination
);

/**
 * Route: GET /api/confirmation-records/:id/termination-request
 * Xem thông tin chi tiết yêu cầu chấm dứt hợp đồng
 */
router.get(
  '/:id/termination-request',
  authenticateToken,
  confirmationRecordController.getContractTerminationDetail
);

/**
 * Route: PATCH & PUT /api/confirmation-records/:id/termination-request/cancel
 * [CUSTOMER & PROVIDER] Hủy yêu cầu chấm dứt trước hạn đang chờ duyệt (PENDING)
 */
router.patch(
  '/:id/termination-request/cancel',
  authenticateToken,
  authorizeRoles('CUSTOMER', 'PROVIDER'),
  confirmationRecordController.cancelEarlyTermination
);

router.put(
  '/:id/termination-request/cancel',
  authenticateToken,
  authorizeRoles('CUSTOMER', 'PROVIDER'),
  confirmationRecordController.cancelEarlyTermination
);

/**
 * Route: PATCH & PUT /api/confirmation-records/:id/terminate-confirm & PATCH /api/confirmation-records/:id/confirm-termination
 * [PROVIDER & CUSTOMER] Confirm contract termination (Xác nhận chấm dứt hợp đồng & thu hồi vị trí đỗ xe)
 */
router.patch(
  '/:id/terminate-confirm',
  authenticateToken,
  authorizeRoles('PROVIDER', 'CUSTOMER'),
  validateConfirmContractTermination,
  confirmationRecordController.confirmContractTermination
);

router.patch(
  '/:id/confirm-termination',
  authenticateToken,
  authorizeRoles('PROVIDER', 'CUSTOMER'),
  validateConfirmContractTermination,
  confirmationRecordController.confirmContractTermination
);

router.put(
  '/:id/confirm-termination',
  authenticateToken,
  authorizeRoles('PROVIDER', 'CUSTOMER'),
  validateConfirmContractTermination,
  confirmationRecordController.confirmContractTermination
);

/**
 * Route: PATCH /api/confirmation-records/:id/accept & PUT /api/confirmation-records/:id/accept
 * 3. [CUSTOMER] Accept confirmation record (Chấp nhận / xác nhận biên bản điện tử)
 */
router.patch(
  '/:id/accept',
  authenticateToken,
  authorizeRoles('CUSTOMER'),
  confirmationRecordController.acceptConfirmationRecord
);

router.put(
  '/:id/accept',
  authenticateToken,
  authorizeRoles('CUSTOMER'),
  confirmationRecordController.acceptConfirmationRecord
);

module.exports = router;
