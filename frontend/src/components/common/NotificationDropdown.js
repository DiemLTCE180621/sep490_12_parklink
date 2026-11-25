import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Bell,
  CheckCheck,
  Radio,
  CalendarCheck,
  FileText,
  AlertCircle,
  Info,
  Loader2
} from 'lucide-react';
import {
  getMyNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead
} from '../../services/notificationService';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import NotificationDetailModal from '../modals/NotificationDetailModal';
import Toast from './Toast';

// Định dạng thời gian tương đối theo ngôn ngữ đang chọn
const formatRelativeTime = (dateString, t, language) => {
  if (!dateString) return '';
  const now = new Date();
  const past = new Date(dateString);
  const diffInSeconds = Math.floor((now - past) / 1000);

  if (diffInSeconds < 60) return t('notifications.time.justNow');
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return t('notifications.time.minutesAgo', { count: diffInMinutes });
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return t('notifications.time.hoursAgo', { count: diffInHours });
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) return t('notifications.time.daysAgo', { count: diffInDays });
  return past.toLocaleDateString(language === 'en' ? 'en-GB' : 'vi-VN');
};

// Icon, màu sắc và nhãn theo loại thông báo
const getNotificationTypeDetails = (type = '', t) => {
  const normalized = (type || '').toUpperCase();
  if (normalized.includes('BẢO TRÌ') || normalized.includes('MAINTENANCE') || normalized.includes('HỆ THỐNG')) {
    return {
      icon: Radio,
      bgColor: 'bg-indigo-50 text-indigo-600',
      badgeColor: 'text-indigo-600 bg-indigo-50 border-indigo-200',
      label: t('notifications.badges.system')
    };
  }
  if (normalized.includes('ĐẶT CHỖ') || normalized.includes('RESERVATION') || normalized.includes('BOOKING')) {
    return {
      icon: CalendarCheck,
      bgColor: 'bg-teal-50 text-teal-600',
      badgeColor: 'text-teal-700 bg-teal-50 border-teal-200',
      label: t('notifications.badges.reservation')
    };
  }
  if (normalized.includes('HỢP ĐỒNG') || normalized.includes('CONTRACT')) {
    return {
      icon: FileText,
      bgColor: 'bg-amber-50 text-amber-600',
      badgeColor: 'text-amber-700 bg-amber-50 border-amber-200',
      label: t('notifications.badges.contract')
    };
  }
  if (normalized.includes('KHIẾU NẠI') || normalized.includes('COMPLAINT')) {
    return {
      icon: AlertCircle,
      bgColor: 'bg-rose-50 text-rose-600',
      badgeColor: 'text-rose-700 bg-rose-50 border-rose-200',
      label: t('notifications.badges.complaint')
    };
  }
  return {
    icon: Info,
    bgColor: 'bg-slate-100 text-slate-600',
    badgeColor: 'text-slate-600 bg-slate-50 border-slate-200',
    label: t('notifications.badges.general')
  };
};

//notification dropdown
/**
 * Component Dropdown hiển thị danh sách thông báo và đánh dấu đã đọc (UC-67, UC-68)
 */
const NotificationDropdown = () => {
  const { t, i18n } = useTranslation('common');
  const tRef = useRef(t);
  tRef.current = t;

  const { isAuthenticated } = useAuth();
  const socket = useSocket();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeTab, setActiveTab] = useState('ALL'); //all or unread
  const [loading, setLoading] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [toast, setToast] = useState(null);
  const dropdownRef = useRef(null);

  //fetch notifications list
  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      setLoading(true);
      const data = await getMyNotifications({ limit: 30 });
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (error) {
      console.error('Lỗi lấy danh sách thông báo:', error);
      setToast({ message: error.message || tRef.current('notifications.errors.loadFailed'), type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  //Socket real-time notification handling
  useEffect(() => {
    if (!socket) return;

    const handleRealtimeNotification = (payload) => {
      console.log('🔔 [Realtime Socket Notification Nhận được]:', payload);
      //incease unread
      setUnreadCount((prev) => prev + 1);

      //add new notification to the top list
      const newNotificationItem = {
        id: payload.id || `realtime_${Date.now()}`,
        title: payload.title,
        content: payload.content,
        type: payload.category || payload.type || 'HỆ THỐNG',
        is_read: false,
        is_persisted: payload.is_persisted !== false,
        created_at: payload.created_at || new Date().toISOString()
      };

      setNotifications((prev) => [newNotificationItem, ...prev]);
    };

    socket.on('system_notification', handleRealtimeNotification);
    socket.on('new_notification', handleRealtimeNotification);

    return () => {
      socket.off('system_notification', handleRealtimeNotification);
      socket.off('new_notification', handleRealtimeNotification);
    };
  }, [socket]);

  //close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  //if click noti, mark as read
  const handleMarkAsRead = async (item) => {
    if (item.is_read) return;

    //optimistic update
    setNotifications((prev) =>
      prev.map((n) => (n.id === item.id ? { ...n, is_read: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));

    if (item.id && typeof item.id === 'number') {
      try {
        const res = await markNotificationAsRead(item.id);
        const serverUnread = res?.data?.unreadCount;
        if (typeof serverUnread === 'number') {
          setUnreadCount(serverUnread);
        }
        return true;
      } catch (error) {
        console.error('Lỗi đánh dấu đã đọc:', error);
        setNotifications((prev) =>
          prev.map((n) => (n.id === item.id ? { ...n, is_read: false } : n))
        );
        setUnreadCount((prev) => prev + 1);
        setToast({ message: error.message || t('notifications.errors.markReadFailed'), type: 'error' });
        return false;
      }
    }

    return true;
  };

  //detail button
  const handleOpenDetail = async (e, item) => {
    e.stopPropagation();
    setSelectedNotification({ ...item, is_read: true });
    if (!item.is_read) {
      const marked = await handleMarkAsRead(item);
      if (!marked) {
        setSelectedNotification((previous) =>
          previous?.id === item.id ? { ...previous, is_read: false } : previous
        );
      }
    }
  };

  //mark all as read
  // Xử lý đánh dấu tất cả là đã đọc (UC-68)
  const handleMarkAllAsRead = async () => {
    if (unreadCount === 0) return;
    try {
      await markAllNotificationsAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Lỗi đánh dấu tất cả đã đọc:', error);
      setToast({ message: error.message || t('notifications.errors.markAllReadFailed'), type: 'error' });
    }
  };

  const filteredNotifications = notifications.filter((item) => {
    if (activeTab === 'UNREAD') return !item.is_read;
    return true;
  });
  const displayedUnreadCount = unreadCount > 99 ? '99+' : unreadCount;
  const unreadLabel = t('notifications.unreadBadge', { count: unreadCount });

  return (
    <div className="md:relative" ref={dropdownRef}>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      {/* bell button*/}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 rounded-xl text-slate-600 hover:text-teal-600 hover:bg-slate-100 transition duration-150 focus:outline-none"
        title={t('notifications.title')}
        aria-label={t('notifications.title')}
        aria-expanded={isOpen}
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] bg-rose-500 text-white text-[11px] font-bold rounded-full flex items-center justify-center px-1 shadow-sm ring-2 ring-white animate-pulse">
            {displayedUnreadCount}
          </span>
        )}
      </button>

      {/* noti dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-3 w-96 max-w-full md:max-w-none bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Header */}
          <div className="p-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <h3 className="font-bold text-slate-800 text-base">{t('notifications.title')}</h3>
              <span
                title={unreadLabel}
                className="shrink-0 whitespace-nowrap tabular-nums text-xs font-semibold px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-100"
              >
                <span aria-hidden="true">{t('notifications.unreadBadge', { count: displayedUnreadCount })}</span>
                <span className="sr-only">{unreadLabel}</span>
              </span>
            </div>

            {/* filter */}
            <div className="flex flex-wrap items-center gap-2 mt-3">
              <button
                type="button"
                onClick={() => setActiveTab('ALL')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition ${activeTab === 'ALL'
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
              >
                {t('notifications.tabAll', { count: notifications.length })}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('UNREAD')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition ${activeTab === 'UNREAD'
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
              >
                {t('notifications.tabUnread', { count: displayedUnreadCount })}
              </button>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllAsRead}
                  className="ml-auto whitespace-nowrap text-xs font-semibold text-teal-600 hover:text-teal-700 flex items-center gap-1 transition"
                >
                  <CheckCheck className="w-3.5 h-3.5 shrink-0" />
                  {t('notifications.markAllRead')}
                </button>
              )}
            </div>
          </div>

          {/* notif list */}
          <div className="max-h-96 overflow-y-auto divide-y divide-slate-100">
            {loading && notifications.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-teal-600" />
                <span className="text-xs">{t('notifications.loading')}</span>
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <Bell className="w-8 h-8 mx-auto mb-2 text-slate-300 opacity-60" />
                <p className="text-sm font-medium">{t('notifications.emptyTitle')}</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {activeTab === 'UNREAD'
                    ? t('notifications.emptyUnread')
                    : t('notifications.emptyAll')}
                </p>
              </div>
            ) : (
              filteredNotifications.map((item) => {
                const typeDetails = getNotificationTypeDetails(item.type, t);
                const IconComponent = typeDetails.icon;

                return (
                  <div
                    key={item.id}
                    onClick={() => handleMarkAsRead(item)}
                    title={!item.is_read ? t('notifications.clickToMarkRead') : ''}
                    className={`p-4 transition cursor-pointer flex items-start gap-3.5 hover:bg-slate-50/80 ${!item.is_read ? 'bg-teal-50/20' : ''
                      }`}
                  >
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${typeDetails.bgColor}`}>
                      <IconComponent className="w-4 h-4" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${typeDetails.badgeColor}`}>
                          {typeDetails.label}
                        </span>
                        <span className="text-[11px] text-slate-400 font-medium">
                          {formatRelativeTime(item.created_at, t, i18n.language)}
                        </span>
                      </div>
                      <h4 className={`text-sm leading-snug line-clamp-1 ${!item.is_read ? 'font-bold text-slate-900' : 'font-medium text-slate-700'}`}>
                        {item.title}
                      </h4>
                      <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                        {item.content}
                      </p>
                      <div className="mt-2 flex items-center justify-between">
                        <button
                          type="button"
                          onClick={(e) => handleOpenDetail(e, item)}
                          className="text-[11px] font-bold text-teal-600 hover:text-teal-800 hover:underline inline-flex items-center gap-1"
                        >
                          {t('notifications.viewDetail')} &rarr;
                        </button>
                      </div>
                    </div>

                    {/* Unread dot */}
                    {!item.is_read && (
                      <span className="w-2.5 h-2.5 rounded-full bg-teal-500 shrink-0 mt-2 shadow-sm" title={t('notifications.unreadDotTitle')} />
                    )}
                  </div>
                );
              })
            )}
          </div>

        </div>
      )}

      {/* long noti detail */}
      <NotificationDetailModal
        isOpen={Boolean(selectedNotification)}
        onClose={() => setSelectedNotification(null)}
        notification={selectedNotification}
        autoMarkAsRead={false}
        onMarkedRead={(id, serverCount) => {
          setNotifications((prev) =>
            prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
          );
          if (typeof serverCount === 'number') {
            setUnreadCount(serverCount);
          } else {
            setUnreadCount((prev) => Math.max(0, prev - 1));
          }
        }}
      />
    </div>
  );
};

export default NotificationDropdown;
