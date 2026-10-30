import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import adminService from '../../services/adminService';
import {
  Building2,
  MapPin,
  User,
  Phone,
  Mail,
  Clock,
  CheckCircle2,
  XCircle,
  Wrench,
  Search,
  RotateCcw,
  Eye,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  DollarSign,
  UserCheck
} from 'lucide-react';
import AssignInspectorModal from './AssignInspectorModal';
import Toast from '../common/Toast';

/**
 * AdminRegistrationsPanel: Giao diện Quản Lý Phê Duyệt Bãi Đỗ Xe
 * Thiết kế đồng bộ với hệ thống Admin (Table layout, Toolbar tìm kiếm & lọc, Điều hướng /id)
 */
const AdminRegistrationsPanel = () => {
  const navigate = useNavigate();

  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Modals xác nhận thao tác nhanh
  const [actionModal, setActionModal] = useState(null); // { type: 'PREPARE' | 'FINALIZE' | 'REJECT', id: number }
  const [rejectReason, setRejectReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (type, message) => {
    setToast({ type, message });
  };

  const handleOpenPrepareModal = (facilityId) => {
    setActionModal({ type: 'PREPARE', id: facilityId });
  };

  const handleOpenReassignModal = (facilityId) => {
    setActionModal({ type: 'REASSIGN', id: facilityId });
  };

  const fetchRegistrations = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await adminService.getPendingRegistrations();
      if (res && res.status === 'success') {
        setRegistrations(res.data || []);
      } else if (Array.isArray(res)) {
        setRegistrations(res);
      } else {
        setRegistrations(res?.data || []);
      }
    } catch (err) {
      console.error(err);
      setError('Lỗi khi tải danh sách đăng ký chờ duyệt');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegistrations();
  }, []);

  const confirmAction = async () => {
    if (!actionModal || isSubmitting) return;
    try {
      setIsSubmitting(true);
      if (actionModal.type === 'FINALIZE') {
        await adminService.finalizeRegistration(actionModal.id);
        showToast(
          'success',
          'Đã duyệt chính thức! Email kèm mật khẩu đã được gửi cho Provider.'
        );
      } else if (actionModal.type === 'REJECT') {
        if (!rejectReason.trim()) {
          showToast('error', 'Vui lòng nhập lý do từ chối!');
          setIsSubmitting(false);
          return;
        }
        await adminService.rejectRegistration(actionModal.id, rejectReason);
        showToast('success', 'Từ chối đăng ký thành công!');
      }
      setActionModal(null);
      setRejectReason('');
      await fetchRegistrations();
    } catch (err) {
      const backendMessage =
        err.response?.data?.message ||
        err.response?.data?.errors?.[0] ||
        err.message;
      showToast('error', 'Thao tác thất bại: ' + backendMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Đếm theo từng giai đoạn
  const pendingCount = useMemo(
    () => registrations.filter((f) => f.verification_status === 'PENDING_REVIEW').length,
    [registrations]
  );
  const preparingCount = useMemo(
    () => registrations.filter((f) => f.verification_status === 'PREPARING').length,
    [registrations]
  );
  const inspectedCount = useMemo(
    () => registrations.filter((f) => f.verification_status === 'INSPECTED').length,
    [registrations]
  );

  // Lọc dữ liệu theo search và statusFilter
  const filteredRegistrations = useMemo(() => {
    return registrations.filter((item) => {
      const matchSearch =
        (item.name || '').toLowerCase().includes(search.toLowerCase()) ||
        (item.address || '').toLowerCase().includes(search.toLowerCase()) ||
        (item.provider?.full_name || '').toLowerCase().includes(search.toLowerCase()) ||
        (item.provider?.email || '').toLowerCase().includes(search.toLowerCase()) ||
        (item.provider?.phone_number || '').toLowerCase().includes(search.toLowerCase());

      const matchStatus =
        statusFilter === 'ALL' || item.verification_status === statusFilter;

      return matchSearch && matchStatus;
    });
  }, [registrations, search, statusFilter]);

  // Phân trang
  const totalPages = Math.ceil(filteredRegistrations.length / itemsPerPage) || 1;
  const paginatedList = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredRegistrations.slice(start, start + itemsPerPage);
  }, [filteredRegistrations, currentPage]);

  const handleResetFilters = () => {
    setSearch('');
    setStatusFilter('ALL');
    setCurrentPage(1);
    fetchRegistrations();
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PENDING_REVIEW':
        return (
          <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2.5 py-1 rounded-full inline-flex items-center gap-1.5 border border-amber-300">
            <Clock className="w-3 h-3 text-amber-600" /> Chờ duyệt sơ bộ
          </span>
        );
      case 'PREPARING':
        return (
          <span className="bg-sky-100 text-sky-800 text-xs font-bold px-2.5 py-1 rounded-full inline-flex items-center gap-1.5 border border-sky-300">
            <Wrench className="w-3 h-3 text-sky-600" /> Đang khảo sát
          </span>
        );
      case 'INSPECTED':
        return (
          <span className="bg-teal-100 text-teal-800 text-xs font-bold px-2.5 py-1 rounded-full inline-flex items-center gap-1.5 border border-teal-300">
            <CheckCircle2 className="w-3 h-3 text-teal-600" /> Đã khảo sát (Chờ duyệt)
          </span>
        );
      case 'APPROVED':
        return (
          <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-1 rounded-full inline-flex items-center gap-1.5 border border-emerald-300">
            <ShieldCheck className="w-3 h-3 text-emerald-600" /> Đã duyệt
          </span>
        );
      default:
        return (
          <span className="bg-slate-100 text-slate-700 text-xs font-bold px-2.5 py-1 rounded-full">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-md p-6 space-y-6">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Building2 className="w-6 h-6 text-teal-600" /> Quản Lý Phê Duyệt Bãi Đỗ Xe
          </h2>
          <p className="text-slate-500 text-xs mt-1">
            Theo dõi tiến trình khảo sát thực địa và phê duyệt hồ sơ đăng ký bãi đỗ xe mới từ Chủ bãi (Provider)
          </p>
        </div>
        <div className="text-xs font-semibold bg-slate-100 px-3 py-1.5 rounded-xl text-slate-700">
          Tổng cộng: <strong className="text-teal-700 font-extrabold">{registrations.length}</strong> hồ sơ
        </div>
      </div>

      {/* Workflow Stage Quick Filters */}
      <div className="flex flex-wrap gap-2 text-xs font-semibold">
        <button
          onClick={() => {
            setStatusFilter('ALL');
            setCurrentPage(1);
          }}
          className={`px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 ${
            statusFilter === 'ALL'
              ? 'bg-teal-600 text-white shadow-sm'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Tất cả ({registrations.length})
        </button>
        <button
          onClick={() => {
            setStatusFilter('PENDING_REVIEW');
            setCurrentPage(1);
          }}
          className={`px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 ${
            statusFilter === 'PENDING_REVIEW'
              ? 'bg-amber-500 text-white shadow-sm'
              : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
          }`}
        >
          <Clock className="w-3.5 h-3.5" /> Chờ duyệt sơ bộ ({pendingCount})
        </button>
        <button
          onClick={() => {
            setStatusFilter('PREPARING');
            setCurrentPage(1);
          }}
          className={`px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 ${
            statusFilter === 'PREPARING'
              ? 'bg-sky-600 text-white shadow-sm'
              : 'bg-sky-50 text-sky-800 border border-sky-200 hover:bg-sky-100'
          }`}
        >
          <Wrench className="w-3.5 h-3.5" /> Đang khảo sát ({preparingCount})
        </button>
        <button
          onClick={() => {
            setStatusFilter('INSPECTED');
            setCurrentPage(1);
          }}
          className={`px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 ${
            statusFilter === 'INSPECTED'
              ? 'bg-teal-700 text-white shadow-sm'
              : 'bg-teal-50 text-teal-800 border border-teal-200 hover:bg-teal-100'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" /> Đã khảo sát - Chờ duyệt ({inspectedCount})
        </button>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
        {/* Search input */}
        <div className="sm:col-span-8 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Tìm theo tên bãi, địa chỉ, họ tên chủ bãi hoặc SĐT..."
            className="w-full pl-9 pr-3 py-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        {/* Status Dropdown Filter */}
        <div className="sm:col-span-4 flex gap-2">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full py-2.5 px-3 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
          >
            <option value="ALL">Tất cả Trạng thái</option>
            <option value="PENDING_REVIEW">Chờ duyệt sơ bộ</option>
            <option value="PREPARING">Đang khảo sát thực địa</option>
            <option value="INSPECTED">Đã khảo sát (Chờ duyệt)</option>
          </select>

          <button
            type="button"
            onClick={handleResetFilters}
            className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 border border-slate-200"
            title="Làm mới bộ lọc"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-600" /> Làm mới
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200 flex items-center gap-2">
          <XCircle className="w-4 h-4 shrink-0 text-red-600" />
          {error}
        </div>
      )}

      {/* Loading state */}
      {loading ? (
        <div className="py-16 text-center text-slate-500 text-sm flex flex-col items-center justify-center gap-3">
          <RefreshCw className="w-8 h-8 animate-spin text-teal-600" />
          <span>Đang tải danh sách phê duyệt bãi đỗ xe...</span>
        </div>
      ) : filteredRegistrations.length === 0 ? (
        <div className="py-16 text-center text-slate-400">
          <Building2 className="w-12 h-12 mx-auto mb-3 text-slate-300" />
          <p className="font-semibold text-sm">Không tìm thấy yêu cầu đăng ký nào phù hợp!</p>
          <p className="text-xs text-slate-400 mt-1">Thử thay đổi từ khóa hoặc bộ lọc tìm kiếm.</p>
        </div>
      ) : (
        /* Data Table */
        <div className="overflow-x-auto rounded-2xl border border-slate-100">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-100">
                <th className="py-3.5 px-4">ID</th>
                <th className="py-3.5 px-4 min-w-[280px]">Cơ sở bãi đỗ xe</th>
                <th className="py-3.5 px-4 min-w-[200px]">Chủ bãi (Provider)</th>
                <th className="py-3.5 px-4">Quy mô &amp; Phí</th>
                <th className="py-3.5 px-4">Tiến trình xét duyệt</th>
                <th className="py-3.5 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {paginatedList.map((facility) => {
                const isPending = facility.verification_status === 'PENDING_REVIEW';
                const isPreparing = facility.verification_status === 'PREPARING';
                const isInspected = facility.verification_status === 'INSPECTED';

                return (
                  <tr key={facility.id} className="hover:bg-slate-50/80 transition">
                    {/* ID */}
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-400">
                      #{facility.id}
                    </td>

                    {/* Facility Info */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center shrink-0 text-teal-700 mt-0.5">
                          {facility.images && facility.images.length > 0 ? (
                            <img
                              src={facility.images[0].image_url}
                              alt=""
                              className="w-10 h-10 object-cover rounded-xl"
                            />
                          ) : (
                            <Building2 className="w-5 h-5" />
                          )}
                        </div>
                        <div className="space-y-0.5">
                          <button
                            onClick={() => navigate(`/admin/registrations/${facility.id}`)}
                            className="font-bold text-slate-900 hover:text-teal-700 transition text-left line-clamp-1"
                          >
                            {facility.name}
                          </button>
                          <div className="text-slate-500 text-[11px] flex items-center gap-1 line-clamp-1">
                            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                            {facility.address}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Provider Info */}
                    <td className="py-3.5 px-4">
                      <div className="space-y-0.5">
                        <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          {facility.provider?.full_name || 'N/A'}
                        </div>
                        <div className="text-slate-500 text-[11px] flex items-center gap-1.5">
                          <Mail className="w-3 h-3 text-slate-400" />
                          {facility.provider?.email || 'N/A'}
                        </div>
                        {facility.provider?.phone_number && (
                          <div className="text-slate-500 text-[11px] flex items-center gap-1.5">
                            <Phone className="w-3 h-3 text-slate-400" />
                            {facility.provider?.phone_number}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Capacity & Fee */}
                    <td className="py-3.5 px-4">
                      <div className="space-y-0.5">
                        <div className="font-bold text-slate-800">
                          {facility.capacity} xe
                        </div>
                        <div className="text-teal-700 font-semibold text-[11px] flex items-center gap-0.5">
                          <DollarSign className="w-3 h-3 text-teal-600" />
                          {Number(facility.system_fee || 0).toLocaleString('vi-VN')} VNĐ
                        </div>
                      </div>
                    </td>

                    {/* Status Badge & Inspector */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div>
                        {getStatusBadge(facility.verification_status)}
                        {facility.assigned_inspector ? (
                          <div className="text-[11px] text-teal-800 font-semibold flex items-center gap-1 mt-1">
                            <UserCheck className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                            <span className="truncate max-w-[140px]" title={facility.assigned_inspector.full_name}>
                              {facility.assigned_inspector.full_name}
                            </span>
                          </div>
                        ) : isPreparing ? (
                          <div className="text-[11px] text-amber-600 font-medium italic mt-1">
                            Chưa gán NV
                          </div>
                        ) : null}
                      </div>
                    </td>

                    {/* Action Buttons */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-2 justify-end">
                        {/* Nút Xem chi tiết chuyển sang /id */}
                        <button
                          onClick={() => navigate(`/admin/registrations/${facility.id}`)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-bold rounded-lg border border-teal-200 transition"
                          title="Xem chi tiết đơn này"
                        >
                          <Eye className="w-3.5 h-3.5" /> Chi tiết
                        </button>

                        {/* Thao tác duyệt sơ bộ */}
                        {isPending && (
                          <>
                            <button
                              onClick={() => handleOpenPrepareModal(facility.id)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-lg shadow-sm transition"
                              title="Duyệt sơ bộ & Giao khảo sát"
                            >
                              <UserCheck className="w-3.5 h-3.5" /> Duyệt sơ bộ
                            </button>
                            <button
                              onClick={() => setActionModal({ type: 'REJECT', id: facility.id })}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-lg border border-rose-200 transition"
                              title="Từ chối đơn này"
                            >
                              <XCircle className="w-3.5 h-3.5" /> Từ chối
                            </button>
                          </>
                        )}

                        {/* Thao tác duyệt chính thức khi đã khảo sát */}
                        {isInspected && (
                          <>
                            <button
                              onClick={() => setActionModal({ type: 'FINALIZE', id: facility.id })}
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-lg shadow-sm transition"
                              title="Hoàn tất phê duyệt & Cấp mật khẩu"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" /> Duyệt chính thức
                            </button>
                            <button
                              onClick={() => setActionModal({ type: 'REJECT', id: facility.id })}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-lg border border-rose-200 transition"
                              title="Từ chối đơn này"
                            >
                              <XCircle className="w-3.5 h-3.5" /> Từ chối
                            </button>
                          </>
                        )}

                        {/* Đang khảo sát thực địa */}
                        {isPreparing && (
                          <button
                            onClick={() => handleOpenReassignModal(facility.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg border border-slate-200 transition"
                            title="Đổi nhân viên khảo sát phụ trách"
                          >
                            <UserCheck className="w-3.5 h-3.5 text-teal-600" /> Đổi NV
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-slate-100 pt-4 text-xs text-slate-600">
          <div>
            Trang <strong>{currentPage}</strong> / {totalPages} (Tổng{' '}
            {filteredRegistrations.length} hồ sơ)
          </div>
          <div className="flex gap-2">
            <button
              disabled={currentPage <= 1 || loading}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 transition disabled:opacity-40 flex items-center gap-1 font-semibold"
            >
              <ChevronLeft className="w-4 h-4" /> Trước
            </button>
            <button
              disabled={currentPage >= totalPages || loading}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 transition disabled:opacity-40 flex items-center gap-1 font-semibold"
            >
              Sau <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Modal Phân công nhân viên khảo sát (Phương án A - Nâng Cấp Popup To & Đa Năng) */}
      <AssignInspectorModal
        isOpen={actionModal?.type === 'PREPARE' || actionModal?.type === 'REASSIGN'}
        onClose={() => setActionModal(null)}
        facilityName={registrations.find((f) => f.id === actionModal?.id)?.name}
        facilityAddress={registrations.find((f) => f.id === actionModal?.id)?.address}
        currentInspectorId={registrations.find((f) => f.id === actionModal?.id)?.assigned_inspector_id}
        isSubmitting={isSubmitting}
        title={
          actionModal?.type === 'REASSIGN'
            ? 'Thay Đổi Nhân Viên Khảo Sát'
            : 'Duyệt Sơ Bộ & Phân Công Khảo Sát'
        }
        confirmText={
          actionModal?.type === 'REASSIGN'
            ? 'Cập nhật phân công'
            : 'Xác nhận duyệt & Giao việc'
        }
        onConfirm={async (inspectorId) => {
          try {
            setIsSubmitting(true);
            if (actionModal.type === 'PREPARE') {
              await adminService.approveRegistration(actionModal.id, inspectorId);
              showToast(
                'success',
                'Đã duyệt sơ bộ và phân công nhân viên khảo sát! Email thông báo đã gửi cho Provider.'
              );
            } else {
              await adminService.assignInspector(actionModal.id, inspectorId);
              showToast(
                'success',
                'Đã phân công lại nhân viên khảo sát thành công!'
              );
            }
            setActionModal(null);
            await fetchRegistrations();
          } catch (err) {
            const backendMessage =
              err.response?.data?.message ||
              err.response?.data?.errors?.[0] ||
              err.message;
            showToast('error', backendMessage || 'Có lỗi xảy ra khi xử lý!');
          } finally {
            setIsSubmitting(false);
          }
        }}
      />

      {/* Action Confirmation Modal for Finalize / Reject */}
      {actionModal && (actionModal.type === 'FINALIZE' || actionModal.type === 'REJECT') && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl my-auto transition-all">
            {actionModal.type === 'FINALIZE' && (
              <>
                <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8 text-teal-600" />
                </div>
                <h3 className="text-xl font-bold text-center text-slate-900 mb-2">
                  Phê Duyệt Chính Thức
                </h3>
                <p className="text-center text-slate-500 text-sm mb-6">
                  Nhân viên khảo sát đã hoàn tất báo cáo và hình ảnh thực địa. Bạn có chắc chắn muốn hoàn tất duyệt và cấp tài khoản cho cơ sở này?
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setActionModal(null)}
                    className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition text-xs"
                  >
                    Hủy
                  </button>
                  <button
                    disabled={isSubmitting}
                    onClick={confirmAction}
                    className="flex-1 py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl shadow-lg transition disabled:opacity-50 text-xs"
                  >
                    {isSubmitting ? 'Đang xử lý...' : 'Duyệt & Cấp Mật Khẩu'}
                  </button>
                </div>
              </>
            )}

            {actionModal.type === 'REJECT' && (
              <>
                <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <XCircle className="w-8 h-8 text-rose-600" />
                </div>
                <h3 className="text-xl font-bold text-center text-slate-900 mb-2">
                  Từ Chối Đăng Ký
                </h3>
                <p className="text-center text-slate-500 text-sm mb-4">
                  Vui lòng cung cấp lý do từ chối để thông báo cho Provider.
                </p>
                <div className="flex flex-wrap gap-2 mb-3 justify-center">
                  <button
                    type="button"
                    onClick={() =>
                      setRejectReason('Thông tin bãi đỗ xe không đầy đủ hoặc thiếu chính xác.')
                    }
                    className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-medium rounded-full transition"
                  >
                    Thiếu thông tin
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setRejectReason('Vị trí hoặc mức giá đăng ký không phù hợp quy định.')
                    }
                    className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-medium rounded-full transition"
                  >
                    Vị trí/Giá sai
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setRejectReason('Khảo sát thực địa không đáp ứng tiêu chuẩn an toàn.')
                    }
                    className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-medium rounded-full transition"
                  >
                    Không đạt tiêu chuẩn
                  </button>
                </div>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Nhập lý do chi tiết..."
                  className="w-full p-3 border border-slate-200 rounded-xl mb-6 focus:outline-none focus:ring-2 focus:ring-rose-500 resize-none h-24 text-xs"
                />
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setActionModal(null);
                      setRejectReason('');
                    }}
                    className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition text-xs"
                  >
                    Hủy
                  </button>
                  <button
                    disabled={isSubmitting}
                    onClick={confirmAction}
                    className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-lg transition disabled:opacity-50 text-xs"
                  >
                    {isSubmitting ? 'Đang từ chối...' : 'Xác nhận Từ Chối'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Toast Alert */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};

export default AdminRegistrationsPanel;
