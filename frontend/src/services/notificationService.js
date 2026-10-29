import api from './api';

/**
 * Service giao tiếp với API Thông báo (Notifications)
 */

/**
 * Phát sóng thông báo đẩy Web App
 * @param {Object} data - { title, content, targetRole, category, priority, saveToDb }
 * @returns {Promise<Object>}
 */
export const broadcastPushNotification = async (data) => {
  return await api.post('/notifications/broadcast-push', data);
};

/**
 * Phát sóng thông báo Email hàng loạt
 * @param {Object} data - { subject, htmlContent, recipientScope, emailCategory }
 * @returns {Promise<Object>}
 */
export const broadcastEmailNotification = async (data) => {
  return await api.post('/notifications/broadcast-email', data);
};

/**
 * Lấy danh sách thông báo của tài khoản hiện tại
 * @param {Object} [params] - { isRead, limit, offset }
 * @returns {Promise<{ notifications: Array, unreadCount: number }>}
 */
export const getMyNotifications = async (params = {}) => {
  const res = await api.get('/notifications/my', { params });
  return res?.data || { notifications: [], unreadCount: 0 };
};

/**
 * Đánh dấu một thông báo là đã đọc
 * @param {number|string} notificationId
 * @returns {Promise<Object>}
 */
export const markNotificationAsRead = async (notificationId) => {
  return await api.put(`/notifications/${notificationId}/read`);
};

/**
 * Đánh dấu tất cả thông báo của user là đã đọc
 * @returns {Promise<Object>}
 */
export const markAllNotificationsAsRead = async () => {
  return await api.put('/notifications/read-all');
};

const notificationService = {
  broadcastPushNotification,
  broadcastEmailNotification,
  getMyNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead
};

export default notificationService;
