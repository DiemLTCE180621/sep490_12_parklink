import React from 'react';
import { AlertTriangle, X, Loader2, Ban, CheckCircle2, Info } from 'lucide-react';

/**
 * Modal Xác Nhận Chuyên Nghiệp (Thay thế hoàn toàn window.confirm xấu xí mặc định của trình duyệt)
 */
const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Xác Nhận Thao Tác',
  message = 'Bạn có chắc chắn muốn thực hiện hành động này không?',
  confirmText = 'Xác Nhận Hủy',
  cancelText = 'Bỏ Qua',
  type = 'danger', // 'danger' | 'warning' | 'info' | 'success'
  loading = false
}) => {
  if (!isOpen) return null;

  const getTypeStyles = () => {
    switch (type) {
      case 'danger':
        return {
          iconBg: 'bg-red-100 text-red-600 border-red-200',
          icon: <AlertTriangle className="w-8 h-8 text-red-600" />,
          btnBg: 'bg-red-600 hover:bg-red-700 text-white shadow-red-600/20'
        };
      case 'warning':
        return {
          iconBg: 'bg-amber-100 text-amber-600 border-amber-200',
          icon: <AlertTriangle className="w-8 h-8 text-amber-600" />,
          btnBg: 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/20'
        };
      case 'success':
        return {
          iconBg: 'bg-emerald-100 text-emerald-600 border-emerald-200',
          icon: <CheckCircle2 className="w-8 h-8 text-emerald-600" />,
          btnBg: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
        };
      default:
        return {
          iconBg: 'bg-teal-100 text-teal-600 border-teal-200',
          icon: <Info className="w-8 h-8 text-teal-600" />,
          btnBg: 'bg-teal-600 hover:bg-teal-700 text-white shadow-teal-600/20'
        };
    }
  };

  const style = getTypeStyles();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-fadeIn">
      <div 
        className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-md overflow-hidden transform transition-all duration-300 scale-100 animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* MODAL HEADER WITH ICON */}
        <div className="p-6 text-center space-y-4">
          <button
            onClick={onClose}
            disabled={loading}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>

          <div className={`w-16 h-16 rounded-3xl border-2 flex items-center justify-center mx-auto shadow-inner ${style.iconBg}`}>
            {style.icon}
          </div>

          <div className="space-y-1.5">
            <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">{title}</h3>
            <p className="text-sm text-slate-600 leading-relaxed font-medium px-2">{message}</p>
          </div>
        </div>

        {/* MODAL FOOTER BUTTONS */}
        <div className="p-6 pt-2 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="w-1/2 py-3 px-4 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold text-sm rounded-2xl transition shadow-sm"
          >
            {cancelText}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`w-1/2 py-3 px-4 ${style.btnBg} disabled:opacity-50 font-bold text-sm rounded-2xl shadow-lg transition flex items-center justify-center gap-2`}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Đang Xử Lý...
              </>
            ) : (
              <>
                <Ban className="w-4 h-4" /> {confirmText}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
