const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticateToken, authorizeRoles } = require('../middlewares/authMiddleware');

/**
 * Middleware: Chỉ ADMIN mới có quyền truy cập các route này
 */
router.use(authenticateToken, authorizeRoles('ADMIN'));

/**
 * M2-UC20: View pending owner registrations
 * Lấy danh sách các đăng ký bãi đỗ xe đang chờ phê duyệt
 */
router.get('/registrations/pending', adminController.getPendingRegistrations);

/**
 * Lấy chi tiết một yêu cầu đăng ký bãi đỗ xe theo ID
 */
router.get('/registrations/:id', adminController.getRegistrationDetails);
router.get('/facilities/:id', adminController.getRegistrationDetails);

/**
 * M2-UC21: Approve facility registration
 * Phê duyệt sơ bộ yêu cầu đăng ký bãi đỗ xe & phân công nhân viên khảo sát
 */
router.put('/registrations/:id/approve', adminController.approveRegistration);

/**
 * Phân công hoặc đổi Nhân viên khảo sát thực địa cho cơ sở
 */
router.put('/registrations/:id/assign-inspector', adminController.assignInspector);
router.put('/facilities/:id/assign-inspector', adminController.assignInspector);

/**
 * M2-UC22: Reject facility registration
 * Từ chối yêu cầu đăng ký bãi đỗ xe
 */
router.put('/registrations/:id/reject', adminController.rejectRegistration);

/**
 * M2-UC21b: Finalize facility (Admin hoàn tất chuẩn bị dữ liệu) → APPROVED + gửi QR mail
 */
router.put('/registrations/:id/finalize', adminController.finalizeRegistration);

/**
 * Provider xác nhận thanh toán (cập nhật payment_status → PAID → tự động VISIBLE)
 */
router.put('/registrations/:id/payment-confirm', adminController.confirmPayment);

/**
 * Lấy danh sách tất cả các bãi đỗ xe trên hệ thống
 */
router.get('/facilities', adminController.getAllFacilities);

/**
 * Khóa / Mở khóa bãi đỗ xe (Chuyển đổi visibility_status VISIBLE <-> HIDDEN)
 */
router.put('/facilities/:id/toggle-lock', adminController.toggleLockFacility);

/**
 * Cập nhật thông tin cơ bản của bãi đỗ xe
 */
router.put('/facilities/:id', adminController.updateFacility);

/**
 *  [ADMIN] Xem toàn bộ Hợp đồng / Biên bản xác nhận trên hệ thống
 */
const confirmationRecordController = require('../controllers/confirmationRecordController');
const { validateAdminQueryConfirmationRecords } = require('../validations/confirmationRecordValidation');
router.get(
  '/confirmation-records',
  validateAdminQueryConfirmationRecords,
  confirmationRecordController.getAllConfirmationRecords
);

module.exports = router;

