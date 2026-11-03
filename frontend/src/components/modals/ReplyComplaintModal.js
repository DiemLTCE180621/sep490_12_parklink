import React, { useState, useEffect, useCallback, memo } from 'react';
import {
  X,
  MessageSquareReply,
  CheckCircle2,
  Clock,
  Loader2,
  Building2,
  User,
  ShieldAlert,
  Send,
  AlertCircle
} from 'lucide-react';
import complaintService from '../../services/complaintService';
import { validateReplyComplaint } from '../../validations/complaintValidation';

const ReplyComplaintModal = memo(({
  isOpen,
  onClose,
  complaint,
  onSuccess,
  role = 'ADMIN'
}) => {
  const [responseText, setResponseText] = useState('');
  const [status, setStatus] = useState('RESOLVED');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  // Khởi tạo dữ liệu khi mở Modal
  useEffect(() => {
    if (complaint && isOpen) {
      setResponseText(complaint.admin_response || '');
      if (!complaint.status || complaint.status === 'OPEN' || complaint.status === 'PENDING') {
        setStatus('RESOLVED');
      } else {
        setStatus(complaint.status);
      }
      setErrorMsg(null);
    }
  }, [complaint, isOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && !loading) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, loading, onClose]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setErrorMsg(null);

    const validation = validateReplyComplaint({
      response: responseText,
      status
    });

    if (!validation.isValid) {
      setErrorMsg(validation.errors.response || validation.errors.status || 'Dữ liệu không hợp lệ');
      return;
    }

    try {
      setLoading(true);
      const res = await complaintService.replyToComplaint(complaint.id, {
        response: responseText.trim(),
        status
      });

      const updated = res.data || res.complaint || {
        ...complaint,
        admin_response: responseText.trim(),
        status
      };

      if (onSuccess) {
        onSuccess(updated);
      }
      onClose();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || 'Lỗi khi gửi phản hồi khiếu nại!');
    } finally {
      setLoading(false);
    }
  }, [complaint, responseText, status, onSuccess, onClose]);

  if (!isOpen || !complaint) return null;

  const isEditing = Boolean(complaint.admin_response);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn"
      onClick={loading ? undefined : onClose}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-xl overflow-hidden transform transition-all duration-200 animate-scaleUp flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER MODAL */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-teal-50/70 via-slate-50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-600 text-white flex items-center justify-center shadow-md shadow-teal-600/20">
              <MessageSquareReply className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-extrabold text-slate-900">
                {isEditing ? 'Chỉnh Sửa Phản Hồi Khiếu Nại' : 'Phản Hồi Khiếu Nại'}
              </h3>
              <p className="text-xs text-slate-500">
                Mã khiếu nại #{complaint.id} • Vai trò: <span className="font-semibold text-teal-700">{role === 'ADMIN' ? 'Ban Quản Trị' : 'Chủ Bãi Xe'}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition disabled:opacity-50"
            title="Đóng (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* BODY MODAL */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* THÔNG TIN TÓM TẮT KHIẾU NẠI */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-3 text-xs sm:text-sm">
            <div className="flex items-start justify-between gap-2">
              <span className="font-extrabold text-slate-900 text-sm sm:text-base leading-snug">
                {complaint.title}
              </span>
              <span className="shrink-0 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-200 text-slate-700">
                #{complaint.id}
              </span>
            </div>

            <div className="text-slate-700 whitespace-pre-wrap bg-white p-3 rounded-xl border border-slate-200/60 leading-relaxed text-xs sm:text-sm">
              {complaint.description}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-xs text-slate-600">
              <div className="flex items-center gap-1.5 truncate">
                <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>Khách hàng: <strong className="text-slate-800">{complaint.customer?.full_name || 'Khách hàng'}</strong></span>
              </div>
              <div className="flex items-center gap-1.5 truncate">
                <Building2 className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                <span>Bãi xe: <strong className="text-slate-800">{complaint.facility?.name || 'Bãi đỗ xe'}</strong></span>
              </div>
            </div>

            {/* LỊCH SỬ TRAO ĐỔI NẾU CÓ */}
            {Array.isArray(complaint.response_history) && complaint.response_history.length > 0 && (
              <div className="mt-3 pt-3 border-t border-slate-200/60 space-y-2">
                <span className="font-bold text-[11px] text-slate-500 uppercase tracking-wider block">
                  Lịch sử xử lý & chuyển cấp ({complaint.response_history.length}):
                </span>
                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {complaint.response_history.map((h, idx) => (
                    <div
                      key={idx}
                      className={`p-2.5 rounded-xl text-xs space-y-1 ${h.action === 'ESCALATED'
                          ? 'bg-purple-50 border border-purple-200 text-purple-900'
                          : h.sender_role === 'ADMIN'
                            ? 'bg-teal-50 border border-teal-200 text-teal-900'
                            : 'bg-white border border-slate-200 text-slate-800'
                        }`}
                    >
                      <div className="flex items-center justify-between font-bold text-[11px]">
                        <span>{h.sender_name || h.sender_role}</span>
                        <span className="text-slate-400 font-normal">
                          {h.created_at ? new Date(h.created_at).toLocaleString('vi-VN') : ''}
                        </span>
                      </div>
                      <p className="whitespace-pre-wrap leading-relaxed">
                        {h.action === 'ESCALATED' ? `[Yêu cầu can thiệp]: ${h.reason}` : h.message}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* FORM NHẬP PHẢN HỒI */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMsg && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs sm:text-sm text-red-700 flex items-start gap-2 animate-shake">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* CHỌN TRẠNG THÁI SAU KHI PHẢN HỒI */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Trạng thái khiếu nại sau phản hồi
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setStatus('RESOLVED')}
                  className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition ${status === 'RESOLVED'
                      ? 'bg-emerald-500 text-white border-emerald-600 shadow-sm'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Đã Giải Quyết (RESOLVED)
                </button>

                {role === 'PROVIDER' ? (
                  <button
                    type="button"
                    onClick={() => setStatus('PROCESSING')}
                    className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition ${status === 'PROCESSING'
                        ? 'bg-blue-600 text-white border-blue-700 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    Đang Xử Lý (PROCESSING)
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setStatus('ESCALATED')}
                    className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition ${status === 'ESCALATED'
                        ? 'bg-purple-600 text-white border-purple-700 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                  >
                    <ShieldAlert className="w-3.5 h-3.5" />
                    Đang Xác Minh (ESCALATED)
                  </button>
                )}
              </div>
            </div>

            {/* Ô NHẬP NỘI DUNG PHẢN HỒI */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <label className="font-bold text-slate-700">
                  Nội dung phản hồi giải quyết <span className="text-red-500">*</span>
                </label>
                <span className={`text-[11px] font-mono ${responseText.length > 3000 ? 'text-red-500 font-bold' : 'text-slate-400'}`}>
                  {responseText.length}/3000
                </span>
              </div>
              <textarea
                rows={5}
                value={responseText}
                onChange={(e) => setResponseText(e.target.value)}
                placeholder="Nhập nội dung phản hồi, hướng giải quyết thỏa đáng hoặc thông báo giải trình gửi tới khách hàng..."
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 text-slate-800 text-sm leading-relaxed transition resize-none"
                disabled={loading}
              />
              <p className="text-[11px] text-slate-400">
                Khách hàng sẽ nhận được thông báo ngay trên hệ thống ParkLink khi bạn gửi phản hồi này.
              </p>
            </div>
          </form>
        </div>

        {/* FOOTER MODAL */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-bold text-xs transition disabled:opacity-50"
          >
            Hủy Bỏ
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading || !responseText.trim()}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md shadow-teal-600/20 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Đang gửi...
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                {isEditing ? 'Cập Nhật Phản Hồi' : 'Gửi Phản Hồi'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
});

ReplyComplaintModal.displayName = 'ReplyComplaintModal';

export default ReplyComplaintModal;

