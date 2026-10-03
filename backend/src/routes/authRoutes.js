const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const {
  validateRegisterCustomer,
  validateRegisterProvider,
  validateLogin,
  validateChangePassword,
  validateForgotPasswordRequest,
  validateVerifyResetPassword
} = require('../validations/authValidation');
const { authenticateToken, authorizeRoles } = require('../middlewares/authMiddleware');

/**
 * Định nghĩa API route cho module Auth & Quản trị bãi đỗ xe
 */

// Lấy danh mục tiện ích hệ thống (Bảng Amenity)
router.get('/amenities', authController.getAmenities);

// UC01: Đăng ký Khách hàng (Sinh mật khẩu ngẫu nhiên gửi email)
router.post('/register/customer', validateRegisterCustomer, authController.registerCustomer);

// UC02 / UC03: Đăng ký Chủ bãi đỗ xe (Provider) & Cơ sở bãi xe
router.post('/register/provider', validateRegisterProvider, authController.registerProvider);

// UC03: Đăng nhập
router.post('/login', validateLogin, authController.login);

// Quên mật khẩu: Yêu cầu mã OTP qua Email
router.post('/forgot-password/request', validateForgotPasswordRequest, authController.requestPasswordReset);

// Quên mật khẩu: Xác nhận mã OTP & Đặt lại mật khẩu mới
router.post('/forgot-password/verify-reset', validateVerifyResetPassword, authController.verifyAndResetPassword);

// Đổi mật khẩu lần đầu hoặc theo cá nhân
router.post('/change-password', authenticateToken, validateChangePassword, authController.changePassword);

// Lấy thông tin user hiện tại
router.get('/me', authenticateToken, authController.getMe);

// UC05: Đăng xuất
router.post('/logout', authenticateToken, authController.logout);

module.exports = router;
