import React, { useEffect, useState, useCallback } from 'react';
import complaintService from '../../services/complaintService';
import { AlertCircle, Calendar, CheckCircle2, Clock, Inbox, Loader2, ShieldAlert } from 'lucide-react';

const AdminComplaintsPanel = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchComplaints = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await complaintService.getAllComplaints();
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
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex min-h-[64px] items-center justify-between border-b border-slate-200 bg-gradient-to-r from-white to-slate-50 px-5 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-50 text-red-600 ring-1 ring-red-100">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 sm:text-lg">Quản lý khiếu nại</h3>
              <p className="hidden text-xs text-slate-500 sm:block">Theo dõi và xử lý yêu cầu từ khách hàng</p>
            </div>
          </div>
          <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 shadow-sm">
            Tổng cộng: <span className="ml-1 text-slate-900">{complaints.length}</span>
          </span>
        </div>

        {complaints.length === 0 ? (
          <div className="flex min-h-[280px] flex-col items-center justify-center px-5 py-10 text-center">
            <div className="relative mb-4">
              <div className="absolute inset-0 scale-150 rounded-full bg-slate-100"></div>
              <div className="relative flex h-16 w-16 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 shadow-sm">
                <Inbox className="h-7 w-7" />
              </div>
            </div>
            <h3 className="text-base font-extrabold text-slate-800 sm:text-lg">Không có khiếu nại nào</h3>
            <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
              Hệ thống hiện chưa ghi nhận khiếu nại nào. Các yêu cầu mới sẽ xuất hiện tại đây.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {complaints.map((item) => (
              <div key={item.id} className="bg-slate-50 rounded-2xl p-5 border border-slate-200 flex flex-col gap-4 hover:shadow-md transition">
                <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-4">
                  <div className="space-y-1">
                    <h4 className="text-lg font-extrabold text-slate-900">{item.title}</h4>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span className="font-mono bg-white border border-slate-200 px-2 py-0.5 rounded text-slate-600">#{item.id}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Gửi ngày: {new Date(item.created_at).toLocaleDateString('vi-VN')}</span>
                    </div>
                  </div>
                  <div>{getStatusBadge(item.status)}</div>
                </div>

                <div className="text-sm text-slate-700 bg-white p-4 rounded-xl border border-slate-100">
                  <span className="font-bold block mb-1 text-slate-900">Nội dung khiếu nại:</span>
                  <p className="whitespace-pre-wrap">{item.description}</p>
                  {Array.isArray(item.image_urls) && item.image_urls.length > 0 && (
                    <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-5">
                      {item.image_urls.map((url, index) => (
                        <a key={url} href={url} target="_blank" rel="noreferrer" className="aspect-square overflow-hidden rounded-lg border border-slate-200 bg-white">
                          <img src={url} alt={`Ảnh khiếu nại ${index + 1}`} className="h-full w-full object-cover hover:opacity-90" />
                        </a>
                      ))}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mt-2">
                  <div className="bg-white p-3 rounded-xl border border-slate-200">
                    <span className="block text-xs font-bold text-slate-500 mb-1 uppercase">Khách hàng (Người gửi)</span>
                    <p className="font-semibold text-slate-900">{item.customer?.full_name}</p>
                    <p className="text-slate-600 text-xs">{item.customer?.phone_number || item.customer?.email}</p>
                  </div>
                  <div className="bg-red-50/50 p-3 rounded-xl border border-red-100">
                    <span className="block text-xs font-bold text-red-800 mb-1 uppercase">Bãi đỗ xe bị khiếu nại</span>
                    <p className="font-semibold text-slate-900">{item.facility?.name}</p>
                    <p className="text-slate-600 text-xs mt-1">Chủ bãi: {item.facility?.provider?.full_name}</p>
                  </div>
                </div>

                {item.admin_response ? (
                  <div className="mt-2 p-4 bg-teal-50 border border-teal-200 rounded-xl">
                    <span className="font-bold block mb-1 text-teal-900 flex items-center gap-1.5"><AlertCircle className="w-4 h-4" /> Bạn (Admin) đã phản hồi:</span>
                    <p className="text-sm text-teal-800 whitespace-pre-wrap">{item.admin_response}</p>
                  </div>
                ) : (
                  <div className="mt-2 p-4 bg-amber-50 border border-amber-200 rounded-xl text-center">
                    <p className="text-sm text-amber-800 font-medium">Khiếu nại này chưa được xử lý. (Chức năng Reply sẽ ra mắt sau)</p>
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

export default AdminComplaintsPanel;
