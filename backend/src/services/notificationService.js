const notificationRepository = require('../repositories/notificationRepository');
const emailService = require('../utils/emailService');
const { getIO } = require('../config/socket');

//Service xử lý toàn bộ Business Logic liên quan đến thông báo (Notifications)

class NotificationService {
  //Phát sóng thông báo đẩy Web App
  async broadcastPushNotification(payload, adminUser) {
    const {
      title,
      content,
      targetRole = 'ALL',
      category = 'Bảo trì hệ thống',
      priority = 'Bình thường',
      saveToDb = true,
      showToast = true
    } = payload;

    //Kiểm tra hợp lệ dữ liệu đầu vào
    if (!title || !title.trim()) {
      const error = new Error('Tiêu đề thông báo không được để trống!');
      error.status = 400;
      throw error;
    }

    if (!content || !content.trim()) {
      const error = new Error('Nội dung thông báo không được để trống!');
      error.status = 400;
      throw error;
    }

    const validRoles = ['ALL', 'CUSTOMER', 'PROVIDER', 'ADMIN'];
    const normalizedRole = validRoles.includes(targetRole) ? targetRole : 'ALL';

    // 1. Truy vấn danh sách người dùng mục tiêu từ Database
    const targetUsers = await notificationRepository.getTargetUsers(normalizedRole);
    const recipientCount = targetUsers.length;

    // 2. Lưu bản ghi vào PostgreSQL (nếu tuỳ chọn lưu được bật)
    if (saveToDb && recipientCount > 0) {
      const notificationRecords = targetUsers.map((user) => ({
        user_id: user.id,
        title: title.trim(),
        content: content.trim(),
        type: category || 'HỆ THỐNG',
        is_read: false
      }));

      await notificationRepository.createManyNotifications(notificationRecords);
    }

    // 3. Phát sóng thời gian thực qua Socket.IO tới các client đang kết nối
    const io = getIO();
    if (io) {
      const socketPayload = {
        id: `broadcast_${Date.now()}`,
        title: title.trim(),
        content: content.trim(),
        category,
        priority,
        showToast: showToast !== false,
        targetRole: normalizedRole,
        created_at: new Date().toISOString()
      };

      const adminId = adminUser?.id || adminUser?.userId;
      if (normalizedRole === 'ALL') {
        // Miễn nhiễm cho Admin: Chỉ phát sóng tới khách hàng và chủ bãi xe
        io.to('role_CUSTOMER').to('role_PROVIDER').emit('system_notification', socketPayload);
      } else if (normalizedRole === 'ADMIN' && adminId) {
        // Gửi thử nghiệm riêng cho Admin đang thao tác
        io.to(`user_${adminId}`).emit('system_notification', socketPayload);
      } else {
        io.to(`role_${normalizedRole}`).emit('system_notification', socketPayload);
      }
      console.log(`[Socket Broadcast] Đã phát sóng thông báo (Priority: ${priority}, Toast: ${showToast}) tới nhóm ${normalizedRole}`);
    }

    return {
      taskId: `PUSH_${Date.now()}`,
      totalRecipients: recipientCount,
      targetRole: normalizedRole,
      timestamp: new Date().toISOString()
    };
  }

  //Gửi email phát sóng cho toàn bộ người dùng hoặc theo nhóm vai trò
  async broadcastEmailNotification(payload, adminUser) {
    const {
      subject,
      htmlContent,
      recipientScope = 'ALL',
      emailCategory = 'Bảo trì & Cập nhật kỹ thuật'
    } = payload;

    // EX-01: Kiểm tra tính hợp lệ
    if (!subject || !subject.trim()) {
      const error = new Error('Tiêu đề Email không được để trống!');
      error.status = 400;
      throw error;
    }

    if (!htmlContent || !htmlContent.trim()) {
      const error = new Error('Nội dung Email không được để trống!');
      error.status = 400;
      throw error;
    }

    const validScopes = ['ALL', 'CUSTOMER', 'PROVIDER'];
    const normalizedScope = validScopes.includes(recipientScope) ? recipientScope : 'ALL';

    // 1. Lấy danh sách email người dùng hợp lệ
    const targetUsers = await notificationRepository.getTargetUsers(normalizedScope);
    const recipientEmails = targetUsers
      .map((u) => u.email)
      .filter((email) => email && email.includes('@'));

    if (recipientEmails.length === 0) {
      const error = new Error('Không tìm thấy người dùng nào phù hợp với phạm vi nhận email đã chọn!');
      error.status = 404;
      throw error;
    }

    // 2. Định dạng nội dung HTML gửi đi kèm template ParkLink
    const formattedHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 650px; margin: 0 auto; padding: 25px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h2 style="color: #0d9488; margin: 0;">PARKLINK THÔNG BÁO HỆ THỐNG</h2>
          <p style="color: #64748b; font-size: 13px; margin: 5px 0 0 0;">Phân loại: ${emailCategory}</p>
        </div>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 15px 0 25px 0;" />
        <div style="color: #334155; line-height: 1.7; font-size: 15px;">
          ${htmlContent}
        </div>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0 15px 0;" />
        <div style="text-align: center; color: #94a3b8; font-size: 12px; line-height: 1.5;">
          <p style="margin: 0;">Đây là email tự động từ Ban Quản Trị ParkLink. Vui lòng không trả lời trực tiếp email này.</p>
          <p style="margin: 4px 0 0 0;">© 2026 ParkLink. Nền tảng kết nối dịch vụ bãi đỗ xe theo tháng.</p>
        </div>
      </div>
    `;

    // 3. Khởi tạo tác vụ gửi email chạy ngầm
    const taskResult = await emailService.sendBroadcastEmail({
      recipientEmails,
      subject: subject.trim(),
      htmlContent: formattedHtml
    });

    // 4. Lưu 1 bản ghi đại diện cho Admin vào PostgreSQL (type = 'EMAIL_LOG')
    // Bản ghi này lưu lịch sử đợt phát email mà không hiển thị lên quả chuông của user hay admin
    const adminId = adminUser?.id || adminUser?.userId;
    if (adminId) {
      try {
        await notificationRepository.createNotification({
          user_id: Number(adminId),
          title: `[EMAIL PHÁT SÓNG] ${subject.trim()}`,
          content: `Đã phát sóng email tới ${recipientEmails.length} người dùng (Phạm vi: ${normalizedScope}, Thể loại: ${emailCategory}, Mã Batch: ${taskResult.batchId}).`,
          type: 'EMAIL_LOG',
          is_read: true // Đánh dấu đã đọc để không gây badge unread cho Admin
        });
        console.log(`[Notification Service] Đã lưu 1 bản ghi EMAIL_LOG cho Admin (ID: ${adminId})`);
      } catch (dbErr) {
        console.error('[Notification Service Error] Lỗi lưu bản ghi EMAIL_LOG:', dbErr.message);
      }
    }

    return {
      batchId: taskResult.batchId,
      totalQueued: taskResult.totalQueued,
      recipientScope: normalizedScope,
      timestamp: taskResult.timestamp
    };
  }

  //Lấy danh sách thông báo của người dùng hiện tại
  async getUserNotifications(userId, query = {}) {
    const { isRead, limit = 20, offset = 0 } = query;

    const [notifications, unreadCount] = await Promise.all([
      notificationRepository.getNotificationsByUserId(userId, { isRead, limit, offset }),
      notificationRepository.countUnreadByUserId(userId)
    ]);

    return {
      notifications,
      unreadCount
    };
  }

  //Đánh dấu 1 thông báo là đã đọc
  async markAsRead(notificationId, userId) {
    if (!notificationId) {
      const error = new Error('Thiếu ID thông báo!');
      error.status = 400;
      throw error;
    }

    await notificationRepository.markAsRead(notificationId, userId);
    const unreadCount = await notificationRepository.countUnreadByUserId(userId);

    return {
      id: Number(notificationId),
      is_read: true,
      unreadCount
    };
  }

  //Đánh dấu tất cả thông báo của người dùng là đã đọc
  async markAllAsRead(userId) {
    await notificationRepository.markAllAsRead(userId);

    return {
      success: true,
      unreadCount: 0
    };
  }
}

module.exports = new NotificationService();
