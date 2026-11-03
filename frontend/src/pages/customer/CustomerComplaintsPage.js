import React, { useEffect, useState, useCallback } from 'react';
import complaintService from '../../services/complaintService';
import { useSocket } from '../../context/SocketContext';
import { Link } from 'react-router-dom';
import Toast from '../../components/common/Toast';
import EscalateComplaintModal from '../../components/modals/EscalateComplaintModal';
import {
  AlertCircle,
  Calendar,
  Building2,
  Clock,
  CheckCircle2,
  Loader2,
  ArrowLeft,
  Inbox,
  ShieldAlert,
  MessageSquare
} from 'lucide-react';

const CustomerComplaintsPage = () => {
  const socket = useSocket();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState({ message: '', type: 'success' });

  // Modal chuyển cấp
  const [selectedForEscalate, setSelectedForEscalate] = useState(null);
  const [isEscalateModalOpen, setIsEscalateModalOpen] = useState(false);

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

  const handleEscalateSuccess = useCallback((updatedComplaint) => {
    setComplaints((prev) =>
      prev.map((c) => (c.id === updatedComplaint.id ? { ...c, ...updatedComplaint } : c))
    );
    setToast({
      message: `Đã gửi yêu cầu chuyển cấp khiếu nại #${updatedComplaint.id} lên Ban Quản Trị thành công!`,
      type: 'success'
    });
  }, []);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PENDING':
      case 'OPEN':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-amber-100 text-amber-800 border border-amber-300">
            <Clock className="w-3.5 h-3.5" /> Chờ Bãi Xe Xử Lý
          </span>
        );
      case 'PROCESSING':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-blue-100 text-blue-800 border border-blue-300">
            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Bãi Xe Đang Xử Lý
          </span>
        );
      case 'ESCALATED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-purple-100 text-purple-800 border border-purple-300">
            <ShieldAlert className="w-3.5 h-3.5" /> Chờ Admin Can Thiệp
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

  return (
    <div className="min-h-screen bg-slate-50 pb-10">
      {/* TOAST */}
      <Toast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: '', type: 'success' })}
      />

      {/* MODAL CHUYỂN CẤP */}
      <EscalateComplaintModal
        isOpen={isEscalateModalOpen}
        onClose={() => setIsEscalateModalOpen(false)}
        complaint={selectedForEscalate}
        onSuccess={handleEscalateSuccess}
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

                  {/* LỊCH SỬ TRAO ĐỔI & PHẢN HỒI */}
                  {Array.isArray(item.response_history) && item.response_history.length > 0 ? (
                    <div className="space-y-2.5 pt-2">
                      <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                        <MessageSquare className="w-3.5 h-3.5 text-teal-600" />
                        Tiến trình trao đổi & giải quyết:
                      </span>
                      <div className="space-y-2">
                        {item.response_history.map((hist, idx) => (
                          <div
                            key={idx}
                            className={`p-3.5 rounded-2xl text-xs space-y-1 ${hist.action === 'ESCALATED'
                                ? 'bg-purple-50 border border-purple-200 text-purple-900'
                                : hist.sender_role === 'ADMIN'
                                  ? 'bg-teal-50 border border-teal-200 text-teal-900'
                                  : 'bg-slate-50 border border-slate-200 text-slate-800'
                              }`}
                          >
                            <div className="flex items-center justify-between font-bold">
                              <span>{hist.sender_name || (hist.sender_role === 'ADMIN' ? 'Ban Quản Trị' : 'Chủ bãi xe')}</span>
                              <span className="text-slate-400 font-normal">
                                {hist.created_at ? new Date(hist.created_at).toLocaleString('vi-VN') : ''}
                              </span>
                            </div>
                            <p className="whitespace-pre-wrap leading-relaxed text-slate-700">
                              {hist.action === 'ESCALATED' ? `[Yêu cầu Admin can thiệp]: ${hist.reason}` : hist.message}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : item.admin_response ? (
                    <div className="mt-2 p-4 bg-teal-50/80 border border-teal-200/80 rounded-2xl space-y-1">
                      <span className="font-bold text-xs text-teal-900 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-teal-600" />
                        Phản hồi giải quyết:
                      </span>
                      <p className="text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">{item.admin_response}</p>
                    </div>
                  ) : (
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 text-xs text-slate-500 flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-amber-500" />
                      <span>Chủ bãi xe đang tiếp nhận khiếu nại này. Vui lòng chờ phản hồi trực tiếp từ bãi xe.</span>
                    </div>
                  )}

                  {/* KHU VỰC HÀNH ĐỘNG CHUYỂN CẤP (ESCALATE) */}
                  <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    {item.status === 'ESCALATED' ? (
                      <div className="inline-flex items-center gap-2 text-xs font-semibold text-purple-700 bg-purple-50 px-3 py-2 rounded-xl border border-purple-200 w-full sm:w-auto">
                        <ShieldAlert className="w-4 h-4 text-purple-600 shrink-0" />
                        <span>Khiếu nại này đã được chuyển cấp. Ban Quản Trị đang can thiệp xử lý.</span>
                      </div>
                    ) : item.status === 'RESOLVED' ? (
                      <div className="inline-flex items-center gap-2 text-xs text-emerald-700">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Khiếu nại này đã hoàn tất giải quyết.</span>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400">
                        Chủ bãi xe không phản hồi hoặc giải quyết không thỏa đáng?
                      </span>
                    )}

                    {item.status !== 'ESCALATED' && (
                      <button
                        onClick={() => {
                          setSelectedForEscalate(item);
                          setIsEscalateModalOpen(true);
                        }}
                        className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 hover:text-purple-800 border border-purple-200 font-bold text-xs rounded-xl transition shadow-sm"
                      >
                        <ShieldAlert className="w-3.5 h-3.5" />
                        Yêu cầu Admin can thiệp
                      </button>
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
