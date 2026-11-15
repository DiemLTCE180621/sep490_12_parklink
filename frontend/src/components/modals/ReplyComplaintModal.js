import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import {
  X,
  MessageSquareReply,
  CheckCircle2,
  Loader2,
  Send,
  AlertCircle
} from 'lucide-react';
import complaintService from '../../services/complaintService';
import { validateReplyComplaint } from '../../validations/complaintValidation';

const ReplyComplaintModal = memo(({
  isOpen,
  onClose,
  complaint,
  onSuccess
}) => {
  const [responseText, setResponseText] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const myPreviousReply = useMemo(() => {
    if (!complaint) return null;
    const history = Array.isArray(complaint.response_history) ? complaint.response_history : [];
    return [...history].reverse().find((h) => h.sender_role === 'PROVIDER');
  }, [complaint]);

  const latestInstruction = useMemo(() => {
    if (!complaint) return null;
    const history = Array.isArray(complaint.response_history) ? complaint.response_history : [];
    return [...history].reverse().find((h) => h.action === 'FORWARDED_TO_PROVIDER' || h.sender_role === 'ADMIN');
  }, [complaint]);

  const isEditing = Boolean(myPreviousReply);

  useEffect(() => {
    if (complaint && isOpen) {
      setResponseText(myPreviousReply ? (myPreviousReply.message || '') : '');
      setErrorMsg(null);
    }
  }, [complaint, isOpen, myPreviousReply]);

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
      status: 'RESOLVED'
    });

    if (!validation.isValid) {
      setErrorMsg(validation.errors.response || 'Vui lòng nhập nội dung phản hồi hợp lệ');
      return;
    }

    try {
      setLoading(true);
      const res = await complaintService.replyToComplaint(complaint.id, {
        response: responseText.trim(),
        status: 'RESOLVED'
      });

      const updated = res.data?.complaint || res.data || res.complaint || {
        ...complaint,
        admin_response: responseText.trim(),
        status: 'RESOLVED'
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
  }, [complaint, responseText, onSuccess, onClose]);

  if (!isOpen || !complaint) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn"
      onClick={loading ? undefined : onClose}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-lg overflow-hidden transform transition-all duration-200 animate-scaleUp flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER MODAL */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-teal-50/70 via-slate-50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-600 text-white flex items-center justify-center shadow-md shadow-teal-600/20 shrink-0">
              <MessageSquareReply className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">
                Phản Hồi & Giải Quyết Khiếu Nại
              </h3>
              <p className="text-xs text-slate-500">
                Gửi trực tiếp tới Khách hàng • Khiếu nại #{complaint.id}
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* TÓM TẮT KHIẾU NẠI */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3 text-xs space-y-1">
            <div className="flex items-center justify-between gap-2">
              <span className="text-slate-500">Khách hàng: <strong className="text-slate-800">{complaint.customer?.full_name || 'Khách hàng'}</strong></span>
              <span className="font-bold text-slate-500">#{complaint.id}</span>
            </div>
            <p className="font-bold text-slate-900 truncate">
              {complaint.title}
            </p>
          </div>

          {/* CHỈ ĐẠO TỪ ADMIN (NẾU CÓ) */}
          {latestInstruction && (
            <div className="bg-amber-50/80 border border-amber-200/80 rounded-2xl p-3 text-xs text-amber-900 space-y-0.5">
              <span className="font-bold block text-amber-950">Yêu cầu từ Ban Quản Trị:</span>
              <p className="leading-relaxed line-clamp-2">{latestInstruction.message || latestInstruction.note}</p>
            </div>
          )}

          {/* THÔNG BÁO GIẢI QUYẾT TRỰC TIẾP */}
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-900 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              Phản hồi và phương án xử lý của bạn sẽ được gửi trực tiếp đến Khách hàng để giải quyết khiếu nại.
            </span>
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
              rows={4}
              value={responseText}
              onChange={(e) => setResponseText(e.target.value)}
              placeholder="Nhập nội dung giải trình, phương án hỗ trợ hoặc thỏa thuận giải quyết gửi trực tiếp tới khách hàng..."
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 text-slate-800 text-sm leading-relaxed transition resize-none"
              disabled={loading}
              autoFocus
            />
          </div>

          {/* FOOTER BUTTONS */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-bold text-xs sm:text-sm transition disabled:opacity-50"
            >
              Hủy Bỏ
            </button>
            <button
              type="submit"
              disabled={loading || !responseText.trim()}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-teal-600/20 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Đang gửi...
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  {isEditing ? 'Cập Nhật Phản Hồi' : 'Gửi Phản Hồi Cho Khách'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
});

ReplyComplaintModal.displayName = 'ReplyComplaintModal';

export default ReplyComplaintModal;
