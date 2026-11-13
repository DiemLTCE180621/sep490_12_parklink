const prisma = require('../config/prisma');

/**
 * Repository xử lý giao tiếp cơ sở dữ liệu cho module Notifications
 * Tuân thủ quy tắc 3-tier architecture: Nơi DUY NHẤT gọi Prisma Client
 * Áp dụng mô hình Fan-out on Read với bảng notification_reads
 */
class NotificationRepository {
  /**
   * Tạo một thông báo mới (cá nhân hoặc broadcast)
   */
  async createNotification(data) {
    return await prisma.notification.create({
      data
    });
  }

  /**
   * Tạo thông báo broadcast hệ thống (chỉ lưu 1 bản ghi duy nhất)
   */
  async createBroadcastNotification({ title, content, type, targetRole = 'ALL' }) {
    return await prisma.notification.create({
      data: {
        user_id: null, // Broadcast chung, không nhân bản theo user_id
        target_role: targetRole,
        title,
        content,
        type: type || 'HỆ THỐNG',
        is_read: false
      }
    });
  }

  /**
   * Tạo hàng loạt thông báo cho danh sách user (hỗ trợ tương thích ngược nếu cần)
   */
  async createManyNotifications(dataArray) {
    if (!dataArray || dataArray.length === 0) return { count: 0 };
    return await prisma.notification.createManyAndReturn({
      data: dataArray
    });
  }

  /**
   * Lấy danh sách thông báo của người dùng (kết hợp thông báo cá nhân và broadcast)
   * Loại trừ type = 'EMAIL_LOG' để không hiển thị email lên quả chuông web
   */
  async getNotificationsByUserId(userId, userRole = null, { isRead, limit = 20, offset = 0 } = {}) {
    const roleFilter = userRole && userRole !== 'ALL'
      ? { in: ['ALL', userRole] }
      : 'ALL';

    const where = {
      type: {
        not: 'EMAIL_LOG'
      },
      OR: [
        { user_id: Number(userId) },
        {
          user_id: null,
          target_role: roleFilter
        }
      ]
    };

    const notifications = await prisma.notification.findMany({
      where,
      include: {
        reads: {
          where: {
            user_id: Number(userId)
          },
          select: {
            user_id: true,
            read_at: true
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      },
      take: Number(limit) || 20,
      skip: Number(offset) || 0
    });

    const formatted = notifications.map((n) => {
      const isReadStatus = n.user_id !== null
        ? n.is_read
        : (Array.isArray(n.reads) && n.reads.length > 0);

      const { reads, ...notificationData } = n;
      return {
        ...notificationData,
        is_read: Boolean(isReadStatus)
      };
    });

    if (isRead !== undefined && isRead !== null) {
      const targetIsRead = isRead === true || isRead === 'true';
      return formatted.filter((item) => item.is_read === targetIsRead);
    }

    return formatted;
  }

  /**
   * Đếm số lượng thông báo chưa đọc của user (gồm cá nhân chưa đọc + broadcast chưa đọc)
   */
  async countUnreadByUserId(userId, userRole = null) {
    const roleFilter = userRole && userRole !== 'ALL'
      ? { in: ['ALL', userRole] }
      : 'ALL';

    const [unreadPersonal, unreadBroadcast] = await Promise.all([
      // 1. Thông báo cá nhân chưa đọc
      prisma.notification.count({
        where: {
          user_id: Number(userId),
          is_read: false,
          type: {
            not: 'EMAIL_LOG'
          }
        }
      }),
      // 2. Thông báo broadcast mà user chưa lưu trong bảng notification_reads
      prisma.notification.count({
        where: {
          user_id: null,
          type: {
            not: 'EMAIL_LOG'
          },
          target_role: roleFilter,
          reads: {
            none: {
              user_id: Number(userId)
            }
          }
        }
      })
    ]);

    return unreadPersonal + unreadBroadcast;
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
   * Nếu là thông báo cá nhân: update is_read = true
   * Nếu là thông báo broadcast: upsert vào bảng notification_reads
   */
  async markAsRead(id, userId) {
    const notif = await prisma.notification.findUnique({
      where: { id: Number(id) }
    });

    if (!notif) {
      return { count: 0 };
    }

    if (notif.user_id !== null) {
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

    // Thông báo broadcast chung
    await prisma.notification_Read.upsert({
      where: {
        notification_id_user_id: {
          notification_id: Number(id),
          user_id: Number(userId)
        }
      },
      create: {
        notification_id: Number(id),
        user_id: Number(userId)
      },
      update: {}
    });

    return { count: 1 };
  }

  /**
   * Đánh dấu tất cả thông báo của user là đã đọc
   * Cập nhật thông báo cá nhân và ghi nhận các broadcast chưa đọc vào notification_reads
   */
  async markAllAsRead(userId, userRole = null) {
    const roleFilter = userRole && userRole !== 'ALL'
      ? { in: ['ALL', userRole] }
      : 'ALL';

    // 1. Đánh dấu tất cả thông báo cá nhân
    await prisma.notification.updateMany({
      where: {
        user_id: Number(userId),
        is_read: false
      },
      data: {
        is_read: true
      }
    });

    // 2. Tìm tất cả thông báo broadcast chưa đọc của user
    const unreadBroadcasts = await prisma.notification.findMany({
      where: {
        user_id: null,
        type: {
          not: 'EMAIL_LOG'
        },
        target_role: roleFilter,
        reads: {
          none: {
            user_id: Number(userId)
          }
        }
      },
      select: {
        id: true
      }
    });

    // 3. Chèn vào bảng notification_reads
    if (unreadBroadcasts.length > 0) {
      await prisma.notification_Read.createMany({
        data: unreadBroadcasts.map((b) => ({
          notification_id: b.id,
          user_id: Number(userId)
        })),
        skipDuplicates: true
      });
    }

    return { count: unreadBroadcasts.length };
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
