import React, { useEffect, useState, useCallback } from 'react';
import { getMyReservations, cancelReservationRequest } from '../../services/reservationService';
import ConfirmModal from '../../components/modals/ConfirmModal';
import Toast from '../../components/common/Toast';
import { Link, useNavigate } from 'react-router-dom';
import {
  Car,
  Calendar,
  MapPin,
  Search,
  AlertCircle,
  RefreshCw,
  Plus,
  Loader2,
  ChevronRight,
  FileText
} from 'lucide-react';

const CustomerReservationsPage = () => {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('ALL'); // ALL, PENDING, APPROVED, CANCELLED
  const [searchTerm, setSearchTerm] = useState('');
  const [cancellingId, setCancellingId] = useState(null);

  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [targetCancelId, setTargetCancelId] = useState(null);
  const [toastInfo, setToastInfo] = useState({ message: '', type: 'success' });

  const navigate = useNavigate();

  const fetchMyReservations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getMyReservations();
      const list = res.data?.reservations || res.reservations || [];
      setReservations(list);
    } catch (err) {
      setError(err.message || 'Không thể tải danh sách yêu cầu thuê xe của bạn!');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMyReservations();
  }, [fetchMyReservations]);

  const handleOpenDetail = (id) => {
    navigate(`/my-reservations/${id}`);
  };

  const handleRequestCancelConfirm = (id, e) => {
    e.stopPropagation();
    setTargetCancelId(id);
    setConfirmModalOpen(true);
  };

  const executeCancelRequest = async () => {
    if (!targetCancelId) return;

    try {
      setCancellingId(targetCancelId);
      await cancelReservationRequest(targetCancelId);
      setToastInfo({ message: 'Đã hủy yêu cầu thuê thành công!', type: 'success' });
      setConfirmModalOpen(false);
      setTargetCancelId(null);
      fetchMyReservations();
    } catch (err) {
      setToastInfo({ message: err.message || 'Hủy yêu cầu thuê không thành công!', type: 'error' });
    } finally {
      setCancellingId(null);
    }
  };

  const cleanVehicleDisplay = (rawVehicle = '') => {
    return rawVehicle.replace(/\s*\[CCCD:[^\]]+\]/i, '').trim() || 'Chưa cập nhật';
  };

  const filteredReservations = reservations.filter((item) => {
    let matchesTab = true;
    if (activeTab === 'PENDING') matchesTab = item.status === 'PENDING';
    else if (activeTab === 'APPROVED') matchesTab = item.status === 'APPROVED';
    else if (activeTab === 'CANCELLED') matchesTab = item.status === 'CANCELLED' || item.status === 'REJECTED';

    const query = searchTerm.trim().toLowerCase();
    let matchesSearch = true;
    if (query) {
      const facilityName = item.facility?.name?.toLowerCase() || '';
      const facilityAddress = item.facility?.address?.toLowerCase() || '';
      const vehicle = cleanVehicleDisplay(item.vehicle_info).toLowerCase();
      matchesSearch =
        facilityName.includes(query) ||
        facilityAddress.includes(query) ||
        vehicle.includes(query) ||
        String(item.id).includes(query);
    }

    return matchesTab && matchesSearch;
  });

  const totalCount = reservations.length;
  const pendingCount = reservations.filter((r) => r.status === 'PENDING').length;
  const approvedCount = reservations.filter((r) => r.status === 'APPROVED').length;
  const otherCount = reservations.filter((r) => r.status === 'CANCELLED' || r.status === 'REJECTED').length;

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
            Đã duyệt
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
            Từ chối
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            Đã hủy
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
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8 w-full">
      <div className="w-full space-y-6">
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Yêu cầu thuê chỗ của tôi</h1>
            <p className="text-sm text-slate-500 mt-1">
              Theo dõi trạng thái phê duyệt và hợp đồng cho các yêu cầu đặt chỗ theo tháng.
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-auto">
            <button
              onClick={fetchMyReservations}
              disabled={loading}
              className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium rounded-lg border border-slate-300 transition flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${loading ? 'animate-spin' : ''}`} />
              Làm mới
            </button>

            <Link
              to="/search"
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-medium text-xs rounded-lg transition flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              Tìm bãi đỗ mới
            </Link>
          </div>
        </div>

        {/* FILTER TABS & SEARCH BAR */}
        <div className="bg-white p-3 rounded-xl border border-slate-200 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="flex items-center gap-1 overflow-x-auto">
            <button
              onClick={() => setActiveTab('ALL')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                activeTab === 'ALL'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Tất cả ({totalCount})
            </button>
            <button
              onClick={() => setActiveTab('PENDING')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                activeTab === 'PENDING'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Chờ duyệt ({pendingCount})
            </button>
            <button
              onClick={() => setActiveTab('APPROVED')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                activeTab === 'APPROVED'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Đã duyệt ({approvedCount})
            </button>
            <button
              onClick={() => setActiveTab('CANCELLED')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                activeTab === 'CANCELLED'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Đã hủy / Từ chối ({otherCount})
            </button>
          </div>

          <div className="relative w-full md:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm bãi xe, biển số..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-teal-600 transition"
            />
          </div>
        </div>

        {/* LIST CONTENT */}
        {loading ? (
          <div className="py-16 text-center bg-white rounded-xl border border-slate-200">
            <Loader2 className="w-7 h-7 text-teal-600 animate-spin mx-auto mb-2.5" />
            <p className="text-sm text-slate-500">Đang tải danh sách yêu cầu...</p>
          </div>
        ) : error ? (
          <div className="p-4 bg-red-50 rounded-xl border border-red-200 text-red-700 flex items-center gap-3 text-sm">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
        ) : filteredReservations.length === 0 ? (
          <div className="py-14 px-6 text-center bg-white rounded-xl border border-slate-200 space-y-3">
            <Car className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-base font-semibold text-slate-800">Không có yêu cầu thuê nào</h3>
            <p className="text-slate-500 text-xs max-w-sm mx-auto">
              {searchTerm
                ? 'Không tìm thấy yêu cầu nào khớp với từ khóa tìm kiếm.'
                : 'Bạn chưa có yêu cầu thuê chỗ đỗ xe nào trong mục này.'}
            </p>
            {!searchTerm && (
              <div className="pt-1">
                <Link
                  to="/search"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-medium rounded-lg transition"
                >
                  Tìm bãi đỗ xe
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredReservations.map((item) => {
              const displayVehicle = cleanVehicleDisplay(item.vehicle_info);

              return (
                <div
                  key={item.id}
                  onClick={() => handleOpenDetail(item.id)}
                  className="bg-white rounded-xl p-5 border border-slate-200 hover:border-slate-300 transition cursor-pointer"
                >
                  {/* TOP ROW */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2.5 text-xs text-slate-500">
                      <span className="font-mono font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                        #{item.id}
                      </span>
                      <span>•</span>
                      <span>Ngày gửi: {new Date(item.created_at).toLocaleDateString('vi-VN')}</span>
                    </div>

                    {getStatusBadge(item.status)}
                  </div>

                  {/* BODY ROW */}
                  <div className="pt-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1.5 min-w-0 flex-1">
                      <h3 className="text-base font-bold text-slate-900 truncate">
                        {item.facility?.name || 'Bãi đỗ xe'}
                      </h3>
                      <p className="text-xs text-slate-500 flex items-center gap-1.5 truncate">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{item.facility?.address}</span>
                      </p>

                      <div className="flex flex-wrap items-center gap-x-5 gap-y-1 pt-1 text-xs text-slate-600">
                        <span className="inline-flex items-center gap-1.5">
                          <Car className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{displayVehicle}</span>
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>
                            Bắt đầu: <strong className="text-slate-800">{new Date(item.desired_start_date).toLocaleDateString('vi-VN')}</strong>
                          </span>
                        </span>
                      </div>
                    </div>

                    {/* RIGHT PRICE & ACTIONS */}
                    <div className="flex sm:flex-col items-center sm:items-end justify-between gap-3 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100 shrink-0">
                      <div className="text-left sm:text-right">
                        <span className="text-[11px] text-slate-400 block">Giá thuê</span>
                        <span className="text-sm font-bold text-teal-700">
                          {Number(item.facility?.price_per_month || 0).toLocaleString('vi-VN')} đ/tháng
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {item.confirmation_record?.id && (
                          <Link
                            to={`/my-contracts/${item.confirmation_record.id}`}
                            onClick={(e) => e.stopPropagation()}
                            className="px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-700 font-medium text-xs rounded-lg border border-teal-200 transition inline-flex items-center gap-1"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            Hợp đồng
                          </Link>
                        )}

                        {item.status === 'APPROVED' && (
                          <Link
                            to={`/submit-complaint/${item.id}`}
                            onClick={(e) => e.stopPropagation()}
                            className="px-3 py-1.5 bg-white hover:bg-red-50 text-red-600 font-medium text-xs rounded-lg border border-slate-200 hover:border-red-200 transition"
                          >
                            Khiếu nại
                          </Link>
                        )}

                        {item.status === 'PENDING' && (
                          <button
                            onClick={(e) => handleRequestCancelConfirm(item.id, e)}
                            disabled={cancellingId === item.id}
                            className="px-3 py-1.5 bg-white hover:bg-red-50 text-red-600 font-medium text-xs rounded-lg border border-slate-200 hover:border-red-200 transition"
                          >
                            {cancellingId === item.id ? 'Đang hủy...' : 'Hủy yêu cầu'}
                          </button>
                        )}

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenDetail(item.id);
                          }}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs rounded-lg transition inline-flex items-center gap-1"
                        >
                          Chi tiết
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={confirmModalOpen}
        onClose={() => {
          setConfirmModalOpen(false);
          setTargetCancelId(null);
        }}
        onConfirm={executeCancelRequest}
        title="Hủy yêu cầu thuê bãi xe"
        message="Bạn có chắc chắn muốn hủy yêu cầu thuê đỗ xe này không? Thao tác này không thể hoàn tác."
        confirmText="Đồng ý hủy"
        cancelText="Quay lại"
        type="danger"
        loading={!!cancellingId}
      />

      <Toast
        message={toastInfo.message}
        type={toastInfo.type}
        onClose={() => setToastInfo({ message: '', type: 'success' })}
      />
    </div>
  );
};

export default CustomerReservationsPage;
