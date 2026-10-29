const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { authenticateToken, authorizeRoles } = require('../middlewares/authMiddleware');

/**
 * Route định nghĩa các endpoint cho module Thông báo (Notifications)
 * Tuân thủ quy tắc 3-tier: Chỉ định nghĩa URL và gán Middleware xác thực / phân quyền
 */

//Phát sóng thông báo đẩy Web App
router.post(
  '/broadcast-push',
  authenticateToken,
  authorizeRoles('ADMIN'),
  notificationController.broadcastPush
);

//Phát sóng thông báo Email hàng loạt
router.post(
  '/broadcast-email',
  authenticateToken,
  authorizeRoles('ADMIN'),
  notificationController.broadcastEmail
);

//Lấy danh sách thông báo của tài khoản hiện tại
router.get(
  '/my',
  authenticateToken,
  notificationController.getMyNotifications
);

//Đánh dấu tất cả thông báo là đã đọc
router.put(
  '/read-all',
  authenticateToken,
  notificationController.markAllAsRead
);

//Đánh dấu một thông báo cụ thể là đã đọc
router.put(
  '/:id/read',
  authenticateToken,
  notificationController.markAsRead
);

module.exports = router;
