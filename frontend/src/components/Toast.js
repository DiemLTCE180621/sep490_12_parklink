import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

/**
 * Toast Notification Chuyên Nghiệp (Thay thế hoàn toàn window.alert)
 */
const Toast = ({ message, type = 'success', onClose, duration = 3000 }) => {
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
          bg: 'bg-slate-900 border-red-500/50 text-white',
          icon: <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
        };
      case 'info':
        return {
          bg: 'bg-slate-900 border-teal-500/50 text-white',
          icon: <Info className="w-5 h-5 text-teal-400 shrink-0" />
        };
      default:
        return {
          bg: 'bg-slate-900 border-emerald-500/50 text-white',
          icon: <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
        };
    }
  };

  const style = getToastStyle();

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-slideUp">
      <div className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl border shadow-2xl backdrop-blur-md ${style.bg}`}>
        {style.icon}
        <span className="text-sm font-semibold pr-2">{message}</span>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white transition p-1 rounded-lg"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default Toast;
