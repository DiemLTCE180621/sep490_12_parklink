import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProviderReservations, acceptReservation, rejectReservation } from '../../services/reservationService';
import ConfirmModal from '../modals/ConfirmModal';
import CreateConfirmationRecordModal from '../CreateConfirmationRecordModal';
import Toast from '../common/Toast';
import {
  Car,
  Calendar,
  MapPin,
  Clock,
  CheckCircle2,
  Ban,
  Eye,
  Search,
  AlertCircle,
  RefreshCw,
  Loader2,
  User,
  Phone,
  Mail,
  Building2,
  Check,
  X,
  FileText
} from 'lucide-react';

const ProviderReservationsPanel = ({ onNavigateToContracts }) => {
  const navigate = useNavigate();
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('ALL'); // ALL, PENDING, APPROVED, REJECTED, CANCELLED
  const [searchTerm, setSearchTerm] = useState('');

  // States for Contract creation modal
  const [selectedReservationForContract, setSelectedReservationForContract] = useState(null);
  const [isCreateContractOpen, setIsCreateContractOpen] = useState(false);

  // States for Confirm Modal (Accept / Reject)
  const [confirmModalState, setConfirmModalState] = useState({
    isOpen: false,
    action: null, // 'ACCEPT' | 'REJECT'
    targetId: null,
    targetName: ''
  });
  const [processingId, setProcessingId] = useState(null);

  // Toast notifications
  const [toastInfo, setToastInfo] = useState({ message: '', type: 'success' });

  // Fetch reservation requests from backend
  const fetchProviderReservations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getProviderReservations();
      const list = res.data?.reservations || res.reservations || [];
      setReservations(list);
    } catch (err) {
      setError(err.message || 'Không thể tải danh sách yêu cầu thuê xe của khách hàng!');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProviderReservations();
  }, [fetchProviderReservations]);

  // Open Detail Page
  const handleOpenDetail = (id) => {
    navigate(`/provider/reservations/${id}`);
  };

  // Open Confirm Modal for Accept or Reject
  const handleOpenConfirmModal = (id, action, customerName, e) => {
    if (e) e.stopPropagation();
    setConfirmModalState({
      isOpen: true,
      action,
      targetId: id,
      targetName: customerName || `Yêu cầu #${id}`
    });
  };

  // Execute Accept / Reject Action
  const handleExecuteAction = async () => {
    const { action, targetId } = confirmModalState;
    if (!targetId || !action) return;

    try {
      setProcessingId(targetId);
      if (action === 'ACCEPT') {
        await acceptReservation(targetId);
        setToastInfo({ message: 'Đã phê duyệt chấp nhận yêu cầu thuê xe thành công!', type: 'success' });
      } else if (action === 'REJECT') {
        await rejectReservation(targetId);
        setToastInfo({ message: 'Đã từ chối yêu cầu thuê xe!', type: 'success' });
      }
      setConfirmModalState({ isOpen: false, action: null, targetId: null, targetName: '' });
      fetchProviderReservations();
    } catch (err) {
      setToastInfo({
        message: err.message || `Thực hiện ${action === 'ACCEPT' ? 'duyệt' : 'từ chối'} thất bại!`,
        type: 'error'
      });
    } finally {
      setProcessingId(null);
    }
  };

  // Filter List according to Tab & Search Keyword
  const filteredReservations = reservations.filter((item) => {
    // 1. Tab Filter
    let matchesTab = true;
    if (activeTab === 'PENDING') matchesTab = item.status === 'PENDING';
    else if (activeTab === 'APPROVED') matchesTab = item.status === 'APPROVED';
    else if (activeTab === 'REJECTED') matchesTab = item.status === 'REJECTED';
    else if (activeTab === 'CANCELLED') matchesTab = item.status === 'CANCELLED';

    // 2. Search Keyword Filter
    const query = searchTerm.trim().toLowerCase();
    let matchesSearch = true;
    if (query) {
      const customerName = item.customer?.full_name?.toLowerCase() || '';
      const customerEmail = item.customer?.email?.toLowerCase() || '';
      const customerPhone = item.customer?.phone_number?.toLowerCase() || '';
      const vehicleInfo = item.vehicle_info?.toLowerCase() || '';
      const facilityName = item.facility?.name?.toLowerCase() || '';

      matchesSearch =
        customerName.includes(query) ||
        customerEmail.includes(query) ||
        customerPhone.includes(query) ||
        vehicleInfo.includes(query) ||
        facilityName.includes(query);
    }

    return matchesTab && matchesSearch;
  });

  // Calculate statistics
  const totalCount = reservations.length;
  const pendingCount = reservations.filter((r) => r.status === 'PENDING').length;
  const approvedCount = reservations.filter((r) => r.status === 'APPROVED').length;
  const rejectedCount = reservations.filter((r) => r.status === 'REJECTED').length;
  const cancelledCount = reservations.filter((r) => r.status === 'CANCELLED').length;

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-amber-100 text-amber-800 border border-amber-300">
            <Clock className="w-3.5 h-3.5" /> Chờ Phê Duyệt
          </span>
        );
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5" /> Đã Chấp Nhận
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-red-100 text-red-800 border border-red-300">
            <Ban className="w-3.5 h-3.5" /> Đã Từ Chối
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-slate-200 text-slate-700 border border-slate-300">
            <Ban className="w-3.5 h-3.5" /> Khách Hủy Yêu Cầu
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-slate-100 text-slate-800">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      <Toast message={toastInfo.message} type={toastInfo.type} onClose={() => setToastInfo({ message: '', type: 'success' })} />

      {/* TOP PANEL HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-md">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Car className="w-5 h-5 text-teal-600" /> Quản Lý Yêu Cầu Thuê Bãi Xe
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Xem và phê duyệt danh sách khách hàng gửi yêu cầu đăng ký thuê bãi đỗ xe theo tháng.
          </p>
        </div>

        <button
          onClick={fetchProviderReservations}
          disabled={loading}
          className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-extrabold rounded-xl transition flex items-center gap-2 border border-slate-200 shrink-0"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Tải Lại Danh Sách
        </button>
      </div>

      {/* STATS OVERVIEW CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div
          onClick={() => setActiveTab('ALL')}
          className={`p-4 rounded-2xl border cursor-pointer transition ${
            activeTab === 'ALL'
              ? 'bg-slate-900 text-white border-slate-900 shadow-md'
              : 'bg-white text-slate-800 border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="text-[11px] font-bold uppercase tracking-wider opacity-80 mb-1">Tất Cả</div>
          <div className="text-xl font-black">{totalCount}</div>
        </div>

        <div
          onClick={() => setActiveTab('PENDING')}
          className={`p-4 rounded-2xl border cursor-pointer transition ${
            activeTab === 'PENDING'
              ? 'bg-amber-600 text-white border-amber-600 shadow-md'
              : 'bg-white text-amber-900 border-slate-200 hover:border-amber-300'
          }`}
        >
          <div className="text-[11px] font-bold uppercase tracking-wider opacity-80 mb-1 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" /> Chờ Duyệt
          </div>
          <div className="text-xl font-black">{pendingCount}</div>
        </div>

        <div
          onClick={() => setActiveTab('APPROVED')}
          className={`p-4 rounded-2xl border cursor-pointer transition ${
            activeTab === 'APPROVED'
              ? 'bg-emerald-600 text-white border-emerald-600 shadow-md'
              : 'bg-white text-emerald-900 border-slate-200 hover:border-emerald-300'
          }`}
        >
          <div className="text-[11px] font-bold uppercase tracking-wider opacity-80 mb-1 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Đã Chấp Nhận
          </div>
          <div className="text-xl font-black">{approvedCount}</div>
        </div>

        <div
          onClick={() => setActiveTab('REJECTED')}
          className={`p-4 rounded-2xl border cursor-pointer transition ${
            activeTab === 'REJECTED'
              ? 'bg-red-600 text-white border-red-600 shadow-md'
              : 'bg-white text-red-900 border-slate-200 hover:border-red-300'
          }`}
        >
          <div className="text-[11px] font-bold uppercase tracking-wider opacity-80 mb-1 flex items-center gap-1">
            <Ban className="w-3.5 h-3.5" /> Đã Từ Chối
          </div>
          <div className="text-xl font-black">{rejectedCount}</div>
        </div>

        <div
          onClick={() => setActiveTab('CANCELLED')}
          className={`p-4 rounded-2xl border cursor-pointer transition ${
            activeTab === 'CANCELLED'
              ? 'bg-slate-700 text-white border-slate-700 shadow-md'
              : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="text-[11px] font-bold uppercase tracking-wider opacity-80 mb-1 flex items-center gap-1">
            <Ban className="w-3.5 h-3.5" /> Khách Hủy
          </div>
          <div className="text-xl font-black">{cancelledCount}</div>
        </div>
      </div>

      {/* CONTROLS: TABS & SEARCH BAR */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-100 shadow-md flex flex-col md:flex-row justify-between items-center gap-4">
        {/* TAB BUTTONS */}
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <button
            onClick={() => setActiveTab('ALL')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition ${
              activeTab === 'ALL'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Tất Cả ({totalCount})
          </button>
          <button
            onClick={() => setActiveTab('PENDING')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition ${
              activeTab === 'PENDING'
                ? 'bg-amber-500 text-white shadow-sm'
                : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
            }`}
          >
            Chờ Duyệt ({pendingCount})
          </button>
          <button
            onClick={() => setActiveTab('APPROVED')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition ${
              activeTab === 'APPROVED'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
            }`}
          >
            Đã Chấp Nhận ({approvedCount})
          </button>
          <button
            onClick={() => setActiveTab('REJECTED')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition ${
              activeTab === 'REJECTED'
                ? 'bg-red-600 text-white shadow-sm'
                : 'bg-red-50 text-red-800 hover:bg-red-100'
            }`}
          >
            Đã Từ Chối ({rejectedCount})
          </button>
        </div>

        {/* SEARCH INPUT */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm khách hàng, biển số xe..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition"
          />
        </div>
      </div>

      {/* CONTENT SECTION: LIST OF RESERVATION REQUESTS */}
      {loading ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 shadow-md space-y-4">
          <Loader2 className="w-10 h-10 animate-spin text-teal-600 mx-auto" />
          <p className="text-slate-600 font-semibold text-sm">
            Đang tải danh sách yêu cầu thuê từ khách hàng...
          </p>
        </div>
      ) : error ? (
        <div className="bg-white rounded-3xl p-8 border border-red-200 shadow-md text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
          <h3 className="text-lg font-bold text-slate-900">Không thể tải dữ liệu</h3>
          <p className="text-sm text-slate-600">{error}</p>
          <button
            onClick={fetchProviderReservations}
            className="px-5 py-2.5 bg-teal-600 text-white font-bold text-xs rounded-xl shadow-md hover:bg-teal-700 transition"
          >
            Thử Lại
          </button>
        </div>
      ) : filteredReservations.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 shadow-md space-y-4">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
            <Car className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-800">Không có yêu cầu thuê nào</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {searchTerm
              ? 'Không tìm thấy yêu cầu phù hợp với từ khóa tìm kiếm của bạn.'
              : 'Chưa có yêu cầu đăng ký thuê bãi đỗ xe nào trong danh mục này.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReservations.map((item) => (
            <div
              key={item.id}
              onClick={() => handleOpenDetail(item.id)}
              className="bg-white rounded-3xl p-6 border border-slate-100 shadow-md hover:shadow-lg transition cursor-pointer flex flex-col lg:flex-row lg:items-center justify-between gap-6 group"
            >
              {/* LEFT CONTENT: CUSTOMER & VEHICLE INFO */}
              <div className="space-y-4 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-100">
                      Mã yêu cầu #{item.id}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">
                      • Gửi ngày {new Date(item.created_at).toLocaleDateString('vi-VN')}
                    </span>
                  </div>

                  <div>{getStatusBadge(item.status)}</div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  {/* CUSTOMER INFORMATION */}
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-extrabold uppercase text-slate-400 tracking-wider">
                      Khách Hàng Đăng Ký
                    </span>
                    <p className="font-bold text-slate-900 flex items-center gap-2 text-base">
                      <User className="w-4 h-4 text-teal-600 shrink-0" />
                      {item.customer?.full_name || 'Khách hàng'}
                    </p>
                    <p className="text-xs text-slate-600 flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      {item.customer?.phone_number || 'Chưa cập nhật SĐT'}
                    </p>
                    <p className="text-xs text-slate-500 flex items-center gap-2 truncate">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      {item.customer?.email}
                    </p>
                  </div>

                  {/* VEHICLE & RENTAL START DATE */}
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-extrabold uppercase text-slate-400 tracking-wider">
                      Thông Tin Xe & Ngày Bắt Đầu
                    </span>
                    <p className="font-bold text-slate-900 flex items-center gap-2">
                      <Car className="w-4 h-4 text-slate-500 shrink-0" />
                      {item.vehicle_info}
                    </p>
                    <p className="text-xs text-teal-800 font-bold flex items-center gap-2 mt-1">
                      <Calendar className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                      Bắt đầu thuê: {new Date(item.desired_start_date).toLocaleDateString('vi-VN')}
                    </p>
                  </div>

                  {/* FACILITY INFO */}
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-extrabold uppercase text-slate-400 tracking-wider">
                      Bãi Đỗ Xe Đăng Ký
                    </span>
                    <p className="font-bold text-slate-900 flex items-center gap-2 truncate">
                      <Building2 className="w-4 h-4 text-teal-600 shrink-0" />
                      {item.facility?.name}
                    </p>
                    <p className="text-xs text-slate-500 flex items-start gap-1.5 line-clamp-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      {item.facility?.address}
                    </p>
                  </div>
                </div>
              </div>

              {/* RIGHT CONTENT: ACTION BUTTONS */}
              <div className="flex flex-col sm:flex-row lg:flex-col gap-2 shrink-0 pt-4 lg:pt-0 border-t lg:border-t-0 border-slate-100 justify-end">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenDetail(item.id);
                  }}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-extrabold rounded-xl transition flex items-center justify-center gap-1.5"
                >
                  <Eye className="w-4 h-4" /> Chi Tiết
                </button>

                {item.status === 'APPROVED' && (
                  item.confirmation_record ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/contracts/${item.confirmation_record.id}`);
                      }}
                      className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-extrabold rounded-xl shadow-md transition flex items-center justify-center gap-1.5"
                    >
                      <FileText className="w-4 h-4" /> Xem Hợp Đồng
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedReservationForContract(item);
                        setIsCreateContractOpen(true);
                      }}
                      className="px-4 py-2.5 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-slate-950 font-black text-xs rounded-xl shadow-md transition flex items-center justify-center gap-1.5"
                    >
                      <FileText className="w-4 h-4 text-slate-950" /> Tạo Hợp Đồng
                    </button>
                  )
                )}

                {item.status === 'PENDING' && (
                  <>
                    <button
                      type="button"
                      onClick={(e) =>
                        handleOpenConfirmModal(item.id, 'ACCEPT', item.customer?.full_name, e)
                      }
                      disabled={processingId === item.id}
                      className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-extrabold rounded-xl shadow-md transition flex items-center justify-center gap-1.5"
                    >
                      {processingId === item.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Check className="w-4 h-4" /> Chấp Nhận
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={(e) =>
                        handleOpenConfirmModal(item.id, 'REJECT', item.customer?.full_name, e)
                      }
                      disabled={processingId === item.id}
                      className="px-4 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-xs font-extrabold rounded-xl shadow-md transition flex items-center justify-center gap-1.5"
                    >
                      {processingId === item.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <X className="w-4 h-4" /> Từ Chối
                        </>
                      )}
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE CONTRACT MODAL */}
      <CreateConfirmationRecordModal
        isOpen={isCreateContractOpen}
        onClose={() => {
          setIsCreateContractOpen(false);
          setSelectedReservationForContract(null);
        }}
        reservation={selectedReservationForContract}
        onSuccess={() => {
          setToastInfo({ message: 'Tạo và gửi hợp đồng điện tử thành công!', type: 'success' });
          fetchProviderReservations();
          if (onNavigateToContracts) {
            onNavigateToContracts();
          }
        }}
      />

      {/* CONFIRMATION MODAL FOR ACCEPT / REJECT */}
      <ConfirmModal
        isOpen={confirmModalState.isOpen}
        onClose={() => setConfirmModalState({ isOpen: false, action: null, targetId: null, targetName: '' })}
        onConfirm={handleExecuteAction}
        title={
          confirmModalState.action === 'ACCEPT'
            ? 'Xác Nhận Chấp Nhận Yêu Cầu Thuê'
            : 'Xác Nhận Từ Chối Yêu Cầu Thuê'
        }
        message={
          confirmModalState.action === 'ACCEPT'
            ? `Bạn có chắc chắn muốn phê duyệt chấp nhận yêu cầu đỗ xe của khách hàng "${confirmModalState.targetName}" không?`
            : `Bạn có chắc chắn muốn từ chối yêu cầu đỗ xe của khách hàng "${confirmModalState.targetName}" không?`
        }
        confirmText={confirmModalState.action === 'ACCEPT' ? 'Đồng Ý Chấp Nhận' : 'Đồng Ý Từ Chối'}
        cancelText="Hủy Bỏ"
        type={confirmModalState.action === 'ACCEPT' ? 'primary' : 'danger'}
        loading={!!processingId}
      />
    </div>
  );
};

export default ProviderReservationsPanel;
