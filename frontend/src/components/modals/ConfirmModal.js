import React from 'react';
import { AlertTriangle, X, Loader2, Ban, CheckCircle2, Info } from 'lucide-react';


const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Xác Nhận Thao Tác',
  message = 'Bạn có chắc chắn muốn thực hiện hành động này không?',
  confirmText = 'Xác Nhận Hủy',
  cancelText = 'Bỏ Qua',
  type = 'danger', 
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
          iconBg: 'bg-neighbor-100 text-neighbor-600 border-neighbor-200',
          icon: <Info className="w-8 h-8 text-neighbor-600" />,
          btnBg: 'bg-neighbor-600 hover:bg-neighbor-700 text-white shadow-neighbor-600/20'
        };
    }
  };

  const style = getTypeStyles();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-950/60 backdrop-blur-md animate-fadeIn">
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-gray-100 w-full max-w-md overflow-hidden transform transition-all duration-300 scale-100 animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {}
        <div className="p-6 text-center space-y-4">
          <button
            onClick={onClose}
            disabled={loading}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-800 flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>

          <div className={`w-16 h-16 rounded-2xl border-2 flex items-center justify-center mx-auto shadow-inner ${style.iconBg}`}>
            {style.icon}
          </div>

          <div className="space-y-1.5">
            <h3 className="text-xl font-extrabold text-gray-900 tracking-tight">{title}</h3>
            <p className="text-sm text-gray-600 leading-relaxed font-medium px-2">{message}</p>
          </div>
        </div>

        {}
        <div className="p-6 pt-2 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="w-1/2 py-3 px-4 bg-white hover:bg-gray-100 border border-gray-200 text-gray-700 font-bold text-sm rounded-2xl transition shadow-sm"
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
