import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { sendReservationRequest } from '../../services/reservationService';
import facilityService from '../../services/facilityService';
import {
  ArrowLeft,
  Calendar,
  Car,
  AlertCircle,
  CheckCircle2,
  MapPin,
  Building2,
  ShieldCheck,
  Loader2,
  User,
  Phone,
  Mail,
  Clock,
  ChevronRight,
  Info,
  Sparkles,
  FileText,
  BadgeCheck,
  Check
} from 'lucide-react';

const CreateReservationPage = () => {
  const { facilityId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  // Facility data
  const [facility, setFacility] = useState(location.state?.facility || null);
  const [availability, setAvailability] = useState(null);
  const [fetchingFacility, setFetchingFacility] = useState(!location.state?.facility);
  const [facilityError, setFacilityError] = useState(null);

  // Form states
  const [vehicleInfo, setVehicleInfo] = useState('');
  const [desiredStartDate, setDesiredStartDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);
  const [createdReservation, setCreatedReservation] = useState(null);

  // Min date is today
  const minDate = new Date().toISOString().split('T')[0];

  // Fetch facility if not passed in location.state
  const fetchFacilityData = useCallback(async () => {
    const idToFetch = facilityId || location.state?.facility?.id;
    if (!idToFetch) return;

    try {
      setFetchingFacility(true);
      setFacilityError(null);
      const res = await facilityService.getFacilityById(idToFetch);
      const facData = res.data?.facility || res.facility || res.data || res;
      setFacility(facData);

      // Also try fetching availability
      try {
        const availRes = await facilityService.getFacilityAvailability(idToFetch);
        setAvailability(availRes.data || availRes);
      } catch (availErr) {
        console.warn('Could not fetch availability:', availErr);
      }
    } catch (err) {
      console.error('Error fetching facility details:', err);
      setFacilityError(err.message || 'Không thể tải thông tin bãi đỗ xe.');
    } finally {
      setFetchingFacility(false);
    }
  }, [facilityId, location.state]);

  useEffect(() => {
    if (!facility && facilityId) {
      fetchFacilityData();
    } else if (facility?.id && !availability) {
      facilityService.getFacilityAvailability(facility.id)
        .then(availRes => setAvailability(availRes.data || availRes))
        .catch(err => console.warn('Could not fetch availability:', err));
    }
  }, [facilityId, facility, fetchFacilityData, availability]);

  const handleQuickPreset = (presetText) => {
    setVehicleInfo((prev) => (prev ? `${prev} - ${presetText}` : presetText));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);

    if (!facility) {
      setFormError('Không có thông tin bãi đỗ xe để tạo yêu cầu.');
      return;
    }

    if (user?.role?.name === 'PROVIDER') {
      setFormError('Tài khoản Chủ bãi xe không thể gửi yêu cầu thuê! Vui lòng dùng tài khoản Khách hàng.');
      return;
    }

    if (availability && availability.available_slots <= 0) {
      setFormError('Rất tiếc, bãi xe này hiện tại đã hết chỗ trống!');
      return;
    }

    if (!vehicleInfo.trim() || vehicleInfo.trim().length < 3) {
      setFormError('Vui lòng nhập rõ thông tin xe (Loại xe & Biển số xe) từ 3 ký tự trở lên.');
      return;
    }

    if (!desiredStartDate) {
      setFormError('Vui lòng chọn ngày mong muốn bắt đầu thuê bãi xe.');
      return;
    }

    try {
      setSubmitting(true);
      const response = await sendReservationRequest({
        facility_id: facility.id,
        vehicle_info: vehicleInfo.trim(),
        desired_start_date: desiredStartDate
      });

      const resData = response.data?.reservation || response.reservation || { id: 'NEW' };
      setCreatedReservation(resData);
    } catch (err) {
      console.error('Error creating reservation:', err);
      setFormError(err.message || 'Không thể gửi yêu cầu thuê bãi xe. Vui lòng thử lại!');
    } finally {
      setSubmitting(false);
    }
  };

  const primaryImage =
    facility?.images?.find((img) => img.is_primary)?.image_url ||
    facility?.images?.[0]?.image_url ||
    null;

  const monthlyPrice = facility?.price_per_month
    ? Number(facility.price_per_month).toLocaleString('vi-VN')
    : '0';

  const providerName =
    facility?.provider?.full_name || facility?.provider?.name || 'Chủ cơ sở bãi xe';

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* TOP BREADCRUMB & BACK ACTION */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <nav className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <Link to="/" className="hover:text-teal-700 transition">
              Trang Chủ
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <Link to="/facilities" className="hover:text-teal-700 transition">
              Bãi Đỗ Xe
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            {facility ? (
              <Link to={`/facility/${facility.id}`} className="hover:text-teal-700 transition truncate max-w-[180px]">
                {facility.name}
              </Link>
            ) : (
              <span>Chi Tiết</span>
            )}
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-teal-800 font-bold">Gửi Yêu Cầu Thuê</span>
          </nav>

          <button
            type="button"
            onClick={() => {
              if (facility?.id) navigate(`/facility/${facility.id}`);
              else navigate(-1);
            }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-bold hover:bg-slate-100 hover:text-slate-900 shadow-2xs transition self-start"
          >
            <ArrowLeft className="w-4 h-4 text-slate-500" /> Quay Lại Bãi Xe
          </button>
        </div>

        {fetchingFacility ? (
          <div className="bg-white rounded-3xl p-16 text-center border border-slate-200 shadow-sm space-y-4">
            <Loader2 className="w-10 h-10 animate-spin text-teal-600 mx-auto" />
            <p className="text-sm font-semibold text-slate-600">Đang tải thông tin cơ sở bãi xe...</p>
          </div>
        ) : facilityError ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-red-200 shadow-sm space-y-4">
            <div className="w-14 h-14 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Không tìm thấy thông tin bãi xe</h2>
            <p className="text-sm text-slate-600 max-w-md mx-auto">{facilityError}</p>
            <Link
              to="/facilities"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-teal-600 text-white font-bold text-sm shadow hover:bg-teal-700 transition"
            >
              Xem danh sách bãi xe khác
            </Link>
          </div>
        ) : createdReservation ? (
          /* SUCCESS SCREEN */
          <div className="bg-white rounded-3xl border border-emerald-200 shadow-xl overflow-hidden animate-fadeIn">
            <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-slate-900 p-8 sm:p-10 text-white text-center">
              <div className="w-16 h-16 rounded-3xl bg-white/10 backdrop-blur-md border border-white/20 text-emerald-300 flex items-center justify-center mx-auto mb-4 shadow-inner">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-black uppercase tracking-wider">
                Yêu cầu đã được gửi thành công
              </span>
              <h1 className="text-2xl sm:text-3xl font-black mt-3">
                Gửi Yêu Cầu Thuê Chỗ Đỗ Thành Công!
              </h1>
              <p className="text-xs sm:text-sm text-slate-200 mt-2 max-w-xl mx-auto">
                Yêu cầu thuê bãi xe hàng tháng của bạn đã được chuyển tới chủ cơ sở{' '}
                <strong className="text-white">{facility?.name}</strong>. Chủ bãi sẽ xem xét và thiết lập hợp đồng dịch vụ gửi giữ.
              </p>
            </div>

            <div className="p-6 sm:p-10 max-w-2xl mx-auto space-y-6">
              {/* SUMMARY INFO BOX */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3 text-xs sm:text-sm">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 font-bold text-slate-800">
                  <span>Cơ sở bãi đỗ xe:</span>
                  <span className="text-teal-900">{facility?.name}</span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 text-slate-700">
                  <span>Thông tin phương tiện:</span>
                  <span className="font-bold text-slate-900 font-mono">{vehicleInfo}</span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 text-slate-700">
                  <span>Ngày mong muốn bắt đầu:</span>
                  <span className="font-bold text-slate-900">
                    {new Date(desiredStartDate).toLocaleDateString('vi-VN')}
                  </span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 text-slate-700">
                  <span>Giá thuê niêm yết:</span>
                  <span className="font-black text-teal-700">{monthlyPrice} VNĐ / tháng</span>
                </div>
                <div className="flex items-center justify-between text-slate-700">
                  <span>Trạng thái:</span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                    <Clock className="w-3.5 h-3.5" /> Chờ Chủ Bãi Duyệt & Tạo Hợp Đồng
                  </span>
                </div>
              </div>

              {/* NEXT STEPS GUIDE */}
              <div className="p-4 rounded-2xl bg-teal-50/70 border border-teal-200/80 text-teal-900 text-xs sm:text-sm space-y-2">
                <div className="flex items-center gap-2 font-bold text-teal-950">
                  <Info className="w-4 h-4 text-teal-600 shrink-0" /> Các bước tiếp theo:
                </div>
                <ol className="list-decimal list-inside space-y-1 text-slate-700 text-xs pl-1">
                  <li>Chủ bãi đỗ xe nhận thông báo và xác nhận giữ chỗ cho phương tiện của bạn.</li>
                  <li>Chủ bãi sẽ thiết lập hợp đồng điện tử (Điều 1 - Điều 6 bám sát quy định pháp luật).</li>
                  <li>Bạn sẽ nhận thông báo để vào kiểm tra và ký số hợp đồng điện tử trực tuyến.</li>
                </ol>
              </div>

              {/* ACTION BUTTONS */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <Link
                  to="/my-reservations"
                  className="w-full sm:w-auto px-6 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-sm text-center shadow-md transition flex items-center justify-center gap-2"
                >
                  <FileText className="w-4 h-4" /> Xem Danh Sách Yêu Cầu Của Tôi
                </Link>
                <Link
                  to={`/facility/${facility?.id}`}
                  className="w-full sm:w-auto px-5 py-3 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-sm text-center transition"
                >
                  Quay Lại Trang Bãi Xe
                </Link>
              </div>
            </div>
          </div>
        ) : (
          /* MAIN FORM CANVAS */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* LEFT COLUMN: THE RESERVATION FORM */}
            <div className="lg:col-span-7 xl:col-span-8 bg-white rounded-3xl border border-slate-200/90 shadow-md overflow-hidden">
              {/* HERO HEADER */}
              <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-teal-950 p-6 sm:p-8 text-white">
                <div className="flex items-center gap-2 mb-2.5">
                  <span className="px-3 py-1 rounded-full bg-teal-500/20 border border-teal-400/30 text-teal-300 text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-teal-400" /> Thuê Chỗ Đỗ Theo Tháng
                  </span>
                </div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight">
                  Gửi Yêu Cầu Thuê Bãi Đỗ Xe
                </h1>
                <p className="text-xs sm:text-sm text-slate-300 mt-1.5 leading-relaxed">
                  Gửi yêu cầu tới chủ cơ sở bãi xe để xác nhận vị trí đỗ và tiến hành khởi tạo hợp đồng dịch vụ gửi giữ phương tiện điện tử.
                </p>
              </div>

              {/* FORM CONTAINER */}
              <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
                {formError && (
                  <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm font-semibold flex items-start gap-3 shadow-2xs animate-shake">
                    <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                    <div className="flex-1">{formError}</div>
                  </div>
                )}

                {/* USER PROFILE CARD */}
                <div className="p-4 sm:p-5 bg-teal-50/50 border border-teal-100 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-teal-100/70">
                    <span className="text-xs font-black uppercase text-teal-900 tracking-wider flex items-center gap-1.5">
                      <User className="w-4 h-4 text-teal-700" /> Thông Tin Người Thuê (Bên B)
                    </span>
                    <span className="text-[11px] bg-teal-100 text-teal-800 font-extrabold px-2.5 py-0.5 rounded-full">
                      Tài khoản của bạn
                    </span>
                  </div>

                  <div className="flex items-start gap-3.5">
                    <div className="w-11 h-11 rounded-2xl bg-teal-600 text-white font-black text-base flex items-center justify-center shrink-0 shadow-xs">
                      {user?.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-black text-slate-900">
                          {user?.full_name || 'Khách hàng'}
                        </span>
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          <BadgeCheck className="w-3.5 h-3.5 text-emerald-600" /> Đã xác thực
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-xs text-slate-600">
                        <p className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{user?.phone_number || 'Chưa cập nhật số điện thoại'}</span>
                        </p>
                        <p className="flex items-center gap-1.5 truncate">
                          <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{user?.email}</span>
                        </p>
                      </div>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-500 pt-1 border-t border-teal-100/60">
                    Thông tin liên hệ này sẽ được tự động sử dụng trong bản thảo Hợp đồng dịch vụ gửi giữ xe ô tô với Bên A.
                  </p>
                </div>

                {/* VEHICLE INFO INPUT */}
                <div className="bg-slate-50/70 p-5 rounded-2xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                      Thông Tin Phương Tiện Đăng Ký Gửi Giữ <span className="text-red-500">*</span>
                    </label>
                    <span className="text-[11px] font-bold text-teal-700">Điều 1 trong Hợp đồng</span>
                  </div>

                  <div className="relative">
                    <Car className="w-5 h-5 absolute left-3.5 top-3.5 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={vehicleInfo}
                      onChange={(e) => setVehicleInfo(e.target.value)}
                      placeholder="Ví dụ: Toyota Camry - Biển số 65A-123.45 (Xe 5 chỗ)"
                      className="w-full pl-11 pr-4 py-3 bg-white border border-slate-300 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-teal-600 transition shadow-2xs"
                    />
                  </div>

                  {/* PRESET CHIPS */}
                  <div className="flex flex-wrap items-center gap-1.5 text-xs pt-1">
                    <span className="text-slate-400 font-semibold">Gợi ý nhanh:</span>
                    <button
                      type="button"
                      onClick={() => handleQuickPreset('Xe 4 chỗ')}
                      className="px-2.5 py-1 bg-white hover:bg-teal-50 hover:text-teal-700 hover:border-teal-300 border border-slate-200 text-slate-600 rounded-lg transition font-semibold shadow-2xs"
                    >
                      + Xe 4 chỗ
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickPreset('Xe 7 chỗ')}
                      className="px-2.5 py-1 bg-white hover:bg-teal-50 hover:text-teal-700 hover:border-teal-300 border border-slate-200 text-slate-600 rounded-lg transition font-semibold shadow-2xs"
                    >
                      + Xe 7 chỗ
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickPreset('SUV / Bán tải')}
                      className="px-2.5 py-1 bg-white hover:bg-teal-50 hover:text-teal-700 hover:border-teal-300 border border-slate-200 text-slate-600 rounded-lg transition font-semibold shadow-2xs"
                    >
                      + SUV / Bán tải
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickPreset('Xe điện (EV)')}
                      className="px-2.5 py-1 bg-white hover:bg-teal-50 hover:text-teal-700 hover:border-teal-300 border border-slate-200 text-slate-600 rounded-lg transition font-semibold shadow-2xs"
                    >
                      + Xe điện (EV)
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Vui lòng nhập rõ dòng xe và biển kiểm soát xe để chủ bãi nắm thông tin phân luồng và soạn thảo vào hợp đồng.
                  </p>
                </div>

                {/* DESIRED START DATE */}
                <div className="bg-slate-50/70 p-5 rounded-2xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                      Ngày Mong Muốn Bắt Đầu Thuê <span className="text-red-500">*</span>
                    </label>
                    <span className="text-[11px] font-bold text-teal-700">Điều 2 trong Hợp đồng</span>
                  </div>

                  <div className="relative">
                    <Calendar className="w-5 h-5 absolute left-3.5 top-3.5 text-slate-400" />
                    <input
                      type="date"
                      required
                      min={minDate}
                      value={desiredStartDate}
                      onChange={(e) => setDesiredStartDate(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 bg-white border border-slate-300 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-teal-600 transition shadow-2xs"
                    />
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-slate-200/80 text-xs text-slate-600 space-y-1">
                    <p className="flex items-center gap-1.5 font-bold text-teal-800">
                      <ShieldCheck className="w-4 h-4 text-teal-600 shrink-0" />
                      Quy định thời hạn và tính phí:
                    </p>
                    <p>
                      • Hợp đồng thuê sẽ được tính bắt đầu từ ngày này sau khi chủ bãi xác nhận và hai bên hoàn tất ký số.
                    </p>
                    <p>
                      • Định kỳ thanh toán phí gửi xe thỏa thuận: từ ngày 01 đến ngày 05 hoặc ngày 10 của mỗi tháng.
                    </p>
                  </div>
                </div>

                {/* PROCESS TIMELINE INFO */}
                <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/70 text-xs space-y-2">
                  <div className="flex items-center gap-2 font-bold text-amber-950">
                    <Clock className="w-4 h-4 text-amber-700 shrink-0" /> Quy trình tiếp nhận & ký hợp đồng:
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-[11px] text-slate-700">
                    <div className="p-2.5 rounded-lg bg-white border border-amber-200/50">
                      <span className="font-bold text-amber-800 block">1. Gửi Yêu Cầu</span>
                      Bạn gửi thông tin xe & ngày nhận chỗ.
                    </div>
                    <div className="p-2.5 rounded-lg bg-white border border-amber-200/50">
                      <span className="font-bold text-amber-800 block">2. Soạn Hợp Đồng</span>
                      Chủ bãi duyệt và tạo hợp đồng điện tử.
                    </div>
                    <div className="p-2.5 rounded-lg bg-white border border-amber-200/50">
                      <span className="font-bold text-amber-800 block">3. Ký & Nhận Chỗ</span>
                      Ký hợp đồng trực tuyến và đỗ xe an toàn.
                    </div>
                  </div>
                </div>

                {/* FORM ACTIONS */}
                <div className="pt-4 flex flex-col sm:flex-row items-center justify-end gap-3 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => {
                      if (facility?.id) navigate(`/facility/${facility.id}`);
                      else navigate(-1);
                    }}
                    disabled={submitting}
                    className="w-full sm:w-auto px-6 py-3 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs uppercase tracking-wider transition"
                  >
                    Hủy Bỏ
                  </button>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-extrabold text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Đang Gửi Yêu Cầu...
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" /> Xác Nhận Gửi Yêu Cầu Thuê
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* RIGHT COLUMN: STICKY FACILITY SUMMARY CARD */}
            <div className="lg:col-span-5 xl:col-span-4 lg:sticky lg:top-8 space-y-5">
              <div className="bg-white rounded-3xl border border-slate-200 shadow-md overflow-hidden">
                {/* FACILITY IMAGE */}
                <div className="h-48 sm:h-56 bg-slate-200 relative overflow-hidden">
                  {primaryImage ? (
                    <img
                      src={primaryImage}
                      alt={facility?.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-teal-50 text-teal-700">
                      <Building2 className="w-12 h-12 mb-2" />
                      <span className="text-xs font-semibold">Chưa có ảnh cơ sở</span>
                    </div>
                  )}
                  <div className="absolute top-3 left-3">
                    <span className="px-2.5 py-1 rounded-lg bg-slate-900/80 backdrop-blur-md text-white text-[11px] font-bold">
                      Cơ sở bãi đỗ xe
                    </span>
                  </div>
                  {availability && (
                    <div className="absolute bottom-3 right-3">
                      <span
                        className={`px-3 py-1 rounded-lg text-xs font-black shadow-md ${
                          availability.available_slots > 0
                            ? 'bg-emerald-600 text-white'
                            : 'bg-red-600 text-white'
                        }`}
                      >
                        {availability.available_slots > 0
                          ? `Còn ${availability.available_slots} chỗ trống`
                          : 'Hết chỗ trống'}
                      </span>
                    </div>
                  )}
                </div>

                {/* FACILITY DETAIL BODY */}
                <div className="p-6 space-y-4">
                  <div>
                    <h2 className="text-lg font-black text-slate-900 leading-snug">
                      {facility?.name}
                    </h2>
                    <p className="text-xs text-slate-600 flex items-start gap-1.5 mt-1.5">
                      <MapPin className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                      <span>{facility?.address}</span>
                    </p>
                  </div>

                  {/* PRICE HIGHLIGHT */}
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-teal-50 to-emerald-50 border border-teal-100 flex items-center justify-between">
                    <div>
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                        Giá thuê niêm yết
                      </span>
                      <strong className="text-xl sm:text-2xl font-black text-teal-800">
                        {monthlyPrice}
                        <span className="text-xs font-medium text-slate-500 ml-1">VNĐ/tháng</span>
                      </strong>
                    </div>
                    <span className="text-[10px] uppercase font-extrabold px-2 py-1 rounded bg-teal-100 text-teal-800 border border-teal-200">
                      Gửi giữ cố định
                    </span>
                  </div>

                  {/* PROVIDER CONTACT */}
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
                    <div className="flex items-center justify-between text-slate-600">
                      <span>Đại diện bên A:</span>
                      <strong className="text-slate-900">{providerName}</strong>
                    </div>
                    {facility?.provider?.phone_number && (
                      <div className="flex items-center justify-between text-slate-600">
                        <span>Số điện thoại:</span>
                        <span className="font-semibold text-slate-800">
                          {facility.provider.phone_number}
                        </span>
                      </div>
                    )}
                    {facility?.total_slots && (
                      <div className="flex items-center justify-between text-slate-600">
                        <span>Tổng quy mô bãi:</span>
                        <span className="font-semibold text-slate-800">
                          {facility.total_slots} ô đỗ xe
                        </span>
                      </div>
                    )}
                  </div>

                  {/* AMENITIES */}
                  {facility?.facility_amenities && facility.facility_amenities.length > 0 && (
                    <div className="space-y-2 pt-1 border-t border-slate-100">
                      <span className="text-xs font-bold text-slate-700 block">
                        Tiện ích & Hệ thống an ninh:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {facility.facility_amenities.map((fa) => (
                          <span
                            key={fa.amenity?.id || fa.id}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-[11px] font-medium"
                          >
                            <CheckCircle2 className="w-3 h-3 text-teal-600" />
                            {fa.amenity?.name || 'Tiện ích'}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* GUARANTEE BADGE */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-500 flex items-start gap-2">
                    <ShieldCheck className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                    <span>
                      Hợp đồng gửi giữ điện tử được bảo đảm tính pháp lý theo Bộ luật Dân sự 2015 & Luật Giao dịch điện tử.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreateReservationPage;
