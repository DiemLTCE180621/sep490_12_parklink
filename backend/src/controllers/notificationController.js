const notificationService = require('../services/notificationService');

/**
 * Controller làm nhiệm vụ lễ tân cho module Thông báo (Notifications)
 * Tuân thủ quy tắc 3-tier: Nhận request, gọi Service và trả về JSON
 */
class NotificationController {
  //Phát sóng thông báo đẩy Web App (Admin only)
  async broadcastPush(req, res, next) {
    try {
      const result = await notificationService.broadcastPushNotification(req.body, req.user);
      return res.status(200).json({
        status: 'success',
        message: 'Đã phát sóng thông báo Web App thành công!',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  //Phát sóng thông báo Email hàng loạt (Admin only)
  async broadcastEmail(req, res, next) {
    try {
      const result = await notificationService.broadcastEmailNotification(req.body, req.user);
      return res.status(200).json({
        status: 'success',
        message: 'Đã khởi tạo tác vụ gửi email thông báo thành công!',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  //Lấy danh sách thông báo của tài khoản đăng nhập
  async getMyNotifications(req, res, next) {
    try {
      const userId = req.user.id || req.user.userId;
      const result = await notificationService.getUserNotifications(userId, req.query);
      return res.status(200).json({
        status: 'success',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  //Đánh dấu một thông báo là đã đọc
  async markAsRead(req, res, next) {
    try {
      const userId = req.user.id || req.user.userId;
      const { id } = req.params;
      const result = await notificationService.markAsRead(id, userId);
      return res.status(200).json({
        status: 'success',
        message: 'Đã đánh dấu thông báo là đã đọc.',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  //Đánh dấu tất cả thông báo của người dùng là đã đọc
  async markAllAsRead(req, res, next) {
    try {
      const userId = req.user.id || req.user.userId;
      const result = await notificationService.markAllAsRead(userId);
      return res.status(200).json({
        status: 'success',
        message: 'Đã đánh dấu tất cả thông báo là đã đọc.',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new NotificationController();
