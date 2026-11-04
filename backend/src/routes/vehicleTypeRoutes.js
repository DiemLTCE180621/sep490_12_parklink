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
 * M2-UC99: Xem danh sách loại phương tiện (Admin)
 * Hỗ trợ tìm kiếm theo từ khóa và lọc theo trạng thái
 */
router.get(
  '/',
  authenticateToken,
  authorizeRoles('ADMIN'),
  vehicleTypeController.getAllVehicleTypes
);

/**
 * M2-UC99: Xem chi tiết thông tin một loại phương tiện theo ID (Admin)
 */
router.get(
  '/:id',
  authenticateToken,
  authorizeRoles('ADMIN'),
  vehicleTypeController.getVehicleTypeById
);

/**
 * M2-UC98: Tạo mới loại phương tiện (Admin)
 */
router.post(
  '/',
  authenticateToken,
  authorizeRoles('ADMIN'),
  validateCreateVehicleType,
  vehicleTypeController.createVehicleType
);

/**
 * M2-UC100: Cập nhật thông tin loại phương tiện (Admin)
 */
router.put(
  '/:id',
  authenticateToken,
  authorizeRoles('ADMIN'),
  validateUpdateVehicleType,
  vehicleTypeController.updateVehicleType
);

/**
 * M2-UC101: Vô hiệu hóa loại phương tiện (Admin)
 */
router.patch(
  '/:id/deactivate',
  authenticateToken,
  authorizeRoles('ADMIN'),
  vehicleTypeController.deactivateVehicleType
);

/**
 * Bật / Tắt kích hoạt loại phương tiện (Admin)
 */
router.patch(
  '/:id/toggle-status',
  authenticateToken,
  authorizeRoles('ADMIN'),
  vehicleTypeController.toggleVehicleTypeStatus
);

module.exports = router;

