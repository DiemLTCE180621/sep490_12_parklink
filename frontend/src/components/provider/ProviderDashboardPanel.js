import React, { useState, useEffect, useCallback } from 'react';
import { 
  Building2, MapPin, Edit3, X, Minus, Plus, Car, CheckCircle2, 
  AlertCircle, Lock, CircleDollarSign, Eye, EyeOff, Sparkles, Save,
  RefreshCw, Clock, Image as ImageIcon
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
  const [loading, setLoading] = useState(false);
  const [selectedImagePreview, setSelectedImagePreview] = useState(null);

  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    available_slots: 0,
    price_per_month: '',
    visibility_status: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Lấy dữ liệu cơ sở mới nhất kèm số chỗ trống & số hợp đồng & danh sách ảnh
  const fetchFacilityData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await providerService.getMyFacility();
      if (res?.data?.facility) {
        setFacilityStats(res.data.facility);
      }
    } catch (err) {
      console.warn("Không thể tải thông tin bãi đỗ xe chi tiết:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user?.facility) {
      fetchFacilityData();
    }
  }, [user?.facility, fetchFacilityData]);

  // Thông tin bãi xe hiển thị (ưu tiên dữ liệu chi tiết có stats và images)
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
      <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-md text-center py-16">
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

  const facilityImages = currentFacility.images || [];

  return (
    <div className="space-y-6">
      <Toast message={toastInfo.message} type={toastInfo.type} onClose={() => setToastInfo({ message: '', type: 'success' })} />

      {/* ── PANEL HEADER (ĐỒNG BỘ VỚI CÁC TAB PROVIDER KHÁC) ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-md">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-teal-600" /> Thông Tin Cơ Sở & Quản Lý Chỗ Trống
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Theo dõi tình trạng hoạt động, sức chứa bãi xe, số chỗ trống thực tế và giá thuê theo tháng.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Badge trạng thái duyệt */}
          <span className={`px-3 py-1.5 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 border ${
            currentFacility.verification_status === 'APPROVED' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
            currentFacility.verification_status === 'REJECTED' ? 'bg-rose-50 text-rose-800 border-rose-200' :
            'bg-amber-50 text-amber-800 border-amber-200'
          }`}>
            <Clock className="w-3.5 h-3.5" />
            {currentFacility.verification_status === 'APPROVED' ? 'Đã Phê Duyệt' :
             currentFacility.verification_status === 'REJECTED' ? 'Bị Từ Chối' : 'Chờ Phê Duyệt'}
          </span>

          {/* Nút cập nhật chỗ trống */}
          <button
            onClick={handleOpenEdit}
            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-sm"
          >
            <Edit3 className="w-3.5 h-3.5" /> Cập nhật chỗ trống & giá
          </button>

          {/* Nút làm mới */}
          <button
            onClick={fetchFacilityData}
            disabled={loading}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-slate-200"
            title="Tải lại dữ liệu bãi xe"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Làm mới
          </button>
        </div>
      </div>

      {/* ── KPI STATS OVERVIEW CARDS (4 CARDS ĐỒNG BỘ) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Chỗ trống hiện tại */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
            <span>Chỗ trống hiện tại</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5 mt-2">
            <span className="text-2xl font-black text-emerald-950">{currentAvailableSlots}</span>
            <span className="text-xs font-bold text-emerald-700">/ {totalCapacity} chỗ</span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2.5 overflow-hidden">
            <div
              className="bg-emerald-600 h-full rounded-full transition-all duration-300"
              style={{ width: `${slotPercent}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-400 mt-1.5 font-medium">Sẵn sàng đón khách ({slotPercent}%)</p>
        </div>

        {/* Card 2: Đang gửi xe */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
            <span>Đang gửi xe</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Car className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-blue-950 mt-2">{occupiedSlots} <span className="text-xs font-semibold text-blue-700">xe</span></div>
          <p className="text-[11px] text-slate-400 mt-1.5 font-medium">Khách gửi thực tế</p>
        </div>

        {/* Card 3: Sức chứa đăng ký */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
            <span>Sức chứa đăng ký</span>
            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
              <Lock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">{totalCapacity} <span className="text-xs font-semibold text-slate-500">slots</span></div>
          <p className="text-[11px] text-slate-400 mt-1.5 font-medium">Gói đăng ký cố định</p>
        </div>

        {/* Card 4: Giá thuê tháng */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
            <span>Giá thuê niêm yết</span>
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
              <CircleDollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black text-teal-900 mt-2 truncate">
            {Number(currentFacility.price_per_month).toLocaleString('vi-VN')} <span className="text-xs font-semibold text-teal-700">đ/tháng</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1.5 font-medium">Áp dụng cho khách thuê mới</p>
        </div>
      </div>

      {/* ── THÔNG TIN CHI TIẾT CƠ SỞ & BỘ SƯU TẬP HÌNH ẢNH ── */}
      <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-100 shadow-md space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-teal-600" /> Chi Tiết Cơ Sở Bãi Xe
          </h3>
          <div className="flex items-center gap-2">
            {currentFacility.visibility_status === 'VISIBLE' ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                <Eye className="w-3.5 h-3.5" /> Đang hoạt động công khai
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                <EyeOff className="w-3.5 h-3.5" /> Tạm đóng cửa (Ẩn)
              </span>
            )}
          </div>
        </div>

        {/* Thông tin tên bãi và địa chỉ */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="space-y-1">
            <span className="text-slate-400 font-semibold uppercase tracking-wider">Tên bãi đỗ xe</span>
            <p className="text-base font-bold text-slate-900">{currentFacility.name}</p>
          </div>
          <div className="space-y-1">
            <span className="text-slate-400 font-semibold uppercase tracking-wider">Địa chỉ cơ sở</span>
            <p className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-teal-600 shrink-0" /> {currentFacility.address}
            </p>
          </div>
        </div>

        {/* ── PHẦN HÌNH ẢNH BÃI ĐỖ XE DÀNH CHO PROVIDER XEM ── */}
        <div className="border-t border-slate-100 pt-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-slate-700 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
              <ImageIcon className="w-4 h-4 text-teal-600" />
              Hình Ảnh Bãi Đỗ Xe {facilityImages.length > 0 ? `(${facilityImages.length})` : ''}
            </span>
            {facilityImages.length > 0 && (
              <span className="text-[11px] text-slate-400">
                Nhấp vào ảnh để phóng to
              </span>
            )}
          </div>

          {facilityImages.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
              {facilityImages.map((img, idx) => (
                <div
                  key={img.id || idx}
                  onClick={() => setSelectedImagePreview(img.image_url)}
                  className="group relative aspect-video rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 cursor-pointer shadow-xs hover:shadow-md transition duration-200"
                >
                  <img
                    src={img.image_url}
                    alt={`Bãi xe ${idx + 1}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />
                  <div className="absolute inset-0 bg-slate-950/25 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                    <span className="p-1.5 bg-white/90 rounded-lg text-slate-800 shadow-sm">
                      <Eye className="w-3.5 h-3.5" />
                    </span>
                  </div>
                  {img.is_primary && (
                    <span className="absolute top-2 left-2 bg-teal-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-sm">
                      Ảnh chính
                    </span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-center">
              <Building2 className="w-8 h-8 text-slate-300 mx-auto mb-1.5" />
              <p className="text-xs text-slate-500 font-medium">Chưa có hình ảnh nào được tải lên cho cơ sở này</p>
            </div>
          )}
        </div>

        {/* Thanh toán phí kích hoạt nếu chưa thanh toán */}
        {currentFacility.verification_status === 'APPROVED' && currentFacility.payment_status === 'UNPAID' && (
          <div className="mt-4 p-6 border-2 border-dashed border-teal-200 rounded-2xl bg-teal-50 text-center space-y-4">
            <h4 className="font-bold text-teal-900 text-base">Hoàn Tất Thanh Toán Phí Nền Tảng</h4>
            <p className="text-xs text-teal-800 max-w-lg mx-auto">
              Quét mã QR dưới đây bằng ứng dụng ngân hàng để thanh toán. Sau khi thanh toán, nhấn xác nhận để bãi đỗ xe của bạn được hiển thị công khai.
            </p>

            <div className="flex justify-center my-3">
              <img
                src={`https://img.vietqr.io/image/MB-881666787988-compact2.png?amount=${currentFacility.system_fee / 100}&addInfo=${encodeURIComponent('PARKLINK F' + currentFacility.id)}&accountName=PARKLINK`}
                alt="QR Code Thanh Toán"
                className="w-44 h-44 rounded-2xl shadow-md border-2 border-white"
              />
            </div>

            <div className="flex justify-center">
              <button
                disabled={isPaying}
                onClick={handleCheckPayment}
                className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-md transition disabled:opacity-50"
              >
                {isPaying ? 'Đang xử lý...' : 'Kiểm tra thanh toán'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── MODAL PHÓNG TO HÌNH ẢNH (LIGHTBOX) ── */}
      {selectedImagePreview && (
        <div
          className="fixed inset-0 z-[120] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setSelectedImagePreview(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] bg-white rounded-3xl p-3 shadow-2xl overflow-hidden animate-scaleUp"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedImagePreview(null)}
              className="absolute top-4 right-4 w-9 h-9 rounded-full bg-slate-900/70 hover:bg-slate-900 text-white flex items-center justify-center transition z-10"
              title="Đóng ảnh"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={selectedImagePreview}
              alt="Xem ảnh bãi xe"
              className="max-h-[82vh] w-auto max-w-full rounded-2xl object-contain mx-auto"
            />
          </div>
        </div>
      )}

      {/* POPUP THANH TOÁN THÀNH CÔNG */}
      {paymentSuccess && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm px-4 transition-opacity">
          <div className="bg-white p-8 max-w-md w-full text-center shadow-2xl rounded-3xl border border-slate-100">
            <div className="w-20 h-20 bg-teal-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-teal-200">
              <CheckCircle2 className="w-10 h-10 text-teal-600 animate-bounce" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Thanh Toán Thành Công!</h3>
            <p className="text-slate-600 text-xs mb-6">
              Bãi đỗ xe của bạn đã được kích hoạt và hiển thị công khai trên hệ thống ParkLink.
            </p>
            <div className="w-full bg-slate-100 h-1.5 overflow-hidden rounded-full">
              <div className="bg-teal-500 h-full rounded-full w-full transition-all duration-1000"></div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL CẬP NHẬT CHỖ TRỐNG & GIÁ THUÊ (KÉO RỘNG NGANG MAX-W-3XL & CHIA 2 CỘT CÂN ĐỐI) ── */}
      {isEditing && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl border border-slate-100 p-6 sm:p-8 space-y-6 animate-scaleUp">
            {/* Header Modal */}
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 border border-teal-100 flex items-center justify-center shrink-0">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Cập Nhật Chỗ Trống & Giá Thuê Cơ Sở
                  </h3>
                  <p className="text-slate-500 text-xs mt-0.5">
                    Điều chỉnh số chỗ trống thực tế đón khách và giá thuê hàng tháng
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsEditing(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition shrink-0"
                title="Đóng"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form chia 2 cột ngang rộng rãi */}
            <form onSubmit={handleUpdateFacility} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
                {/* ── CỘT TRÁI: ĐIỀU KHIỂN CHỖ TRỐNG KHẢ DỤNG ── */}
                <div className="space-y-4">
                  {/* 2 Card mini tóm tắt */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-xs">
                      <div className="flex items-center justify-between text-slate-500 font-bold mb-1">
                        <span className="flex items-center gap-1">
                          <Lock className="w-3 h-3 text-slate-400" /> Sức chứa
                        </span>
                        <span className="bg-slate-200/70 text-slate-600 px-1.5 py-0.5 rounded text-[10px]">Cố định</span>
                      </div>
                      <p className="text-lg font-black text-slate-900">{totalCapacity} <span className="text-xs font-semibold text-slate-500">slots</span></p>
                    </div>

                    <div className="p-3 bg-blue-50/60 border border-blue-100 rounded-xl text-xs">
                      <div className="flex items-center justify-between text-blue-700 font-bold mb-1">
                        <span className="flex items-center gap-1">
                          <Car className="w-3 h-3 text-blue-500" /> Có xe đỗ
                        </span>
                        <span className="bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded text-[10px]">Thực tế</span>
                      </div>
                      <p className="text-lg font-black text-blue-950">{editOccupiedSlots} <span className="text-xs font-semibold text-blue-700">xe</span></p>
                    </div>
                  </div>

                  {/* Hộp Stepper Số Chỗ Trống */}
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-800 flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                        Số Chỗ Trống Khả Dụng <span className="text-red-500">*</span>
                      </label>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-lg bg-teal-100 text-teal-800 border border-teal-200">
                        {editSlotPercent}% trống
                      </span>
                    </div>

                    {/* Stepper điều khiển */}
                    <div className="flex items-center justify-between gap-3 bg-white p-2.5 rounded-xl border border-slate-200">
                      <button
                        type="button"
                        onClick={() => handleSlotStep(-1)}
                        disabled={Number(editData.available_slots) <= 0}
                        className="w-11 h-11 rounded-lg bg-slate-100 hover:bg-slate-200 active:scale-95 disabled:opacity-30 disabled:pointer-events-none text-slate-800 font-bold flex items-center justify-center transition shrink-0"
                        title="Giảm 1 chỗ trống (có xe vào gửi)"
                      >
                        <Minus className="w-4 h-4" />
                      </button>

                      <div className="flex-1 text-center">
                        <input
                          type="number"
                          required
                          min="0"
                          max={totalCapacity}
                          step="1"
                          className="w-24 text-3xl font-black text-teal-900 text-center bg-transparent focus:outline-none p-0"
                          value={editData.available_slots}
                          onChange={(e) => {
                            const val = e.target.value === '' ? '' : Number(e.target.value);
                            setEditData({ ...editData, available_slots: val });
                          }}
                        />
                        <span className="text-[11px] font-semibold text-slate-400 block mt-0.5">
                          / {totalCapacity} chỗ tối đa
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleSlotStep(1)}
                        disabled={Number(editData.available_slots) >= totalCapacity}
                        className="w-11 h-11 rounded-lg bg-teal-600 hover:bg-teal-700 active:scale-95 disabled:opacity-30 disabled:pointer-events-none text-white font-bold flex items-center justify-center transition shrink-0 shadow-sm"
                        title="Tăng 1 chỗ trống (có xe rời bãi)"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Thanh tiến trình */}
                    <div className="w-full bg-slate-200/70 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-teal-600 h-full rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(100, Math.max(0, editSlotPercent))}%` }}
                      />
                    </div>

                    {/* Nút chọn nhanh */}
                    <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                      <span className="text-[11px] text-slate-400 font-medium">Chọn nhanh:</span>
                      <button
                        type="button"
                        onClick={() => handleQuickPreset(0)}
                        className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition ${
                          Number(editData.available_slots) === 0
                            ? 'bg-rose-50 text-rose-700 border-rose-300 font-bold'
                            : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        Hết chỗ (0)
                      </button>
                      {totalCapacity > 2 && (
                        <button
                          type="button"
                          onClick={() => handleQuickPreset(Math.floor(totalCapacity / 2))}
                          className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition ${
                            Number(editData.available_slots) === Math.floor(totalCapacity / 2)
                              ? 'bg-teal-50 text-teal-800 border-teal-300 font-bold'
                              : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          Nửa bãi ({Math.floor(totalCapacity / 2)})
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleQuickPreset(totalCapacity)}
                        className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition ${
                          Number(editData.available_slots) === totalCapacity
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300 font-bold'
                            : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        Trống hoàn toàn ({totalCapacity})
                      </button>
                    </div>

                    <p className="text-[11px] text-slate-500 flex items-start gap-1 font-medium pt-1 border-t border-slate-200/60">
                      <AlertCircle className="w-3.5 h-3.5 text-teal-600 shrink-0 mt-0.5" />
                      <span>Bấm <strong>(-)</strong> khi có xe vãng lai vào gửi, bấm <strong>(+)</strong> khi xe rời bãi để khách thấy đúng số chỗ.</span>
                    </p>
                  </div>
                </div>

                {/* ── CỘT PHẢI: GIÁ THUÊ & TRẠNG THÁI HOẠT ĐỘNG ── */}
                <div className="space-y-4">
                  {/* GIÁ THUÊ THEO THÁNG */}
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                    <div className="flex justify-between items-center text-xs">
                      <label className="font-bold text-slate-800 flex items-center gap-1">
                        <CircleDollarSign className="w-3.5 h-3.5 text-teal-600" />
                        Giá Thuê Theo Tháng (VNĐ) <span className="text-red-500">*</span>
                      </label>
                      {editData.price_per_month !== '' && !isNaN(Number(editData.price_per_month)) && (
                        <span className="font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-100">
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
                        className="w-full px-3.5 py-2.5 text-sm font-bold border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                        placeholder="Ví dụ: 1500000"
                        value={editData.price_per_month}
                        onChange={(e) => setEditData({ ...editData, price_per_month: e.target.value })}
                      />
                      <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-[10px] pointer-events-none">
                        VNĐ / THÁNG
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 pt-0.5">
                      <span className="text-[11px] text-slate-400 font-medium">Điều chỉnh nhanh:</span>
                      <button
                        type="button"
                        onClick={() => handlePriceQuickAdjust(-100000)}
                        className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition border border-slate-200"
                      >
                        -100k
                      </button>
                      <button
                        type="button"
                        onClick={() => handlePriceQuickAdjust(100000)}
                        className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 transition border border-teal-200"
                      >
                        +100k
                      </button>
                      <button
                        type="button"
                        onClick={() => handlePriceQuickAdjust(500000)}
                        className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 transition border border-teal-200"
                      >
                        +500k
                      </button>
                    </div>
                  </div>

                  {/* TRẠNG THÁI HOẠT ĐỘNG CỦA BÃI XE */}
                  {currentFacility.payment_status === 'PAID' && (
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2.5">
                      <label className="text-xs font-bold text-slate-800 block">
                        Trạng Thái Hoạt Động Của Bãi Xe
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div
                          onClick={() => setEditData({ ...editData, visibility_status: 'VISIBLE' })}
                          className={`cursor-pointer p-3 rounded-xl border-2 transition flex items-center gap-2.5 ${
                            editData.visibility_status === 'VISIBLE'
                              ? 'bg-emerald-50 border-emerald-500 text-emerald-950 shadow-xs'
                              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                            editData.visibility_status === 'VISIBLE' ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-500'
                          }`}>
                            <Eye className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-xs font-bold">Đang Hoạt Động</p>
                            <p className="text-[10px] text-slate-500">Hiển thị tìm kiếm</p>
                          </div>
                        </div>

                        <div
                          onClick={() => setEditData({ ...editData, visibility_status: 'HIDDEN' })}
                          className={`cursor-pointer p-3 rounded-xl border-2 transition flex items-center gap-2.5 ${
                            editData.visibility_status === 'HIDDEN'
                              ? 'bg-amber-50 border-amber-500 text-amber-950 shadow-xs'
                              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                            editData.visibility_status === 'HIDDEN' ? 'bg-amber-500 text-white' : 'bg-slate-200 text-slate-500'
                          }`}>
                            <EyeOff className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-xs font-bold">Tạm Đóng Cửa</p>
                            <p className="text-[10px] text-slate-500">Ẩn khỏi tìm kiếm</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* ── FOOTER ACTIONS ── */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-5 py-2.5 text-slate-600 font-bold hover:bg-slate-100 rounded-xl transition text-xs"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl shadow-md transition disabled:opacity-50 text-xs flex items-center gap-1.5"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Đang lưu...
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      Lưu Thay Đổi
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProviderDashboardPanel;
