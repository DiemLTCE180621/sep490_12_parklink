import React, { useEffect, useState, useCallback, useMemo } from 'react';
import complaintService from '../../services/complaintService';
import { useSocket } from '../../context/SocketContext';
import Toast from '../common/Toast';
import ReplyComplaintModal from '../modals/ReplyComplaintModal';
import UpdateComplaintStatusModal from '../modals/UpdateComplaintStatusModal';
import {
  AlertCircle,
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
  MessageSquareReply
} from 'lucide-react';

const AdminComplaintsPanel = () => {
  const socket = useSocket();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState({ message: '', type: 'success' });

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ESCALATED');

  // Modal phản hồi & Modal cập nhật trạng thái
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [isReplyModalOpen, setIsReplyModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);

  // Mở modal cập nhật trạng thái Admin
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
      console.log('[Admin Socket] Cập nhật khiếu nại thời gian thực:', payload);
      // Tự động cập nhật danh sách khiếu nại
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

  // Mở modal phản hồi
  const handleOpenReplyModal = useCallback((complaintItem) => {
    setSelectedComplaint(complaintItem);
    setIsReplyModalOpen(true);
  }, []);

  const handleReplySuccess = useCallback((updatedComplaint) => {
    setComplaints((prev) =>
      prev.map((c) => (c.id === updatedComplaint.id ? { ...c, ...updatedComplaint } : c))
    );
    setToast({
      message: `Đã gửi phản hồi thành công cho khiếu nại #${updatedComplaint.id}!`,
      type: 'success'
    });
  }, []);

  const getStatusBadge = useCallback((status) => {
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
            <ShieldAlert className="w-3.5 h-3.5" /> Cần Admin Can Thiệp
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

      // Lọc theo từ khóa tìm kiếm (Tiêu đề, Tên khách hàng, Tên bãi xe, ID)
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

      {/* MODAL PHẢN HỒI KHIẾU NẠI */}
      <ReplyComplaintModal
        isOpen={isReplyModalOpen}
        onClose={() => setIsReplyModalOpen(false)}
        complaint={selectedComplaint}
        onSuccess={handleReplySuccess}
        role="ADMIN"
      />

      {/* MODAL CẬP NHẬT TRẠNG THÁI KHIẾU NẠI (ADMIN) */}
      <UpdateComplaintStatusModal
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        complaint={selectedComplaint}
        onSuccess={handleStatusSuccess}
      />

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 bg-gradient-to-r from-white to-slate-50 px-5 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-600 ring-1 ring-red-100 shadow-sm">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 sm:text-lg">Quản lý khiếu nại hệ thống</h3>
              <p className="text-xs text-slate-500">Theo dõi, kiểm tra và phản hồi trực tiếp các khiếu nại từ khách hàng</p>
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

        {/* THANH TÌM KIẾM & BỘ LỌC */}
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
            {[
              { id: 'ESCALATED', label: 'Cần Admin can thiệp' },
              { id: 'ALL', label: 'Tất cả' },
              { id: 'RESOLVED', label: 'Đã giải quyết' },
              { id: 'PROCESSING', label: 'Bãi xe đang xử lý' },
              { id: 'PENDING', label: 'Chờ bãi xe xử lý' }
            ].map((btn) => (
              <button
                key={btn.id}
                onClick={() => setStatusFilter(btn.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${statusFilter === btn.id
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>

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
                {/* 1. Header của thẻ ID: Tiêu đề, Mã ID, Ngày gửi và Trạng thái */}
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
                  <div>{getStatusBadge(item.status)}</div>
                </div>

                {/* 2. Nội dung khiếu nại */}
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

                {/* 3. Thông tin người gửi & bãi xe */}
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

                {/* LỊCH SỬ TRAO ĐỔI & TIẾN TRÌNH */}
                {Array.isArray(item.response_history) && item.response_history.length > 0 && (
                  <div className="pt-2 space-y-2">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                      Tiến trình giải quyết khiếu nại & chuyển cấp:
                    </span>
                    <div className="space-y-2">
                      {item.response_history.map((hist, idx) => (
                        <div
                          key={idx}
                          className={`p-3 rounded-xl text-xs space-y-1 ${hist.action === 'ESCALATED'
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

                {/* KHU VỰC PHẢN HỒI KHIẾU NẠI (ADMIN ACTIONS) */}
                <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  {item.status === 'ESCALATED' ? (
                    <div className="flex items-center gap-2 text-xs text-purple-800 bg-purple-50 p-3 rounded-xl border border-purple-200 flex-1">
                      <ShieldAlert className="w-4 h-4 text-purple-600 shrink-0" />
                      <div className="space-y-0.5">
                        <span className="font-extrabold text-purple-950">Yêu cầu cần Admin can thiệp:</span>
                        <p className="text-purple-900">
                          Khách hàng đã yêu cầu Ban Quản Trị can thiệp. Admin vui lòng kiểm tra nội dung và đưa ra phán quyết.
                        </p>
                      </div>
                    </div>
                  ) : item.status === 'RESOLVED' ? (
                    <div className="flex items-start gap-2 text-xs text-emerald-800 flex-1 bg-emerald-50/60 p-3 rounded-xl border border-emerald-100">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <div className="space-y-1 flex-1">
                        <span className="font-extrabold text-emerald-950">Khiếu nại đã giải quyết (RESOLVED):</span>
                        <p className="text-slate-800 whitespace-pre-wrap leading-relaxed">
                          {item.latest_reply || item.admin_response}
                        </p>
                      </div>
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
                    <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50/60 px-3 py-2 rounded-xl border border-amber-200/60 flex-1">
                      <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span className="font-medium">
                        Đang do Chủ bãi xe xử lý bước đầu. Admin chỉ can thiệp khi khách hàng chuyển cấp.
                      </span>
                    </div>
                  )}

                  {/* KHU VỰC CÁC THAO TÁC CỦA ADMIN */}
                  <div className="flex items-center gap-2 shrink-0">
                    {item.status === 'ESCALATED' ? (
                      <>
                        <button
                          onClick={() => handleOpenStatusModal(item)}
                          className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-sm hover:shadow transition"
                          title="Cập nhật trạng thái xử lý của Admin"
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                          Cập nhật trạng thái
                        </button>
                        <button
                          onClick={() => handleOpenReplyModal(item)}
                          className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl shadow-sm hover:shadow transition"
                          title="Gửi phản hồi và trao đổi với các bên"
                        >
                          <MessageSquareReply className="w-3.5 h-3.5" />
                          Phản hồi
                        </button>
                      </>
                    ) : item.status === 'RESOLVED' ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                          Đã giải quyết xong
                        </span>
                        <button
                          onClick={() => handleOpenStatusModal(item)}
                          className="text-xs font-bold text-slate-600 hover:text-purple-600 hover:bg-purple-50 px-2.5 py-1.5 rounded-xl border border-slate-200 transition"
                          title="Điều chỉnh hoặc mở lại khiếu nại"
                        >
                          Đổi trạng thái
                        </button>
                      </div>
                    ) : item.status === 'CLOSED' ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-300">
                          Đã đóng
                        </span>
                        <button
                          onClick={() => handleOpenStatusModal(item)}
                          className="text-xs font-bold text-slate-600 hover:text-purple-600 hover:bg-purple-50 px-2.5 py-1.5 rounded-xl border border-slate-200 transition"
                        >
                          Đổi trạng thái
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs font-medium text-slate-400 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
                        Chờ bãi xe xử lý
                      </span>
                    )}
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
