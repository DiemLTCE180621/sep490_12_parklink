const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticateToken, authorizeRoles } = require('../middlewares/authMiddleware');

/**
 * Middleware: Chỉ ADMIN mới có quyền truy cập các route này
 */
router.use(authenticateToken, authorizeRoles('ADMIN'));
router.get('/transactions', require('../controllers/transactionController').getHistory);

router.get('/dashboard/overview', adminController.getDashboardOverview);
router.get('/dashboard/platform-fees/:month', adminController.getDashboardPlatformFeeTransactionsByMonth);
router.get('/dashboard/export-revenue', adminController.exportRevenueReport);

/**
 * Lấy đăng ký cơ sở chờ duyệt
 */
router.get('/registrations/pending', adminController.getPendingRegistrations);

/**
 * Lấy chi tiết một yêu cầu đăng ký bãi đỗ xe theo ID
 */
router.get('/registrations/:id', adminController.getRegistrationDetails);
router.get('/facilities/:id', adminController.getRegistrationDetails);

/**
 * Duyệt sơ bộ và phân công khảo sát
 */
router.put('/registrations/:id/approve', adminController.approveRegistration);

/**
 * Phân công hoặc đổi Nhân viên khảo sát thực địa cho cơ sở
 */
router.put('/registrations/:id/assign-inspector', adminController.assignInspector);
router.put('/facilities/:id/assign-inspector', adminController.assignInspector);

/**
 * Từ chối đăng ký cơ sở
 */
router.put('/registrations/:id/reject', adminController.rejectRegistration);

/**
 * Phê duyệt cơ sở và gửi mã QR
 */
router.put('/registrations/:id/finalize', adminController.finalizeRegistration);

/**
 * Hiển thị cơ sở sau khi thanh toán
 */
router.put('/registrations/:id/payment-confirm', adminController.confirmPayment);

/**
 * Lấy danh sách tất cả các bãi đỗ xe trên hệ thống
 */
router.get('/facilities', adminController.getAllFacilities);

/**
 * Khóa hoặc mở khóa cơ sở
 */
router.put('/facilities/:id/toggle-lock', adminController.toggleLockFacility);

/**
 * Cập nhật thông tin cơ bản của bãi đỗ xe
 */
router.put('/facilities/:id', adminController.updateFacility);

/**
 * Xem hợp đồng và biên bản xác nhận
 */
const confirmationRecordController = require('../controllers/confirmationRecordController');
const { validateAdminQueryConfirmationRecords } = require('../validations/confirmationRecordValidation');
const { validateProviderRevenueQuery } = require('../validations/adminValidation');

router.get(
  '/confirmation-records',
  validateAdminQueryConfirmationRecords,
  confirmationRecordController.getAllConfirmationRecords
);

router.get(
  '/reports/provider-revenue',
  validateProviderRevenueQuery,
  adminController.getProviderRevenueStatistics
);

module.exports = router;
