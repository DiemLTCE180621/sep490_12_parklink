const express = require('express');
const router = express.Router();

const confirmationRecordController = require('../controllers/confirmationRecordController');
const { authenticateToken, authorizeRoles } = require('../middlewares/authMiddleware');
const { validateCreateConfirmationRecord } = require('../validations/confirmationRecordValidation');

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
 * Route: GET /api/confirmation-records/:id
 * Xem thông tin chi tiết một Biên bản xác nhận điện tử
 */
router.get(
  '/:id',
  authenticateToken,
  confirmationRecordController.getConfirmationRecordById
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
