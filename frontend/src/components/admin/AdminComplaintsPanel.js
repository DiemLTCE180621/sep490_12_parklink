import React, { useEffect, useState, useCallback, useMemo } from 'react';
import complaintService from '../../services/complaintService';
import { useSocket } from '../../context/SocketContext';
import Toast from '../common/Toast';
import UpdateComplaintStatusModal from '../modals/UpdateComplaintStatusModal';
import ForwardComplaintModal from '../modals/ForwardComplaintModal';
import {
  AlertCircle,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  Inbox,
  Loader2,
  ShieldAlert,
  ShieldCheck,
  User,
  Building2,
  Search,
  RefreshCw,
  Filter,
  MessageSquareReply,
  Share2,
  XCircle
} from 'lucide-react';

const STATUS_BADGE_CONFIG = {
  PENDING_ADMIN: { label: 'Chờ BQT Tiếp Nhận', bg: 'bg-amber-100 text-amber-800 border-amber-300', icon: Clock },
  PENDING: { label: 'Chờ BQT Tiếp Nhận', bg: 'bg-amber-100 text-amber-800 border-amber-300', icon: Clock },
  OPEN: { label: 'Chờ BQT Tiếp Nhận', bg: 'bg-amber-100 text-amber-800 border-amber-300', icon: Clock },
  WAITING_PROVIDER: { label: 'Chờ Bãi Xe Giải Trình', bg: 'bg-blue-100 text-blue-800 border-blue-300', icon: Clock },
  PROVIDER_REPLIED: { label: 'Bãi Xe Đã Giải Trình', bg: 'bg-indigo-100 text-indigo-800 border-indigo-300', icon: MessageSquareReply },
  PROCESSING: { label: 'Đang Đối Soát', bg: 'bg-sky-100 text-sky-800 border-sky-300', icon: Loader2, spin: true },
  ESCALATED: { label: 'Cần Admin Can Thiệp', bg: 'bg-purple-100 text-purple-800 border-purple-300', icon: ShieldAlert },
  RESOLVED: { label: 'Đã Giải Quyết', bg: 'bg-emerald-100 text-emerald-800 border-emerald-300', icon: CheckCircle2 },
  REJECTED: { label: 'Bác Bỏ', bg: 'bg-rose-100 text-rose-800 border-rose-300', icon: XCircle },
  CLOSED: { label: 'Đã Đóng', bg: 'bg-slate-200 text-slate-800 border-slate-300', icon: CheckCircle2 }
};

const FILTER_TABS = [
  { id: 'ALL', label: 'Tất cả' },
  { id: 'PENDING_ADMIN', label: 'Chờ BQT tiếp nhận' },
  { id: 'WAITING_PROVIDER', label: 'Chờ bãi xe giải trình' },
  { id: 'PROVIDER_REPLIED', label: 'Bãi xe đã giải trình' },
  { id: 'RESOLVED', label: 'Đã giải quyết' },
  { id: 'REJECTED', label: 'Bác bỏ' }
];

const AdminComplaintsPanel = () => {
  const socket = useSocket();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState({ message: '', type: 'success' });

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isForwardModalOpen, setIsForwardModalOpen] = useState(false);

  // Modal chuyển tiếp cho Provider
  const handleOpenForwardModal = useCallback((complaintItem) => {
    setSelectedComplaint(complaintItem);
    setIsForwardModalOpen(true);
  }, []);

  const handleForwardSuccess = useCallback((updatedComplaint) => {
    setComplaints((prev) =>
      prev.map((c) => (c.id === updatedComplaint.id ? { ...c, ...updatedComplaint } : c))
    );
    setToast({
      message: `Đã chuyển tiếp khiếu nại #${updatedComplaint.id} cho Chủ bãi xe kèm chỉ đạo thành công!`,
      type: 'success'
    });
  }, []);

  // Modal cập nhật trạng thái Admin
  const handleOpenStatusModal = useCallback((complaintItem) => {
    setSelectedComplaint(complaintItem);
    setIsStatusModalOpen(true);
  }, []);

  const handleStatusSuccess = useCallback((updatedComplaint) => {
    setComplaints((prev) =>
      prev.map((c) => (c.id === updatedComplaint.id ? { ...c, ...updatedComplaint } : c))
    );
    setToast({
      message: `Đã cập nhật trạng thái khiếu nại #${updatedComplaint.id} sang ${updatedComplaint.status}!`,
      type: 'success'
    });
  }, []);

  const fetchComplaints = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      setError(null);
      const res = await complaintService.getAllComplaints();
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

  // Huy hiệu trạng thái
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

  // Lọc dữ liệu tìm kiếm
  const filteredComplaints = useMemo(() => {
    return complaints.filter((item) => {
      if (statusFilter !== 'ALL') {
        if (statusFilter === 'PENDING_ADMIN') {
          if (!['PENDING_ADMIN', 'PENDING', 'OPEN'].includes(item.status)) return false;
        } else if (item.status !== statusFilter) {
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

  // Hiển thị thông báo trạng thái bên trái
  const renderStatusInfo = (item) => {
    if (['PENDING_ADMIN', 'PENDING', 'OPEN'].includes(item.status)) return null;

    if (item.status === 'WAITING_PROVIDER') {
      if (item.is_overdue) {
        return (
          <div className="flex items-center gap-2.5 text-xs text-rose-900 bg-rose-50 p-3 rounded-xl border border-rose-300 flex-1">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <div className="space-y-0.5">
              <span className="font-extrabold text-rose-950 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                ĐÃ QUÁ HẠN 3 NGÀY CHƯA GIẢI TRÌNH
              </span>
              <p className="text-rose-900 leading-relaxed">
                Hạn chót: <strong>{item.deadline ? new Date(item.deadline).toLocaleDateString('vi-VN') : 'Đã quá hạn'}</strong>. Chủ bãi xe chưa nộp giải trình. Hệ thống tự động ghi nhận chậm trễ. BQT có thể ra phán quyết ngay hoặc tiếp tục đôn đốc.
              </p>
            </div>
          </div>
        );
      }
      return (
        <div className="flex items-center gap-2 text-xs text-blue-900 bg-blue-50 p-3 rounded-xl border border-blue-200 flex-1">
          <Clock className="w-4 h-4 text-blue-600 shrink-0" />
          <div className="space-y-0.5">
            <span className="font-extrabold text-blue-950">Đang chờ chủ bãi xe giải trình:</span>
            <p className="text-blue-900">
              BQT đã gửi chỉ đạo. Thời hạn phản hồi: {item.deadline ? <strong>trước {new Date(item.deadline).toLocaleDateString('vi-VN')}</strong> : '3 ngày'}.
            </p>
          </div>
        </div>
      );
    }

    if (item.status === 'PROVIDER_REPLIED') {
      return (
        <div className="flex items-center gap-2 text-xs text-indigo-900 bg-indigo-50 p-3 rounded-xl border border-indigo-200 flex-1">
          <MessageSquareReply className="w-4 h-4 text-indigo-600 shrink-0" />
          <div className="space-y-0.5">
            <span className="font-extrabold text-indigo-950">Chủ bãi xe đã nộp bản giải trình:</span>
            <p className="text-indigo-900">
              BQT vui lòng kiểm tra nội dung giải trình trong tiến trình và đưa ra phán quyết cuối cùng.
            </p>
          </div>
        </div>
      );
    }

    const responseText = item.latest_reply || item.admin_response;
    if (['RESOLVED', 'REJECTED'].includes(item.status) || item.admin_response) {
      const isResolved = item.status === 'RESOLVED';
      const isRejected = item.status === 'REJECTED';
      const label = isResolved
        ? 'Khiếu nại đã giải quyết (RESOLVED):'
        : isRejected
        ? 'Khiếu nại đã bị bác bỏ (REJECTED):'
        : 'Phản hồi gần nhất:';
      const Icon = isRejected ? XCircle : CheckCircle2;
      const theme = isResolved
        ? { box: 'text-emerald-800 bg-emerald-50/60 border-emerald-100', icon: 'text-emerald-600', text: 'text-emerald-950' }
        : isRejected
        ? { box: 'text-rose-800 bg-rose-50/60 border-rose-100', icon: 'text-rose-600', text: 'text-rose-950' }
        : { box: 'text-teal-800 bg-teal-50/60 border-teal-100', icon: 'text-teal-600', text: 'text-teal-900' };

      return (
        <div className={`flex items-start gap-2 text-xs flex-1 p-3 rounded-xl border ${theme.box}`}>
          <Icon className={`w-4 h-4 shrink-0 mt-0.5 ${theme.icon}`} />
          <div className="space-y-1 flex-1">
            <span className={`font-extrabold ${theme.text}`}>{label}</span>
            <p className="text-slate-800 whitespace-pre-wrap leading-relaxed">{responseText}</p>
          </div>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-2 text-xs text-slate-700 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 flex-1">
        <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
        <span className="font-medium">Hồ sơ khiếu nại đang được xử lý.</span>
      </div>
    );
  };

  // Hiển thị các nút thao tác bên phải
  const renderActionButtons = (item) => {
    const isPending = ['PENDING_ADMIN', 'PENDING', 'OPEN'].includes(item.status);

    if (isPending) {
      return (
        <>
          <button
            onClick={() => handleOpenForwardModal(item)}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm hover:shadow transition"
            title="Chuyển tiếp cho Chủ bãi xe kèm chỉ đạo yêu cầu giải trình"
          >
            <Share2 className="w-3.5 h-3.5" />
            Chuyển bãi xe
          </button>
          <button
            onClick={() => handleOpenStatusModal(item)}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-sm hover:shadow transition"
            title="Bác bỏ hoặc cập nhật trạng thái khiếu nại"
          >
            <XCircle className="w-3.5 h-3.5" />
            Bác bỏ / Phán quyết
          </button>
        </>
      );
    }

    if (item.status === 'PROVIDER_REPLIED') {
      return (
        <button
          onClick={() => handleOpenStatusModal(item)}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm hover:shadow transition"
          title="Ra phán quyết kết luận giải quyết khiếu nại"
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          Kết luận & Phán quyết
        </button>
      );
    }

    if (item.status === 'WAITING_PROVIDER') {
      return (
        <button
          onClick={() => handleOpenStatusModal(item)}
          className={`inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-white font-bold text-xs rounded-xl shadow-sm hover:shadow transition ${
            item.is_overdue ? 'bg-rose-600 hover:bg-rose-700' : 'bg-slate-800 hover:bg-slate-900'
          }`}
          title={item.is_overdue ? 'Chủ bãi xe đã quá hạn 3 ngày. Admin có thể ra phán quyết ngay' : 'Cập nhật trạng thái'}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          {item.is_overdue ? 'Phán quyết (Quá hạn)' : 'Cập nhật trạng thái'}
        </button>
      );
    }

    const statusMap = {
      RESOLVED: { text: 'Đã giải quyết xong', style: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
      REJECTED: { text: 'Đã bác bỏ', style: 'text-rose-700 bg-rose-50 border-rose-200' },
      CLOSED: { text: 'Đã đóng', style: 'text-slate-700 bg-slate-100 border-slate-300' }
    };
    const currentStatus = statusMap[item.status];

    return (
      <div className="flex items-center gap-2">
        {currentStatus && (
          <span className={`text-xs font-bold px-3 py-1.5 rounded-xl border ${currentStatus.style}`}>
            {currentStatus.text}
          </span>
        )}
        <button
          onClick={() => handleOpenStatusModal(item)}
          className="text-xs font-bold text-slate-600 hover:text-purple-600 hover:bg-purple-50 px-2.5 py-1.5 rounded-xl border border-slate-200 transition"
          title="Điều chỉnh hoặc mở lại khiếu nại"
        >
          Đổi trạng thái
        </button>
      </div>
    );
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
      {/* Toast thông báo */}
      <Toast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: '', type: 'success' })}
      />

      {/* Modal cập nhật trạng thái khiếu nại */}
      <UpdateComplaintStatusModal
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        complaint={selectedComplaint}
        onSuccess={handleStatusSuccess}
      />

      {/* Modal chuyển tiếp cho Chủ bãi xe */}
      <ForwardComplaintModal
        isOpen={isForwardModalOpen}
        onClose={() => setIsForwardModalOpen(false)}
        complaint={selectedComplaint}
        onSuccess={handleForwardSuccess}
      />

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {/* Header Panel */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 bg-gradient-to-r from-white to-slate-50 px-5 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-600 ring-1 ring-red-100 shadow-sm">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 sm:text-lg">Quản lý khiếu nại hệ thống</h3>
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
              placeholder="Tìm theo tiêu đề, ID, khách hàng, bãi xe..."
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
                ? 'Hệ thống hiện chưa ghi nhận khiếu nại nào. Các yêu cầu mới sẽ xuất hiện tại đây.'
                : 'Thử điều chỉnh lại từ khóa tìm kiếm hoặc bỏ chọn các bộ lọc trạng thái.'}
            </p>
          </div>
        ) : (
          <div className="p-4 sm:p-5 space-y-4 bg-slate-50/50">
            {filteredComplaints.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm hover:shadow-md transition flex flex-col gap-3.5"
              >
                {/* 1. Header: Mã ID, Tiêu đề, Ngày gửi, Trạng thái */}
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

                {/* 2. Nội dung khiếu nại & Ảnh đính kèm */}
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

                {/* 3. Thông tin người gửi & Bãi xe */}
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
                      <span className="block text-slate-400 font-medium">Bãi xe bị khiếu nại:</span>
                      <p className="font-bold text-slate-900 text-sm leading-snug">{item.facility?.name}</p>
                      {item.facility?.provider?.full_name && (
                        <p className="text-slate-500 text-xs">
                          Chủ bãi: <span className="font-semibold text-slate-700">{item.facility.provider.full_name}</span>
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* 4. Lịch sử trao đổi & Tiến trình */}
                {Array.isArray(item.response_history) && item.response_history.length > 0 && (
                  <div className="pt-2 space-y-2">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                      Tiến trình giải quyết khiếu nại & chuyển cấp:
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

                {/* 5. Khu vực phản hồi & Thao tác của Admin */}
                <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  {renderStatusInfo(item)}
                  <div className="flex items-center gap-2 shrink-0 flex-wrap sm:flex-nowrap ml-auto">
                    {renderActionButtons(item)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminComplaintsPanel;
