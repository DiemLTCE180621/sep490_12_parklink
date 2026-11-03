import React, { useState, useEffect, useCallback, memo } from 'react';
import {
  X,
  ShieldAlert,
  AlertTriangle,
  Loader2,
  Building2,
  Send,
  AlertCircle
} from 'lucide-react';
import complaintService from '../../services/complaintService';

const EscalateComplaintModal = memo(({
  isOpen,
  onClose,
  complaint,
  onSuccess
}) => {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setReason('');
      setErrorMsg(null);
    }
  }, [isOpen]);

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
    if (!reason.trim()) {
      setErrorMsg('Vui lòng nhập lý do bạn muốn chuyển cấp yêu cầu can thiệp.');
      return;
    }

    try {
      setLoading(true);
      setErrorMsg(null);
      const res = await complaintService.escalateComplaint(complaint.id, reason.trim());
      const updated = res.data || {
        ...complaint,
        status: 'ESCALATED'
      };

      if (onSuccess) {
        onSuccess(updated);
      }
      onClose();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || 'Lỗi khi yêu cầu chuyển cấp');
    } finally {
      setLoading(false);
    }
  }, [complaint, reason, onSuccess, onClose]);

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
        {/* HEADER */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-purple-100 bg-gradient-to-r from-purple-50 via-slate-50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-600 text-white flex items-center justify-center shadow-md shadow-purple-600/20">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-extrabold text-slate-900">
                Yêu Cầu Admin Can Thiệp
              </h3>
              <p className="text-xs text-slate-500">
                Chuyển cấp khiếu nại #{complaint.id} lên Ban Quản Trị ParkLink
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* BODY */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-800 flex items-start gap-2.5 leading-relaxed">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>
              Bạn chỉ nên chuyển cấp khi Chủ bãi xe không phản hồi trong thời hạn hoặc không giải quyết thỏa đáng. Ban Quản Trị sẽ trực tiếp vào cuộc xác minh và đưa ra phán quyết cuối cùng.
            </span>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 text-xs space-y-1">
            <p className="font-extrabold text-slate-900 text-sm">{complaint.title}</p>
            <div className="flex items-center gap-1.5 text-slate-600">
              <Building2 className="w-3.5 h-3.5 text-teal-600" />
              <span>Bãi xe: <strong className="text-slate-800">{complaint.facility?.name}</strong></span>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <label className="font-bold text-slate-700">
                Lý do yêu cầu Admin can thiệp <span className="text-red-500">*</span>
              </label>
              <span className="text-[11px] font-mono text-slate-400">
                {reason.length}/1000
              </span>
            </div>
            <textarea
              rows={4}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Nêu rõ lý do (ví dụ: Chủ bãi xe quá 48h không phản hồi, giải thích của chủ bãi không hợp lý, bãi xe từ chối bồi thường...)"
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 text-slate-800 text-sm leading-relaxed resize-none transition"
              disabled={loading}
              maxLength={1000}
            />
          </div>

          {/* FOOTER */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-bold text-xs transition disabled:opacity-50"
            >
              Hủy Bỏ
            </button>
            <button
              type="submit"
              disabled={loading || !reason.trim()}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md shadow-purple-600/20 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Đang chuyển cấp...
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  Xác Nhận Chuyển Cấp
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
});

EscalateComplaintModal.displayName = 'EscalateComplaintModal';

export default EscalateComplaintModal;

