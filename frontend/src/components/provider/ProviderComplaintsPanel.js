import React, { useEffect, useState, useCallback } from 'react';
import complaintService from '../../services/complaintService';
import { AlertCircle, Calendar, CheckCircle2, Clock, Inbox, Loader2, MessageSquareText, User, Building2 } from 'lucide-react';

const ProviderComplaintsPanel = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchComplaints = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await complaintService.getProviderComplaints();
      const list = res.data?.complaints || res.complaints || [];
      setComplaints(list);
    } catch (err) {
      setError(err.message || 'Không thể tải danh sách khiếu nại!');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchComplaints();
  }, [fetchComplaints]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PENDING':
      case 'OPEN':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-amber-100 text-amber-800 border border-amber-300">
            <Clock className="w-3.5 h-3.5" /> Chờ Xử Lý
          </span>
        );
      case 'PROCESSING':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-blue-100 text-blue-800 border border-blue-300">
            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Đang Xử Lý
          </span>
        );
      case 'RESOLVED':
      case 'CLOSED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5" /> Đã Giải Quyết
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-800">
            {status}
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-teal-600 mx-auto" />
        <p className="text-slate-600 font-semibold text-sm">Đang tải danh sách khiếu nại...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-3xl p-8 border border-red-200 shadow-sm text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
        <h3 className="text-lg font-bold text-slate-900">Không thể tải dữ liệu</h3>
        <p className="text-sm text-slate-600">{error}</p>
        <button
          onClick={fetchComplaints}
          className="px-5 py-2.5 bg-teal-600 text-white font-bold text-xs rounded-xl shadow-md hover:bg-teal-700 transition"
        >
          Thử Lại
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-md">
        <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <MessageSquareText className="w-5 h-5 text-teal-600" /> Quản Lý Khiếu Nại
          </h3>
          <span className="text-xs font-bold bg-slate-100 text-slate-600 px-3 py-1 rounded-full">
            Tổng cộng: {complaints.length}
          </span>
        </div>

        {complaints.length === 0 ? (
          <div className="text-center py-12 space-y-4">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-400">
              <Inbox className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">Không có khiếu nại nào</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Chưa có khách hàng nào khiếu nại bãi đỗ xe của bạn.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {complaints.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm hover:shadow-md transition flex flex-col gap-3.5"
              >
                {/* 1. Header của thẻ ID */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-xs border border-slate-200">
                      #{item.id}
                    </span>
                    <h4 className="text-base sm:text-lg font-extrabold text-slate-900">{item.title}</h4>
                    <span className="text-slate-300">•</span>
                    <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      Gửi ngày: {new Date(item.created_at).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                  <div>{getStatusBadge(item.status)}</div>
                </div>

                {/* 2. Nội dung khiếu nại (Không đóng khung nhỏ) */}
                <div className="text-sm text-slate-700 space-y-2">
                  <div className="flex items-start gap-2">
                    <span className="font-bold text-slate-900 shrink-0">Nội dung khiếu nại:</span>
                    <p className="text-slate-800 whitespace-pre-wrap flex-1">{item.description}</p>
                  </div>
                  {Array.isArray(item.image_urls) && item.image_urls.length > 0 && (
                    <div className="pt-1 flex flex-wrap gap-2">
                      {item.image_urls.map((url, index) => (
                        <a
                          key={url}
                          href={url}
                          target="_blank"
                          rel="noreferrer"
                          className="relative block w-20 h-20 rounded-xl overflow-hidden border border-slate-200 hover:ring-2 hover:ring-teal-500 transition group"
                        >
                          <img
                            src={url}
                            alt={`Ảnh khiếu nại ${index + 1}`}
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-200"
                          />
                        </a>
                      ))}
                    </div>
                  )}
                </div>

                {/* 3. Thông tin khách hàng & bãi xe liên quan (Mỗi thông tin nằm trên 1 dòng riêng biệt) */}
                <div className="pt-3 border-t border-slate-100 flex flex-col gap-3 text-xs">
                  <div className="flex items-start gap-2.5 text-slate-600">
                    <User className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <span className="block text-slate-400 font-medium">Khách hàng:</span>
                      <p className="font-bold text-slate-900 text-sm leading-snug">{item.customer?.full_name || 'Khách hàng'}</p>
                      {(item.customer?.phone_number || item.customer?.email) && (
                        <p className="text-slate-500 text-xs">
                          {item.customer?.phone_number || item.customer?.email}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5 text-slate-600">
                    <Building2 className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <span className="block text-slate-400 font-medium">Bãi xe liên quan:</span>
                      <p className="font-bold text-slate-900 text-sm leading-snug">{item.facility?.name}</p>
                    </div>
                  </div>
                </div>

                {/* 4. Phản hồi từ Admin (nếu có) */}
                {item.admin_response && (
                  <div className="pt-3 border-t border-slate-100 flex items-start gap-2 text-xs text-teal-800">
                    <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-teal-900">Phản hồi từ Quản trị viên: </span>
                      <span className="text-slate-700">{item.admin_response}</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProviderComplaintsPanel;
