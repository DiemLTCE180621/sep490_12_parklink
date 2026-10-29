const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticateToken, authorizeRoles } = require('../middlewares/authMiddleware');

const { validateUserId, validateUpdateUser } = require('../validations/userValidation');

/**
 * Middleware: Chỉ ADMIN mới có quyền thực hiện các thao tác Quản lý Tài khoản này
 */
router.use(authenticateToken, authorizeRoles('ADMIN'));

/**
 * UC11: View user accounts list (Xem danh sách tài khoản người dùng)
 */
router.get('/', userController.getUsers);

/**
 * UC12: View user account details (Xem chi tiết tài khoản người dùng)
 */
router.get('/:id', validateUserId, userController.getUserById);

/**
 * UC13: Update user information (Admin cập nhật thông tin người dùng)
 */
router.put('/:id', validateUserId, validateUpdateUser, userController.updateUser);

/**
 * UC10: Force reset user password (Admin cưỡng chế đặt lại mật khẩu)
 */
router.post('/:id/reset-password', validateUserId, userController.forceResetPassword);

/**
 * UC14 & UC15: Lock / Unlock user account (Khóa / Mở khóa tài khoản người dùng)
 */
router.put('/:id/toggle-status', validateUserId, userController.toggleUserStatus);

module.exports = router;
