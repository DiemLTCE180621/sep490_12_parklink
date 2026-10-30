import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getReservationDetail, cancelReservationRequest } from '../../services/reservationService';
import ConfirmModal from '../../components/modals/ConfirmModal';
import Toast from '../../components/common/Toast';
import {
  Car,
  Calendar,
  MapPin,
  ArrowLeft,
  User,
  Phone,
  Mail,
  FileText,
  AlertCircle,
  Loader2,
  ExternalLink
} from 'lucide-react';

const CustomerReservationDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [reservation, setReservation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState(null);
  const [toastInfo, setToastInfo] = useState({ message: '', type: 'success' });
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);

  const fetchDetail = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getReservationDetail(id);
      const data = res.data?.reservation || res.reservation;
      if (!data) {
        throw new Error('Không tìm thấy thông tin yêu cầu thuê xe này.');
      }
      setReservation(data);
    } catch (err) {
      setError(err.message || 'Không thể tải chi tiết yêu cầu thuê!');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      fetchDetail();
    }
  }, [id, fetchDetail]);

  const executeCancelRequest = async () => {
    try {
      setCancelling(true);
      await cancelReservationRequest(id);
      setToastInfo({ message: 'Đã hủy yêu cầu thuê thành công!', type: 'success' });
      setReservation((prev) => (prev ? { ...prev, status: 'CANCELLED' } : null));
      setConfirmModalOpen(false);
    } catch (err) {
      setToastInfo({ message: err.message || 'Hủy yêu cầu thuê không thành công!', type: 'error' });
    } finally {
      setCancelling(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Chờ chủ bãi duyệt
          </span>
        );
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Đã phê duyệt
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
            Từ chối
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            Đã hủy
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
            {status}
          </span>
        );
    }
  };

  const rawVehicle = reservation?.vehicle_info || '';
  const cccdMatch = rawVehicle.match(/\[CCCD:\s*([^|\]]+)/i);
  const dcMatch = rawVehicle.match(/\|\s*ĐC:\s*([^\]]+)/i);
  const displayVehicle = rawVehicle.replace(/\s*\[CCCD:[^\]]+\]/i, '').trim();
  const displayCccd = cccdMatch ? cccdMatch[1].trim() : null;
  const displayAddress = dcMatch ? dcMatch[1].trim() : null;

  return (
    <div className="min-h-screen bg-slate-50 py-6 px-4 sm:px-6 lg:px-8 w-full">
      <Toast message={toastInfo.message} type={toastInfo.type} onClose={() => setToastInfo({ message: '', type: 'success' })} />

      <div className="w-full space-y-4">
        {/* TOP NAVIGATION */}
        <div>
          <button
            onClick={() => navigate('/my-reservations')}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Quay lại danh sách yêu cầu
          </button>
        </div>

        {loading ? (
          <div className="bg-white rounded-xl p-16 text-center border border-slate-200">
            <Loader2 className="w-8 h-8 animate-spin text-teal-600 mx-auto mb-3" />
            <p className="text-sm text-slate-600">Đang tải thông tin yêu cầu #{id}...</p>
          </div>
        ) : error ? (
          <div className="bg-white rounded-xl p-10 border border-slate-200 text-center space-y-3">
            <AlertCircle className="w-10 h-10 text-red-500 mx-auto" />
            <h3 className="text-base font-bold text-slate-900">Không thể tải thông tin</h3>
            <p className="text-sm text-slate-600 max-w-md mx-auto">{error}</p>
            <button
              onClick={fetchDetail}
              className="px-4 py-2 bg-teal-600 text-white font-medium text-xs rounded-lg hover:bg-teal-700 transition"
            >
              Thử lại
            </button>
          </div>
        ) : reservation ? (
          /* UNIFIED SINGLE CARD CONTAINER */
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            {/* 1. HEADER SECTION */}
            <div className="p-6 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                  <span className="font-mono font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                    Mã yêu cầu #{reservation.id}
                  </span>
                  <span>•</span>
                  <span>Ngày gửi: {new Date(reservation.created_at).toLocaleDateString('vi-VN')}</span>
                </div>
                <h1 className="text-xl font-bold text-slate-900">
                  Chi tiết yêu cầu thuê bãi đỗ xe
                </h1>
              </div>

              <div className="shrink-0">{getStatusBadge(reservation.status)}</div>
            </div>

            {/* 2. BODY SECTION (MERGED IN SAME CONTAINER) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
              {/* LEFT COLUMN: FACILITY + REGISTRATION DETAILS */}
              <div className="lg:col-span-8 divide-y divide-slate-200">
                {/* FACILITY INFO */}
                <div className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-base font-bold text-slate-900">
                      Thông tin bãi đỗ xe
                    </h2>
                    {reservation.facility?.id && (
                      <Link
                        to={`/facility/${reservation.facility.id}`}
                        className="text-xs font-medium text-teal-600 hover:text-teal-700 inline-flex items-center gap-1"
                      >
                        Xem trang bãi xe <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm pt-1">
                    <div>
                      <span className="text-xs text-slate-500 block">Tên bãi xe</span>
                      <p className="font-semibold text-slate-900 mt-0.5">{reservation.facility?.name}</p>
                    </div>

                    <div className="sm:col-span-2">
                      <span className="text-xs text-slate-500 block">Địa chỉ</span>
                      <p className="text-slate-700 flex items-start gap-1.5 mt-0.5">
                        <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                        <span>{reservation.facility?.address}</span>
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex justify-between items-center text-sm">
                    <span className="text-slate-500">Giá thuê niêm yết</span>
                    <span className="text-base font-bold text-teal-700">
                      {Number(reservation.facility?.price_per_month || 0).toLocaleString('vi-VN')} đ/tháng
                    </span>
                  </div>
                </div>

                {/* VEHICLE & CUSTOMER DETAILS */}
                <div className="p-6 space-y-3">
                  <h2 className="text-base font-bold text-slate-900">
                    Thông tin đăng ký gửi giữ
                  </h2>

                  <div className="divide-y divide-slate-100 text-sm">
                    <div className="py-2.5 flex justify-between gap-4">
                      <span className="text-slate-500 flex items-center gap-1.5">
                        <Car className="w-4 h-4 text-slate-400" />
                        Phương tiện
                      </span>
                      <span className="font-semibold text-slate-900 text-right">
                        {displayVehicle || reservation.vehicle_info}
                      </span>
                    </div>

                    <div className="py-2.5 flex justify-between gap-4">
                      <span className="text-slate-500 flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        Ngày bắt đầu dự kiến
                      </span>
                      <span className="font-semibold text-slate-900">
                        {new Date(reservation.desired_start_date).toLocaleDateString('vi-VN')}
                      </span>
                    </div>

                    {displayCccd && (
                      <div className="py-2.5 flex justify-between gap-4">
                        <span className="text-slate-500">Số CCCD / CMND</span>
                        <span className="font-medium text-slate-900">{displayCccd}</span>
                      </div>
                    )}

                    {displayAddress && (
                      <div className="py-2.5 flex justify-between gap-4">
                        <span className="text-slate-500 shrink-0">Địa chỉ liên hệ</span>
                        <span className="font-medium text-slate-900 text-right">{displayAddress}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN: PROVIDER CONTACT & CONTRACT */}
              <div className="lg:col-span-4 divide-y divide-slate-200 flex flex-col justify-between">
                <div className="p-6 space-y-4">
                  <h2 className="text-base font-bold text-slate-900">
                    Liên hệ chủ bãi xe
                  </h2>

                  {reservation.facility?.provider ? (
                    <div className="space-y-3 text-sm">
                      <div className="flex items-center gap-2.5">
                        <User className="w-4 h-4 text-slate-400 shrink-0" />
                        <span className="font-semibold text-slate-900">
                          {reservation.facility.provider.full_name}
                        </span>
                      </div>

                      <div className="flex items-center gap-2.5">
                        <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                        <a
                          href={`tel:${reservation.facility.provider.phone_number}`}
                          className="text-teal-700 hover:underline font-medium"
                        >
                          {reservation.facility.provider.phone_number || 'Chưa cập nhật'}
                        </a>
                      </div>

                      <div className="flex items-center gap-2.5">
                        <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                        <span className="text-slate-600 break-all">
                          {reservation.facility.provider.email}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500">Chưa có thông tin liên hệ.</p>
                  )}

                  {/* CONTRACT SECTION IF EXISTS */}
                  {reservation.confirmation_record && (
                    <div className="pt-4 mt-4 border-t border-slate-100 space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <h3 className="text-sm font-bold text-slate-900">
                            Hợp đồng điện tử
                          </h3>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Mã: <strong className="font-mono text-slate-800">{reservation.confirmation_record.contract_code}</strong>
                          </p>
                        </div>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-teal-50 text-teal-700 border border-teal-200">
                          {reservation.confirmation_record.status === 'ACTIVE'
                            ? 'Đang hiệu lực'
                            : 'Chờ xác nhận'}
                        </span>
                      </div>

                      <Link
                        to={`/my-contracts/${reservation.confirmation_record.id}`}
                        className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-medium text-xs rounded-lg transition"
                      >
                        <FileText className="w-4 h-4" />
                        Xem văn bản hợp đồng
                      </Link>
                    </div>
                  )}
                </div>

                {/* ACTION BUTTONS IN SAME CONTAINER */}
                <div className="p-6 bg-slate-50/60 space-y-2.5">
                  {reservation.status === 'PENDING' && (
                    <button
                      onClick={() => setConfirmModalOpen(true)}
                      disabled={cancelling}
                      className="w-full py-2.5 px-4 bg-white hover:bg-red-50 text-red-600 font-medium text-xs rounded-lg border border-red-200 transition"
                    >
                      {cancelling ? 'Đang hủy yêu cầu...' : 'Hủy yêu cầu thuê'}
                    </button>
                  )}

                  {reservation.status === 'APPROVED' && (
                    <Link
                      to={`/submit-complaint/${reservation.id}`}
                      className="w-full py-2.5 px-4 bg-white hover:bg-red-50 text-red-600 font-medium text-xs rounded-lg border border-red-200 transition block text-center"
                    >
                      Gửi khiếu nại bãi xe
                    </Link>
                  )}

                  <button
                    onClick={() => navigate('/my-reservations')}
                    className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs rounded-lg transition"
                  >
                    Quay lại danh sách
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <ConfirmModal
        isOpen={confirmModalOpen}
        onClose={() => setConfirmModalOpen(false)}
        onConfirm={executeCancelRequest}
        title="Hủy yêu cầu thuê bãi xe"
        message="Bạn có chắc chắn muốn hủy yêu cầu thuê đỗ xe này không? Thao tác này không thể hoàn tác."
        confirmText="Đồng ý hủy"
        cancelText="Quay lại"
        type="danger"
        loading={cancelling}
      />
    </div>
  );
};

export default CustomerReservationDetailPage;
