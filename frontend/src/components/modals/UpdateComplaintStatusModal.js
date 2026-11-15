import React, { useState, useEffect, useCallback, memo } from 'react';
import {
  X,
  ShieldCheck,
  CheckCircle2,
  Loader2,
  Building2,
  User,
  AlertCircle
} from 'lucide-react';
import { ADMIN_ALLOWED_STATUS_OPTIONS } from '../../constants/complaintConstants';
import { validateUpdateComplaintStatus } from '../../validations/complaintValidation';
import complaintService from '../../services/complaintService';

const UpdateComplaintStatusModal = memo(({
  isOpen,
  onClose,
  complaint,
  onSuccess
}) => {
  const [selectedStatus, setSelectedStatus] = useState('RESOLVED');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    if (complaint && isOpen) {
      if (['RESOLVED', 'REJECTED', 'PROCESSING', 'CLOSED'].includes(complaint.status)) {
        setSelectedStatus(complaint.status);
      } else {
        setSelectedStatus('RESOLVED');
      }
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

    const validation = validateUpdateComplaintStatus({
      status: selectedStatus,
      note
    });

    if (!validation.isValid) {
      setErrorMsg(validation.errors.status || validation.errors.note || 'Dữ liệu không hợp lệ');
      return;
    }

    try {
      setLoading(true);

      const res = await complaintService.updateComplaintStatusByAdmin(complaint.id, {
        status: selectedStatus,
        note: note.trim()
      });

      const updated = res.data?.complaint || res.data || {
        ...complaint,
        status: selectedStatus
      };

      if (onSuccess) {
        onSuccess(updated);
      }
      onClose();
    } catch (err) {
      setErrorMsg(
        err.response?.data?.message ||
        err.message ||
        'Lỗi khi cập nhật trạng thái khiếu nại!'
      );
    } finally {
      setLoading(false);
    }
  }, [complaint, selectedStatus, note, onSuccess, onClose]);

  if (!isOpen || !complaint) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn"
      onClick={loading ? undefined : onClose}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-xl overflow-hidden transform transition-all duration-200 animate-scaleUp flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER MODAL */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-purple-50/80 via-slate-50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-600 text-white flex items-center justify-center shadow-md shadow-purple-600/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-extrabold text-slate-900">
                Cập Nhật Trạng Thái Khiếu Nại
              </h3>
              <p className="text-xs text-slate-500">
                Mã khiếu nại #{complaint.id} • Quyền hạn: <span className="font-semibold text-purple-700">Admin ParkLink</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* BODY */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Thông báo lỗi nếu có */}
          {errorMsg && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3 text-xs text-red-700 animate-shake">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{errorMsg}</div>
            </div>
          )}

          {/* THÔNG TIN TÓM TẮT KHIẾU NẠI */}
          <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-200/80 space-y-2.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-slate-900 text-sm">
                #{complaint.id} - {complaint.title}
              </span>
              <span className="px-2.5 py-0.5 rounded-full font-bold bg-purple-100 text-purple-800 border border-purple-200 text-[11px]">
                {complaint.status}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-slate-600">
              <div className="flex items-center gap-1.5 truncate">
                <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate">Khách hàng: <strong className="text-slate-800">{complaint.customer?.full_name || 'Khách hàng'}</strong></span>
              </div>
              <div className="flex items-center gap-1.5 truncate">
                <Building2 className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                <span className="truncate">Bãi xe: <strong className="text-slate-800">{complaint.facility?.name}</strong></span>
              </div>
            </div>
          </div>

          {/* CHỌN TRẠNG THÁI MỤC TIÊU */}
          <div className="space-y-2.5">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Chọn trạng thái cập nhật <span className="text-red-500">*</span>
            </label>

            <div className="space-y-2">
              {ADMIN_ALLOWED_STATUS_OPTIONS.map((opt) => {
                const isSelected = selectedStatus === opt.value;
                return (
                  <label
                    key={opt.value}
                    className={`flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer transition select-none ${isSelected
                        ? 'border-purple-500 bg-purple-50/50 shadow-sm ring-1 ring-purple-500/20'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                      }`}
                  >
                    <input
                      type="radio"
                      name="adminComplaintStatus"
                      value={opt.value}
                      checked={isSelected}
                      onChange={(e) => setSelectedStatus(e.target.value)}
                      className="mt-1 w-4 h-4 text-purple-600 focus:ring-purple-500 border-slate-300"
                    />
                    <div className="flex-1 space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm text-slate-900">{opt.label}</span>
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${opt.badgeClass}`}>
                          {opt.value}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed">{opt.description}</p>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* GHI CHÚ KẾT LUẬN / PHÁN QUYẾT */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Ghi chú phán quyết của Admin (Tùy chọn)
              </label>
              <span className="text-[11px] text-slate-400">
                {note.length}/2000 ký tự
              </span>
            </div>
            <textarea
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={2000}
              placeholder="Nhập kết luận thẩm tra, hướng giải quyết hoặc căn cứ xử lý để thông báo đến Khách hàng và Chủ bãi xe..."
              className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition resize-none"
            />
          </div>

          {/* FOOTER ACTIONS */}
          <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition disabled:opacity-50"
            >
              Hủy Bỏ
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md shadow-purple-600/20 hover:shadow-lg transition disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Đang Cập Nhật...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Lưu Trạng Thái
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
});

export default UpdateComplaintStatusModal;

