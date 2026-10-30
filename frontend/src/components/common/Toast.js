import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

const Toast = ({
  message,
  type = 'success',
  onClose,
  duration = 3000,
  position = 'top-right'
}) => {
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        if (onClose) onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [message, duration, onClose]);

  if (!message) return null;

  const getToastStyle = () => {
    switch (type) {
      case 'error':
        return {
          wrapper: 'bg-white/95 border-red-200 shadow-xl shadow-red-500/10 text-slate-800 ring-1 ring-red-500/10',
          iconWrapper: 'bg-red-50 text-red-500 border border-red-100',
          icon: <AlertCircle className="w-4 h-4 shrink-0" />
        };
      case 'info':
        return {
          wrapper: 'bg-white/95 border-teal-200 shadow-xl shadow-teal-500/10 text-slate-800 ring-1 ring-teal-500/10',
          iconWrapper: 'bg-teal-50 text-teal-600 border border-teal-100',
          icon: <Info className="w-4 h-4 shrink-0" />
        };
      default:
        return {
          wrapper: 'bg-white/95 border-emerald-200 shadow-xl shadow-emerald-500/10 text-slate-800 ring-1 ring-emerald-500/10',
          iconWrapper: 'bg-emerald-50 text-emerald-600 border border-emerald-100',
          icon: <CheckCircle2 className="w-4 h-4 shrink-0" />
        };
    }
  };

  const getPositionClass = () => {
    switch (position) {
      case 'top-center':
        return 'top-24 left-1/2 -translate-x-1/2';
      case 'top-left':
        return 'top-24 left-5 sm:left-6';
      case 'bottom-right':
        return 'bottom-5 right-5 sm:right-6';
      case 'top-right':
      default:
        // Đặt ở top-24 (96px) để nằm ngay dưới Header Navbar (80px), không bị đè lên Header
        return 'top-24 right-5 sm:right-6';
    }
  };

  const style = getToastStyle();
  const positionClass = getPositionClass();

  return (
    <div className={`fixed ${positionClass} z-[9999] transition-all duration-300 ease-out animate-in fade-in slide-in-from-top-3`}>
      <div className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border backdrop-blur-md max-w-sm sm:max-w-md ${style.wrapper}`}>
        {/* Icon thu nhỏ đặt trong khung tròn mềm */}
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${style.iconWrapper}`}>
          {style.icon}
        </div>
        
        {/* Nội dung thông báo nhỏ gọn, vừa mắt */}
        <span className="text-xs sm:text-[13px] font-medium text-slate-700 leading-snug pr-1 break-words">
          {message}
        </span>

        {/* Nút đóng nhỏ gọn */}
        <button
          onClick={onClose}
          type="button"
          aria-label="Đóng thông báo"
          className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors p-1 rounded-md ml-auto shrink-0"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

export default Toast;
