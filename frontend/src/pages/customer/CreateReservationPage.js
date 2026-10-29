import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { sendReservationRequest } from '../../services/reservationService';
import facilityService from '../../services/facilityService';
import { getFacilitySupportedTypes } from '../../constants/vehicleTypes';
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
  ChevronRight,
  CreditCard,
  FileText,
  Clock
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
  const [customerIdCard, setCustomerIdCard] = useState(() => localStorage.getItem('customer_id_card') || '');
  const [customerAddress, setCustomerAddress] = useState(() => localStorage.getItem('customer_address') || '');
  const [vehicleBrand, setVehicleBrand] = useState('');
  const [licensePlate, setLicensePlate] = useState('');
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
      facilityService
        .getFacilityAvailability(facility.id)
        .then((availRes) => setAvailability(availRes.data || availRes))
        .catch((err) => console.warn('Could not fetch availability:', err));
    }
  }, [facilityId, facility, fetchFacilityData, availability]);

  const supportedVehicleTypes = getFacilitySupportedTypes(facility?.vehicle_types);

  const handleQuickPreset = (presetText) => {
    setVehicleBrand((prev) => {
      if (!prev) return presetText;
      if (prev.includes(presetText)) return prev;
      return `${prev} - ${presetText}`;
    });
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

    if (!customerIdCard?.trim()) {
      setFormError('Vui lòng nhập Số CMND hoặc Căn cước công dân (CCCD) của bạn.');
      return;
    }

    if (!customerAddress?.trim()) {
      setFormError('Vui lòng nhập Địa chỉ thường trú / liên hệ của bạn.');
      return;
    }

    if (!vehicleBrand?.trim() || vehicleBrand.trim().length < 2) {
      setFormError('Vui lòng nhập Hãng xe / Dòng xe (Ví dụ: Toyota Camry, Honda City...).');
      return;
    }

    if (!licensePlate?.trim() || licensePlate.trim().length < 3) {
      setFormError('Vui lòng nhập Biển kiểm soát / Biển số xe (Ví dụ: 65A-123.45).');
      return;
    }

    if (!desiredStartDate) {
      setFormError('Vui lòng chọn ngày mong muốn bắt đầu thuê bãi xe.');
      return;
    }

    const cleanBrand = vehicleBrand.trim();
    const cleanPlate = licensePlate.trim().toUpperCase();
    const cleanIdCard = customerIdCard.trim();
    const cleanAddress = customerAddress.trim();

    localStorage.setItem('customer_id_card', cleanIdCard);
    localStorage.setItem('customer_address', cleanAddress);

    const formattedVehicle = `${cleanBrand} - Biển số: ${cleanPlate}`;
    const fullVehicleInfo = `${formattedVehicle} [CCCD: ${cleanIdCard} | ĐC: ${cleanAddress}]`;

    try {
      setSubmitting(true);
      const response = await sendReservationRequest({
        facility_id: facility.id,
        vehicle_info: fullVehicleInfo,
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
    <div className="min-h-screen bg-slate-50 py-6 sm:py-8 px-4 sm:px-6 lg:px-8 w-full">
      <div className="w-full space-y-6">
        {/* TOP BAR: BREADCRUMB & BACK BUTTON */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <nav className="flex items-center gap-1.5 text-xs sm:text-sm text-slate-500">
            <Link to="/" className="hover:text-teal-700 transition">
              Trang chủ
            </Link>
            <ChevronRight className="w-4 h-4 text-slate-400" />
            <Link to="/search" className="hover:text-teal-700 transition">
              Tìm bãi đỗ
            </Link>
            {facility && (
              <>
                <ChevronRight className="w-4 h-4 text-slate-400" />
                <Link
                  to={`/facility/${facility.id}`}
                  className="hover:text-teal-700 transition truncate max-w-[240px]"
                >
                  {facility.name}
                </Link>
              </>
            )}
            <ChevronRight className="w-4 h-4 text-slate-400" />
            <span className="text-slate-900 font-semibold">Đăng ký thuê chỗ</span>
          </nav>

          <button
            type="button"
            onClick={() => {
              if (facility?.id) navigate(`/facility/${facility.id}`);
              else navigate(-1);
            }}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition"
          >
            <ArrowLeft className="w-4 h-4 text-slate-500" />
            Quay lại bãi xe
          </button>
        </div>

        {fetchingFacility ? (
          <div className="bg-white rounded-2xl p-16 text-center border border-slate-200 shadow-xs">
            <Loader2 className="w-8 h-8 animate-spin text-teal-600 mx-auto mb-3" />
            <p className="text-sm font-medium text-slate-600">Đang tải thông tin bãi đỗ xe...</p>
          </div>
        ) : facilityError ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-xs space-y-3">
            <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">Không tìm thấy thông tin bãi xe</h2>
            <p className="text-sm text-slate-600 max-w-md mx-auto">{facilityError}</p>
            <div className="pt-2">
              <Link
                to="/search"
                className="inline-flex items-center px-5 py-2.5 rounded-xl bg-teal-600 text-white font-semibold text-sm hover:bg-teal-700 transition"
              >
                Tìm bãi xe khác
              </Link>
            </div>
          </div>
        ) : createdReservation ? (
          /* SUCCESS SCREEN */
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm max-w-3xl mx-auto overflow-hidden">
            <div className="p-6 sm:p-8 border-b border-slate-100 flex items-start gap-4 bg-emerald-50/40">
              <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <span className="inline-block text-xs font-semibold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-md mb-1">
                  Gửi yêu cầu thành công
                </span>
                <h1 className="text-xl font-bold text-slate-900">
                  Đã gửi đăng ký thuê chỗ đỗ xe
                </h1>
                <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                  Yêu cầu của bạn đã được chuyển đến chủ bãi <strong className="text-slate-900">{facility?.name}</strong>. Sau khi chủ bãi phê duyệt và tạo hợp đồng, bạn sẽ nhận được thông báo để xác nhận trực tuyến.
                </p>
              </div>
            </div>

            <div className="p-6 sm:p-8 space-y-6">
              <div className="rounded-xl border border-slate-200 divide-y divide-slate-100 text-sm">
                <div className="flex justify-between py-3 px-4">
                  <span className="text-slate-500">Bãi đỗ xe</span>
                  <span className="font-semibold text-slate-900">{facility?.name}</span>
                </div>
                <div className="flex justify-between py-3 px-4">
                  <span className="text-slate-500">Phương tiện</span>
                  <span className="font-semibold text-slate-900">{vehicleBrand}</span>
                </div>
                <div className="flex justify-between py-3 px-4">
                  <span className="text-slate-500">Biển kiểm soát</span>
                  <span className="font-mono font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                    {licensePlate.toUpperCase()}
                  </span>
                </div>
                <div className="flex justify-between py-3 px-4">
                  <span className="text-slate-500">Số CCCD / CMND</span>
                  <span className="font-medium text-slate-900">{customerIdCard}</span>
                </div>
                <div className="flex justify-between py-3 px-4 gap-4">
                  <span className="text-slate-500 shrink-0">Địa chỉ liên hệ</span>
                  <span className="font-medium text-slate-900 text-right">{customerAddress}</span>
                </div>
                <div className="flex justify-between py-3 px-4">
                  <span className="text-slate-500">Ngày bắt đầu dự kiến</span>
                  <span className="font-semibold text-slate-900">
                    {new Date(desiredStartDate).toLocaleDateString('vi-VN')}
                  </span>
                </div>
                <div className="flex justify-between py-3.5 px-4 bg-slate-50/80 rounded-b-xl">
                  <span className="text-slate-700 font-medium">Giá thuê niêm yết</span>
                  <span className="font-bold text-teal-700 text-base">{monthlyPrice} VNĐ / tháng</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-end gap-3">
                <Link
                  to={`/facility/${facility?.id}`}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-sm text-center transition"
                >
                  Quay lại bãi xe
                </Link>
                <Link
                  to="/my-reservations"
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm text-center shadow-xs transition flex items-center justify-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  Xem yêu cầu của tôi
                </Link>
              </div>
            </div>
          </div>
        ) : (
          /* MAIN FORM LAYOUT */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* LEFT COLUMN: RESERVATION FORM */}
            <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              {/* CLEAN PAGE HEADER */}
              <div className="px-6 sm:px-8 py-6 border-b border-slate-200 bg-white">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
                      Đăng ký thuê chỗ đỗ xe theo tháng
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">
                      Vui lòng điền chính xác thông tin để chủ bãi thiết lập hợp đồng gửi giữ xe.
                    </p>
                  </div>
                </div>

                {/* SUBTLE 3-STEP FLOW BAR */}
                <div className="grid grid-cols-3 gap-2 mt-5 pt-4 border-t border-slate-100 text-xs">
                  <div className="flex items-center gap-2 text-teal-700 font-semibold">
                    <span className="w-5 h-5 rounded-full bg-teal-600 text-white text-[11px] font-bold flex items-center justify-center shrink-0">
                      1
                    </span>
                    <span className="truncate">Gửi thông tin đăng ký</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-500">
                    <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 text-[11px] font-semibold flex items-center justify-center shrink-0">
                      2
                    </span>
                    <span className="truncate">Chủ bãi duyệt & soạn HĐ</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-500">
                    <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 text-[11px] font-semibold flex items-center justify-center shrink-0">
                      3
                    </span>
                    <span className="truncate">Xác nhận HĐ & nhận chỗ</span>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="divide-y divide-slate-100">
                {formError && (
                  <div className="px-6 sm:px-8 pt-6">
                    <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-medium flex items-start gap-2.5">
                      <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                      <span>{formError}</span>
                    </div>
                  </div>
                )}

                {/* SECTION 1: CUSTOMER INFO */}
                <div className="p-6 sm:px-8 space-y-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-1 h-5 bg-teal-600 rounded-full" />
                    <h2 className="text-base font-bold text-slate-900">
                      Thông tin người đăng ký (Bên thuê)
                    </h2>
                  </div>

                  {/* ACCOUNT SUMMARY BAR */}
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-teal-600 text-white font-bold text-sm flex items-center justify-center shrink-0">
                        {user?.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">
                          {user?.full_name || 'Khách hàng'}
                        </p>
                        <p className="text-xs text-slate-500">Tài khoản đăng ký thuê</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs sm:text-sm text-slate-600">
                      <span className="inline-flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-teal-600" />
                        <span className="font-medium text-slate-800">
                          {user?.phone_number || 'Chưa cập nhật SĐT'}
                        </span>
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-teal-600" />
                        <span className="text-slate-700">{user?.email}</span>
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Số CCCD / CMND <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <CreditCard className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                        <input
                          type="text"
                          required
                          value={customerIdCard}
                          onChange={(e) => setCustomerIdCard(e.target.value)}
                          placeholder="Nhập 9 hoặc 12 chữ số"
                          className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Địa chỉ thường trú / liên hệ <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <MapPin className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                        <input
                          type="text"
                          required
                          value={customerAddress}
                          onChange={(e) => setCustomerAddress(e.target.value)}
                          placeholder="Số nhà, đường, phường/xã, tỉnh/thành..."
                          className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* SECTION 2: VEHICLE INFO */}
                <div className="p-6 sm:px-8 space-y-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-1 h-5 bg-teal-600 rounded-full" />
                    <h2 className="text-base font-bold text-slate-900">
                      Thông tin phương tiện gửi giữ
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Hãng xe / Dòng xe <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Car className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                        <input
                          type="text"
                          required
                          value={vehicleBrand}
                          onChange={(e) => setVehicleBrand(e.target.value)}
                          placeholder="VD: Toyota Camry, Mazda CX-5..."
                          className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition"
                        />
                      </div>

                      {supportedVehicleTypes && supportedVehicleTypes.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5 mt-2">
                          <span className="text-xs text-slate-400">Gợi ý loại xe:</span>
                          {supportedVehicleTypes.map((preset) => (
                            <button
                              key={preset.id}
                              type="button"
                              onClick={() => handleQuickPreset(preset.shortLabel || preset.label)}
                              className="px-2.5 py-1 bg-slate-50 hover:bg-teal-50 hover:text-teal-700 hover:border-teal-300 border border-slate-200 text-slate-600 rounded-lg text-xs font-medium transition"
                            >
                              + {preset.shortLabel || preset.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Biển kiểm soát (Biển số xe) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={licensePlate}
                        onChange={(e) => setLicensePlate(e.target.value.toUpperCase())}
                        placeholder="VD: 65A-123.45"
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-mono font-bold text-slate-900 tracking-wider uppercase placeholder:font-sans placeholder:font-normal placeholder:tracking-normal placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition"
                      />
                      <p className="text-[11px] text-slate-400 mt-1.5">
                        Biển số dùng để đối chiếu xe ra vào bãi và ghi nhận trên hợp đồng.
                      </p>
                    </div>
                  </div>
                </div>

                {/* SECTION 3: START DATE */}
                <div className="p-6 sm:px-8 space-y-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-1 h-5 bg-teal-600 rounded-full" />
                    <h2 className="text-base font-bold text-slate-900">
                      Thời gian bắt đầu gửi xe
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Ngày bắt đầu nhận chỗ <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Calendar className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                        <input
                          type="date"
                          required
                          min={minDate}
                          value={desiredStartDate}
                          onChange={(e) => setDesiredStartDate(e.target.value)}
                          className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition"
                        />
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600 space-y-1.5">
                      <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                        <Clock className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                        Lưu ý về kỳ hạn thuê
                      </div>
                      <p className="leading-relaxed text-slate-500">
                        Hợp đồng gửi giữ xe tính theo tháng kể từ ngày bắt đầu. Bạn có thể kiểm tra chi tiết các điều khoản trước khi xác nhận hợp đồng điện tử.
                      </p>
                    </div>
                  </div>
                </div>

                {/* FOOTER ACTIONS */}
                <div className="px-6 sm:px-8 py-4 bg-slate-50/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <ShieldCheck className="w-4 h-4 text-teal-600 shrink-0" />
                    <span>Thông tin được bảo mật và chỉ sử dụng để lập hợp đồng gửi giữ xe.</span>
                  </div>

                  <div className="flex items-center justify-end gap-3 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        if (facility?.id) navigate(`/facility/${facility.id}`);
                        else navigate(-1);
                      }}
                      disabled={submitting}
                      className="px-5 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm transition"
                    >
                      Hủy bỏ
                    </button>

                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-semibold text-sm shadow-xs transition flex items-center gap-2"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Đang gửi...
                        </>
                      ) : (
                        'Gửi yêu cầu thuê'
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </div>

            {/* RIGHT COLUMN: FACILITY SUMMARY SIDEBAR */}
            <div className="lg:col-span-4 lg:sticky lg:top-6">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="p-3 pb-0">
                  <div className="h-52 rounded-xl bg-slate-100 relative overflow-hidden border border-slate-200/60">
                    {primaryImage ? (
                      <img
                        src={primaryImage}
                        alt={facility?.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                        <Building2 className="w-10 h-10 mb-1.5" />
                        <span className="text-xs font-medium">Chưa có hình ảnh bãi xe</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent pointer-events-none" />

                    {availability && (
                      <span
                        className={`absolute bottom-3 right-3 px-2.5 py-1 rounded-lg text-xs font-semibold shadow-xs ${
                          availability.available_slots > 0
                            ? 'bg-emerald-600 text-white'
                            : 'bg-red-600 text-white'
                        }`}
                      >
                        {availability.available_slots > 0
                          ? `Còn ${availability.available_slots} chỗ trống`
                          : 'Hết chỗ trống'}
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-5 space-y-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 leading-snug">
                      {facility?.name}
                    </h3>
                    <p className="text-xs text-slate-500 flex items-start gap-1.5 mt-1.5 leading-relaxed">
                      <MapPin className="w-3.5 h-3.5 text-teal-600 shrink-0 mt-0.5" />
                      <span>{facility?.address}</span>
                    </p>
                  </div>

                  {/* PRICE BOX */}
                  <div className="p-4 rounded-xl bg-teal-50/60 border border-teal-200/70 flex items-baseline justify-between">
                    <span className="text-xs font-semibold text-slate-600">
                      Giá thuê theo tháng
                    </span>
                    <div className="text-right">
                      <span className="text-xl font-bold text-teal-800">{monthlyPrice}</span>
                      <span className="text-xs text-slate-500 ml-1">VNĐ/tháng</span>
                    </div>
                  </div>

                  {/* FACILITY METADATA */}
                  <div className="space-y-2.5 pt-1 text-xs">
                    <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                      <span className="text-slate-500 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        Chủ bãi xe
                      </span>
                      <span className="font-semibold text-slate-800">{providerName}</span>
                    </div>

                    {facility?.provider?.phone_number && (
                      <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                        <span className="text-slate-500 flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          Điện thoại
                        </span>
                        <span className="font-semibold text-slate-800">
                          {facility.provider.phone_number}
                        </span>
                      </div>
                    )}

                    {facility?.total_slots && (
                      <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                        <span className="text-slate-500 flex items-center gap-1.5">
                          <Car className="w-3.5 h-3.5 text-slate-400" />
                          Tổng quy mô
                        </span>
                        <span className="font-semibold text-slate-800">
                          {facility.total_slots} chỗ đỗ
                        </span>
                      </div>
                    )}
                  </div>

                  {/* AMENITIES */}
                  {facility?.facility_amenities && facility.facility_amenities.length > 0 && (
                    <div className="space-y-2 pt-1">
                      <span className="text-xs font-semibold text-slate-700 block">
                        Tiện ích tại bãi
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {facility.facility_amenities.map((fa) => (
                          <span
                            key={fa.amenity?.id || fa.id}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200/80 text-slate-700 text-xs"
                          >
                            <CheckCircle2 className="w-3 h-3 text-teal-600 shrink-0" />
                            {fa.amenity?.name || 'Tiện ích'}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
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
