import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProviderReservations, acceptReservation, rejectReservation } from '../../services/reservationService';
import ConfirmModal from '../modals/ConfirmModal';
import Toast from '../common/Toast';
import {
  Car,
  Calendar,
  MapPin,
  Eye,
  Search,
  AlertCircle,
  RefreshCw,
  Loader2,
  User,
  Phone,
  Mail,
  Check,
  X,
  FileText
} from 'lucide-react';

const ProviderReservationsPanel = () => {
  const navigate = useNavigate();
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('ALL'); // ALL, PENDING, APPROVED, REJECTED, CANCELLED
  const [searchTerm, setSearchTerm] = useState('');

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

  const cleanVehicleDisplay = (rawVehicle = '') => {
    return rawVehicle.replace(/\s*\[CCCD:[^\]]+\]/i, '').trim() || 'Chưa cập nhật';
  };

  // Filter List according to Tab & Search Keyword
  const filteredReservations = reservations.filter((item) => {
    let matchesTab = true;
    if (activeTab === 'PENDING') matchesTab = item.status === 'PENDING';
    else if (activeTab === 'APPROVED') matchesTab = item.status === 'APPROVED';
    else if (activeTab === 'REJECTED') matchesTab = item.status === 'REJECTED';
    else if (activeTab === 'CANCELLED') matchesTab = item.status === 'CANCELLED';

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
        facilityName.includes(query) ||
        String(item.id).includes(query);
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
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Chờ duyệt
          </span>
        );
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Đã chấp nhận
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
            Đã từ chối
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            Khách đã hủy
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      <Toast message={toastInfo.message} type={toastInfo.type} onClose={() => setToastInfo({ message: '', type: 'success' })} />

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden divide-y divide-slate-200">
        {/* 1. HEADER */}
        <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Quản lý yêu cầu thuê bãi xe
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Xem và phê duyệt danh sách khách hàng đăng ký thuê bãi đỗ xe theo tháng.
            </p>
          </div>

          <button
            onClick={fetchProviderReservations}
            disabled={loading}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium rounded-lg border border-slate-300 transition flex items-center gap-1.5 self-start sm:self-auto shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${loading ? 'animate-spin' : ''}`} />
            Làm mới
          </button>
        </div>

        {/* 2. FILTER TABS & SEARCH BAR */}
        <div className="px-6 py-3.5 bg-slate-50/60 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="flex items-center gap-1 overflow-x-auto">
            <button
              onClick={() => setActiveTab('ALL')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                activeTab === 'ALL'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-200/70'
              }`}
            >
              Tất cả ({totalCount})
            </button>
            <button
              onClick={() => setActiveTab('PENDING')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                activeTab === 'PENDING'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-200/70'
              }`}
            >
              Chờ duyệt ({pendingCount})
            </button>
            <button
              onClick={() => setActiveTab('APPROVED')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                activeTab === 'APPROVED'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-200/70'
              }`}
            >
              Đã chấp nhận ({approvedCount})
            </button>
            <button
              onClick={() => setActiveTab('REJECTED')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                activeTab === 'REJECTED'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-200/70'
              }`}
            >
              Đã từ chối ({rejectedCount})
            </button>
            <button
              onClick={() => setActiveTab('CANCELLED')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                activeTab === 'CANCELLED'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-200/70'
              }`}
            >
              Khách hủy ({cancelledCount})
            </button>
          </div>

          <div className="relative w-full md:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm khách hàng, biển số xe..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-teal-600 transition"
            />
          </div>
        </div>

        {/* 3. LIST OF RESERVATIONS */}
        {loading ? (
          <div className="p-16 text-center">
            <Loader2 className="w-7 h-7 animate-spin text-teal-600 mx-auto mb-2.5" />
            <p className="text-slate-500 text-sm">
              Đang tải danh sách yêu cầu thuê...
            </p>
          </div>
        ) : error ? (
          <div className="p-10 text-center space-y-3">
            <AlertCircle className="w-10 h-10 text-red-500 mx-auto" />
            <h3 className="text-base font-bold text-slate-900">Không thể tải dữ liệu</h3>
            <p className="text-sm text-slate-600">{error}</p>
            <button
              onClick={fetchProviderReservations}
              className="px-4 py-2 bg-teal-600 text-white font-medium text-xs rounded-lg hover:bg-teal-700 transition"
            >
              Thử lại
            </button>
          </div>
        ) : filteredReservations.length === 0 ? (
          <div className="py-14 px-6 text-center space-y-2">
            <Car className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-base font-semibold text-slate-800">Không có yêu cầu thuê nào</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {searchTerm
                ? 'Không tìm thấy yêu cầu phù hợp với từ khóa tìm kiếm.'
                : 'Chưa có yêu cầu đăng ký thuê bãi đỗ xe nào trong mục này.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-200">
            {filteredReservations.map((item) => {
              const displayVehicle = cleanVehicleDisplay(item.vehicle_info);

              return (
                <div
                  key={item.id}
                  onClick={() => handleOpenDetail(item.id)}
                  className="p-6 hover:bg-slate-50/70 transition cursor-pointer flex flex-col lg:flex-row lg:items-center justify-between gap-5"
                >
                  {/* LEFT CONTENT */}
                  <div className="space-y-3 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2.5 text-xs text-slate-500">
                      <span className="font-mono font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                        Mã yêu cầu #{item.id}
                      </span>
                      <span>•</span>
                      <span>Gửi ngày {new Date(item.created_at).toLocaleDateString('vi-VN')}</span>
                      <span>•</span>
                      {getStatusBadge(item.status)}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm pt-1">
                      {/* CUSTOMER */}
                      <div className="space-y-1">
                        <span className="text-xs text-slate-500 block">Khách hàng đăng ký</span>
                        <p className="font-semibold text-slate-900 flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{item.customer?.full_name || 'Khách hàng'}</span>
                        </p>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-slate-500">
                          <span className="inline-flex items-center gap-1">
                            <Phone className="w-3 h-3 text-slate-400" />
                            {item.customer?.phone_number || 'Chưa cập nhật'}
                          </span>
                          {item.customer?.email && (
                            <span className="inline-flex items-center gap-1 truncate">
                              <Mail className="w-3 h-3 text-slate-400" />
                              {item.customer.email}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* VEHICLE & START DATE */}
                      <div className="space-y-1">
                        <span className="text-xs text-slate-500 block">Phương tiện & ngày bắt đầu</span>
                        <p className="font-semibold text-slate-900 flex items-center gap-1.5">
                          <Car className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{displayVehicle}</span>
                        </p>
                        <p className="text-xs text-slate-600 flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>Bắt đầu: <strong className="font-medium text-slate-800">{new Date(item.desired_start_date).toLocaleDateString('vi-VN')}</strong></span>
                        </p>
                      </div>

                      {/* FACILITY */}
                      <div className="space-y-1">
                        <span className="text-xs text-slate-500 block">Bãi đỗ xe</span>
                        <p className="font-semibold text-slate-900 truncate">
                          {item.facility?.name}
                        </p>
                        <p className="text-xs text-slate-500 flex items-start gap-1 line-clamp-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                          <span className="truncate">{item.facility?.address}</span>
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* RIGHT ACTIONS */}
                  <div className="flex flex-wrap sm:flex-row items-center gap-2 shrink-0 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100 justify-end">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenDetail(item.id);
                      }}
                      className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg transition inline-flex items-center gap-1.5"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Chi tiết
                    </button>

                    {item.status === 'APPROVED' && (
                      item.confirmation_record ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/contracts/${item.confirmation_record.id}`);
                          }}
                          className="px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-medium rounded-lg transition inline-flex items-center gap-1.5"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          Xem hợp đồng
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/provider/reservations/${item.id}/create-contract`, {
                              state: { reservation: item }
                            });
                          }}
                          className="px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white font-medium text-xs rounded-lg transition inline-flex items-center gap-1.5"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          Tạo hợp đồng
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
                          className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-medium rounded-lg transition inline-flex items-center gap-1.5"
                        >
                          {processingId === item.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              Chấp nhận
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={(e) =>
                            handleOpenConfirmModal(item.id, 'REJECT', item.customer?.full_name, e)
                          }
                          disabled={processingId === item.id}
                          className="px-3.5 py-2 bg-white hover:bg-red-50 disabled:opacity-50 text-red-600 border border-red-200 text-xs font-medium rounded-lg transition inline-flex items-center gap-1.5"
                        >
                          {processingId === item.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <>
                              <X className="w-3.5 h-3.5" />
                              Từ chối
                            </>
                          )}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* CONFIRMATION MODAL FOR ACCEPT / REJECT */}
      <ConfirmModal
        isOpen={confirmModalState.isOpen}
        onClose={() => setConfirmModalState({ isOpen: false, action: null, targetId: null, targetName: '' })}
        onConfirm={handleExecuteAction}
        title={
          confirmModalState.action === 'ACCEPT'
            ? 'Xác nhận chấp nhận yêu cầu thuê'
            : 'Xác nhận từ chối yêu cầu thuê'
        }
        message={
          confirmModalState.action === 'ACCEPT'
            ? `Bạn có chắc chắn muốn phê duyệt chấp nhận yêu cầu đỗ xe của khách hàng "${confirmModalState.targetName}" không?`
            : `Bạn có chắc chắn muốn từ chối yêu cầu đỗ xe của khách hàng "${confirmModalState.targetName}" không?`
        }
        confirmText={confirmModalState.action === 'ACCEPT' ? 'Đồng ý chấp nhận' : 'Đồng ý từ chối'}
        cancelText="Hủy bỏ"
        type={confirmModalState.action === 'ACCEPT' ? 'primary' : 'danger'}
        loading={!!processingId}
      />
    </div>
  );
};

export default ProviderReservationsPanel;
