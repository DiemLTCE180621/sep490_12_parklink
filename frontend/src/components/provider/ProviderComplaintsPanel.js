import React, { useEffect, useState, useCallback, useMemo } from 'react';
import complaintService from '../../services/complaintService';
import { useSocket } from '../../context/SocketContext';
import Toast from '../common/Toast';
import ReplyComplaintModal from '../modals/ReplyComplaintModal';
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  Inbox,
  Loader2,
  MessageSquareText,
  User,
  Building2,
  MessageSquareReply,
  Edit3,
  Search,
  Filter,
  RefreshCw,
  ShieldAlert
} from 'lucide-react';

const ProviderComplaintsPanel = () => {
  const socket = useSocket();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState({ message: '', type: 'success' });

  // Filters & Tìm kiếm
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modal phản hồi
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [isReplyModalOpen, setIsReplyModalOpen] = useState(false);

  const fetchComplaints = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      setError(null);
      const res = await complaintService.getProviderComplaints();
      const list = res.data?.complaints || res.complaints || [];
      setComplaints(list);
    } catch (err) {
      setError(err.message || 'Không thể tải danh sách khiếu nại!');
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
      console.log('[Provider Socket] Cập nhật khiếu nại:', payload);
      if (payload.complaint) {
        setComplaints((prev) => {
          const exists = prev.some((c) => c.id === payload.complaint.id);
          if (exists) {
            return prev.map((c) => (c.id === payload.complaint.id ? { ...c, ...payload.complaint } : c));
          }
          return [payload.complaint, ...prev];
        });
      } else {
        fetchComplaints(false);
      }
    };

    socket.on('complaint_updated', handleComplaintUpdate);

    return () => {
      socket.off('complaint_updated', handleComplaintUpdate);
    };
  }, [socket, fetchComplaints]);

  //modal phản hồi
  const handleOpenReplyModal = useCallback((complaintItem) => {
    setSelectedComplaint(complaintItem);
    setIsReplyModalOpen(true);
  }, []);

  const handleReplySuccess = useCallback((updatedComplaint) => {
    setComplaints((prev) =>
      prev.map((c) => (c.id === updatedComplaint.id ? { ...c, ...updatedComplaint } : c))
    );
    setToast({
      message: `Đã phản hồi khiếu nại #${updatedComplaint.id} thành công! Khách hàng đã được thông báo.`,
      type: 'success'
    });
  }, []);

  const getStatusBadge = useCallback((status) => {
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
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5" /> Đã Giải Quyết
          </span>
        );
      case 'CLOSED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-slate-200 text-slate-800 border border-slate-300">
            <ShieldAlert className="w-3.5 h-3.5" /> Đã Đóng
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-800">
            {status}
          </span>
        );
    }
  }, []);

  // Tối ưu hóa bộ lọc với useMemo
  const filteredComplaints = useMemo(() => {
    return complaints.filter((item) => {
      if (statusFilter !== 'ALL') {
        if (statusFilter === 'PENDING' && item.status !== 'PENDING' && item.status !== 'OPEN') {
          return false;
        }
        if (statusFilter !== 'PENDING' && item.status !== statusFilter) {
          return false;
        }
      }

      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase().trim();
        const matchesId = item.id?.toString().includes(query);
        const matchesTitle = item.title?.toLowerCase().includes(query);
        const matchesCustomer = item.customer?.full_name?.toLowerCase().includes(query);
        const matchesFacility = item.facility?.name?.toLowerCase().includes(query);
        return matchesId || matchesTitle || matchesCustomer || matchesFacility;
      }

      return true;
    });
  }, [complaints, statusFilter, searchTerm]);

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
          onClick={() => fetchComplaints(true)}
          className="px-5 py-2.5 bg-teal-600 text-white font-bold text-xs rounded-xl shadow-md hover:bg-teal-700 transition"
        >
          Thử Lại
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* THÔNG BÁO TOAST */}
      <Toast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: '', type: 'success' })}
      />

      {/* MODAL PHẢN HỒI KHIẾU NẠI CHO PROVIDER */}
      <ReplyComplaintModal
        isOpen={isReplyModalOpen}
        onClose={() => setIsReplyModalOpen(false)}
        complaint={selectedComplaint}
        onSuccess={handleReplySuccess}
        role="PROVIDER"
      />

      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-4 mb-4">
          <div className="space-y-1">
            <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <MessageSquareText className="w-5 h-5 text-teal-600" /> Quản Lý Khiếu Nại Bãi Đỗ Xe
            </h3>
            <p className="text-xs text-slate-500">
              Lắng nghe và phản hồi trực tiếp các thắc mắc, phản ánh từ khách thuê bãi xe
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchComplaints(true)}
              className="p-2 text-slate-500 hover:text-teal-600 hover:bg-teal-50 rounded-xl transition"
              title="Tải lại danh sách"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold bg-slate-100 text-slate-700 px-3 py-1.5 rounded-full border border-slate-200">
              Tổng cộng: <strong className="text-teal-700">{complaints.length}</strong>
            </span>
          </div>
        </div>

        {/* BỘ LỌC & TÌM KIẾM */}
        <div className="mb-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo tiêu đề, ID, khách hàng..."
              className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            {[
              { id: 'ALL', label: 'Tất cả' },
              { id: 'PENDING', label: 'Chờ xử lý' },
              { id: 'PROCESSING', label: 'Đang xử lý' },
              { id: 'ESCALATED', label: 'Chuyển cấp Admin' },
              { id: 'RESOLVED', label: 'Đã giải quyết' }
            ].map((btn) => (
              <button
                key={btn.id}
                onClick={() => setStatusFilter(btn.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${statusFilter === btn.id
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>

        {filteredComplaints.length === 0 ? (
          <div className="text-center py-12 space-y-4">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-400">
              <Inbox className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">
              {complaints.length === 0 ? 'Không có khiếu nại nào' : 'Không tìm thấy khiếu nại phù hợp'}
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              {complaints.length === 0
                ? 'Chưa có khách hàng nào khiếu nại bãi đỗ xe của bạn.'
                : 'Thử kiểm tra lại từ khóa tìm kiếm hoặc bỏ chọn bộ lọc trạng thái.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredComplaints.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm hover:shadow-md transition flex flex-col gap-3.5"
              >
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

                {/*Nội dung khiếu nại */}
                <div className="text-sm text-slate-700 space-y-2">
                  <div className="flex items-start gap-2">
                    <span className="font-bold text-slate-900 shrink-0">Nội dung khiếu nại:</span>
                    <p className="text-slate-800 whitespace-pre-wrap flex-1 leading-relaxed">{item.description}</p>
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

                {/*Thông tin khách hàng & bãi xe liên quan */}
                <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-start justify-between gap-3 text-xs">
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

                {/* LỊCH SỬ TRAO ĐỔI & TIẾN TRÌNH */}
                {Array.isArray(item.response_history) && item.response_history.length > 0 && (
                  <div className="pt-2 space-y-2">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                      Tiến trình giải quyết khiếu nại:
                    </span>
                    <div className="space-y-2">
                      {item.response_history.map((hist, idx) => (
                        <div
                          key={idx}
                          className={`p-3 rounded-xl text-xs space-y-1 ${
                            hist.action === 'ESCALATED'
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
                          <p className="whitespace-pre-wrap leading-relaxed">
                            {hist.action === 'ESCALATED' ? `[Khách yêu cầu Admin can thiệp]: ${hist.reason}` : hist.message}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 4. PHẢN HỒI KHIẾU NẠI CHO PROVIDER */}
                <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  {item.status === 'ESCALATED' ? (
                    <div className="flex items-center gap-2 text-xs text-purple-700 bg-purple-50/80 px-3.5 py-2.5 rounded-xl border border-purple-200 flex-1">
                      <ShieldAlert className="w-4 h-4 text-purple-600 shrink-0" />
                      <span className="font-medium">
                        Khách hàng đã yêu cầu Ban Quản Trị can thiệp. Khiếu nại đang chờ Admin phán quyết.
                      </span>
                    </div>
                  ) : item.admin_response ? (
                    <div className="flex items-start gap-2 text-xs text-teal-800 flex-1 bg-teal-50/60 p-3 rounded-xl border border-teal-100">
                      <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                      <div className="space-y-1 flex-1">
                        <span className="font-extrabold text-teal-900">Phản hồi gần nhất:</span>
                        <p className="text-slate-800 whitespace-pre-wrap leading-relaxed">
                          {item.latest_reply || item.admin_response}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50/60 px-3 py-2 rounded-xl border border-amber-200/60">
                      <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span className="font-medium">Khiếu nại này chưa được phản hồi.</span>
                    </div>
                  )}

                  {item.status !== 'ESCALATED' && (
                    <button
                      onClick={() => handleOpenReplyModal(item)}
                      className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-sm hover:shadow transition shrink-0"
                    >
                      {item.admin_response ? (
                        <>
                          <Edit3 className="w-3.5 h-3.5" />
                          Phản hồi thêm / Cập nhật
                        </>
                      ) : (
                        <>
                          <MessageSquareReply className="w-3.5 h-3.5" />
                          Phản hồi khiếu nại
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProviderComplaintsPanel;
