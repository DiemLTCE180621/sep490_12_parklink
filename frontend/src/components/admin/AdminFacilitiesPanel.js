import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Building2,
  MapPin,
  User,
  Phone,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Edit2,
  RotateCcw,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Clock,
  AlertTriangle,
  X
} from 'lucide-react';
import adminService from '../../services/adminService';
import FacilityDetailsModal from '../modals/FacilityDetailsModal';

const AdminFacilitiesPanel = () => {
  const navigate = useNavigate();

  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Search & Filter state
  const [search, setSearch] = useState('');
  const [verificationFilter, setVerificationFilter] = useState('ALL');
  const [visibilityFilter, setVisibilityFilter] = useState('ALL');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Modals state
  const [selectedFacilityForView, setSelectedFacilityForView] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    type: '', // 'LOCK' | 'UNLOCK'
    facility: null
  });
  const [actionLoading, setActionLoading] = useState(false);

  const fetchFacilities = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await adminService.getAllFacilities();
      if (res && res.status === 'success') {
        setFacilities(res.data || []);
      } else if (Array.isArray(res)) {
        setFacilities(res);
      } else {
        setFacilities(res?.data || []);
      }
    } catch (err) {
      console.error('Lỗi khi lấy danh sách cơ sở:', err);
      setError(err.response?.data?.message || err.message || 'Lỗi khi tải danh sách cơ sở bãi đỗ xe');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFacilities();
  }, []);

  const handleResetFilters = () => {
    setSearch('');
    setVerificationFilter('ALL');
    setVisibilityFilter('ALL');
    setCurrentPage(1);
    fetchFacilities();
  };

  // Mở dialog xác nhận Khóa / Mở khóa
  const handleOpenToggleLock = (facility) => {
    if (facility.verification_status !== 'APPROVED') {
      setError('Chỉ có thể khóa/mở khóa các cơ sở đã được phê duyệt.');
      return;
    }

    setConfirmDialog({
      isOpen: true,
      type: facility.visibility_status === 'VISIBLE' ? 'LOCK' : 'UNLOCK',
      facility
    });
  };

  // Thực thi Khóa / Mở khóa
  const handleConfirmAction = async () => {
    const { type, facility } = confirmDialog;
    if (!facility) return;

    try {
      setActionLoading(true);
      setError('');
      const res = await adminService.toggleLockFacility(facility.id);
      if (res && (res.status === 'success' || !res.status)) {
        const nextStatus = type === 'LOCK' ? 'HIDDEN' : 'VISIBLE';
        const actionMsg =
          res.message ||
          (type === 'LOCK' ? 'Đã khóa cơ sở bãi xe thành công!' : 'Đã mở khóa cơ sở bãi xe thành công!');
        setSuccessMessage(actionMsg);
        setFacilities((prev) =>
          prev.map((f) => (f.id === facility.id ? { ...f, visibility_status: nextStatus } : f))
        );
      } else {
        setError(res?.message || 'Thao tác thất bại!');
      }
      setConfirmDialog({ isOpen: false, type: '', facility: null });
    } catch (err) {
      console.error('Lỗi khi thay đổi trạng thái:', err);
      setError(err.response?.data?.message || err.message || 'Thao tác thất bại!');
    } finally {
      setActionLoading(false);
    }
  };

  // Lọc dữ liệu
  const filteredFacilities = useMemo(() => {
    return facilities.filter((f) => {
      const matchSearch =
        !search.trim() ||
        f.name?.toLowerCase().includes(search.toLowerCase()) ||
        f.address?.toLowerCase().includes(search.toLowerCase()) ||
        f.provider?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
        f.provider?.phone_number?.includes(search) ||
        String(f.id).includes(search.trim());

      const matchVerification =
        verificationFilter === 'ALL' || f.verification_status === verificationFilter;

      const matchVisibility =
        visibilityFilter === 'ALL' || f.visibility_status === visibilityFilter;

      return matchSearch && matchVerification && matchVisibility;
    });
  }, [facilities, search, verificationFilter, visibilityFilter]);

  // Phân trang
  const totalPages = Math.ceil(filteredFacilities.length / itemsPerPage) || 1;
  const paginatedFacilities = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredFacilities.slice(start, start + itemsPerPage);
  }, [filteredFacilities, currentPage, itemsPerPage]);

  const getVerificationBadge = (statusStr) => {
    const s = (statusStr || '').toUpperCase();
    switch (s) {
      case 'APPROVED':
        return (
          <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Đã duyệt
          </span>
        );
      case 'PENDING_REVIEW':
        return (
          <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
            <Clock className="w-3 h-3" /> Chờ duyệt
          </span>
        );
      case 'PREPARING':
        return (
          <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
            <Clock className="w-3 h-3" /> Đang chuẩn bị
          </span>
        );
      case 'REJECTED':
        return (
          <span className="bg-rose-100 text-rose-800 text-xs font-bold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" /> Đã từ chối
          </span>
        );
      default:
        return <span className="bg-slate-100 text-slate-700 text-xs font-bold px-2.5 py-0.5 rounded-full">{s}</span>;
    }
  };

  const getVisibilityBadge = (visibilityStr) => {
    const v = (visibilityStr || '').toUpperCase();
    if (v === 'VISIBLE') {
      return (
        <span className="bg-teal-100 text-teal-800 text-xs font-bold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
          <Eye className="w-3 h-3" /> Hiện
        </span>
      );
    }
    return (
      <span className="bg-rose-100 text-rose-800 text-xs font-bold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
        <EyeOff className="w-3 h-3" /> Ẩn (Khóa)
      </span>
    );
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-md p-6 space-y-6">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Building2 className="w-6 h-6 text-teal-600" /> Quản Lý Tất Cả Cơ Sở
          </h2>
          <p className="text-slate-500 text-xs mt-1">
            Danh sách toàn bộ cơ sở bãi đỗ xe và trạng thái hoạt động trong hệ thống ParkLink
          </p>
        </div>
        <div className="text-xs font-semibold bg-slate-100 px-3 py-1.5 rounded-xl text-slate-700">
          Tổng cộng: <strong className="text-teal-700 font-extrabold">{filteredFacilities.length}</strong> cơ sở
        </div>
      </div>

      {/* Thông báo thành công */}
      {successMessage && (
        <div className="p-4 bg-emerald-50 text-emerald-800 text-xs font-medium rounded-2xl border border-emerald-200 flex justify-between items-center animate-in fade-in">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            {successMessage}
          </span>
          <button onClick={() => setSuccessMessage('')} className="text-emerald-600 hover:text-emerald-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Thông báo lỗi */}
      {error && (
        <div className="p-4 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200 flex justify-between items-center animate-in fade-in">
          <span>{error}</span>
          <button onClick={() => setError('')} className="text-red-500 hover:text-red-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-3">
        {/* Input Tìm kiếm */}
        <div className="relative flex-1">
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
            placeholder="Tìm theo tên cơ sở, địa chỉ, chủ bãi hoặc số điện thoại..."
            className="w-full pl-9 pr-4 py-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 transition"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Lọc theo Trạng thái duyệt */}
          <select
            value={verificationFilter}
            onChange={(e) => {
              setVerificationFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white font-medium text-slate-700"
          >
            <option value="ALL">Tất cả trạng thái duyệt</option>
            <option value="APPROVED">Đã duyệt</option>
            <option value="PENDING_REVIEW">Chờ duyệt</option>
            <option value="PREPARING">Đang chuẩn bị</option>
            <option value="REJECTED">Đã từ chối</option>
          </select>

          {/* Lọc theo Hiển thị (Visibility) */}
          <select
            value={visibilityFilter}
            onChange={(e) => {
              setVisibilityFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white font-medium text-slate-700"
          >
            <option value="ALL">Tất cả hiển thị</option>
            <option value="VISIBLE">Hiện</option>
            <option value="HIDDEN">Ẩn (Khóa)</option>
          </select>

          <button
            type="button"
            onClick={handleResetFilters}
            className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 border border-slate-200"
            title="Đặt lại bộ lọc & Tải lại danh sách"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-600" /> Làm mới
          </button>
        </div>
      </div>

      {/* Table Data */}
      {loading ? (
        <div className="py-16 text-center text-slate-500 text-sm flex flex-col items-center justify-center gap-3">
          <RefreshCw className="w-8 h-8 animate-spin text-teal-600" />
          <span>Đang tải danh sách cơ sở...</span>
        </div>
      ) : filteredFacilities.length === 0 ? (
        <div className="py-16 text-center text-slate-400">
          <Building2 className="w-12 h-12 mx-auto mb-3 text-slate-300" />
          <p className="font-semibold text-sm">Không tìm thấy cơ sở nào phù hợp!</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-100">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-100">
                <th className="py-3 px-4">ID</th>
                <th className="py-3 px-4">Cơ sở</th>
                <th className="py-3 px-4">Chủ bãi</th>
                <th className="py-3 px-4">Trạng thái duyệt</th>
                <th className="py-3 px-4">Hiển thị (Visibility)</th>
                <th className="py-3 px-4 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {paginatedFacilities.map((facility) => {
                const isHidden = facility.visibility_status === 'HIDDEN';
                const isApproved = facility.verification_status === 'APPROVED';
                const primaryImg =
                  facility.images?.find((img) => img.is_primary)?.image_url ||
                  facility.images?.[0]?.image_url;

                return (
                  <tr key={facility.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 font-mono font-bold text-slate-400">#{facility.id}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 overflow-hidden shrink-0 border border-slate-200 flex items-center justify-center">
                          {primaryImg ? (
                            <img
                              src={primaryImg}
                              alt={facility.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Building2 className="w-5 h-5 text-slate-400" />
                          )}
                        </div>
                        <div className="min-w-0 max-w-xs">
                          <div
                            className="font-semibold text-slate-900 truncate"
                            title={facility.name}
                          >
                            {facility.name}
                          </div>
                          <div
                            className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5 truncate"
                            title={facility.address}
                          >
                            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate">{facility.address}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900 flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{facility.provider?.full_name || '—'}</span>
                      </div>
                      <div className="text-[11px] font-mono text-slate-500 flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>{facility.provider?.phone_number || '—'}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">{getVerificationBadge(facility.verification_status)}</td>
                    <td className="py-3 px-4">{getVisibilityBadge(facility.visibility_status)}</td>
                    <td className="py-3 px-4 text-center">
                      <div className="inline-flex items-center gap-1.5">
                        {/* Xem chi tiết */}
                        <button
                          onClick={() => setSelectedFacilityForView(facility)}
                          title="Xem chi tiết cơ sở"
                          className="p-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 rounded-lg border border-teal-200 transition"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {/* Cập nhật thông tin */}
                        <button
                          onClick={() => navigate(`/admin/facilities/${facility.id}/edit`)}
                          title="Cập nhật thông tin cơ sở"
                          className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg border border-blue-200 transition"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {/* Khóa / Mở khóa */}
                        <button
                          onClick={() => handleOpenToggleLock(facility)}
                          disabled={!isApproved}
                          title={
                            !isApproved
                              ? 'Chỉ có thể khóa/mở khóa cơ sở đã duyệt'
                              : isHidden
                              ? 'Mở khóa cơ sở'
                              : 'Khóa cơ sở'
                          }
                          className={`p-1.5 rounded-lg border transition ${
                            !isApproved
                              ? 'bg-slate-100 text-slate-300 border-slate-200 cursor-not-allowed opacity-50'
                              : isHidden
                              ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                              : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200'
                          }`}
                        >
                          {isHidden ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                        </button>
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
            Trang <strong>{currentPage}</strong> / {totalPages} (Tổng cộng{' '}
            <strong className="text-teal-700">{filteredFacilities.length}</strong> cơ sở)
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

      {/* Modal Xem chi tiết cơ sở */}
      {selectedFacilityForView && (
        <FacilityDetailsModal
          facility={selectedFacilityForView}
          onClose={() => setSelectedFacilityForView(null)}
          title="Chi Tiết Cơ Sở Bãi Đỗ Xe"
        />
      )}

      {/* CONFIRMATION DIALOG (Khóa / Mở khóa) */}
      {confirmDialog.isOpen && confirmDialog.facility && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-8 shadow-2xl space-y-6 animate-in fade-in zoom-in duration-150 border border-slate-100">
            <div className="flex items-center gap-4">
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${
                  confirmDialog.type === 'LOCK'
                    ? 'bg-rose-100 text-rose-600'
                    : 'bg-emerald-100 text-emerald-600'
                }`}
              >
                {confirmDialog.type === 'LOCK' ? (
                  <Lock className="w-7 h-7" />
                ) : (
                  <Unlock className="w-7 h-7" />
                )}
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">
                  {confirmDialog.type === 'LOCK'
                    ? 'Xác nhận Khóa cơ sở'
                    : 'Xác nhận Mở khóa cơ sở'}
                </h3>
                <p className="text-sm text-slate-500 mt-0.5">
                  #{confirmDialog.facility.id} — {confirmDialog.facility.name}
                </p>
              </div>
            </div>

            <div className="text-base text-slate-700 leading-relaxed bg-slate-50 p-5 rounded-2xl border border-slate-100">
              {confirmDialog.type === 'LOCK' ? (
                <p>
                  Bạn có chắc chắn muốn <strong>khóa cơ sở</strong> "<strong>{confirmDialog.facility.name}</strong>"? Khi bị khóa, cơ sở này sẽ chuyển sang trạng thái <strong>Ẩn</strong> và tạm thời không xuất hiện trên hệ thống tìm kiếm cho khách thuê.
                </p>
              ) : (
                <p>
                  Bạn có chắc chắn muốn <strong>mở khóa cơ sở</strong> "<strong>{confirmDialog.facility.name}</strong>"? Cơ sở này sẽ chuyển sang trạng thái <strong>Hiện</strong> và hiển thị công khai bình thường trên hệ thống ParkLink.
                </p>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmDialog({ isOpen: false, type: '', facility: null })}
                disabled={actionLoading}
                className="px-6 py-2.5 border border-slate-200 text-slate-700 font-semibold text-base rounded-xl hover:bg-slate-50 transition"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleConfirmAction}
                disabled={actionLoading}
                className={`px-6 py-2.5 text-white font-bold text-base rounded-xl shadow-md transition disabled:opacity-50 flex items-center gap-2 ${
                  confirmDialog.type === 'LOCK'
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                {actionLoading && <RefreshCw className="w-4 h-4 animate-spin" />}
                {confirmDialog.type === 'LOCK' ? 'Khóa Cơ Sở' : 'Mở Khóa Cơ Sở'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminFacilitiesPanel;
