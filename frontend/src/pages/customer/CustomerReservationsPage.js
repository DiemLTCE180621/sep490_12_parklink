import React, { useEffect, useState, useCallback } from 'react';
import { getMyReservations, cancelReservationRequest } from '../../services/reservationService';
import ReservationDetailModal from '../../components/modals/ReservationDetailModal';
import ConfirmModal from '../../components/modals/ConfirmModal';
import Toast from '../../components/common/Toast';
import { Link, useNavigate } from 'react-router-dom';
import { Car, Calendar, MapPin, Building2, Clock, CheckCircle2, Ban, Eye, Search, AlertCircle, RefreshCw, PlusCircle, Loader2, ArrowLeft } from 'lucide-react';

const CustomerReservationsPage = () => {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('ALL'); // ALL, PENDING, APPROVED, CANCELLED
  const [selectedReservationId, setSelectedReservationId] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [cancellingId, setCancellingId] = useState(null);

  // States cho Confirm Modal & Toast
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
    setSelectedReservationId(id);
    setIsDetailOpen(true);
  };

  // Mở Confirm Modal thay cho window.confirm
  const handleRequestCancelConfirm = (id, e) => {
    e.stopPropagation();
    setTargetCancelId(id);
    setConfirmModalOpen(true);
  };

  // Xử lý Hủy khi bấm Xác nhận trong Modal
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

  // Filter List theo Tab
  const filteredReservations = reservations.filter(item => {
    if (activeTab === 'PENDING') return item.status === 'PENDING';
    if (activeTab === 'APPROVED') return item.status === 'APPROVED';
    if (activeTab === 'CANCELLED') return item.status === 'CANCELLED' || item.status === 'REJECTED';
    return true;
  });

  // Tính thống kê
  const totalCount = reservations.length;
  const pendingCount = reservations.filter(r => r.status === 'PENDING').length;
  const approvedCount = reservations.filter(r => r.status === 'APPROVED').length;
  const otherCount = reservations.filter(r => r.status === 'CANCELLED' || r.status === 'REJECTED').length;

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-extrabold bg-amber-100 text-amber-800 border border-amber-300">
            <Clock className="w-3.5 h-3.5" /> Chờ Phê Duyệt
          </span>
        );
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5" /> Đã Chấp Nhận
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-extrabold bg-red-100 text-red-800 border border-red-300">
            <Ban className="w-3.5 h-3.5" /> Từ Chối
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-extrabold bg-slate-200 text-slate-700 border border-slate-300">
            <Ban className="w-3.5 h-3.5" /> Đã Hủy
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-800">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* PAGE BANNER HEADER */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-teal-950 rounded-3xl p-8 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 text-xs font-semibold transition mb-3 border border-white/10"
            >
              <ArrowLeft className="w-4 h-4 text-teal-400" /> Quay Lại
            </button>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 border border-teal-400/30 text-teal-300 text-xs font-bold uppercase tracking-wider mb-3 ml-2">
              <Car className="w-4 h-4 text-teal-400" /> Quản Lý Đăng Ký Thuê
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Danh Sách Yêu Cầu Thuê Xe Của Tôi</h1>
            <p className="text-slate-300 text-sm mt-1">Theo dõi tiến độ duyệt, xem chi tiết và quản lý các yêu cầu thuê bãi đỗ xe theo tháng</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchMyReservations}
              className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl shadow transition"
              title="Làm mới dữ liệu"
            >
              <RefreshCw className="w-5 h-5" />
            </button>

            <Link
              to="/facilities"
              className="px-5 py-3 bg-teal-500 hover:bg-teal-600 text-slate-950 font-extrabold text-sm rounded-2xl shadow-md transition flex items-center gap-2"
            >
              <PlusCircle className="w-5 h-5" /> Tìm Bãi Đỗ Mới
            </Link>
          </div>
        </div>

        {/* STATS OVERVIEW CARDS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          <div 
            onClick={() => setActiveTab('ALL')} 
            className={`p-5 rounded-3xl border cursor-pointer transition shadow-sm ${activeTab === 'ALL' ? 'bg-teal-900 text-white border-teal-800 ring-2 ring-teal-500' : 'bg-white border-slate-200 text-slate-900 hover:border-teal-300'}`}
          >
            <span className="text-xs font-semibold uppercase block opacity-80 mb-1">Tất cả yêu cầu</span>
            <span className="text-2xl sm:text-3xl font-extrabold">{totalCount}</span>
          </div>

          <div 
            onClick={() => setActiveTab('PENDING')} 
            className={`p-5 rounded-3xl border cursor-pointer transition shadow-sm ${activeTab === 'PENDING' ? 'bg-amber-600 text-white border-amber-700 ring-2 ring-amber-400' : 'bg-white border-slate-200 text-slate-900 hover:border-amber-300'}`}
          >
            <span className="text-xs font-semibold uppercase block text-amber-700 mb-1">Chờ chủ bãi duyệt</span>
            <span className="text-2xl sm:text-3xl font-extrabold text-amber-700">{pendingCount}</span>
          </div>

          <div 
            onClick={() => setActiveTab('APPROVED')} 
            className={`p-5 rounded-3xl border cursor-pointer transition shadow-sm ${activeTab === 'APPROVED' ? 'bg-emerald-700 text-white border-emerald-800 ring-2 ring-emerald-500' : 'bg-white border-slate-200 text-slate-900 hover:border-emerald-300'}`}
          >
            <span className="text-xs font-semibold uppercase block text-emerald-700 mb-1">Đã được duyệt</span>
            <span className="text-2xl sm:text-3xl font-extrabold text-emerald-700">{approvedCount}</span>
          </div>

          <div 
            onClick={() => setActiveTab('CANCELLED')} 
            className={`p-5 rounded-3xl border cursor-pointer transition shadow-sm ${activeTab === 'CANCELLED' ? 'bg-slate-700 text-white border-slate-800 ring-2 ring-slate-500' : 'bg-white border-slate-200 text-slate-900 hover:border-slate-300'}`}
          >
            <span className="text-xs font-semibold uppercase block text-slate-500 mb-1">Đã hủy / Từ chối</span>
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-700">{otherCount}</span>
          </div>
        </div>

        {/* FILTER TABS */}
        <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-2">
          <button
            onClick={() => setActiveTab('ALL')}
            className={`px-4 py-2 text-sm font-bold rounded-xl transition ${activeTab === 'ALL' ? 'bg-teal-600 text-white shadow' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            Tất Cả ({totalCount})
          </button>
          <button
            onClick={() => setActiveTab('PENDING')}
            className={`px-4 py-2 text-sm font-bold rounded-xl transition ${activeTab === 'PENDING' ? 'bg-amber-600 text-white shadow' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            Đang Chờ Phê Duyệt ({pendingCount})
          </button>
          <button
            onClick={() => setActiveTab('APPROVED')}
            className={`px-4 py-2 text-sm font-bold rounded-xl transition ${activeTab === 'APPROVED' ? 'bg-emerald-600 text-white shadow' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            Đã Duyệt / Chấp Nhận ({approvedCount})
          </button>
          <button
            onClick={() => setActiveTab('CANCELLED')}
            className={`px-4 py-2 text-sm font-bold rounded-xl transition ${activeTab === 'CANCELLED' ? 'bg-slate-700 text-white shadow' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            Đã Hủy / Từ Chối ({otherCount})
          </button>
        </div>

        {/* RESERVATIONS LIST CONTENT */}
        {loading ? (
          <div className="py-20 text-center bg-white rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <Loader2 className="w-10 h-10 text-teal-600 animate-spin mx-auto" />
            <p className="text-slate-600 font-semibold">Đang tải danh sách yêu cầu thuê xe của bạn...</p>
          </div>
        ) : error ? (
          <div className="p-6 bg-red-50 rounded-3xl border border-red-200 text-red-700 flex items-center gap-4">
            <AlertCircle className="w-6 h-6 text-red-600 shrink-0" />
            <div>
              <p className="font-bold text-base">Đã xảy ra lỗi</p>
              <p className="text-sm">{error}</p>
            </div>
          </div>
        ) : filteredReservations.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-3xl border border-dashed border-slate-300 shadow-sm space-y-4">
            <Car className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="text-lg font-bold text-slate-800">Không tìm thấy yêu cầu thuê nào</h3>
            <p className="text-slate-500 text-sm max-w-md mx-auto">
              Bạn chưa có yêu cầu thuê xe nào thuộc mục này. Hãy tìm kiếm bãi đỗ xe phù hợp tại Ninh Kiều để gửi yêu cầu thuê ngay!
            </p>
            <Link
              to="/facilities"
              className="inline-flex items-center gap-2 px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl shadow transition"
            >
              <Search className="w-4 h-4" /> Khám Phá Bãi Đỗ Xe
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredReservations.map((item) => (
              <div
                key={item.id}
                onClick={() => handleOpenDetail(item.id)}
                className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col justify-between space-y-5 hover:-translate-y-1 group"
              >
                <div className="space-y-4">
                  {/* CARD TOP HEADER */}
                  <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 font-extrabold text-xs flex items-center justify-center border border-teal-100">
                        #{item.id}
                      </span>
                      <div className="text-xs font-semibold text-slate-400">
                        Gửi ngày: {new Date(item.created_at).toLocaleDateString('vi-VN')}
                      </div>
                    </div>
                    {getStatusBadge(item.status)}
                  </div>

                  {/* FACILITY NAME & ADDRESS */}
                  <div className="space-y-1">
                    <h3 className="text-lg font-extrabold text-slate-900 group-hover:text-teal-700 transition flex items-center gap-2">
                      <Building2 className="w-5 h-5 text-teal-600 shrink-0" />
                      {item.facility?.name}
                    </h3>
                    <p className="text-xs text-slate-600 flex items-start gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      {item.facility?.address}
                    </p>
                  </div>

                  {/* DETAILS GRID */}
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 font-medium flex items-center gap-1.5">
                        <Car className="w-3.5 h-3.5 text-slate-400" /> Xe đăng ký:
                      </span>
                      <span className="font-bold text-slate-900 truncate max-w-[200px]">{item.vehicle_info}</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 font-medium flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-teal-600" /> Ngày muốn thuê:
                      </span>
                      <span className="font-bold text-teal-900">{new Date(item.desired_start_date).toLocaleDateString('vi-VN')}</span>
                    </div>

                    <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                      <span className="text-slate-500 font-medium">Giá thuê tháng:</span>
                      <span className="font-extrabold text-teal-700 text-sm">
                        {Number(item.facility?.price_per_month || 0).toLocaleString('vi-VN')} VNĐ/tháng
                      </span>
                    </div>
                  </div>
                </div>

                {/* CARD FOOTER ACTIONS */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenDetail(item.id);
                    }}
                    className="px-4 py-2 bg-slate-100 hover:bg-teal-50 text-slate-700 hover:text-teal-700 font-bold text-xs rounded-xl transition flex items-center gap-1.5"
                  >
                    <Eye className="w-4 h-4" /> Xem Chi Tiết
                  </button>

                  {item.status === 'APPROVED' && (
                    <Link
                      to={`/submit-complaint/${item.id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs rounded-xl transition border border-red-200 flex items-center gap-1.5"
                    >
                      <AlertCircle className="w-3.5 h-3.5" /> Khiếu Nại
                    </Link>
                  )}

                  {item.status === 'PENDING' && (
                    <button
                      onClick={(e) => handleRequestCancelConfirm(item.id, e)}
                      disabled={cancellingId === item.id}
                      className="px-4 py-2 bg-red-50 hover:bg-red-600 text-red-700 hover:text-white font-bold text-xs rounded-xl transition border border-red-200 flex items-center gap-1.5"
                    >
                      {cancellingId === item.id ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" /> Đang hủy...
                        </>
                      ) : (
                        <>
                          <Ban className="w-3.5 h-3.5" /> Hủy Yêu Cầu
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

      {/* DETAIL MODAL */}
      <ReservationDetailModal
        reservationId={selectedReservationId}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        onRefresh={fetchMyReservations}
      />

      {/* CONFIRMATION MODAL DÀNH CHO THAO TÁC HỦY */}
      <ConfirmModal
        isOpen={confirmModalOpen}
        onClose={() => {
          setConfirmModalOpen(false);
          setTargetCancelId(null);
        }}
        onConfirm={executeCancelRequest}
        title="Hủy Yêu Cầu Thuê Bãi Xe"
        message="Bạn có chắc chắn muốn hủy yêu cầu thuê đỗ xe này không? Thao tác này không thể hoàn tác."
        confirmText="Đồng Ý Hủy"
        cancelText="Quay Lại"
        type="danger"
        loading={!!cancellingId}
      />

      {/* TOAST NOTIFICATION */}
      <Toast
        message={toastInfo.message}
        type={toastInfo.type}
        onClose={() => setToastInfo({ message: '', type: 'success' })}
      />
    </div>
  );
};

export default CustomerReservationsPage;
