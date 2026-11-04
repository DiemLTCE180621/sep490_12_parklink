import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, Calendar, FileText, CheckCircle2 } from 'lucide-react';
import policyService from '../../services/policyService';

/**
 * Modal hiển thị chi tiết Điều khoản & Chính sách dịch vụ (UC-90)
 * Cho phép người dùng xem nhanh khi đăng ký hoặc từ nút Disclaimer Google Login
 */
const PolicyDetailModal = ({ isOpen, onClose, policyType = 'CUSTOMER' }) => {
  const [policy, setPolicy] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && policyType) {
      fetchPolicy();
    }
  }, [isOpen, policyType]);

  const fetchPolicy = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await policyService.getPolicyByTypeOrId(policyType);
      if (res?.data?.policy) {
        setPolicy(res.data.policy);
      }
    } catch (err) {
      setError(err?.response?.data?.message || 'Không thể tải nội dung chính sách!');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Hiện hành';
    return new Date(dateStr).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-100 overflow-hidden animate-fadeIn flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-slate-900 via-slate-800 to-teal-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center font-bold">
              <ShieldCheck className="w-6 h-6 text-teal-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold">
                {policy?.title || 'Chính Sách & Điều Khoản Dịch Vụ'}
              </h3>
              <p className="text-xs text-teal-300 flex items-center gap-1.5 mt-0.5">
                <Calendar className="w-3.5 h-3.5" />
                <span>Cập nhật lần cuối ngày: {formatDate(policy?.updated_at)}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4 text-slate-700 text-sm leading-relaxed">
          {loading ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-8 h-8 border-3 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-slate-500 text-xs font-medium">Đang tải nội dung chính sách...</p>
            </div>
          ) : error ? (
            <div className="p-4 rounded-xl bg-red-50 text-red-600 text-center text-sm">
              {error}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Thông báo pháp lý chuẩn (Phương án 1) */}
              <div className="p-3.5 rounded-2xl bg-teal-50/80 border border-teal-100/80 text-teal-900 text-xs flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Quy ước chung:</strong> ParkLink có quyền cập nhật, sửa đổi các điều khoản này để phù hợp với quy định vận hành. Việc người dùng tiếp tục truy cập và sử dụng dịch vụ sau khi điều khoản được cập nhật đồng nghĩa với việc chấp thuận toàn bộ nội dung chính sách mới nhất.
                </span>
              </div>

              {/* Nội dung chính sách */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/70 whitespace-pre-line font-normal text-slate-800">
                {policy?.content || 'Chưa có nội dung văn bản cho chính sách này.'}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow transition"
          >
            Tôi Đã Hiểu & Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

export default PolicyDetailModal;
