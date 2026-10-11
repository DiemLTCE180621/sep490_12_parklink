import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  getReservationDetail,
  acceptReservation,
  rejectReservation
} from '../../services/reservationService';
import ConfirmModal from '../../components/modals/ConfirmModal';
import CreateConfirmationRecordModal from '../../components/CreateConfirmationRecordModal';
import Toast from '../../components/common/Toast';
import {
  Car,
  Calendar,
  MapPin,
  Building2,
  Clock,
  CheckCircle2,
  Ban,
  ArrowLeft,
  User,
  Phone,
  Mail,
  FileText,
  AlertCircle,
  Loader2,
  Check,
  X,
  ShieldCheck
} from 'lucide-react';

const ProviderReservationDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [reservation, setReservation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toastInfo, setToastInfo] = useState({ message: '', type: 'success' });

  // Confirm Modal for Accept / Reject
  const [confirmModalState, setConfirmModalState] = useState({
    isOpen: false,
    action: null // 'ACCEPT' | 'REJECT'
  });
  const [processingAction, setProcessingAction] = useState(false);

  // Create Contract Modal
  const [isCreateContractOpen, setIsCreateContractOpen] = useState(false);

  const fetchDetail = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getReservationDetail(id);
      const data = res.data?.reservation || res.reservation;
      if (!data) {
        throw new Error('Không tìm thấy thông tin yêu cầu thuê xe.');
      }
      setReservation(data);
    } catch (err) {
      setError(err.message || 'Không thể tải chi tiết yêu cầu thuê của khách hàng!');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      fetchDetail();
    }
  }, [id, fetchDetail]);

  const handleExecuteAction = async () => {
    const { action } = confirmModalState;
    if (!action || !id) return;

    try {
      setProcessingAction(true);
      if (action === 'ACCEPT') {
        await acceptReservation(id);
        setToastInfo({ message: 'Đã phê duyệt chấp nhận yêu cầu thuê xe thành công!', type: 'success' });
      } else if (action === 'REJECT') {
        await rejectReservation(id);
        setToastInfo({ message: 'Đã từ chối yêu cầu thuê xe!', type: 'success' });
      }
      setConfirmModalState({ isOpen: false, action: null });
      fetchDetail();
    } catch (err) {
      setToastInfo({
        message: err.message || `Thực hiện ${action === 'ACCEPT' ? 'duyệt' : 'từ chối'} thất bại!`,
        type: 'error'
      });
    } finally {
      setProcessingAction(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-extrabold bg-amber-100 text-amber-800 border border-amber-300">
            <Clock className="w-4 h-4" /> Đang Chờ Chủ Bãi Phê Duyệt
          </span>
        );
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-4 h-4" /> Đã Phê Duyệt / Chấp Nhận
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-extrabold bg-red-100 text-red-800 border border-red-300">
            <Ban className="w-4 h-4" /> Đã Từ Chối
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-extrabold bg-slate-200 text-slate-700 border border-slate-300">
            <Ban className="w-4 h-4" /> Khách Đã Hủy Yêu Cầu
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-extrabold bg-slate-100 text-slate-800">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <Toast message={toastInfo.message} type={toastInfo.type} onClose={() => setToastInfo({ message: '', type: 'success' })} />

      <div className="max-w-5xl mx-auto space-y-6">
        {/* TOP BAR / NAVIGATION */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 text-xs sm:text-sm font-bold rounded-xl border border-slate-200 shadow-sm transition"
          >
            <ArrowLeft className="w-4 h-4 text-teal-600" /> Quay Lại Danh Sách
          </button>

          <div className="text-xs text-slate-500 font-medium hidden sm:block">
            <span>Quản Lý Bãi Xe</span> / <span>Yêu Cầu Thuê</span> / <span className="text-teal-700 font-bold">Mã #{id}</span>
          </div>
        </div>

        {loading ? (
          <div className="bg-white rounded-3xl p-16 text-center border border-slate-200 shadow-sm space-y-4">
            <Loader2 className="w-10 h-10 animate-spin text-teal-600 mx-auto" />
            <p className="text-slate-600 font-semibold text-sm">Đang tải thông tin chi tiết yêu cầu thuê #{id}...</p>
          </div>
        ) : error ? (
          <div className="bg-white rounded-3xl p-10 border border-red-200 shadow-sm text-center space-y-4">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
            <h3 className="text-lg font-bold text-slate-900">Không thể tải thông tin</h3>
            <p className="text-sm text-slate-600 max-w-md mx-auto">{error}</p>
            <button
              onClick={fetchDetail}
              className="px-5 py-2.5 bg-teal-600 text-white font-bold text-xs rounded-xl shadow hover:bg-teal-700 transition"
            >
              Thử Lại
            </button>
          </div>
        ) : reservation ? (
          <div className="space-y-6">
            {/* HERO BANNER */}
            <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-teal-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 rounded-xl bg-teal-500/20 text-teal-300 font-mono font-bold text-xs border border-teal-500/30">
                    MÃ YÊU CẦU #{reservation.id}
                  </span>
                  <span className="text-xs text-slate-300">
                    Gửi ngày: {new Date(reservation.created_at).toLocaleDateString('vi-VN')}
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                  Chi Tiết Yêu Cầu Thuê Bãi Xe Của Khách Hàng
                </h1>
                <p className="text-xs sm:text-sm text-slate-300">
                  Xem thông tin khách thuê, phương tiện đăng ký và tiến hành phê duyệt hoặc tạo hợp đồng điện tử
                </p>
              </div>

              <div className="shrink-0">{getStatusBadge(reservation.status)}</div>
            </div>

            {/* MAIN CONTENT GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* LEFT COLUMN: CUSTOMER & VEHICLE INFO (2 cols) */}
              <div className="lg:col-span-2 space-y-6">
                {/* CARD 1: CUSTOMER INFORMATION */}
                <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                    <User className="w-5 h-5 text-teal-600" /> Khách Hàng Đăng Ký Thuê
                  </h2>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">Họ Và Tên</span>
                      <p className="text-base font-bold text-slate-900">{reservation.customer?.full_name || 'Khách hàng'}</p>
                    </div>

                    <div className="space-y-1">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">Số Điện Thoại</span>
                      <a
                        href={`tel:${reservation.customer?.phone_number}`}
                        className="text-base font-bold text-teal-700 hover:underline flex items-center gap-1.5"
                      >
                        <Phone className="w-4 h-4 text-teal-600 shrink-0" />
                        {reservation.customer?.phone_number || 'Chưa cập nhật SĐT'}
                      </a>
                    </div>

                    <div className="sm:col-span-2 space-y-1 pt-2 border-t border-slate-100">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">Email Trực Tuyến</span>
                      <p className="text-sm font-medium text-slate-700 flex items-center gap-2">
                        <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                        {reservation.customer?.email}
                      </p>
                    </div>
                  </div>
                </div>

                {/* CARD 2: VEHICLE & RENTAL DURATION */}
                <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                    <Car className="w-5 h-5 text-teal-600" /> Thông Tin Phương Tiện & Thời Điểm
                  </h2>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                        <Car className="w-4 h-4 text-slate-500" /> Phương Tiện Đăng Ký
                      </span>
                      <p className="text-base font-extrabold text-slate-900">{reservation.vehicle_info}</p>
                    </div>

                    <div className="p-4 rounded-2xl bg-teal-50 border border-teal-100 space-y-1">
                      <span className="text-xs font-bold uppercase tracking-wider text-teal-700 flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-teal-600" /> Ngày Bắt Đầu Thuê
                      </span>
                      <p className="text-base font-extrabold text-teal-950">
                        {new Date(reservation.desired_start_date).toLocaleDateString('vi-VN')}
                      </p>
                    </div>
                  </div>
                </div>

                {/* CARD 3: FACILITY INFO */}
                <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                    <Building2 className="w-5 h-5 text-teal-600" /> Bãi Đỗ Xe Của Bạn
                  </h2>

                  <div className="space-y-3">
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">Tên Bãi Xe</span>
                      <p className="text-base font-extrabold text-slate-900 mt-0.5">{reservation.facility?.name}</p>
                    </div>

                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">Địa Chỉ</span>
                      <p className="text-sm font-medium text-slate-700 flex items-start gap-1.5 mt-0.5">
                        <MapPin className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                        {reservation.facility?.address}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex justify-between items-center">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Giá Thuê Niêm Yết</span>
                      <span className="text-lg font-black text-teal-700">
                        {Number(reservation.facility?.price_per_month || 0).toLocaleString('vi-VN')} VNĐ/tháng
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN: ACTIONS & CONTRACT (1 col) */}
              <div className="space-y-6">
                {/* CONTRACT CARD */}
                {reservation.confirmation_record ? (
                  <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-3xl p-6 border border-emerald-200 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-emerald-950 flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-emerald-600" /> Hợp Đồng Điện Tử
                      </h3>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-emerald-200 text-emerald-900">
                        {reservation.confirmation_record.status}
                      </span>
                    </div>

                    <div>
                      <span className="text-xs text-slate-400 font-bold block">MÃ HỢP ĐỒNG</span>
                      <span className="font-mono text-base font-black text-teal-800">
                        {reservation.confirmation_record.contract_code}
                      </span>
                    </div>

                    <Link
                      to={`/contracts/${reservation.confirmation_record.id}`}
                      className="w-full py-2.5 px-4 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow transition flex items-center justify-center gap-2 text-center"
                    >
                      <FileText className="w-4 h-4" /> Xem Chi Tiết Hợp Đồng
                    </Link>
                  </div>
                ) : reservation.status === 'APPROVED' ? (
                  <div className="bg-teal-50 rounded-3xl p-6 border border-teal-200 shadow-sm space-y-3">
                    <h3 className="text-sm font-bold text-teal-950 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-teal-600" /> Khởi Tạo Hợp Đồng
                    </h3>
                    <p className="text-xs text-teal-800">
                      Yêu cầu đã được bạn phê duyệt chấp nhận. Hãy tạo Biên bản xác nhận / Hợp đồng điện tử để gửi cho khách hàng ký xác nhận.
                    </p>
                    <button
                      onClick={() => setIsCreateContractOpen(true)}
                      className="w-full py-3 px-4 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-slate-950 font-black text-xs sm:text-sm rounded-xl shadow-md transition flex items-center justify-center gap-2"
                    >
                      <FileText className="w-4 h-4 text-slate-950" /> Tạo Hợp Đồng Điện Tử
                    </button>
                  </div>
                ) : null}

                {/* APPROVAL ACTIONS FOR PENDING */}
                {reservation.status === 'PENDING' && (
                  <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2">
                      Phê Duyệt Yêu Cầu Thuê
                    </h3>

                    <button
                      onClick={() => setConfirmModalState({ isOpen: true, action: 'ACCEPT' })}
                      disabled={processingAction}
                      className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition flex items-center justify-center gap-2"
                    >
                      <Check className="w-4 h-4" /> Phê Duyệt & Chấp Nhận
                    </button>

                    <button
                      onClick={() => setConfirmModalState({ isOpen: true, action: 'REJECT' })}
                      disabled={processingAction}
                      className="w-full py-3 px-4 bg-red-600 hover:bg-red-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition flex items-center justify-center gap-2"
                    >
                      <X className="w-4 h-4" /> Từ Chối Yêu Cầu
                    </button>
                  </div>
                )}

                <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-2">
                  <button
                    onClick={() => navigate(-1)}
                    className="w-full py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm rounded-xl transition text-center"
                  >
                    Quay Lại Danh Sách
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* CREATE CONTRACT MODAL */}
      <CreateConfirmationRecordModal
        isOpen={isCreateContractOpen}
        onClose={() => setIsCreateContractOpen(false)}
        reservation={reservation}
        onSuccess={() => {
          setToastInfo({ message: 'Tạo và gửi hợp đồng điện tử thành công!', type: 'success' });
          fetchDetail();
        }}
      />

      {/* CONFIRM MODAL FOR ACCEPT / REJECT */}
      <ConfirmModal
        isOpen={confirmModalState.isOpen}
        onClose={() => setConfirmModalState({ isOpen: false, action: null })}
        onConfirm={handleExecuteAction}
        title={
          confirmModalState.action === 'ACCEPT'
            ? 'Xác Nhận Chấp Nhận Yêu Cầu Thuê'
            : 'Xác Nhận Từ Chối Yêu Cầu Thuê'
        }
        message={
          confirmModalState.action === 'ACCEPT'
            ? `Bạn có chắc chắn muốn phê duyệt chấp nhận yêu cầu đỗ xe của khách hàng "${reservation?.customer?.full_name || ''}" không?`
            : `Bạn có chắc chắn muốn từ chối yêu cầu đỗ xe của khách hàng "${reservation?.customer?.full_name || ''}" không?`
        }
        confirmText={confirmModalState.action === 'ACCEPT' ? 'Đồng Ý Chấp Nhận' : 'Đồng Ý Từ Chối'}
        cancelText="Hủy Bỏ"
        type={confirmModalState.action === 'ACCEPT' ? 'primary' : 'danger'}
        loading={processingAction}
      />
    </div>
  );
};

export default ProviderReservationDetailPage;
