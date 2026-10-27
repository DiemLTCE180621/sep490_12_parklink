const prisma = require('../config/prisma');

/**
 * Repository xử lý giao tiếp cơ sở dữ liệu cho module Notifications
 * Tuân thủ quy tắc 3-tier architecture: Nơi DUY NHẤT gọi Prisma Client
 */
class NotificationRepository {
  /**
   * Tạo một thông báo mới
   */
  async createNotification(data) {
    return await prisma.notification.create({
      data
    });
  }

  /**
   * Tạo hàng loạt thông báo cho danh sách user (Broadcast)
   */
  async createManyNotifications(dataArray) {
    if (!dataArray || dataArray.length === 0) return { count: 0 };
    return await prisma.notification.createMany({
      data: dataArray
    });
  }

  /**
   * Lấy danh sách thông báo của một người dùng kèm phân trang và lọc theo trạng thái đọc
   */
  /**
   * Lấy danh sách thông báo của một người dùng kèm phân trang và lọc theo trạng thái đọc
   * Loại trừ type = 'EMAIL_LOG' để không hiển thị email lên quả chuông web
   */
  async getNotificationsByUserId(userId, { isRead, limit = 20, offset = 0 } = {}) {
    const where = {
      user_id: Number(userId),
      type: {
        not: 'EMAIL_LOG' // Loại trừ các bản ghi log email, không hiển thị lên quả chuông
      }
    };

    if (isRead !== undefined && isRead !== null) {
      where.is_read = isRead === true || isRead === 'true';
    }

    return await prisma.notification.findMany({
      where,
      orderBy: {
        created_at: 'desc'
      },
      take: Number(limit) || 20,
      skip: Number(offset) || 0
    });
  }

  /**
   * Đếm số lượng thông báo chưa đọc của user (loại trừ EMAIL_LOG)
   */
  async countUnreadByUserId(userId) {
    return await prisma.notification.count({
      where: {
        user_id: Number(userId),
        is_read: false,
        type: {
          not: 'EMAIL_LOG' // Không tính email log vào badge đếm thông báo chưa đọc
        }
      }
    });
  }

  /**
   * Lấy danh sách lịch sử phát sóng Email (dành cho Admin tra cứu nếu cần)
   */
  async getEmailLogs({ limit = 20, offset = 0 } = {}) {
    return await prisma.notification.findMany({
      where: {
        type: 'EMAIL_LOG'
      },
      orderBy: {
        created_at: 'desc'
      },
      take: Number(limit) || 20,
      skip: Number(offset) || 0,
      include: {
        user: {
          select: {
            id: true,
            full_name: true,
            email: true
          }
        }
      }
    });
  }

  /**
   * Đánh dấu 1 thông báo là đã đọc
   */
  async markAsRead(id, userId) {
    return await prisma.notification.updateMany({
      where: {
        id: Number(id),
        user_id: Number(userId)
      },
      data: {
        is_read: true
      }
    });
  }

  /**
   * Đánh dấu tất cả thông báo của user là đã đọc
   */
  async markAllAsRead(userId) {
    return await prisma.notification.updateMany({
      where: {
        user_id: Number(userId),
        is_read: false
      },
      data: {
        is_read: true
      }
    });
  }

  /**
   * Lấy danh sách người dùng mục tiêu theo phạm vi vai trò (ALL / CUSTOMER / PROVIDER)
   */
  async getTargetUsers(roleScope = 'ALL') {
    const where = {
      status: 'ACTIVE'
    };

    if (roleScope === 'ALL') {
      where.role = {
        name: { in: ['CUSTOMER', 'PROVIDER'] }
      };
    } else if (roleScope) {
      where.role = {
        name: roleScope
      };
    }

    return await prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        full_name: true,
        role: {
          select: {
            name: true
          }
        }
      }
    });
  }
}

module.exports = new NotificationRepository();
