import React, { useEffect } from 'react';
import {
  X,
  Radio,
  CalendarCheck,
  FileText,
  AlertCircle,
  Info,
  CheckCheck,
  Clock,
  ShieldAlert,
  AlertTriangle
} from 'lucide-react';
import { markNotificationAsRead } from '../../services/notificationService';

/**
 * Lấy Icon và màu sắc cho phân loại thông báo
 */
const getTypeStyle = (type = '', priority = '') => {
  const normType = (type || '').toUpperCase();
  const normPriority = (priority || '').toUpperCase();

  if (normPriority.includes('KHẨN CẤP')) {
    return {
      icon: ShieldAlert,
      bgColor: 'bg-rose-100 text-rose-700',
      badgeColor: 'bg-rose-50 text-rose-700 border-rose-200',
      label: '[KHẨN CẤP]'
    };
  }
  if (normPriority.includes('QUAN TRỌNG')) {
    return {
      icon: AlertTriangle,
      bgColor: 'bg-amber-100 text-amber-800',
      badgeColor: 'bg-amber-50 text-amber-800 border-amber-200',
      label: '[QUAN TRỌNG]'
    };
  }
  if (normType.includes('BẢO TRÌ') || normType.includes('MAINTENANCE') || normType.includes('HỆ THỐNG')) {
    return {
      icon: Radio,
      bgColor: 'bg-indigo-100 text-indigo-700',
      badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      label: '[HỆ THỐNG]'
    };
  }
  if (normType.includes('ĐẶT CHỖ') || normType.includes('RESERVATION') || normType.includes('BOOKING')) {
    return {
      icon: CalendarCheck,
      bgColor: 'bg-teal-100 text-teal-700',
      badgeColor: 'bg-teal-50 text-teal-700 border-teal-200',
      label: '[ĐẶT CHỖ]'
    };
  }
  if (normType.includes('HỢP ĐỒNG') || normType.includes('CONTRACT')) {
    return {
      icon: FileText,
      bgColor: 'bg-amber-100 text-amber-700',
      badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
      label: '[HỢP ĐỒNG]'
    };
  }
  if (normType.includes('KHIẾU NẠI') || normType.includes('COMPLAINT')) {
    return {
      icon: AlertCircle,
      bgColor: 'bg-rose-100 text-rose-700',
      badgeColor: 'bg-rose-50 text-rose-700 border-rose-200',
      label: '[KHIẾU NẠI]'
    };
  }
  return {
    icon: Info,
    bgColor: 'bg-slate-100 text-slate-700',
    badgeColor: 'bg-slate-50 text-slate-700 border-slate-200',
    label: '[THÔNG BÁO]'
  };
};

/**
 * Modal hiển thị chi tiết nội dung thông báo đầy đủ khi nội dung quá dài
 * Tự động đánh dấu đã đọc khi người dùng mở xem chi tiết
 */
const NotificationDetailModal = ({ isOpen, onClose, notification, onMarkedRead }) => {
  const markedIdRef = React.useRef(null);

  useEffect(() => {
    if (
      isOpen &&
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
        });
    }
    if (!isOpen) {
      markedIdRef.current = null;
    }
  }, [isOpen, notification?.id, notification?.is_read]);

  if (!isOpen || !notification) return null;

  const style = getTypeStyle(notification.type || notification.category, notification.priority);
  const IconComponent = style.icon;

  const formattedDate = notification.created_at
    ? new Date(notification.created_at).toLocaleString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
    : '';

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-none w-[95vw] md:w-[70vw] max-w-[1400px] h-[75vh] md:h-[80vh] shadow-2xl border-2 border-slate-400 overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col">
        {/* Header Modal */}
        <div className="p-6 sm:p-7 border-b border-slate-200 bg-slate-50 flex items-start justify-between gap-4 shrink-0">
          <div className="flex items-start gap-4">
            <div className={`w-14 h-14 rounded-none flex items-center justify-center shrink-0 border ${style.bgColor} border-slate-300`}>
              <IconComponent className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className={`text-xs font-black tracking-wider uppercase px-2.5 py-0.5 rounded-none border ${style.badgeColor}`}>
                  {notification.category || style.label}
                </span>
                {notification.priority && (
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-none bg-slate-200 text-slate-800">
                    {notification.priority}
                  </span>
                )}
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-slate-950 leading-snug">
                {notification.title}
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2.5 text-slate-400 hover:text-slate-900 hover:bg-slate-200 rounded-none transition shrink-0"
            title="Đóng modal"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Thông tin Meta: Thời gian & Trạng thái */}
        <div className="px-6 sm:px-8 py-3 bg-white border-b border-slate-200 flex items-center justify-between text-xs sm:text-sm text-slate-600 font-medium shrink-0">
          <span className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-400" />
            {formattedDate}
          </span>
          <span className="flex items-center gap-1.5 text-teal-800 font-bold bg-teal-50 px-3 py-1 rounded-none border border-teal-200 text-xs uppercase tracking-wide">
            <CheckCheck className="w-4 h-4 text-teal-600" />
            Đã đánh dấu đã đọc
          </span>
        </div>

        {/* Nội dung chi tiết thông báo (Cao ráo, thoáng đãng, lấp đầy không gian modal) */}
        <div className="p-6 sm:p-8 flex-1 flex flex-col min-h-0 overflow-hidden">
          <div className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3 shrink-0">
            Nội dung thông báo chi tiết:
          </div>
          <div className="p-6 rounded-none bg-slate-50 border-2 border-slate-200 text-slate-800 text-base sm:text-lg leading-relaxed flex-1 min-h-0 overflow-y-auto whitespace-pre-line font-medium shadow-inner">
            {notification.content}
          </div>
        </div>

        {/* Footer Modal */}
        <div className="p-5 sm:p-6 border-t border-slate-200 bg-slate-50 flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-10 py-3 rounded-none bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase tracking-widest transition active:translate-y-0.5 shadow-md"
          >
            Đóng thông báo
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationDetailModal;
