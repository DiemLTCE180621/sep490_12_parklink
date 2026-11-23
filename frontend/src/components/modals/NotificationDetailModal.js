import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Radio,
  CalendarCheck,
  FileText,
  AlertCircle,
  Info,
  CheckCheck,
  Clock,
  ShieldAlert,
  AlertTriangle,
  ArrowRight
} from 'lucide-react';
import { markNotificationAsRead } from '../../services/notificationService';
import Toast from '../common/Toast';


const getTypeStyle = (type = '', priority = '', t) => {
  const normType = (type || '').toUpperCase();
  const normPriority = (priority || '').toUpperCase();

  if (normPriority.includes('KHẨN CẤP')) {
    return {
      icon: ShieldAlert,
      bgColor: 'bg-rose-100 text-rose-700',
      badgeColor: 'bg-rose-50 text-rose-700 border-rose-200',
      label: t('notifications.badges.urgent')
    };
  }
  if (normPriority.includes('QUAN TRỌNG')) {
    return {
      icon: AlertTriangle,
      bgColor: 'bg-amber-100 text-amber-800',
      badgeColor: 'bg-amber-50 text-amber-800 border-amber-200',
      label: t('notifications.badges.important')
    };
  }
  if (normType.includes('BẢO TRÌ') || normType.includes('MAINTENANCE') || normType.includes('HỆ THỐNG')) {
    return {
      icon: Radio,
      bgColor: 'bg-indigo-100 text-indigo-700',
      badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      label: t('notifications.badges.system')
    };
  }
  if (normType.includes('ĐẶT CHỖ') || normType.includes('RESERVATION') || normType.includes('BOOKING')) {
    return {
      icon: CalendarCheck,
      bgColor: 'bg-neighbor-100 text-neighbor-700',
      badgeColor: 'bg-neighbor-50 text-neighbor-700 border-neighbor-200',
      label: t('notifications.badges.reservation')
    };
  }
  if (normType.includes('HỢP ĐỒNG') || normType.includes('CONTRACT')) {
    return {
      icon: FileText,
      bgColor: 'bg-amber-100 text-amber-700',
      badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
      label: t('notifications.badges.contract')
    };
  }
  if (normType.includes('KHIẾU NẠI') || normType.includes('COMPLAINT')) {
    return {
      icon: AlertCircle,
      bgColor: 'bg-rose-100 text-rose-700',
      badgeColor: 'bg-rose-50 text-rose-700 border-rose-200',
      label: t('notifications.badges.complaint')
    };
  }
  return {
    icon: Info,
    bgColor: 'bg-gray-100 text-gray-700',
    badgeColor: 'bg-gray-50 text-gray-700 border-gray-200',
    label: t('notifications.badges.general')
  };
};


const NotificationDetailModal = ({ isOpen, onClose, notification, onMarkedRead, autoMarkAsRead = true }) => {
  const { t, i18n } = useTranslation('common');
  const tRef = useRef(t);
  tRef.current = t;

  const markedIdRef = React.useRef(null);
  const [toast, setToast] = React.useState(null);

  useEffect(() => {
    if (
      isOpen &&
      autoMarkAsRead &&
      notification &&
      !notification.is_read &&
      notification.id &&
      typeof notification.id === 'number' &&
      markedIdRef.current !== notification.id
    ) {
      markedIdRef.current = notification.id;
      markNotificationAsRead(notification.id)
        .then((res) => {
          const serverUnread = res?.data?.unreadCount;
          onMarkedRead?.(notification.id, serverUnread);
        })
        .catch((err) => {
          console.error('Lỗi tự động đánh dấu đã đọc khi xem chi tiết:', err);
          setToast({ message: err.message || tRef.current('notifications.errors.markReadFailed'), type: 'error' });
        });
    }
    if (!isOpen) {
      markedIdRef.current = null;
    }
  }, [autoMarkAsRead, isOpen, notification, onMarkedRead]);

  if (!isOpen || !notification) return null;

  const style = getTypeStyle(notification.type || notification.category, notification.priority, t);
  const IconComponent = style.icon;

  const formattedDate = notification.created_at
    ? new Date(notification.created_at).toLocaleString(i18n.language === 'en' ? 'en-GB' : 'vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
    : '';

  
  const getPolicyUrl = () => {
    const title = notification.title || '';
    const content = notification.content || '';
    const category = notification.category || notification.type || '';

    if (title.includes('Chủ Bãi') || content.includes('chủ bãi') || content.includes('/policies/provider')) {
      return '/policies/provider';
    }
    if (title.includes('Khách Hàng') || content.includes('khách hàng') || content.includes('/policies/customer')) {
      return '/policies/customer';
    }
    if (category.includes('Chính sách') || title.includes('chính sách') || title.includes('Chính sách') || content.includes('/policies')) {
      return '/policies';
    }
    return null;
  };

  const policyUrl = getPolicyUrl();
  const displayContent = (notification.content || '').replace(/\s*(?:tại:?\s*)?\/policies[\w\-]*/gi, '');

  const formatPriorityLabel = (rawPriority) => {
    const norm = (rawPriority || '').toUpperCase();
    if (norm.includes('KHẨN CẤP') || norm === 'URGENT') return t('notifications.priorities.urgent');
    if (norm.includes('QUAN TRỌNG') || norm === 'IMPORTANT') return t('notifications.priorities.important');
    if (norm.includes('THÔNG THƯỜNG') || norm.includes('BÌNH THƯỜNG') || norm === 'NORMAL') {
      return t('notifications.priorities.normal');
    }
    return rawPriority;
  };

  const categoryBadgeLabel = i18n.language?.startsWith('en')
    ? style.label
    : (notification.category || style.label);

  return (
    <>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-gray-950/75 backdrop-blur-sm animate-in fade-in duration-150">
        <div className="bg-white rounded-none w-[95vw] md:w-[70vw] max-w-[1400px] h-[75vh] md:h-[80vh] shadow-2xl border-2 border-gray-400 overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col">
          {}
          <div className="p-6 sm:p-7 border-b border-gray-200 bg-gray-50 flex items-start justify-between gap-4 shrink-0">
            <div className="flex items-start gap-4">
              <div className={`w-14 h-14 rounded-none flex items-center justify-center shrink-0 border ${style.bgColor} border-gray-300`}>
                <IconComponent className="w-7 h-7" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className={`text-xs font-black tracking-wider uppercase px-2.5 py-0.5 rounded-none border ${style.badgeColor}`}>
                    {categoryBadgeLabel}
                  </span>
                  {notification.priority && (
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-none bg-gray-200 text-gray-800">
                      {formatPriorityLabel(notification.priority)}
                    </span>
                  )}
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-gray-950 leading-snug">
                  {notification.title}
                </h3>
              </div>
            </div>
          </div>

          {}
          <div className="px-6 sm:px-8 py-3 bg-white border-b border-gray-200 flex items-center justify-between text-xs sm:text-sm text-gray-600 font-medium shrink-0">
            <span className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-400" />
              {formattedDate}
            </span>
            <span className={`flex items-center gap-1.5 font-bold px-3 py-1 rounded-none border text-xs uppercase tracking-wide ${notification.is_read
              ? 'text-neighbor-800 bg-neighbor-50 border-neighbor-200'
              : 'text-amber-800 bg-amber-50 border-amber-200'
              }`}>
              <CheckCheck className={`w-4 h-4 ${notification.is_read ? 'text-neighbor-600' : 'text-amber-600'}`} />
              {notification.is_read ? t('notifications.modal.markedRead') : t('notifications.modal.unread')}
            </span>
          </div>
          {}
          <div className="p-6 sm:p-8 flex-1 flex flex-col min-h-0 overflow-hidden">
            <div className="text-xs font-black text-gray-500 uppercase tracking-widest mb-3 shrink-0">
              {t('notifications.modal.contentLabel')}
            </div>
            <div className="p-6 rounded-none bg-gray-50 border-2 border-gray-200 text-gray-800 text-base sm:text-lg leading-relaxed flex-1 min-h-0 overflow-y-auto whitespace-pre-line font-medium shadow-inner">
              {displayContent || notification.content}
            </div>
          </div>

          {}
          <div className="p-5 sm:p-6 border-t border-gray-200 bg-gray-50 flex items-center justify-between gap-3 shrink-0">
            {policyUrl ? (
              <Link
                to={policyUrl}
                onClick={onClose}
                className="px-6 py-3 bg-neighbor-600 hover:bg-neighbor-700 text-white font-bold text-xs uppercase tracking-wider transition inline-flex items-center gap-2 shadow-sm rounded-none"
              >
                <span>{t('notifications.modal.viewPolicy')}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <div />
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-8 py-3 rounded-none bg-gray-900 hover:bg-gray-800 text-white font-black text-xs uppercase tracking-widest transition active:translate-y-0.5 shadow-md"
            >
              {t('notifications.modal.close')}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default NotificationDetailModal;
