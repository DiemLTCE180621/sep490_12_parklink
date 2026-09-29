import React, { useState } from 'react';
import { sendReservationRequest } from '../services/reservationService';
import { useAuth } from '../context/AuthContext';
import { X, Calendar, Car, AlertCircle, CheckCircle2, MapPin, Building2, ShieldCheck, Loader2, User, Phone, Mail } from 'lucide-react';

const SendReservationModal = ({ facility, isOpen, onClose, onSuccess }) => {
  const { user } = useAuth();
  const [vehicleInfo, setVehicleInfo] = useState('');
  const [desiredStartDate, setDesiredStartDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  if (!isOpen || !facility) return null;

  // Tính ngày tối thiểu là ngày hôm nay
  const minDate = new Date().toISOString().split('T')[0];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!vehicleInfo.trim() || vehicleInfo.trim().length < 3) {
      setError('Vui lòng nhập thông tin xe (Tên dòng xe + Biển số) từ 3 ký tự trở lên.');
      return;
    }

    if (!desiredStartDate) {
      setError('Vui lòng chọn ngày mong muốn bắt đầu thuê.');
      return;
    }

    try {
      setLoading(true);
      const response = await sendReservationRequest({
        facility_id: facility.id,
        vehicle_info: vehicleInfo.trim(),
        desired_start_date: desiredStartDate
      });

      setSuccessMsg(response.message || 'Gửi yêu cầu thuê bãi đỗ xe thành công!');
      setTimeout(() => {
        if (onSuccess) onSuccess(response.data?.reservation);
      }, 1500);
    } catch (err) {
      setError(err.message || 'Không thể gửi yêu cầu thuê. Vui lòng thử lại!');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickPreset = (presetText) => {
    setVehicleInfo(prev => prev ? `${prev} - ${presetText}` : presetText);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div 
        className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-xl overflow-hidden transform transition-all duration-300 scale-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* MODAL HEADER */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-teal-950 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition text-slate-300 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3 mb-2">
            <span className="px-3 py-1 rounded-full bg-teal-500/20 border border-teal-400/30 text-teal-300 text-xs font-bold uppercase tracking-wider">
              Thuê Theo Tháng
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Gửi Yêu Cầu Thuê Bãi Đỗ Xe</h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            Gửi yêu cầu tới chủ bãi để xác nhận giữ chỗ đỗ xe hàng tháng tại Ninh Kiều, Cần Thơ
          </p>
        </div>

        {/* FACILITY SUMMARY CARD */}
        <div className="p-6 bg-slate-50/80 border-b border-slate-100 flex items-start gap-4">
          <div className="w-20 h-20 rounded-2xl bg-slate-200 overflow-hidden shrink-0 border border-slate-200 shadow-inner">
            {facility.images && facility.images.length > 0 ? (
              <img 
                src={facility.images.find(img => img.is_primary)?.image_url || facility.images[0].image_url} 
                alt={facility.name} 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-teal-100 text-teal-700">
                <Building2 className="w-8 h-8" />
              </div>
            )}
          </div>

          <div className="space-y-1.5 flex-1 min-w-0">
            <h3 className="font-bold text-slate-900 text-base truncate">{facility.name}</h3>
            <p className="text-xs text-slate-600 flex items-center gap-1.5 truncate">
              <MapPin className="w-3.5 h-3.5 text-teal-600 shrink-0" /> {facility.address}
            </p>
            <div className="flex items-center justify-between pt-1">
              <span className="text-xs font-semibold text-slate-500">Giá niêm yết:</span>
              <span className="text-base font-extrabold text-teal-700">
                {Number(facility.price_per_month).toLocaleString('vi-VN')} VNĐ/tháng
              </span>
            </div>
          </div>
        </div>

        {/* MODAL FORM */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* ALERT MESSAGES */}
          {error && (
            <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm font-medium flex items-start gap-3 animate-shake">
              <AlertCircle className="w-5 h-5 shrink-0 text-red-600 mt-0.5" />
              <div className="flex-1">{error}</div>
            </div>
          )}

          {successMsg && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-medium flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600 mt-0.5" />
              <div className="flex-1">{successMsg}</div>
            </div>
          )}

          {/* USER INFO DISPLAY CARD */}
          {user && (
            <div className="p-3.5 bg-teal-50/60 border border-teal-100 rounded-2xl flex items-center justify-between text-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-teal-600 text-white font-bold flex items-center justify-center text-sm shrink-0 shadow-sm">
                  {user.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{user.full_name || 'Khách hàng'}</span>
                    <span className="text-[10px] bg-teal-100 text-teal-800 px-2 py-0.5 rounded-md font-semibold">
                      Tài khoản của bạn
                    </span>
                  </div>
                  <p className="text-slate-500 flex items-center gap-3 mt-0.5">
                    <span> {user.phone_number || 'Chưa cập nhật SĐT'}</span>
                    <span> {user.email}</span>
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* INPUT 1: VEHICLE INFO */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Thông tin xe đỗ <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Car className="w-5 h-5 absolute left-3.5 top-3.5 text-slate-400" />
              <input
                type="text"
                required
                value={vehicleInfo}
                onChange={(e) => setVehicleInfo(e.target.value)}
                placeholder="Ví dụ: Toyota Camry - Biển số 65A-123.45 (Xe 5 chỗ)"
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition"
              />
            </div>
            
            {/* Quick Preset Badges */}
            <div className="mt-2.5 flex flex-wrap items-center gap-1.5 text-xs">
              <span className="text-slate-400 font-medium">Gợi ý loại xe:</span>
              <button
                type="button"
                onClick={() => handleQuickPreset('Xe 4 chỗ')}
                className="px-2.5 py-1 bg-slate-100 hover:bg-teal-50 hover:text-teal-700 text-slate-600 rounded-lg transition font-medium"
              >
                + Xe 4 chỗ
              </button>
              <button
                type="button"
                onClick={() => handleQuickPreset('Xe 7 chỗ')}
                className="px-2.5 py-1 bg-slate-100 hover:bg-teal-50 hover:text-teal-700 text-slate-600 rounded-lg transition font-medium"
              >
                + Xe 7 chỗ
              </button>
              <button
                type="button"
                onClick={() => handleQuickPreset('SUV / Bán tải')}
                className="px-2.5 py-1 bg-slate-100 hover:bg-teal-50 hover:text-teal-700 text-slate-600 rounded-lg transition font-medium"
              >
                + SUV / Bán tải
              </button>
            </div>
          </div>

          {/* INPUT 2: DESIRED START DATE */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Ngày mong muốn bắt đầu thuê <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Calendar className="w-5 h-5 absolute left-3.5 top-3.5 text-slate-400" />
              <input
                type="date"
                required
                min={minDate}
                value={desiredStartDate}
                onChange={(e) => setDesiredStartDate(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition"
              />
            </div>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-600 inline" /> Hợp đồng thuê sẽ được tính bắt đầu từ ngày này sau khi chủ bãi xác nhận.
            </p>
          </div>

          {/* BUTTON ACTIONS */}
          <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition"
            >
              Hủy Bỏ
            </button>

            <button
              type="submit"
              disabled={loading || !!successMsg}
              className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-sm font-bold rounded-xl shadow-md flex items-center gap-2 transition"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Đang Gửi Yêu Cầu...
                </>
              ) : successMsg ? (
                <>
                  <CheckCircle2 className="w-4 h-4" /> Đã Gửi Thành Công!
                </>
              ) : (
                'Xác Nhận Gửi Yêu Cầu'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SendReservationModal;
