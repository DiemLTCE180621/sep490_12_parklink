import React, { useState, useEffect } from 'react';
import {
  Radio,
  AlertTriangle,
  ShieldAlert,
  X,
  Bell,
  CheckCircle2,
  Info
} from 'lucide-react';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import NotificationDetailModal from '../modals/NotificationDetailModal';

/**
 * Component toàn cục xử lý hiển thị trực tiếp trên giao diện Web App:
 * 1. Mức độ ưu tiên:
 *    - Bình thường: Hiện Toast nổi góc màn hình
 *    - Quan trọng: Nổi Banner cố định trên đầu trang web
 *    - Khẩn cấp: Hiện Modal chặn giữa màn hình (Emergency Modal)
 * 2. Cấu hình hiển thị:
 *    - Hiển thị Pop-up Toast nổi ở góc màn hình Web
 */
const GlobalBroadcastAlerts = () => {
  const socket = useSocket();
  const { user } = useAuth();

  // State quản lý danh sách Toast nổi góc màn hình
  const [toasts, setToasts] = useState([]);

  // State quản lý Banner quan trọng trên đầu web
  const [bannerAlert, setBannerAlert] = useState(null);

  // State quản lý Modal khẩn cấp chặn màn hình
  const [emergencyModal, setEmergencyModal] = useState(null);

  // State xem chi tiết thông báo đầy đủ khi nhấn vào Toast hoặc Banner
  const [detailModalNotification, setDetailModalNotification] = useState(null);

  useEffect(() => {
    if (!socket) return;

    const handleSystemNotification = (payload) => {
      console.log('⚡ [Global Alert] Nhận sự kiện system_notification:', payload);

      // 🛡️ CƠ CHẾ MIỄN NHIỄM CHO ADMIN:
      // Admin không bị modal khẩn cấp hay banner chặn web của chính mình khi gửi broadcast toàn hệ thống.
      // Chỉ nhận khi đây là thông báo kiểm thử (Test Self) gửi riêng cho Admin.
      const isAdmin = user?.role?.name === 'ADMIN';
      const isTestForAdmin =
        payload.targetRole === 'ADMIN' ||
        (typeof payload.title === 'string' && payload.title.startsWith('[TEST]'));

      if (isAdmin && !isTestForAdmin) {
        console.log('🛡️ [Admin Immunity] Bỏ qua thông báo hệ thống trên web của Admin');
        return;
      }

      const priority = payload.priority || 'Bình thường';
      const showToast = payload.showToast !== false; // Mặc định là true nếu không chỉ định

      // 1. XỬ LÝ MỨC ĐỘ ƯU TIÊN: KHẨN CẤP (Modal chặn web)
      if (priority.includes('Khẩn cấp')) {
        setEmergencyModal({
          id: payload.id || `emergency_${Date.now()}`,
          title: payload.title,
          content: payload.content,
          category: payload.category || 'THÔNG BÁO KHẨN CẤP',
          created_at: payload.created_at || new Date().toISOString()
        });
      }

      // 2. XỬ LÝ MỨC ĐỘ ƯU TIÊN: QUAN TRỌNG (Nổi banner trên web)
      if (priority.includes('Quan trọng')) {
        setBannerAlert({
          id: payload.id || `banner_${Date.now()}`,
          title: payload.title,
          content: payload.content,
          category: payload.category || 'THÔNG BÁO QUAN TRỌNG',
          created_at: payload.created_at || new Date().toISOString()
        });
      }

      // 3. XỬ LÝ CẤU HÌNH HIỂN THỊ: POP-UP TOAST NỔI Ở GÓC MÀN HÌNH WEB
      // (Hiển thị khi được bật checkbox 'Hiển thị Pop-up Toast' hoặc ở mức Bình thường / Quan trọng)
      if (showToast) {
        const toastId = payload.id || `toast_${Date.now()}_${Math.random()}`;
        const newToast = {
          id: toastId,
          title: payload.title,
          content: payload.content,
          category: payload.category || 'HỆ THỐNG',
          priority: priority
        };

        setToasts((prev) => [newToast, ...prev]);

        // Tự động đóng toast sau 7 giây
        setTimeout(() => {
          setToasts((currentToasts) => currentToasts.filter((t) => t.id !== toastId));
        }, 7000);
      }
    };

    socket.on('system_notification', handleSystemNotification);

    return () => {
      socket.off('system_notification', handleSystemNotification);
    };
  }, [socket, user]);

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <>
      {/* ─── 1. BANNER NỔI TRÊN ĐẦU WEB (MỨC ĐỘ: QUAN TRỌNG) ─── */}
      {bannerAlert && (
        <div className="bg-amber-500 text-slate-950 px-4 py-3 shadow-md sticky top-0 z-[9990] animate-in slide-in-from-top duration-200 border-b-2 border-amber-700">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <span className="p-1.5 bg-amber-950 text-amber-300 shrink-0">
                <AlertTriangle className="w-5 h-5 animate-pulse" />
              </span>
              <div className="min-w-0">
                <span className="font-extrabold text-xs uppercase tracking-wider bg-slate-950 text-amber-300 px-2 py-0.5 mr-2">
                  {bannerAlert.category || 'QUAN TRỌNG'}
                </span>
                <span className="font-bold text-sm text-slate-950">
                  {bannerAlert.title}:
                </span>{' '}
                <span className="text-sm font-medium text-slate-900">
                  {bannerAlert.content}
                </span>
                <button
                  type="button"
                  onClick={() => setDetailModalNotification(bannerAlert)}
                  className="text-xs font-black text-slate-950 hover:underline ml-2 inline-flex items-center gap-0.5"
                >
                  [Xem chi tiết &rarr;]
                </button>
              </div>
            </div>

            <button
              onClick={() => setBannerAlert(null)}
              className="p-1.5 hover:bg-amber-600 transition text-slate-950 shrink-0"
              title="Đóng banner"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* ─── 2. MODAL CHẶN MÀN HÌNH (MỨC ĐỘ: KHẨN CẤP - TO, KHÔNG BO GÓC) ─── */}
      {emergencyModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-none w-[95vw] md:w-[70vw] max-w-[1400px] h-[75vh] md:h-[80vh] p-6 sm:p-10 shadow-2xl border-4 border-rose-600 space-y-6 relative animate-in zoom-in-95 duration-200 flex flex-col">
            {/* Header Icon khẩn cấp */}
            <div className="flex items-start gap-5 shrink-0">
              <div className="w-16 h-16 rounded-none bg-rose-100 text-rose-700 border-2 border-rose-400 flex items-center justify-center shrink-0">
                <ShieldAlert className="w-9 h-9" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <span className="px-3 py-0.5 rounded-none bg-rose-600 text-white text-xs font-black tracking-widest uppercase">
                    {emergencyModal.category || 'THÔNG BÁO KHẨN CẤP'}
                  </span>
                  <span className="text-xs text-rose-700 font-bold uppercase tracking-wider bg-rose-50 px-2 py-0.5 border border-rose-200">
                    Mức độ: Khẩn cấp / Chặn tương tác
                  </span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-black text-slate-900 leading-snug">
                  {emergencyModal.title}
                </h3>
              </div>
            </div>

            {/* Nội dung thông điệp (Rộng rãi, to bản, dễ đọc, lấp đầy chiều cao modal) */}
            <div className="p-6 rounded-none bg-slate-50 border-2 border-slate-300 text-base sm:text-lg text-slate-800 leading-relaxed flex-1 min-h-0 overflow-y-auto font-medium whitespace-pre-line shadow-inner">
              {emergencyModal.content}
            </div>

            {/* Footer action */}
            <div className="pt-2 flex flex-col sm:flex-row justify-end gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setEmergencyModal(null)}
                className="w-full sm:w-auto px-10 py-3.5 rounded-none bg-rose-600 hover:bg-rose-700 text-white font-black text-xs uppercase tracking-widest shadow-lg transition transform active:scale-[0.99] flex items-center justify-center gap-2"
              >
                Tôi Đã Đọc Và Xác Nhận Đóng Thông Báo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── 3. POP-UP TOAST NỔI Ở GÓC MÀN HÌNH WEB ─── */}
      <div className="fixed top-20 right-4 sm:right-6 z-[9980] flex flex-col gap-3 max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => {
          const isEmergency = toast.priority?.includes('Khẩn cấp');
          const isImportant = toast.priority?.includes('Quan trọng');

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto w-full p-4 rounded-none shadow-2xl border-l-4 border-y border-r backdrop-blur-md transition-all duration-300 transform translate-y-0 opacity-100 flex items-start gap-3.5 ${
                isEmergency
                  ? 'bg-rose-950/95 text-white border-rose-500 border-l-rose-500 shadow-rose-950/40'
                  : isImportant
                  ? 'bg-amber-950/95 text-white border-amber-500 border-l-amber-500 shadow-amber-950/40'
                  : 'bg-slate-900/95 text-white border-slate-700 border-l-teal-500 shadow-slate-950/40'
              }`}
            >
              <div
                className={`w-9 h-9 rounded-none flex items-center justify-center shrink-0 border ${
                  isEmergency
                    ? 'bg-rose-600/30 text-rose-400 border-rose-600/50'
                    : isImportant
                    ? 'bg-amber-600/30 text-amber-400 border-amber-600/50'
                    : 'bg-teal-500/20 text-teal-400 border-teal-500/50'
                }`}
              >
                {isEmergency ? (
                  <ShieldAlert className="w-5 h-5" />
                ) : isImportant ? (
                  <AlertTriangle className="w-5 h-5" />
                ) : (
                  <Radio className="w-5 h-5 animate-pulse" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-1">
                  <span
                    className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-none uppercase tracking-wider ${
                      isEmergency
                        ? 'bg-rose-500 text-white'
                        : isImportant
                        ? 'bg-amber-500 text-slate-950'
                        : 'bg-teal-600 text-white'
                    }`}
                  >
                    {toast.category || 'HỆ THỐNG'}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-white leading-snug line-clamp-1">
                  {toast.title}
                </h4>
                <p className="text-xs text-slate-300 line-clamp-2 mt-1 leading-relaxed">
                  {toast.content}
                </p>

                {/* Nút xem chi tiết khi thông báo dài */}
                <div className="mt-2 flex items-center">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeToast(toast.id);
                      setDetailModalNotification(toast);
                    }}
                    className="text-[11px] font-bold text-teal-300 hover:text-white underline underline-offset-2 flex items-center gap-1"
                  >
                    Chi tiết &rarr;
                  </button>
                </div>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeToast(toast.id);
                }}
                className="text-slate-400 hover:text-white p-1 rounded-none transition shrink-0"
                title="Đóng toast"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>

      {/* ─── 4. MODAL CHI TIẾT NỘI DUNG ĐẦY ĐỦ ─── */}
      <NotificationDetailModal
        isOpen={Boolean(detailModalNotification)}
        onClose={() => setDetailModalNotification(null)}
        notification={detailModalNotification}
      />
    </>
  );
};

export default GlobalBroadcastAlerts;
