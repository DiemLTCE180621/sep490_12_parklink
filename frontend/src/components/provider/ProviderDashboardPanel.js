import React, { useState, useEffect, useCallback } from 'react';
import { 
  Building2, MapPin, Edit3, X, Minus, Plus, Car, CheckCircle2, 
  AlertCircle, Lock, CircleDollarSign, Eye, EyeOff, Sparkles, Save
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import authService from '../../services/authService';
import providerService from '../../services/providerService';
import Toast from '../common/Toast';

const ProviderDashboardPanel = () => {
  const { user, refreshUser } = useAuth();
  const [isPaying, setIsPaying] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [toastInfo, setToastInfo] = useState({ message: '', type: 'success' });
  const [facilityStats, setFacilityStats] = useState(null);

  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    available_slots: 0,
    price_per_month: '',
    visibility_status: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Lấy dữ liệu cơ sở mới nhất kèm số chỗ trống & số hợp đồng
  const fetchFacilityData = useCallback(async () => {
    try {
      const res = await providerService.getMyFacility();
      if (res?.data?.facility) {
        setFacilityStats(res.data.facility);
      }
    } catch (err) {
      console.warn("Không thể tải thông tin bãi đỗ xe chi tiết:", err);
    }
  }, []);

  useEffect(() => {
    if (user?.facility) {
      fetchFacilityData();
    }
  }, [user?.facility, fetchFacilityData]);

  // Thông tin bãi xe hiển thị (ưu tiên dữ liệu chi tiết có stats)
  const currentFacility = facilityStats || user?.facility;
  const totalCapacity = currentFacility?.capacity || 0;
  const currentAvailableSlots = currentFacility?.available_slots !== undefined && currentFacility?.available_slots !== null
    ? currentFacility.available_slots
    : totalCapacity;
  const occupiedSlots = Math.max(0, totalCapacity - currentAvailableSlots);

  const handleOpenEdit = () => {
    setEditData({
      available_slots: currentAvailableSlots,
      price_per_month: currentFacility?.price_per_month || '',
      visibility_status: currentFacility?.visibility_status || 'VISIBLE'
    });
    setIsEditing(true);
  };

  const handleSlotStep = (delta) => {
    const current = parseInt(editData.available_slots, 10) || 0;
    const nextVal = Math.min(totalCapacity, Math.max(0, current + delta));
    setEditData((prev) => ({ ...prev, available_slots: nextVal }));
  };

  const handleQuickPreset = (slots) => {
    const val = Math.min(totalCapacity, Math.max(0, slots));
    setEditData((prev) => ({ ...prev, available_slots: val }));
  };

  const handlePriceQuickAdjust = (delta) => {
    const currentPrice = Number(editData.price_per_month) || 0;
    const nextPrice = Math.max(0, currentPrice + delta);
    setEditData((prev) => ({ ...prev, price_per_month: nextPrice }));
  };

  const handleUpdateFacility = async (e) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      const slotsNum = parseInt(editData.available_slots, 10);

      if (isNaN(slotsNum) || slotsNum < 0) {
        setToastInfo({ message: "Số chỗ trống hiện tại phải lớn hơn hoặc bằng 0!", type: 'error' });
        return;
      }

      if (slotsNum > totalCapacity) {
        setToastInfo({
          message: `Số chỗ trống (${slotsNum}) không thể vượt quá tổng sức chứa đăng ký (${totalCapacity} chỗ)!`,
          type: 'error'
        });
        return;
      }

      const res = await providerService.updateMyFacility({
        available_slots: slotsNum,
        price_per_month: Number(editData.price_per_month),
        visibility_status: editData.visibility_status
      });

      if (res?.data?.facility) {
        setFacilityStats(res.data.facility);
      }

      await refreshUser();
      await fetchFacilityData();

      setToastInfo({
        message: `Cập nhật thành công! Chỗ trống hiện tại: ${slotsNum}/${totalCapacity} chỗ.`,
        type: 'success'
      });
      setIsEditing(false);
    } catch (error) {
      const errorMsg = error.response?.data?.error || error.response?.data?.message || "Cập nhật bãi đỗ xe thất bại";
      setToastInfo({ message: errorMsg, type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    let intervalId;
    if (user?.facility?.verification_status === 'APPROVED' && user?.facility?.payment_status !== 'PAID') {
      intervalId = setInterval(async () => {
        try {
          const res = await authService.getCurrentUser();
          const latestFacility = res.data?.user?.facility;
          if (latestFacility && latestFacility.payment_status === 'PAID') {
            clearInterval(intervalId);
            setPaymentSuccess(true);
            await refreshUser();
            await fetchFacilityData();
            setTimeout(() => {
              setPaymentSuccess(false);
            }, 3000);
          }
        } catch (error) {
          console.error("Lỗi khi kiểm tra trạng thái thanh toán:", error);
        }
      }, 5000); // Polling mỗi 5 giây
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [user, refreshUser, fetchFacilityData]);

  const handleCheckPayment = async () => {
    try {
      setIsPaying(true);
      const res = await authService.getCurrentUser();
      const latestFacility = res.data?.user?.facility;
      
      if (latestFacility && latestFacility.payment_status === 'PAID') {
        setPaymentSuccess(true);
        setToastInfo({ message: "Thanh toán thành công! Bãi đỗ xe đã được kích hoạt.", type: 'success' });
        await refreshUser();
        await fetchFacilityData();
        setTimeout(() => {
          setPaymentSuccess(false);
        }, 3000);
      } else {
        setToastInfo({ message: "Hệ thống chưa nhận được thanh toán. Vui lòng đợi thêm hoặc kiểm tra lại.", type: 'error' });
      }
    } catch (err) {
      setToastInfo({ message: "Không thể kiểm tra trạng thái thanh toán.", type: 'error' });
    } finally {
      setIsPaying(false);
    }
  };

  if (!user?.facility) {
    return (
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-md text-center py-12">
        <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-slate-700">Chưa tìm thấy thông tin bãi đỗ xe</h3>
        <p className="text-sm text-slate-500 mt-1">Vui lòng đăng ký cơ sở bãi đỗ xe để bắt đầu quản lý.</p>
      </div>
    );
  }

  // Tỉ lệ chỗ trống hiện tại
  const slotPercent = totalCapacity > 0 ? Math.round((currentAvailableSlots / totalCapacity) * 100) : 0;
  const editSlotPercent = totalCapacity > 0 ? Math.round((Number(editData.available_slots || 0) / totalCapacity) * 100) : 0;
  const editOccupiedSlots = Math.max(0, totalCapacity - Number(editData.available_slots || 0));

  return (
    <div className="bg-white p-6 rounded-3xl border border-teal-100 shadow-md space-y-6">
      <div className="flex justify-between items-center border-b border-slate-100 pb-4">
        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <Building2 className="w-5 h-5 text-teal-600" /> Quản Lý Chỗ Trống & Cơ Sở (Facility)
        </h3>
        <div className="flex items-center gap-3">
          <button
            onClick={handleOpenEdit}
            className="px-4 py-2 bg-gradient-to-r from-teal-50 to-emerald-50 text-teal-700 hover:from-teal-100 hover:to-emerald-100 rounded-xl text-sm font-bold flex items-center gap-1.5 transition border border-teal-200/60 shadow-2xs"
          >
            <Edit3 className="w-4 h-4 text-teal-600" /> Cập nhật chỗ trống & giá
          </button>
          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
            currentFacility.verification_status === 'APPROVED' ? 'bg-green-100 text-green-700' :
            currentFacility.verification_status === 'REJECTED' ? 'bg-red-100 text-red-700' :
            'bg-orange-100 text-orange-700'
          }`}>
            {currentFacility.verification_status === 'APPROVED' ? 'Đã Duyệt' :
             currentFacility.verification_status === 'REJECTED' ? 'Bị Từ Chối' : 'Chờ Duyệt'}
          </span>
        </div>
      </div>

      <div className="space-y-4 text-sm">
        <div>
          <label className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Tên Bãi Đỗ Xe</label>
          <p className="text-lg font-black text-slate-900 mt-0.5">{currentFacility.name}</p>
        </div>

        <div>
          <label className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Địa chỉ chi tiết</label>
          <p className="text-slate-700 flex items-center gap-1.5 mt-0.5 font-medium">
            <MapPin className="w-4 h-4 text-teal-600 shrink-0" /> {currentFacility.address}
          </p>
        </div>

        {/* CÁC THẺ THỐNG KÊ SỨC CHỨA & CHỖ TRỐNG THỰC TẾ */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
          {/* Chỗ còn trống thực tế (Nổi bật nhất) */}
          <div className="p-4 bg-emerald-50 rounded-2xl border-2 border-emerald-200 shadow-sm relative overflow-hidden">
            <span className="text-xs text-emerald-800 font-bold flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Chỗ trống hiện tại
            </span>
            <div className="flex items-baseline gap-1.5 mt-1.5">
              <span className="text-3xl font-black text-emerald-950">{currentAvailableSlots}</span>
              <span className="text-sm font-bold text-emerald-700">/ {totalCapacity} chỗ</span>
            </div>
            <div className="w-full bg-emerald-200/60 h-1.5 rounded-full mt-2.5 overflow-hidden">
              <div 
                className="bg-emerald-600 h-full rounded-full transition-all duration-500" 
                style={{ width: `${slotPercent}%` }}
              />
            </div>
            <span className="text-[11px] text-emerald-700/90 font-medium mt-1 block">
              Sẵn sàng đón khách ({slotPercent}%)
            </span>
          </div>

          {/* Sức chứa tổng đăng ký */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
            <span className="text-xs text-slate-500 font-semibold flex items-center gap-1">
              <Lock className="w-3.5 h-3.5 text-slate-400" /> Sức chứa (Tổng)
            </span>
            <p className="text-2xl font-black text-slate-900 mt-1">{totalCapacity} slots</p>
            <span className="text-[11px] text-slate-400 font-medium">Gói đăng ký cố định</span>
          </div>

          {/* Chỗ đang có xe gửi (vãng lai / hợp đồng) */}
          <div className="p-4 bg-blue-50/70 rounded-2xl border border-blue-100">
            <span className="text-xs text-blue-700 font-semibold flex items-center gap-1">
              <Car className="w-3.5 h-3.5 text-blue-600" /> Đang có xe gửi
            </span>
            <p className="text-2xl font-black text-blue-900 mt-1">{occupiedSlots} xe</p>
            <span className="text-[11px] text-blue-600/80 font-medium">Khách gửi thực tế</span>
          </div>

          {/* Giá thuê tháng */}
          <div className="p-4 bg-teal-50 rounded-2xl border border-teal-100">
            <span className="text-xs text-teal-700 font-semibold">Giá thuê / tháng</span>
            <p className="text-xl font-black text-teal-900 mt-1 truncate">
              {Number(currentFacility.price_per_month).toLocaleString('vi-VN')}
            </p>
            <span className="text-[11px] text-teal-600/80 font-medium">VNĐ / tháng</span>
          </div>
        </div>
      </div>

      {currentFacility.verification_status === 'APPROVED' && currentFacility.payment_status === 'UNPAID' && (
        <div className="mt-6 p-6 border-2 border-dashed border-teal-200 rounded-3xl bg-teal-50 text-center space-y-4">
          <h4 className="font-bold text-teal-900 text-lg">Hoàn Tất Thanh Toán Phí Nền Tảng</h4>
          <p className="text-sm text-teal-800">Quét mã QR dưới đây bằng ứng dụng ngân hàng để thanh toán. Sau khi thanh toán, nhấn xác nhận để bãi đỗ xe của bạn được hiển thị công khai.</p>

          <div className="flex justify-center my-4">
            <img
              src={`https://img.vietqr.io/image/MB-881666787988-compact2.png?amount=${currentFacility.system_fee / 100}&addInfo=${encodeURIComponent('PARKLINK F' + currentFacility.id)}&accountName=PARKLINK`}
              alt="QR Code Thanh Toán"
              className="w-48 h-48 rounded-2xl shadow-lg border-2 border-white"
            />
          </div>

          <div className="flex flex-col sm:flex-row justify-center items-center gap-3 mt-4">
            <button
              disabled={isPaying}
              onClick={handleCheckPayment}
              className="px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl shadow-md transition disabled:opacity-50 w-full sm:w-auto"
            >
              {isPaying ? 'Đang xử lý...' : 'Kiểm tra thanh toán'}
            </button>
          </div>
        </div>
      )}

      {currentFacility.verification_status === 'APPROVED' && currentFacility.visibility_status === 'VISIBLE' && (
        <div className="mt-4 p-4 border border-green-200 rounded-2xl bg-green-50 flex items-center gap-3">
          <div>
            <h4 className="font-bold text-green-900">Đang Hoạt Động Công Khai</h4>
            <p className="text-xs text-green-800">Cơ sở của bạn đã được thanh toán và đang hiển thị trên nền tảng cho khách hàng tìm kiếm.</p>
          </div>
        </div>
      )}

      {currentFacility.verification_status === 'APPROVED' && currentFacility.payment_status === 'PAID' && currentFacility.visibility_status === 'HIDDEN' && (
        <div className="mt-4 p-4 border border-orange-200 rounded-2xl bg-orange-50 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
            <span className="text-xl">⏸️</span>
          </div>
          <div>
            <h4 className="font-bold text-orange-900">Đang Tạm Đóng Cửa (Ẩn)</h4>
            <p className="text-xs text-orange-800">Cơ sở của bạn đang được ẩn khỏi kết quả tìm kiếm của khách hàng.</p>
          </div>
        </div>
      )}

      {/* POPUP BỰ VUÔNG NGAY GIỮA */}
      {paymentSuccess && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm px-4 transition-opacity">
          <div className="bg-white p-10 max-w-md w-full text-center shadow-2xl transform transition-all scale-100 opacity-100" style={{ borderRadius: '16px' }}>
            <div className="w-24 h-24 bg-teal-50 rounded-xl flex items-center justify-center mx-auto mb-6 border-2 border-teal-100">
              <svg className="w-12 h-12 text-teal-600 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <h3 className="text-2xl font-black text-slate-900 mb-3 uppercase">Thanh Toán Thành Công!</h3>
            <p className="text-slate-600 font-medium mb-8 text-base">
              Bãi đỗ xe của bạn đã được kích hoạt và hiển thị công khai trên hệ thống ParkLink.
            </p>
            <div className="w-full bg-slate-100 h-2 mb-3 overflow-hidden rounded">
              <div
                className="bg-teal-500 h-2 rounded"
                style={{
                  width: '100%',
                  transition: 'width 3s linear'
                }}
              ></div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL CẬP NHẬT CHỖ TRỐNG & HOẠT ĐỘNG (PREMIUM REDESIGN) ── */}
      {isEditing && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 backdrop-blur-md px-4 py-6 transition-all duration-300">
          <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-100 overflow-hidden relative transform transition-all scale-100 opacity-100 max-h-[92vh] flex flex-col">
            {/* Thanh accent gradient trên cùng */}
            <div className="h-2 w-full bg-gradient-to-r from-teal-500 via-emerald-500 to-cyan-500 shrink-0" />

            <div className="p-6 sm:p-8 overflow-y-auto space-y-6">
              {/* Header Modal */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white flex items-center justify-center shadow-md shadow-teal-500/25 shrink-0">
                    <Edit3 className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                      Cập Nhật Chỗ Trống Cơ Sở
                    </h3>
                    <p className="text-slate-500 text-xs font-medium mt-0.5">
                      Điều chỉnh số chỗ trống thực tế đón khách và giá thuê
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setIsEditing(false)}
                  className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-transform active:scale-90 shrink-0"
                  title="Đóng"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Thẻ tóm tắt thông tin hiện tại (2 Card mini) */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl">
                  <div className="flex items-center justify-between text-[11px] text-slate-500 font-bold mb-1">
                    <span className="flex items-center gap-1">
                      <Lock className="w-3.5 h-3.5 text-slate-400" /> Sức chứa đăng ký
                    </span>
                    <span className="bg-slate-200/70 text-slate-600 px-1.5 py-0.2 rounded text-[10px]">Cố định</span>
                  </div>
                  <p className="text-xl font-black text-slate-900">{totalCapacity} <span className="text-xs font-semibold text-slate-500">slots</span></p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Theo gói phí dịch vụ đã duyệt</p>
                </div>

                <div className="p-3.5 bg-blue-50/60 border border-blue-100 rounded-2xl">
                  <div className="flex items-center justify-between text-[11px] text-blue-700 font-bold mb-1">
                    <span className="flex items-center gap-1">
                      <Car className="w-3.5 h-3.5 text-blue-500" /> Đang có xe đỗ
                    </span>
                    <span className="bg-blue-100 text-blue-800 px-1.5 py-0.2 rounded text-[10px]">Thực tế</span>
                  </div>
                  <p className="text-xl font-black text-blue-950">{editOccupiedSlots} <span className="text-xs font-semibold text-blue-700">xe</span></p>
                  <p className="text-[10px] text-blue-600/80 mt-0.5">Tính theo số chỗ trống đang nhập</p>
                </div>
              </div>

              <form onSubmit={handleUpdateFacility} className="space-y-6">
                {/* ── SECTION 1: BỘ ĐIỀU KHIỂN CHỖ TRỐNG KHẢ DỤNG ── */}
                <div className="bg-gradient-to-br from-teal-50/40 via-white to-emerald-50/30 p-5 sm:p-6 rounded-3xl border border-teal-200/90 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-teal-600" />
                        Số Chỗ Trống Khả Dụng <span className="text-red-500">*</span>
                      </label>
                      <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                        Số lượng chỗ sẵn sàng cho khách hàng trên ứng dụng đặt
                      </p>
                    </div>

                    <span className="text-xs font-black px-2.5 py-1 rounded-xl bg-teal-600 text-white shadow-xs">
                      {editSlotPercent}% trống
                    </span>
                  </div>

                  {/* Widget Stepper Số Chỗ Trống Lớn */}
                  <div className="flex items-center justify-between gap-4 bg-white p-3.5 rounded-2xl border-2 border-teal-100 shadow-2xs">
                    {/* Nút Giảm (-1) */}
                    <button
                      type="button"
                      onClick={() => handleSlotStep(-1)}
                      disabled={Number(editData.available_slots) <= 0}
                      className="w-14 h-14 rounded-2xl bg-slate-100 hover:bg-slate-200 active:scale-90 disabled:opacity-30 disabled:pointer-events-none text-slate-800 font-black flex items-center justify-center transition shadow-2xs shrink-0"
                      title="Có xe vào gửi (-1 chỗ trống)"
                    >
                      <Minus className="w-6 h-6" />
                    </button>

                    {/* Hiển thị số to ở giữa */}
                    <div className="flex-1 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <input
                          type="number"
                          required
                          min="0"
                          max={totalCapacity}
                          step="1"
                          className="w-24 text-4xl sm:text-5xl font-black text-teal-950 text-center bg-transparent focus:outline-none focus:ring-0 p-0"
                          value={editData.available_slots}
                          onChange={(e) => {
                            const val = e.target.value === '' ? '' : Number(e.target.value);
                            setEditData({ ...editData, available_slots: val });
                          }}
                        />
                      </div>
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mt-0.5">
                        / {totalCapacity} chỗ tối đa
                      </span>
                    </div>

                    {/* Nút Tăng (+1) */}
                    <button
                      type="button"
                      onClick={() => handleSlotStep(1)}
                      disabled={Number(editData.available_slots) >= totalCapacity}
                      className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 active:scale-90 disabled:opacity-30 disabled:pointer-events-none text-white font-black flex items-center justify-center transition shadow-md shadow-teal-600/30 shrink-0"
                      title="Có xe rời bãi (+1 chỗ trống)"
                    >
                      <Plus className="w-6 h-6" />
                    </button>
                  </div>

                  {/* Thanh tiến trình tỉ lệ */}
                  <div>
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden p-0.5 border border-slate-200/60">
                      <div
                        className="bg-gradient-to-r from-teal-500 to-emerald-500 h-full rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(100, Math.max(0, editSlotPercent))}%` }}
                      />
                    </div>
                  </div>

                  {/* Nút chọn nhanh (Quick Preset Chips) */}
                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-[11px] font-bold text-slate-400 shrink-0">Chọn nhanh:</span>
                    <button
                      type="button"
                      onClick={() => handleQuickPreset(0)}
                      className={`px-3 py-1 text-xs font-bold rounded-xl border transition ${
                        Number(editData.available_slots) === 0
                          ? 'bg-red-500 text-white border-red-500 shadow-2xs'
                          : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      Hết chỗ (0)
                    </button>
                    {totalCapacity > 2 && (
                      <button
                        type="button"
                        onClick={() => handleQuickPreset(Math.floor(totalCapacity / 2))}
                        className={`px-3 py-1 text-xs font-bold rounded-xl border transition ${
                          Number(editData.available_slots) === Math.floor(totalCapacity / 2)
                            ? 'bg-teal-600 text-white border-teal-600 shadow-2xs'
                            : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                        }`}
                      >
                        Nửa bãi ({Math.floor(totalCapacity / 2)})
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleQuickPreset(totalCapacity)}
                      className={`px-3 py-1 text-xs font-bold rounded-xl border transition ${
                        Number(editData.available_slots) === totalCapacity
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                          : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      Trống hoàn toàn ({totalCapacity})
                    </button>
                  </div>

                  <p className="text-[11px] text-slate-500 flex items-start gap-1.5 font-medium leading-relaxed pt-1 border-t border-teal-100/60">
                    <AlertCircle className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                    <span>
                      Khi có người ngoài vãng lai vào gửi xe, bạn bấm <strong className="text-slate-800">(-)</strong> để giảm chỗ. Khi xe rời đi, bấm <strong className="text-slate-800">(+)</strong> để khách trên hệ thống thấy đúng số lượng thực tế.
                    </span>
                  </p>
                </div>

                {/* ── SECTION 2: GIÁ THUÊ THEO THÁNG ── */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                      <CircleDollarSign className="w-4 h-4 text-teal-600" />
                      Giá Thuê Theo Tháng (VNĐ) <span className="text-red-500">*</span>
                    </label>
                    {editData.price_per_month !== '' && !isNaN(Number(editData.price_per_month)) && (
                      <span className="text-xs font-black text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-lg border border-teal-100">
                        {Number(editData.price_per_month).toLocaleString('vi-VN')} đ/tháng
                      </span>
                    )}
                  </div>

                  <div className="relative">
                    <input
                      type="number"
                      required
                      min="0"
                      step="50000"
                      className="w-full px-5 py-3.5 bg-slate-50 border-2 border-slate-200/80 rounded-2xl focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-500/10 focus:outline-none transition-all text-lg font-black text-slate-900"
                      placeholder="Ví dụ: 1500000"
                      value={editData.price_per_month}
                      onChange={(e) => setEditData({ ...editData, price_per_month: e.target.value })}
                    />
                    <span className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs pointer-events-none">
                      VNĐ / THÁNG
                    </span>
                  </div>

                  {/* Nút chỉnh nhanh giá */}
                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-[11px] font-bold text-slate-400">Điều chỉnh nhanh:</span>
                    <button
                      type="button"
                      onClick={() => handlePriceQuickAdjust(-100000)}
                      className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                    >
                      -100k
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePriceQuickAdjust(100000)}
                      className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 transition"
                    >
                      +100k
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePriceQuickAdjust(500000)}
                      className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 transition"
                    >
                      +500k
                    </button>
                  </div>
                </div>

                {/* ── SECTION 3: TRẠNG THÁI HOẠT ĐỘNG (INTERACTIVE CARDS) ── */}
                {currentFacility.payment_status === 'PAID' && (
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-800 block">
                      Trạng Thái Hoạt Động Của Bãi Xe
                    </label>

                    <div className="grid grid-cols-2 gap-3">
                      {/* Thẻ 1: Công khai */}
                      <div
                        onClick={() => setEditData({ ...editData, visibility_status: 'VISIBLE' })}
                        className={`cursor-pointer p-4 rounded-2xl border-2 transition-all flex items-start gap-3 ${
                          editData.visibility_status === 'VISIBLE'
                            ? 'bg-emerald-50/80 border-emerald-500 shadow-sm'
                            : 'bg-slate-50/60 border-slate-200 hover:bg-slate-100/70 opacity-75'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                          editData.visibility_status === 'VISIBLE' ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-500'
                        }`}>
                          <Eye className="w-4 h-4" />
                        </div>
                        <div>
                          <p className={`text-xs font-black ${editData.visibility_status === 'VISIBLE' ? 'text-emerald-950' : 'text-slate-800'}`}>
                            Đang Hoạt Động
                          </p>
                          <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                            Hiển thị công khai trên ParkLink
                          </p>
                        </div>
                      </div>

                      {/* Thẻ 2: Tạm ẩn */}
                      <div
                        onClick={() => setEditData({ ...editData, visibility_status: 'HIDDEN' })}
                        className={`cursor-pointer p-4 rounded-2xl border-2 transition-all flex items-start gap-3 ${
                          editData.visibility_status === 'HIDDEN'
                            ? 'bg-amber-50/80 border-amber-500 shadow-sm'
                            : 'bg-slate-50/60 border-slate-200 hover:bg-slate-100/70 opacity-75'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                          editData.visibility_status === 'HIDDEN' ? 'bg-amber-500 text-white' : 'bg-slate-200 text-slate-500'
                        }`}>
                          <EyeOff className="w-4 h-4" />
                        </div>
                        <div>
                          <p className={`text-xs font-black ${editData.visibility_status === 'HIDDEN' ? 'text-amber-950' : 'text-slate-800'}`}>
                            Tạm Đóng Cửa
                          </p>
                          <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                            Ẩn khỏi tìm kiếm của khách
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── FOOTER ACTIONS ── */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-6 py-3.5 text-slate-600 font-bold hover:bg-slate-100 rounded-2xl transition text-sm active:scale-95"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-8 py-3.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-black rounded-2xl shadow-lg shadow-teal-600/30 active:scale-95 transition disabled:opacity-50 text-sm flex items-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Đang lưu...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        <span>Lưu Thay Đổi</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {toastInfo.message && (
        <Toast
          message={toastInfo.message}
          type={toastInfo.type}
          onClose={() => setToastInfo({ message: '', type: 'success' })}
        />
      )}
    </div>
  );
};

export default ProviderDashboardPanel;
