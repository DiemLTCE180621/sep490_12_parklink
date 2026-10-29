const express = require('express');
const router = express.Router();
const platformFeeController = require('../controllers/platformFeeController');
const { authenticateToken, authorizeRoles } = require('../middlewares/authMiddleware');
const {
  validateCreatePlatformFee,
  validateUpdatePlatformFee
} = require('../validations/platformFeeValidation');

/**
 * Tính toán phí nền tảng ước tính dựa trên số slot
 */
router.get(
  '/calculate',
  authenticateToken,
  authorizeRoles('ADMIN', 'PROVIDER'),
  platformFeeController.calculateFee
);

/**
 * Xem danh sách biểu phí nền tảng (View Platform Fee)
 */
router.get(
  '/',
  authenticateToken,
  authorizeRoles('ADMIN', 'PROVIDER'),
  platformFeeController.getAllFees
);

/**
 * Lấy danh sách biểu phí đang hoạt động
 */
router.get(
  '/active',
  platformFeeController.getActiveFees
);

/**
 * Xem chi tiết một gói biểu phí nền tảng theo ID
 */
router.get(
  '/:id',
  authenticateToken,
  authorizeRoles('ADMIN', 'PROVIDER'),
  platformFeeController.getFeeById
);

/**
 *Tạo mới biểu phí nền tảng
 */
router.post(
  '/',
  authenticateToken,
  authorizeRoles('ADMIN'),
  validateCreatePlatformFee,
  platformFeeController.createFee
);

/**
 *Cập nhật thông tin biểu phí
 */
router.put(
  '/:id',
  authenticateToken,
  authorizeRoles('ADMIN'),
  validateUpdatePlatformFee,
  platformFeeController.updateFee
);

/**
 * Bật / Tắt kích hoạt biểu phí
 */
router.patch(
  '/:id/toggle-status',
  authenticateToken,
  authorizeRoles('ADMIN'),
  platformFeeController.toggleFeeStatus
);

module.exports = router;
