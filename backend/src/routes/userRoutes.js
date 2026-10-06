const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticateToken, authorizeRoles } = require('../middlewares/authMiddleware');

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
router.get('/:id', userController.getUserById);

/**
 * UC Tương lai: Lock / Unlock user account (Khóa / Mở khóa tài khoản người dùng)
 */
router.put('/:id/toggle-status', userController.toggleUserStatus);

module.exports = router;
