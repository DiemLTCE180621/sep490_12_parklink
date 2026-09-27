import React, { useEffect, useState, useCallback } from 'react';
import { getReservationDetail, cancelReservationRequest } from '../services/reservationService';
import ConfirmModal from './ConfirmModal';
import { X, Calendar, Car, MapPin, Building2, User, Phone, Mail, FileText, Ban, AlertCircle, CheckCircle2, Clock, Loader2 } from 'lucide-react';

const ReservationDetailModal = ({ reservationId, isOpen, onClose, onRefresh }) => {
  const [reservation, setReservation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);

  const fetchDetail = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getReservationDetail(reservationId);
      setReservation(res.data?.reservation || res.reservation);
    } catch (err) {
      setError(err.message || 'Không thể tải chi tiết yêu cầu thuê!');
    } finally {
      setLoading(false);
    }
  }, [reservationId]);

  useEffect(() => {
    if (isOpen && reservationId) {
      fetchDetail();
    } else {
      setReservation(null);
      setError(null);
      setSuccessMsg(null);
      setConfirmModalOpen(false);
    }
  }, [isOpen, reservationId, fetchDetail]);

  const executeCancelRequest = async () => {
    try {
      setCancelling(true);
      setError(null);
      await cancelReservationRequest(reservationId);
      setSuccessMsg('Đã hủy yêu cầu thuê thành công!');
      setReservation(prev => ({ ...prev, status: 'CANCELLED' }));
      setConfirmModalOpen(false);
      if (onRefresh) onRefresh();
    } catch (err) {
      setError(err.message || 'Hủy yêu cầu thuê không thành công!');
    } finally {
      setCancelling(false);
    }
  };

  if (!isOpen) return null;

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-amber-100 text-amber-800 border border-amber-300">
            <Clock className="w-3.5 h-3.5" /> Đang Chờ Chủ Bãi Phê Duyệt
          </span>
        );
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5" /> Đã Chấp Nhận / Đã Duyệt
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-red-100 text-red-800 border border-red-300">
            <Ban className="w-3.5 h-3.5" /> Chủ Bãi Từ Chối
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-slate-200 text-slate-700 border border-slate-300">
            <Ban className="w-3.5 h-3.5" /> Khách Thuê Đã Hủy
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div 
        className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-2xl overflow-hidden transform transition-all duration-300 max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* MODAL HEADER */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-teal-950 p-6 text-white relative shrink-0">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition text-slate-300 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-4 h-4 text-teal-400" />
            <span className="text-xs text-teal-300 font-bold uppercase tracking-wider">Chi Tiết Yêu Cầu Thuê #{reservationId}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Yêu Cầu Đăng Ký Thuê Bãi Xe</h2>
        </div>

        {/* MODAL BODY */}
        <div className="p-6 overflow-y-auto space-y-6 flex-grow">
          {loading ? (
            <div className="py-12 text-center space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-teal-600 mx-auto" />
              <p className="text-sm font-semibold text-slate-600">Đang lấy dữ liệu yêu cầu thuê...</p>
            </div>
          ) : error ? (
            <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm font-medium flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
              <div>{error}</div>
            </div>
          ) : reservation ? (
            <>
              {/* MESSAGES */}
              {successMsg && (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-medium flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div>{successMsg}</div>
                </div>
              )}

              {/* STATUS BANNER */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <span className="text-xs text-slate-500 font-bold uppercase block mb-1">Trạng thái hiện tại</span>
                  {getStatusBadge(reservation.status)}
                </div>
                <div className="text-xs text-slate-500 font-medium">
                  Ngày gửi: {new Date(reservation.created_at).toLocaleDateString('vi-VN')}
                </div>
              </div>

              {/* SECTION 1: FACILITY INFO */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                <h4 className="text-xs font-extrabold text-teal-800 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
                  <Building2 className="w-4 h-4 text-teal-600" /> Thông Tin Bãi Đỗ Xe
                </h4>
                
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-xs text-slate-500 font-semibold">Tên cơ sở:</span>
                    <p className="font-bold text-slate-900 text-base">{reservation.facility?.name}</p>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 font-semibold">Địa chỉ:</span>
                    <p className="text-slate-700 flex items-start gap-1.5 mt-0.5">
                      <MapPin className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                      {reservation.facility?.address}
                    </p>
                  </div>
                  <div className="flex justify-between items-center pt-1 border-t border-slate-100">
                    <span className="text-xs text-slate-500 font-semibold">Giá thuê theo tháng:</span>
                    <span className="font-extrabold text-teal-700 text-base">
                      {Number(reservation.facility?.price_per_month || 0).toLocaleString('vi-VN')} VNĐ/tháng
                    </span>
                  </div>
                </div>
              </div>

              {/* SECTION 2: RENTAL REQUEST DETAILS */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                <h4 className="text-xs font-extrabold text-teal-800 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
                  <Car className="w-4 h-4 text-teal-600" /> Chi Tiết Thuê & Phương Tiện
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-xs text-slate-500 font-semibold">Thông tin xe đăng ký đỗ:</span>
                    <p className="font-bold text-slate-900 mt-0.5 flex items-center gap-2">
                      <Car className="w-4 h-4 text-slate-400" /> {reservation.vehicle_info}
                    </p>
                  </div>

                  <div>
                    <span className="text-xs text-slate-500 font-semibold">Ngày mong muốn bắt đầu thuê:</span>
                    <p className="font-bold text-teal-900 mt-0.5 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-teal-600" />
                      {new Date(reservation.desired_start_date).toLocaleDateString('vi-VN')}
                    </p>
                  </div>
                </div>
              </div>

              {/* SECTION 3: PROVIDER CONTACT */}
              {reservation.facility?.provider && (
                <div className="bg-teal-50/60 p-5 rounded-2xl border border-teal-100 space-y-3">
                  <h4 className="text-xs font-extrabold text-teal-800 uppercase tracking-wider flex items-center gap-2 border-b border-teal-100 pb-2">
                    <User className="w-4 h-4 text-teal-600" /> Liên Hệ Chủ Bãi Đỗ Xe (Parking Provider)
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2 text-slate-700">
                      <User className="w-4 h-4 text-teal-600 shrink-0" />
                      <span className="font-bold">{reservation.facility.provider.full_name}</span>
                    </div>

                    <div className="flex items-center gap-2 text-slate-700">
                      <Phone className="w-4 h-4 text-teal-600 shrink-0" />
                      <a href={`tel:${reservation.facility.provider.phone_number}`} className="font-bold text-teal-700 hover:underline">
                        {reservation.facility.provider.phone_number}
                      </a>
                    </div>

                    <div className="flex items-center gap-2 text-slate-700 sm:col-span-2">
                      <Mail className="w-4 h-4 text-teal-600 shrink-0" />
                      <span className="font-medium text-xs">{reservation.facility.provider.email}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* SECTION 4: ELECTRONIC CONFIRMATION CONTRACT RECORD */}
              {reservation.confirmation_record && (
                <div className="bg-emerald-50/80 p-5 rounded-2xl border border-emerald-200 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-emerald-900 uppercase tracking-wider">Hợp Đồng / Biên Bản Xác Nhận Điện Tử</span>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-emerald-200 text-emerald-900">
                      {reservation.confirmation_record.status}
                    </span>
                  </div>
                  <p className="text-sm font-extrabold text-slate-900">
                    Mã Hợp Đồng: <span className="font-mono text-teal-800">{reservation.confirmation_record.contract_code}</span>
                  </p>
                </div>
              )}
            </>
          ) : null}
        </div>

        {/* MODAL FOOTER */}
        <div className="p-5 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-sm rounded-xl transition"
          >
            Đóng
          </button>

          {reservation && reservation.status === 'PENDING' && (
            <button
              type="button"
              onClick={() => setConfirmModalOpen(true)}
              disabled={cancelling}
              className="px-5 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold text-sm rounded-xl shadow-md flex items-center gap-2 transition"
            >
              {cancelling ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Đang Hủy...
                </>
              ) : (
                <>
                  <Ban className="w-4 h-4" /> Hủy Yêu Cầu Thuê
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* CONFIRMATION MODAL */}
      <ConfirmModal
        isOpen={confirmModalOpen}
        onClose={() => setConfirmModalOpen(false)}
        onConfirm={executeCancelRequest}
        title="Hủy Yêu Cầu Thuê Bãi Xe"
        message="Bạn có chắc chắn muốn hủy yêu cầu thuê đỗ xe này không? Thao tác này không thể hoàn tác."
        confirmText="Đồng Ý Hủy"
        cancelText="Bỏ Qua"
        type="danger"
        loading={cancelling}
      />
    </div>
  );
};

export default ReservationDetailModal;
