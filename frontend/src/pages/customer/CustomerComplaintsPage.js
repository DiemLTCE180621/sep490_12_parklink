import React, { useEffect, useState, useCallback } from 'react';
import complaintService from '../../services/complaintService';
import { useSocket } from '../../context/SocketContext';
import { Link } from 'react-router-dom';
import Toast from '../../components/common/Toast';
import {
  AlertCircle,
  Calendar,
  Building2,
  Clock,
  CheckCircle2,
  Loader2,
  ArrowLeft,
  Inbox,
  MessageSquare
} from 'lucide-react';

const CustomerComplaintsPage = () => {
  const socket = useSocket();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState({ message: '', type: 'success' });

  const fetchComplaints = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      setError(null);
      const res = await complaintService.getMyComplaints();
      const list = res.data?.complaints || res.complaints || [];
      setComplaints(list);
    } catch (err) {
      setError(err.message || 'Không thể tải danh sách khiếu nại của bạn!');
    } finally {
      if (showLoading) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchComplaints(true);
  }, [fetchComplaints]);

  useEffect(() => {
    if (!socket) return;

    const handleComplaintUpdate = (payload) => {
      console.log('[Customer Socket] Cập nhật khiếu nại:', payload);
      if (payload.complaint) {
        setComplaints((prev) =>
          prev.map((c) => (c.id === payload.complaint.id ? { ...c, ...payload.complaint } : c))
        );
      } else {
        fetchComplaints(false);
      }
    };

    socket.on('complaint_updated', handleComplaintUpdate);

    return () => {
      socket.off('complaint_updated', handleComplaintUpdate);
    };
  }, [socket, fetchComplaints]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PENDING_ADMIN':
      case 'PENDING':
      case 'OPEN':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-amber-100 text-amber-800 border border-amber-300">
            <Clock className="w-3.5 h-3.5" /> Chờ BQT tiếp nhận
          </span>
        );
      case 'WAITING_PROVIDER':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-blue-100 text-blue-800 border border-blue-300">
            <Clock className="w-3.5 h-3.5" /> Chờ Bãi Xe Giải Trình
          </span>
        );
      case 'PROVIDER_REPLIED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-indigo-100 text-indigo-800 border border-indigo-300">
            <MessageSquare className="w-3.5 h-3.5" /> Bãi Xe Đã Giải Trình
          </span>
        );
      case 'PROCESSING':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-sky-100 text-sky-800 border border-sky-300">
            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Đang Thẩm Tra Đối Soát
          </span>
        );
      case 'RESOLVED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5" /> Đã Giải Quyết
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-rose-100 text-rose-800 border border-rose-300">
            <AlertCircle className="w-3.5 h-3.5" /> Bác Bỏ Khiếu Nại
          </span>
        );
      case 'CLOSED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-slate-200 text-slate-800 border border-slate-300">
            <CheckCircle2 className="w-3.5 h-3.5" /> Đã Đóng
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

  return (
    <div className="min-h-screen bg-slate-50 pb-10">
      {/* TOAST */}
      <Toast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: '', type: 'success' })}
      />

      {/* HEADER BANNER */}
      <div className="w-full bg-gradient-to-r from-slate-900 via-slate-800 to-teal-950 px-6 sm:px-12 py-10 text-white shadow-xl mb-8">
        <div className="w-full flex flex-col gap-4">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 text-teal-400 hover:text-teal-300 font-medium text-sm transition-all self-start hover:bg-white/5 px-4 py-2 rounded-full border border-teal-500/30 hover:border-teal-400 backdrop-blur-sm"
          >
            <ArrowLeft className="w-4 h-4" /> Quay lại Dashboard
          </Link>

          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-amber-500 text-white rounded-2xl flex items-center justify-center shadow-lg">
              <AlertCircle className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold">Khiếu Nại Của Tôi</h1>
              <p className="text-teal-300 text-sm font-medium mt-1">
                Theo dõi quá trình giải quyết từ Chủ bãi xe hoặc yêu cầu Ban Quản Trị can thiệp khi cần thiết.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-8 w-full mx-auto">
        <div className="max-w-7xl mx-auto space-y-6">
          {loading ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm space-y-4">
              <Loader2 className="w-10 h-10 animate-spin text-teal-600 mx-auto" />
              <p className="text-slate-600 font-semibold text-sm">Đang tải danh sách khiếu nại...</p>
            </div>
          ) : error ? (
            <div className="bg-white rounded-3xl p-8 border border-red-200 shadow-sm text-center space-y-4">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
              <h3 className="text-lg font-bold text-slate-900">Không thể tải dữ liệu</h3>
              <p className="text-sm text-slate-600">{error}</p>
              <button
                onClick={() => fetchComplaints(true)}
                className="px-5 py-2.5 bg-teal-600 text-white font-bold text-xs rounded-xl shadow-md hover:bg-teal-700 transition"
              >
                Thử Lại
              </button>
            </div>
          ) : complaints.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm space-y-4">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
                <Inbox className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-800">Không có khiếu nại nào</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Bạn chưa từng gửi khiếu nại nào lên hệ thống.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {complaints.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col gap-4"
                >
                  {/* HEADER THẺ */}
                  <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-4">
                    <div className="space-y-1">
                      <h3 className="text-lg font-extrabold text-slate-900">{item.title}</h3>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-600">#{item.id}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" /> Gửi ngày: {new Date(item.created_at).toLocaleDateString('vi-VN')}
                        </span>
                      </div>
                    </div>
                    <div>{getStatusBadge(item.status)}</div>
                  </div>

                  {/* NỘI DUNG KHIẾU NẠI */}
                  <div className="text-sm text-slate-700 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <span className="font-bold block mb-1 text-slate-900">Nội dung khiếu nại:</span>
                    <p className="whitespace-pre-wrap leading-relaxed">{item.description}</p>
                    {Array.isArray(item.image_urls) && item.image_urls.length > 0 && (
                      <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-5">
                        {item.image_urls.map((url, index) => (
                          <a
                            key={url}
                            href={url}
                            target="_blank"
                            rel="noreferrer"
                            className="aspect-square overflow-hidden rounded-lg border border-slate-200 bg-white"
                          >
                            <img src={url} alt={`Ảnh khiếu nại ${index + 1}`} className="h-full w-full object-cover hover:opacity-90" />
                          </a>
                        ))}
                      </div>
                    )}
                  </div>

                  {item.facility && (
                    <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
                      <Building2 className="w-4 h-4 text-teal-600" /> Liên quan đến bãi xe: <span className="font-bold text-slate-900">{item.facility.name}</span>
                    </div>
                  )}

                  {/* PHẢN HỒI TỪ CHỦ BÃI XE (CHỈ HIỂN THỊ PHẢN HỒI CỦA PROVIDER, ẨN LỆNH NỘI BỘ CỦA ADMIN) */}
                  {(() => {
                    const providerReplies = Array.isArray(item.response_history)
                      ? item.response_history.filter((h) => h.sender_role === 'PROVIDER' || h.action === 'PROVIDER_REPLY')
                      : [];

                    if (providerReplies.length === 0) return null;

                    return (
                      <div className="space-y-2 pt-1">
                        <span className="text-xs font-bold text-teal-800 uppercase tracking-wider flex items-center gap-1.5">
                          <MessageSquare className="w-3.5 h-3.5 text-teal-600" />
                          Phản hồi từ Chủ bãi xe:
                        </span>
                        <div className="space-y-2">
                          {providerReplies.map((reply, idx) => (
                            <div
                              key={idx}
                              className="p-3.5 rounded-2xl text-xs space-y-1.5 bg-teal-50/70 border border-teal-200 text-teal-950"
                            >
                              <div className="flex items-center justify-between font-bold">
                                <span className="text-teal-900">{reply.sender_name || 'Chủ bãi xe'}</span>
                                <span className="text-slate-400 font-normal">
                                  {reply.created_at ? new Date(reply.created_at).toLocaleString('vi-VN') : ''}
                                </span>
                              </div>
                              <p className="whitespace-pre-wrap leading-relaxed text-slate-800 text-xs sm:text-sm">
                                {reply.message}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}

                  {/* THÔNG BÁO TIẾN ĐỘ VÀ TRẠNG THÁI */}
                  <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    {item.status === 'PENDING_ADMIN' || item.status === 'PENDING' || item.status === 'OPEN' ? (
                      <div className="inline-flex items-center gap-2 text-xs font-medium text-amber-800 bg-amber-50 px-3.5 py-2.5 rounded-xl border border-amber-200 w-full">
                        <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>Ban Quản Trị ParkLink đã tiếp nhận khiếu nại và đang tiến hành thẩm tra hồ sơ hợp đồng.</span>
                      </div>
                    ) : item.status === 'WAITING_PROVIDER' ? (
                      <div className="inline-flex items-center gap-2 text-xs font-medium text-blue-800 bg-blue-50 px-3.5 py-2.5 rounded-xl border border-blue-200 w-full">
                        <Clock className="w-4 h-4 text-blue-600 shrink-0" />
                        <span>
                          Ban Quản Trị đã yêu cầu Chủ bãi xe kiểm tra giải quyết {item.deadline ? `(Thời hạn phản hồi: trước ${new Date(item.deadline).toLocaleDateString('vi-VN')})` : '(trong vòng 3 ngày)'}. Vui lòng chờ phản hồi.
                        </span>
                      </div>
                    ) : item.status === 'PROVIDER_REPLIED' ? (
                      <div className="inline-flex items-center gap-2 text-xs font-medium text-teal-800 bg-teal-50 px-3.5 py-2.5 rounded-xl border border-teal-200 w-full">
                        <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                        <span>Chủ bãi xe đã gửi phản hồi giải quyết cho bạn.</span>
                      </div>
                    ) : item.status === 'RESOLVED' ? (
                      <div className="inline-flex items-center gap-2 text-xs font-medium text-emerald-800 bg-emerald-50 px-3.5 py-2.5 rounded-xl border border-emerald-200 w-full">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Khiếu nại này đã được hoàn tất giải quyết thỏa đáng.</span>
                      </div>
                    ) : item.status === 'REJECTED' ? (
                      <div className="inline-flex items-center gap-2 text-xs font-medium text-rose-800 bg-rose-50 px-3.5 py-2.5 rounded-xl border border-rose-200 w-full">
                        <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                        <span>Khiếu nại không hợp lệ hoặc đã bị Ban Quản Trị bác bỏ.</span>
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-2 text-xs text-slate-500">
                        <span>Hồ sơ khiếu nại đã đóng.</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerComplaintsPage;
