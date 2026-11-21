const express = require('express');
const router = express.Router();
const vehicleTypeController = require('../controllers/vehicleTypeController');
const { authenticateToken, authorizeRoles } = require('../middlewares/authMiddleware');
const {
  validateCreateVehicleType,
  validateUpdateVehicleType
} = require('../validations/vehicleTypeValidation');

/**
 * Lấy danh sách các loại phương tiện đang hoạt động (Active)
 * Dùng cho Provider chọn khi đăng ký bãi xe, Customer tìm kiếm
 */
router.get(
  '/active',
  vehicleTypeController.getActiveVehicleTypes
);

/**
 * Lấy danh sách loại phương tiện
 * Hỗ trợ tìm kiếm theo từ khóa và lọc theo trạng thái
 */
router.get(
  '/',
  authenticateToken,
  authorizeRoles('ADMIN'),
  vehicleTypeController.getAllVehicleTypes
);

/**
 * Lấy chi tiết loại phương tiện
 */
router.get(
  '/:id',
  authenticateToken,
  authorizeRoles('ADMIN'),
  vehicleTypeController.getVehicleTypeById
);

/**
 * Tạo loại phương tiện
 */
router.post(
  '/',
  authenticateToken,
  authorizeRoles('ADMIN'),
  validateCreateVehicleType,
  vehicleTypeController.createVehicleType
);

/**
 * Cập nhật loại phương tiện
 */
router.put(
  '/:id',
  authenticateToken,
  authorizeRoles('ADMIN'),
  validateUpdateVehicleType,
  vehicleTypeController.updateVehicleType
);

/**
 * Vô hiệu hóa loại phương tiện
 */
router.patch(
  '/:id/deactivate',
  authenticateToken,
  authorizeRoles('ADMIN'),
  vehicleTypeController.deactivateVehicleType
);

/**
 * Bật hoặc tắt loại phương tiện
 */
router.patch(
  '/:id/toggle-status',
  authenticateToken,
  authorizeRoles('ADMIN'),
  vehicleTypeController.toggleVehicleTypeStatus
);

module.exports = router;

