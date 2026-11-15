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

    //get target
    const targetUsers = await notificationRepository.getTargetUsers(normalizedRole);
    const recipientCount = targetUsers.length;

    // optional save to db (chỉ lưu 1 bản ghi duy nhất, áp dụng Fan-out on Read)
    let persistedNotification = null;
    if (saveToDb && recipientCount > 0) {
      persistedNotification = await notificationRepository.createBroadcastNotification({
        title: title.trim(),
        content: content.trim(),
        type: category || 'HỆ THỐNG',
        targetRole: normalizedRole
      });
    }

    // Broadcast throug socket.io
    const io = getIO();
    if (io) {
      const notificationId = persistedNotification ? persistedNotification.id : `broadcast_${Date.now()}`;
      const socketPayload = {
        id: notificationId,
        title: title.trim(),
        content: content.trim(),
        category,
        priority,
        showToast: showToast !== false,
        targetRole: normalizedRole,
        created_at: persistedNotification?.created_at?.toISOString() || new Date().toISOString(),
        is_persisted: saveToDb
      };

      const adminId = adminUser?.id || adminUser?.userId;
      if (normalizedRole === 'ALL') {
        io.to('role_CUSTOMER').to('role_PROVIDER').emit('system_notification', socketPayload);
      } else if (normalizedRole === 'ADMIN' && adminId) {
        io.to(`user_${adminId}`).emit('system_notification', socketPayload);
      } else {
        io.to(`role_${normalizedRole}`).emit('system_notification', socketPayload);
      }
      console.log(`[Socket Broadcast] Đã phát sóng thông báo (ID: ${notificationId}, Priority: ${priority}, Toast: ${showToast}) tới nhóm ${normalizedRole}`);
    }

    return {
      taskId: `PUSH_${Date.now()}`,
      totalRecipients: recipientCount,
      targetRole: normalizedRole,
      timestamp: new Date().toISOString()
    };
  }

  //email broadcast
  async broadcastEmailNotification(payload, adminUser) {
    const {
      subject,
      htmlContent,
      recipientScope = 'ALL',
      emailCategory = 'Bảo trì & Cập nhật kỹ thuật',
      testEmail
    } = payload;

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

    const validScopes = ['ALL', 'CUSTOMER', 'PROVIDER', 'ADMIN'];
    const normalizedScope = validScopes.includes(recipientScope) ? recipientScope : 'ALL';

    //get target list
    let recipientEmails = [];
    if (normalizedScope === 'ADMIN') {
      const emailToUse = testEmail && typeof testEmail === 'string' && testEmail.trim().includes('@')
        ? testEmail.trim()
        : adminUser?.email;

      if (!emailToUse || !emailToUse.includes('@')) {
        const error = new Error('Vui lòng cung cấp một địa chỉ email hợp lệ để nhận email thử nghiệm!');
        error.status = 400;
        throw error;
      }
      recipientEmails = [emailToUse];
    } else {
      const targetUsers = await notificationRepository.getTargetUsers(normalizedScope);
      recipientEmails = targetUsers
        .map((u) => u.email)
        .filter((email) => email && email.includes('@'));
    }

    if (recipientEmails.length === 0) {
      const error = new Error('Không tìm thấy người dùng nào phù hợp với phạm vi nhận email đã chọn!');
      error.status = 404;
      throw error;
    }

    //HTML with ParkLink template 
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

    //innit email sending task
    const taskResult = await emailService.sendBroadcastEmail({
      recipientEmails,
      subject: subject.trim(),
      htmlContent: formattedHtml
    });

    // save 1 record for admin (type = 'EMAIL_LOG') to save email broadcast history
    const adminId = adminUser?.id || adminUser?.userId;
    if (adminId) {
      try {
        await notificationRepository.createNotification({
          user_id: Number(adminId),
          title: `[EMAIL PHÁT SÓNG] ${subject.trim()}`,
          content: `Đã phát sóng email tới ${recipientEmails.length} người dùng (Phạm vi: ${normalizedScope}, Thể loại: ${emailCategory}, Mã Batch: ${taskResult.batchId}).`,
          type: 'EMAIL_LOG',
          is_read: true // mark read
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

  // get current user's notifications (hỗ trợ cả personal notifications và broadcast)
  async getUserNotifications(userId, userRole = null, query = {}) {
    const { isRead, limit = 20, offset = 0 } = query;

    const [notifications, unreadCount] = await Promise.all([
      notificationRepository.getNotificationsByUserId(userId, userRole, { isRead, limit, offset }),
      notificationRepository.countUnreadByUserId(userId, userRole)
    ]);

    return {
      notifications,
      unreadCount
    };
  }

  async markAsRead(notificationId, userId, userRole = null) {
    if (!notificationId) {
      const error = new Error('Thiếu ID thông báo!');
      error.status = 400;
      throw error;
    }

    await notificationRepository.markAsRead(notificationId, userId);
    const unreadCount = await notificationRepository.countUnreadByUserId(userId, userRole);

    return {
      id: Number(notificationId),
      is_read: true,
      unreadCount
    };
  }

  async markAllAsRead(userId, userRole = null) {
    await notificationRepository.markAllAsRead(userId, userRole);

    return {
      success: true,
      unreadCount: 0
    };
  }
}

module.exports = new NotificationService();
