import React, { useState, useEffect, useCallback, memo } from 'react';
import {
  X,
  Share2,
  Clock,
  AlertCircle,
  Loader2,
  Send
} from 'lucide-react';
import complaintService from '../../services/complaintService';

const ForwardComplaintModal = memo(({
  isOpen,
  onClose,
  complaint,
  onSuccess
}) => {
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    if (complaint && isOpen) {
      setNote('');
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

    if (!note || note.trim().length < 5) {
      setErrorMsg('Vui lòng nhập chỉ đạo hoặc yêu cầu giải trình (tối thiểu 5 ký tự).');
      return;
    }

    try {
      setLoading(true);
      const res = await complaintService.forwardToProvider(complaint.id, {
        note: note.trim()
      });

      const updated = res.data?.complaint || res.complaint || {
        ...complaint,
        status: 'WAITING_PROVIDER'
      };

      if (onSuccess) {
        onSuccess(updated);
      }
      onClose();
    } catch (err) {
      setErrorMsg(
        err.response?.data?.message ||
        err.message ||
        'Có lỗi khi chuyển tiếp khiếu nại tới chủ bãi xe!'
      );
    } finally {
      setLoading(false);
    }
  }, [complaint, note, onSuccess, onClose]);

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
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-blue-50/70 via-slate-50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-600/20 shrink-0">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">
                Chuyển tiếp cho Chủ Bãi xe
              </h3>
              <p className="text-xs text-slate-500">
                Khiếu nại #{complaint.id} • Yêu cầu kiểm tra & giải trình
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition disabled:opacity-50"
            title="Đóng"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* BODY */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* TÓM TẮT THÔNG TIN & THỜI HẠN */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div className="truncate">
              <span className="text-slate-500">Bãi xe tiếp nhận:</span>{' '}
              <strong className="text-slate-800">{complaint.facility?.name || 'Chủ cơ sở'}</strong>
            </div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-100/70 text-blue-800 font-semibold text-[11px] shrink-0 self-start sm:self-auto">
              <Clock className="w-3.5 h-3.5 text-blue-600" />
              Hạn giải trình: 3 ngày
            </div>
          </div>

          {/* Ô NHẬP NỘI DUNG CHỈ ĐẠO */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <label className="font-bold text-slate-700">
                Chỉ đạo / Yêu cầu giải trình gửi Chủ bãi xe <span className="text-red-500">*</span>
              </label>
              <span className={`text-[11px] font-mono ${note.length > 2000 ? 'text-red-500 font-bold' : 'text-slate-400'}`}>
                {note.length}/2000
              </span>
            </div>
            <textarea
              rows={4}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Nhập yêu cầu giải trình (kiểm tra camera, đối soát nhân viên, làm rõ phản ánh của khách và gửi phương án xử lý)..."
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-slate-800 text-sm leading-relaxed transition resize-none"
              disabled={loading}
              autoFocus
            />
          </div>

          {/* ACTION BUTTONS */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs sm:text-sm font-bold transition disabled:opacity-50"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={loading || !note.trim()}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-blue-600/20 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Đang chuyển...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Chuyển tiếp cho Chủ bãi xe
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
});

export default ForwardComplaintModal;
