import React, { useEffect, useState, useCallback, useMemo } from 'react';
import complaintService from '../../services/complaintService';
import { useSocket } from '../../context/SocketContext';
import Toast from '../common/Toast';
import ReplyComplaintModal from '../modals/ReplyComplaintModal';
import {
  AlertCircle,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  Inbox,
  Loader2,
  User,
  Edit3,
  Search,
  Filter,
  RefreshCw,
  ShieldAlert,
  MessageSquareReply
} from 'lucide-react';

const STATUS_BADGE_CONFIG = {
  WAITING_PROVIDER: { label: 'Cần Giải Trình', bg: 'bg-amber-100 text-amber-800 border-amber-300', icon: Clock },
  PENDING: { label: 'Cần Giải Trình', bg: 'bg-amber-100 text-amber-800 border-amber-300', icon: Clock },
  OPEN: { label: 'Cần Giải Trình', bg: 'bg-amber-100 text-amber-800 border-amber-300', icon: Clock },
  PROVIDER_REPLIED: { label: 'Đã Giải Quyết Cho Khách', bg: 'bg-indigo-100 text-indigo-800 border-indigo-300', icon: CheckCircle2 },
  PROCESSING: { label: 'Đang Thẩm Tra', bg: 'bg-blue-100 text-blue-800 border-blue-300', icon: Loader2, spin: true },
  RESOLVED: { label: 'Đã Giải Quyết', bg: 'bg-emerald-100 text-emerald-800 border-emerald-300', icon: CheckCircle2 },
  REJECTED: { label: 'Đã Bác Bỏ', bg: 'bg-rose-100 text-rose-800 border-rose-300', icon: ShieldAlert },
  CLOSED: { label: 'Đã Đóng', bg: 'bg-slate-200 text-slate-800 border-slate-300', icon: ShieldAlert }
};

const FILTER_TABS = [
  { id: 'ALL', label: 'Tất cả' },
  { id: 'WAITING_PROVIDER', label: 'Cần giải trình' },
  { id: 'PROVIDER_REPLIED', label: 'Đã giải trình' },
  { id: 'RESOLVED', label: 'Đã giải quyết' }
];

const ProviderComplaintsPanel = () => {
  const socket = useSocket();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState({ message: '', type: 'success' });

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

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
      if (payload.complaint) {
        setComplaints((prev) => {
          const exists = prev.some((c) => c.id === payload.complaint.id);
          return exists
            ? prev.map((c) => (c.id === payload.complaint.id ? { ...c, ...payload.complaint } : c))
            : [payload.complaint, ...prev];
        });
      } else {
        fetchComplaints(false);
      }
    };

    socket.on('complaint_updated', handleComplaintUpdate);
    return () => socket.off('complaint_updated', handleComplaintUpdate);
  }, [socket, fetchComplaints]);

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

  const getStatusBadge = useCallback((status, isOverdue = false) => {
    if (status === 'WAITING_PROVIDER' && isOverdue) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-rose-100 text-rose-800 border border-rose-300 animate-pulse">
          <AlertCircle className="w-3.5 h-3.5 text-rose-600" /> Quá Hạn Giải Trình
        </span>
      );
    }
    const conf = STATUS_BADGE_CONFIG[status] || {
      label: status,
      bg: 'bg-slate-100 text-slate-800 border-slate-200',
      icon: Clock
    };
    const Icon = conf.icon;
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold border ${conf.bg}`}>
        <Icon className={`w-3.5 h-3.5 ${conf.spin ? 'animate-spin' : ''}`} /> {conf.label}
      </span>
    );
  }, []);

  const filteredComplaints = useMemo(() => {
    return complaints.filter((item) => {
      if (statusFilter !== 'ALL') {
        if (statusFilter === 'WAITING_PROVIDER') {
          if (!['WAITING_PROVIDER', 'PENDING', 'OPEN'].includes(item.status)) return false;
        } else if (item.status !== statusFilter) {
          return false;
        }
      }

      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase().trim();
        const matchesId = item.id?.toString().includes(query);
        const matchesTitle = item.title?.toLowerCase().includes(query);
        const matchesCustomer = item.customer?.full_name?.toLowerCase().includes(query);
        return matchesId || matchesTitle || matchesCustomer;
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
      <Toast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: '', type: 'success' })}
      />

      <ReplyComplaintModal
        isOpen={isReplyModalOpen}
        onClose={() => setIsReplyModalOpen(false)}
        complaint={selectedComplaint}
        onSuccess={handleReplySuccess}
      />

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {/* Header Panel */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 bg-gradient-to-r from-white to-slate-50 px-5 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-600 ring-1 ring-teal-100 shadow-sm">
              <MessageSquareReply className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 sm:text-lg">Quản Lý Khiếu Nại Bãi Đỗ Xe</h3>
              <p className="text-xs text-slate-500">Lắng nghe và phản hồi trực tiếp các thắc mắc, phản ánh từ khách thuê bãi xe</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchComplaints(true)}
              className="p-2 text-slate-500 hover:text-teal-600 hover:bg-teal-50 rounded-xl transition"
              title="Tải lại danh sách"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-bold text-slate-700 shadow-sm">
              Tổng cộng: <span className="ml-1 text-teal-700">{complaints.length}</span>
            </span>
          </div>
        </div>

        {/* Thanh tìm kiếm & Bộ lọc */}
        <div className="p-4 sm:px-6 border-b border-slate-100 bg-slate-50/70 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo tiêu đề, ID, khách hàng..."
              className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            {FILTER_TABS.map((btn) => (
              <button
                key={btn.id}
                onClick={() => setStatusFilter(btn.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
                  statusFilter === btn.id
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>

        {/* Danh sách khiếu nại */}
        {filteredComplaints.length === 0 ? (
          <div className="flex min-h-[280px] flex-col items-center justify-center px-5 py-10 text-center">
            <div className="relative mb-4">
              <div className="absolute inset-0 scale-150 rounded-full bg-slate-100"></div>
              <div className="relative flex h-16 w-16 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 shadow-sm">
                <Inbox className="h-7 w-7" />
              </div>
            </div>
            <h3 className="text-base font-extrabold text-slate-800 sm:text-lg">
              {complaints.length === 0 ? 'Không có khiếu nại nào' : 'Không tìm thấy khiếu nại phù hợp'}
            </h3>
            <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
              {complaints.length === 0
                ? 'Chưa có khách hàng nào khiếu nại bãi đỗ xe của bạn.'
                : 'Thử điều chỉnh lại từ khóa tìm kiếm hoặc bỏ chọn các bộ lọc trạng thái.'}
            </p>
          </div>
        ) : (
          <div className="p-4 sm:p-5 space-y-4 bg-slate-50/50">
            {filteredComplaints.map((item) => {
              const adminInstructions = Array.isArray(item.response_history)
                ? item.response_history.filter((h) => h.sender_role === 'ADMIN' || h.action === 'FORWARDED_TO_PROVIDER')
                : [];
              const latestAdminInstruction = adminInstructions.length > 0 ? adminInstructions[adminInstructions.length - 1] : null;

              // Lọc các phản hồi khác (không lặp lại chỉ đạo của Admin đã hiển thị ở trên)
              const otherReplies = Array.isArray(item.response_history)
                ? item.response_history.filter((h) => h !== latestAdminInstruction && h.action !== 'FORWARDED_TO_PROVIDER')
                : [];

              return (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm hover:shadow-md transition flex flex-col gap-3.5"
                >
                  {/* Header: ID, Tiêu đề, Ngày gửi, Trạng thái */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="font-mono font-bold bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded text-xs border border-slate-200">
                        #{item.id}
                      </span>
                      <h4 className="text-base sm:text-lg font-extrabold text-slate-900">{item.title}</h4>
                      <span className="text-slate-300">•</span>
                      <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        Gửi ngày: {new Date(item.created_at).toLocaleDateString('vi-VN')}
                      </span>
                    </div>
                    <div>{getStatusBadge(item.status, item.is_overdue)}</div>
                  </div>

                  {/* YÊU CẦU & CHỈ ĐẠO TỪ ADMIN (HIỂN THỊ DUY NHẤT Ở ĐÂY) */}
                  {latestAdminInstruction && (
                    <div className={`p-4 rounded-2xl border space-y-1.5 ${
                      item.is_overdue
                        ? 'bg-rose-50/90 border-rose-300 text-rose-950'
                        : 'bg-amber-50/90 border-amber-200 text-amber-950'
                    }`}>
                      <div className="flex items-center justify-between gap-2">
                        <div className={`flex items-center gap-2 font-extrabold text-xs ${item.is_overdue ? 'text-rose-900' : 'text-amber-900'}`}>
                          <ShieldAlert className={`w-4 h-4 ${item.is_overdue ? 'text-rose-600' : 'text-amber-600'}`} />
                          <span>Yêu cầu & Chỉ đạo từ Ban Quản Trị ParkLink:</span>
                        </div>
                        {item.deadline && (
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            item.is_overdue
                              ? 'bg-rose-200 text-rose-900 border border-rose-300 animate-pulse'
                              : 'bg-amber-100 text-amber-800 border border-amber-300'
                          }`}>
                            {item.is_overdue ? 'ĐÃ QUÁ HẠN 3 NGÀY' : `Hạn chót: ${new Date(item.deadline).toLocaleDateString('vi-VN')}`}
                          </span>
                        )}
                      </div>
                      <p className={`text-xs sm:text-sm whitespace-pre-wrap leading-relaxed font-medium ${
                        item.is_overdue ? 'text-rose-900' : 'text-amber-900'
                      }`}>
                        {latestAdminInstruction.message || latestAdminInstruction.note}
                      </p>
                      {latestAdminInstruction.created_at && (
                        <span className={`text-[11px] block ${item.is_overdue ? 'text-rose-700/80' : 'text-amber-700/80'}`}>
                          Chuyển tiếp lúc: {new Date(latestAdminInstruction.created_at).toLocaleString('vi-VN')}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Nội dung khiếu nại & Ảnh đính kèm */}
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

                  {/* Thông tin khách hàng */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2.5 text-slate-600">
                      <User className="w-4 h-4 text-slate-400 shrink-0" />
                      <div>
                        <span className="text-slate-400 font-medium">Khách hàng:</span>{' '}
                        <strong className="text-slate-900 text-sm">{item.customer?.full_name || 'Khách hàng'}</strong>
                        {(item.customer?.phone_number || item.customer?.email) && (
                          <span className="text-slate-500 ml-2 font-mono">
                            ({item.customer?.phone_number || item.customer?.email})
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* LỊCH SỬ PHẢN HỒI (CHỈ HIỂN THỊ KHI CÓ PHẢN HỒI MỚI, KHÔNG LẶP LẠI CHỈ ĐẠO ADMIN) */}
                  {otherReplies.length > 0 && (
                    <div className="pt-2 space-y-2">
                      <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                        Phản hồi giải quyết đã gửi:
                      </span>
                      <div className="space-y-2">
                        {otherReplies.map((hist, idx) => (
                          <div
                            key={idx}
                            className="p-3 rounded-xl text-xs space-y-1 bg-teal-50 border border-teal-200 text-teal-900"
                          >
                            <div className="flex items-center justify-between font-bold">
                              <span>{hist.sender_name || 'Chủ bãi xe'}</span>
                              <span className="text-slate-400 font-normal">
                                {hist.created_at ? new Date(hist.created_at).toLocaleString('vi-VN') : ''}
                              </span>
                            </div>
                            <p className="whitespace-pre-wrap leading-relaxed">
                              {hist.message}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Thao tác phản hồi */}
                  <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    {item.is_overdue && (
                      <div className="flex items-center gap-2 text-xs text-rose-900 bg-rose-50/90 px-3.5 py-2.5 rounded-xl border border-rose-300 flex-1">
                        <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                        <span className="font-medium flex items-center gap-1.5">
                          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 inline" />
                          <span>
                            <strong>ĐÃ QUÁ HẠN 3 NGÀY.</strong> Vui lòng gửi phản hồi giải quyết cho khách ngay!
                          </span>
                        </span>
                      </div>
                    )}

                    {!['RESOLVED', 'REJECTED', 'CLOSED'].includes(item.status) && (
                      <button
                        onClick={() => handleOpenReplyModal(item)}
                        className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-sm hover:shadow transition shrink-0 ml-auto"
                      >
                        {item.status === 'PROVIDER_REPLIED' ? (
                          <>
                            <Edit3 className="w-3.5 h-3.5" />
                            Cập nhật phản hồi
                          </>
                        ) : (
                          <>
                            <MessageSquareReply className="w-3.5 h-3.5" />
                            Gửi bản giải trình
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProviderComplaintsPanel;
