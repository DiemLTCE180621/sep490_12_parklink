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
 * M2-UC21: Approve facility registration
 * Phê duyệt yêu cầu đăng ký bãi đỗ xe
 */
router.put('/registrations/:id/approve', adminController.approveRegistration);

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
 * UC-Admin: View user accounts list (Xem danh sách tài khoản người dùng)
 */
router.get('/users', adminController.getUsers);

/**
 * UC-Admin: View user account details (Xem chi tiết tài khoản người dùng)
 */
router.get('/users/:id', adminController.getUserById);

module.exports = router;
