import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
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
  ArrowRight,
  X,
} from 'lucide-react';
import { markNotificationAsRead } from '../../services/notificationService';
import Toast from '../common/Toast';

const getTypeStyle = (type = '', priority = '', t) => {
  const normType = (type || '').toUpperCase();
  const normPriority = (priority || '').toUpperCase();

  if (normPriority.includes('KHẨN CẤP')) {
    return {
      icon: ShieldAlert,
      bgColor: 'bg-rose-50 text-rose-600 border-rose-200',
      badgeColor: 'bg-rose-50 text-rose-700 border-rose-200',
      label: t('notifications.badges.urgent'),
    };
  }
  if (normPriority.includes('QUAN TRỌNG')) {
    return {
      icon: AlertTriangle,
      bgColor: 'bg-amber-50 text-amber-600 border-amber-200',
      badgeColor: 'bg-amber-50 text-amber-800 border-amber-200',
      label: t('notifications.badges.important'),
    };
  }
  if (normType.includes('BẢO TRÌ') || normType.includes('MAINTENANCE') || normType.includes('HỆ THỐNG')) {
    return {
      icon: Radio,
      bgColor: 'bg-indigo-50 text-indigo-600 border-indigo-200',
      badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      label: t('notifications.badges.system'),
    };
  }
  if (normType.includes('ĐẶT CHỖ') || normType.includes('RESERVATION') || normType.includes('BOOKING')) {
    return {
      icon: CalendarCheck,
      bgColor: 'bg-neighbor-50 text-neighbor-600 border-neighbor-200',
      badgeColor: 'bg-neighbor-50 text-neighbor-700 border-neighbor-200',
      label: t('notifications.badges.reservation'),
    };
  }
  if (normType.includes('HỢP ĐỒNG') || normType.includes('CONTRACT')) {
    return {
      icon: FileText,
      bgColor: 'bg-amber-50 text-amber-600 border-amber-200',
      badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
      label: t('notifications.badges.contract'),
    };
  }
  if (normType.includes('KHIẾU NẠI') || normType.includes('COMPLAINT')) {
    return {
      icon: AlertCircle,
      bgColor: 'bg-rose-50 text-rose-600 border-rose-200',
      badgeColor: 'bg-rose-50 text-rose-700 border-rose-200',
      label: t('notifications.badges.complaint'),
    };
  }
  return {
    icon: Info,
    bgColor: 'bg-gray-100 text-gray-600 border-gray-200',
    badgeColor: 'bg-gray-50 text-gray-700 border-gray-200',
    label: t('notifications.badges.general'),
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

  useEffect(() => {
    if (!isOpen) return undefined;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen]);

  if (!isOpen || !notification) return null;

  const style = getTypeStyle(notification.type || notification.category, notification.priority, t);
  const IconComponent = style.icon;

  const formattedDate = notification.created_at
    ? new Date(notification.created_at).toLocaleString(i18n.language === 'en' ? 'en-GB' : 'vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
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
    if (
      category.includes('Chính sách') ||
      title.includes('chính sách') ||
      title.includes('Chính sách') ||
      content.includes('/policies')
    ) {
      return '/policies';
    }
    return null;
  };

  const policyUrl = getPolicyUrl();
  const displayContent = (notification.content || '').replace(/\s*(?:tại:?\s*)?\/policies[\w-]*/gi, '');

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
    : notification.category || style.label;

  return createPortal(
    <>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      <div
        className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-gray-900/50 backdrop-blur-xs animate-in fade-in duration-150"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
      >
        <div
          className="bg-white rounded-2xl w-full max-w-2xl max-h-[85vh] shadow-xl border border-gray-200 overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-6 py-5 border-b border-gray-100 bg-white flex items-start justify-between gap-4 shrink-0">
            <div className="flex items-start gap-3.5 min-w-0">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border ${style.bgColor}`}>
                <IconComponent className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <span className={`text-[11px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full border ${style.badgeColor}`}>
                    {categoryBadgeLabel}
                  </span>
                  {notification.priority && (
                    <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-700 border border-gray-200">
                      {formatPriorityLabel(notification.priority)}
                    </span>
                  )}
                </div>
                <h3 className="text-base sm:text-lg font-bold text-gray-900 leading-snug">
                  {notification.title}
                </h3>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-800 flex items-center justify-center transition-colors shrink-0 cursor-pointer"
              aria-label={t('notifications.modal.close')}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="px-6 py-3 bg-gray-50/60 border-b border-gray-100 flex items-center justify-between text-xs text-gray-500 font-medium shrink-0">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-gray-400" />
              {formattedDate}
            </span>
            <span
              className={`inline-flex items-center gap-1.5 font-semibold px-2.5 py-0.5 rounded-full border text-[11px] ${
                notification.is_read
                  ? 'text-neighbor-700 bg-neighbor-50 border-neighbor-200'
                  : 'text-amber-700 bg-amber-50 border-amber-200'
              }`}
            >
              <CheckCheck className={`w-3.5 h-3.5 ${notification.is_read ? 'text-neighbor-600' : 'text-amber-600'}`} />
              {notification.is_read ? t('notifications.modal.markedRead') : t('notifications.modal.unread')}
            </span>
          </div>

          <div className="p-6 flex-1 flex flex-col min-h-0 overflow-hidden">
            <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2.5 shrink-0">
              {t('notifications.modal.contentLabel')}
            </div>
            <div className="p-4 sm:p-5 rounded-xl bg-gray-50 border border-gray-200/80 text-gray-700 text-sm leading-relaxed min-h-[120px] max-h-[45vh] overflow-y-auto whitespace-pre-line font-normal">
              {displayContent || notification.content}
            </div>
          </div>

          <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/70 flex items-center justify-between gap-3 shrink-0">
            {policyUrl ? (
              <Link
                to={policyUrl}
                onClick={onClose}
                className="px-4 py-2 bg-neighbor-600 hover:bg-neighbor-700 text-white font-semibold text-xs rounded-lg transition-colors inline-flex items-center gap-1.5 shadow-xs"
              >
                <span>{t('notifications.modal.viewPolicy')}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <div />
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-lg bg-neighbor-600 hover:bg-neighbor-700 active:bg-neighbor-800 text-white font-semibold text-xs transition-colors shadow-xs cursor-pointer"
            >
              {t('notifications.modal.close')}
            </button>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
};

export default NotificationDetailModal;
