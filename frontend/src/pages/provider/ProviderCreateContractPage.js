import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { getReservationDetail } from '../../services/reservationService';
import { createConfirmationRecord } from '../../services/confirmationRecordService';
import { useAuth } from '../../context/AuthContext';
import Toast from '../../components/common/Toast';
import {
  FileText,
  Calendar,
  Building2,
  Car,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Info,
  ArrowLeft,
  ChevronRight,
  User,
  Phone,
  Mail,
  MapPin,
  Clock,
  Eye
} from 'lucide-react';

const ProviderCreateContractPage = () => {
  const { id, reservationId } = useParams();
  const targetId = id || reservationId;
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const [reservation, setReservation] = useState(location.state?.reservation || null);
  const [loadingReservation, setLoadingReservation] = useState(!location.state?.reservation);
  const [reservationError, setReservationError] = useState(null);

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);
  const [toastInfo, setToastInfo] = useState({ message: '', type: 'success' });

  const defaultTerms = useMemo(
    () => ({
      owner_obligations:
        '- Yêu cầu bên gửi trả tiền dịch vụ trông giữ xe theo thỏa thuận.\n- Được chấm dứt hợp đồng trước thời hạn, nhưng phải báo trước cho bên B ít nhất 15 ngày.\n- Bảo quản xe ô tô theo đúng thỏa thuận, trả lại xe ô tô cho bên gửi theo đúng tình trạng như khi nhận giữ.\n- Chỉ được thay đổi cách bảo quản xe ô tô nếu việc thay đổi là cần thiết nhằm bảo quản tốt hơn xe ô tô đó, nhưng phải báo ngay cho bên gửi biết về việc thay đổi.\n- Thông báo kịp thời cho bên gửi biết về nguy cơ hư hỏng, tiêu hủy xe ô tô do tính chất của xe ô tô đó và yêu cầu bên gửi cho biết cách giải quyết trong một thời hạn; nếu hết thời hạn đó mà bên gửi không trả lời thì bên giữ có quyền thực hiện các biện pháp cần thiết để bảo quản và yêu cầu bên gửi thanh toán chi phí.\n- Quá thời gian thanh toán, bên A có quyền thu hồi vị trí gửi xe và yêu cầu bên B trả phí giữ xe.\n- Phải bồi thường thiệt hại, nếu làm mất, hư hỏng xe ô tô gửi giữ, trừ trường hợp bất khả kháng.\n- Bảo quản cẩn thận xe gửi giữ, không được sử dụng xe trong thời gian bảo quản.',
      customer_obligations:
        '- Được chấm dứt hợp đồng trước thời hạn, nhưng phải báo trước cho bên A ít nhất 15 ngày.\n- Yêu cầu bồi thường thiệt hại, nếu bên giữ làm mất, hư hỏng xe ô tô gửi giữ, trừ trường hợp bất khả kháng.\n- Phải trả đủ tiền dịch vụ trông giữ xe đúng thời hạn và đúng phương thức đã thỏa thuận. Trường hợp đóng tiền trễ so với thời gian quy định hợp đồng quá 3 lần/năm thì mặc định thanh lý hợp đồng trước thời hạn và khách hàng phải nộp tiền nợ (nếu có).\n- Trả phí giữ xe khi hết hạn hợp đồng mà không kịp thời nhận lại xe đã gửi.\n- Bên B tự bảo quản chìa khoá xe, thẻ xe, tài sản, tư trang trong xe ô tô.\n- Thực hiện theo đúng nội quy của bãi đậu xe.',
      termination_conditions:
        '- Hợp đồng này có hiệu lực từ ngày bắt đầu đến ngày kết thúc thỏa thuận. Hợp đồng đương nhiên được thanh lý khi hai bên hoàn thành toàn bộ các nghĩa vụ theo nội dung Hợp đồng và hai bên không có nhu cầu thỏa thuận gia hạn hợp đồng.\n- Mỗi bên có quyền chấm dứt hợp đồng trước thời hạn nhưng phải báo trước cho bên kia ít nhất 15 ngày.\n- Hợp đồng này được lập dưới dạng hợp đồng điện tử có giá trị pháp lý theo quy định của Luật Giao dịch điện tử và Bộ luật Dân sự 2015 nước CHXHCN Việt Nam; mỗi bên lưu giữ một bản có giá trị như nhau để thực hiện.',
      dispute_resolution:
        '- Hai bên cần chủ động thông báo cho nhau biết tình hình thực hiện hợp đồng, nếu có gì bất lợi phát sinh, các bên phải kịp thời thông báo cho nhau biết và tích cực giải quyết trên cơ sở thương lượng, bình đẳng, có lợi (có lập biên bản).\n- Trường hợp các bên không tự giải quyết được mới đưa việc tranh chấp ra Tòa án giải quyết.'
    }),
    []
  );

  const [formData, setFormData] = useState({
    agreed_price: '',
    payment_deadline_day: 5,
    start_date: '',
    end_date: '',
    parking_spot: 'Chỗ đỗ tự do trong bãi',
    vehicle_type: '',
    license_plate: '',
    customer_address: '',
    customer_id_card: '',
    ...defaultTerms
  });

  const [activeTermsTab, setActiveTermsTab] = useState('customer'); // customer | owner | termination | dispute

  // Helper safety parsers
  const parseCleanNumber = (val) => {
    if (val === null || val === undefined) return 0;
    const cleanStr = String(val).replace(/[^0-9.]/g, '');
    return parseFloat(cleanStr) || 0;
  };

  // Fetch reservation if not passed or needed
  const fetchReservation = useCallback(async () => {
    if (!targetId) return;
    try {
      setLoadingReservation(true);
      setReservationError(null);
      const res = await getReservationDetail(targetId);
      const data = res.data?.reservation || res.reservation;
      if (!data) {
        throw new Error('Không tìm thấy thông tin yêu cầu thuê xe này.');
      }
      setReservation(data);
    } catch (err) {
      setReservationError(err.message || 'Không thể tải thông tin yêu cầu thuê!');
    } finally {
      setLoadingReservation(false);
    }
  }, [targetId]);

  useEffect(() => {
    if ((!reservation || !reservation.facility?.provider) && targetId) {
      fetchReservation();
    }
  }, [reservation, targetId, fetchReservation]);

  // Sync form defaults once reservation is available
  useEffect(() => {
    if (reservation) {
      let initialPrice = '';
      if (reservation.facility?.price_per_month) {
        initialPrice = String(reservation.facility.price_per_month).split('.')[0];
      }

      const startDateVal = reservation.desired_start_date
        ? new Date(reservation.desired_start_date).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0];

      const startObj = new Date(startDateVal);
      const endObj = new Date(startObj);
      endObj.setFullYear(endObj.getFullYear() + 1);
      const endDateVal = endObj.toISOString().split('T')[0];

      let extractedVehicleType = '';
      let extractedLicensePlate = '';
      let extractedIdCard = '';
      let extractedAddress = '';

      if (reservation.vehicle_info) {
        const raw = reservation.vehicle_info;
        const cccdMatch = raw.match(/(?:CCCD|CMND|Số CMND|Số CCCD)[:\s]+([^|\]\-,\n]+)/i);
        if (cccdMatch) extractedIdCard = cccdMatch[1].trim();

        const dcMatch = raw.match(/(?:ĐC|Địa chỉ|DC)[:\s]+([^|\]\n]+)/i);
        if (dcMatch) extractedAddress = dcMatch[1].trim();

        if (!extractedIdCard) extractedIdCard = localStorage.getItem('customer_id_card') || '';
        if (!extractedAddress) extractedAddress = localStorage.getItem('customer_address') || reservation.customer?.address || '';

        const cleanVehicle = raw
          .replace(/\s*\[(?:CCCD|CMND)[^\]]+\]/i, '')
          .replace(/\s*\[(?:ĐC|Địa chỉ)[^\]]+\]/i, '')
          .trim();

        const plateRegex = /\s*-\s*Biển\s*(?:số|kiểm\s*soát)?:\s*/i;
        if (plateRegex.test(cleanVehicle)) {
          const parts = cleanVehicle.split(plateRegex);
          extractedVehicleType = parts[0].trim();
          extractedLicensePlate = parts.slice(1).join(' ').trim();
        } else if (cleanVehicle.includes(' - ')) {
          const parts = cleanVehicle.split(' - ');
          extractedVehicleType = parts[0].trim();
          extractedLicensePlate = parts.slice(1).join(' - ').replace(/Biển số:\s*/i, '').trim();
        } else {
          extractedVehicleType = cleanVehicle;
          extractedLicensePlate = cleanVehicle;
        }
      } else {
        extractedIdCard = localStorage.getItem('customer_id_card') || '';
        extractedAddress = localStorage.getItem('customer_address') || reservation.customer?.address || '';
      }

      setFormData((prev) => ({
        ...prev,
        agreed_price: prev.agreed_price || initialPrice,
        payment_deadline_day: prev.payment_deadline_day || 5,
        start_date: prev.start_date || startDateVal,
        end_date: prev.end_date || endDateVal,
        parking_spot: prev.parking_spot || 'Chỗ đỗ tự do trong bãi',
        vehicle_type: extractedVehicleType || prev.vehicle_type || 'Phương tiện đăng ký đỗ',
        license_plate: extractedLicensePlate || prev.license_plate || reservation.vehicle_info || '',
        customer_address: extractedAddress || prev.customer_address || reservation.customer?.address || '',
        customer_id_card: extractedIdCard || prev.customer_id_card || '',
        ...defaultTerms
      }));
    }
  }, [reservation, defaultTerms]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Calculate rental duration in months for preview
  const getDurationMonths = () => {
    if (!formData.start_date || !formData.end_date) return null;
    const start = new Date(formData.start_date);
    const end = new Date(formData.end_date);
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || end <= start) return null;
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const approxMonths = Math.round(diffDays / 30);
    return `${approxMonths} tháng (${diffDays} ngày)`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);

    const priceNum = parseCleanNumber(formData.agreed_price);
    if (priceNum <= 0) {
      setFormError('Vui lòng nhập giá thuê thỏa thuận hợp lệ (lớn hơn 0 VNĐ)!');
      return;
    }

    if (!formData.start_date || !formData.end_date) {
      setFormError('Vui lòng chọn ngày bắt đầu và ngày kết thúc hợp đồng!');
      return;
    }

    if (new Date(formData.end_date) <= new Date(formData.start_date)) {
      setFormError('Ngày kết thúc hợp đồng phải diễn ra sau ngày bắt đầu!');
      return;
    }

    if (!formData.customer_id_card || !formData.customer_id_card.trim()) {
      setFormError('Vui lòng nhập Số CMND hoặc Căn cước công dân (CCCD) của Bên B để lập hợp đồng!');
      return;
    }

    if (!formData.customer_address || !formData.customer_address.trim()) {
      setFormError('Vui lòng nhập Địa chỉ liên hệ / thường trú của Bên B để lập hợp đồng!');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        reservation_id: reservation.id,
        agreed_price: priceNum,
        payment_deadline_day: parseCleanNumber(formData.payment_deadline_day) || 5,
        start_date: formData.start_date,
        end_date: formData.end_date,
        parking_spot: formData.parking_spot ? formData.parking_spot.trim() : 'Chỗ đỗ tự do',
        vehicle_type: formData.vehicle_type ? formData.vehicle_type.trim() : 'Phương tiện đỗ',
        license_plate: formData.license_plate ? formData.license_plate.trim() : reservation.vehicle_info,
        customer_address: formData.customer_address.trim(),
        customer_id_card: formData.customer_id_card.trim(),
        terms: {
          customer_obligations: formData.customer_obligations,
          owner_obligations: formData.owner_obligations,
          termination_conditions: formData.termination_conditions,
          dispute_resolution: formData.dispute_resolution
        }
      };

      const res = await createConfirmationRecord(payload);
      const createdRecord = res.data?.confirmation_record || res.confirmation_record;

      setToastInfo({
        message: 'Tạo và gửi hợp đồng điện tử thành công! Đang chuyển đến văn bản hợp đồng...',
        type: 'success'
      });

      setTimeout(() => {
        if (createdRecord?.id) {
          navigate(`/contracts/${createdRecord.id}`);
        } else {
          navigate('/dashboard', { state: { providerTab: 'contracts' } });
        }
      }, 1200);
    } catch (err) {
      setFormError(err.message || 'Không thể tạo hợp đồng điện tử. Vui lòng thử lại!');
    } finally {
      setSubmitting(false);
    }
  };

  const formattedPricePreview = parseCleanNumber(formData.agreed_price).toLocaleString('vi-VN');

  return (
    <div className="min-h-screen bg-slate-50 py-6 px-3 sm:px-6 lg:px-8 font-sans antialiased">
      <Toast
        message={toastInfo.message}
        type={toastInfo.type}
        onClose={() => setToastInfo({ message: '', type: 'success' })}
      />

      <div className="w-full max-w-[1600px] mx-auto space-y-6">
        {/* BREADCRUMB & BACK NAVIGATION */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-500 flex-wrap">
            <Link
              to="/dashboard"
              className="font-medium text-slate-600 hover:text-teal-700 transition"
            >
              Bảng Điều Khiển
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="font-medium text-slate-600 hover:text-teal-700 transition"
            >
              Duyệt Yêu Cầu Thuê
            </button>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-bold text-teal-800">Thiết Lập Hợp Đồng</span>
          </div>

          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Quay Lại
          </button>
        </div>

        {/* LOADING STATE */}
        {loadingReservation ? (
          <div className="bg-white rounded-3xl p-16 text-center border border-slate-200 shadow-sm space-y-4">
            <Loader2 className="w-10 h-10 animate-spin text-teal-600 mx-auto" />
            <p className="text-slate-600 font-semibold text-sm">
              Đang tải dữ liệu yêu cầu thuê xe #{targetId}...
            </p>
          </div>
        ) : reservationError ? (
          <div className="bg-white rounded-3xl p-10 border border-red-200 shadow-sm text-center space-y-4">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
            <h3 className="text-lg font-bold text-slate-900">Không tìm thấy yêu cầu thuê</h3>
            <p className="text-sm text-slate-600 max-w-md mx-auto">{reservationError}</p>
            <button
              onClick={fetchReservation}
              className="px-5 py-2.5 bg-teal-600 text-white font-bold text-xs rounded-xl shadow hover:bg-teal-700 transition"
            >
              Thử Lại
            </button>
          </div>
        ) : reservation?.confirmation_record ? (
          /* ALREADY HAS CONTRACT */
          <div className="bg-white rounded-3xl p-10 border border-teal-200 shadow-md text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-teal-50 border border-teal-200 text-teal-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">
              Yêu cầu thuê này đã có hợp đồng điện tử!
            </h3>
            <p className="text-sm text-slate-600 max-w-lg mx-auto">
              Hợp đồng cho yêu cầu thuê này đã được khởi tạo trước đó. Bạn có thể xem chi tiết
              văn bản hợp đồng hoặc theo dõi trạng thái ký kết.
            </p>
            <div className="pt-2 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
              >
                Quay Lại
              </button>
              <button
                type="button"
                onClick={() => navigate(`/contracts/${reservation.confirmation_record.id}`)}
                className="px-5 py-2.5 bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-2"
              >
                <Eye className="w-4 h-4" /> Xem Hợp Đồng #{reservation.confirmation_record.id}
              </button>
            </div>
          </div>
        ) : reservation?.status !== 'APPROVED' ? (
          /* NOT APPROVED WARNING */
          <div className="bg-white rounded-3xl p-10 border border-amber-200 shadow-md text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto">
              <Clock className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">
              Yêu cầu thuê chưa được phê duyệt chấp nhận
            </h3>
            <p className="text-sm text-slate-600 max-w-lg mx-auto">
              Hợp đồng điện tử chỉ có thể thiết lập sau khi yêu cầu thuê được phê duyệt (Trạng
              thái hiện tại:{' '}
              <span className="font-bold text-slate-800">{reservation?.status}</span>).
            </p>
            <button
              type="button"
              onClick={() => navigate(`/provider/reservations/${reservation.id}`)}
              className="px-5 py-2.5 bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs rounded-xl shadow-md transition"
            >
              Xem Chi Tiết Yêu Cầu Để Phê Duyệt
            </button>
          </div>
        ) : (
          /* MAIN FORM CANVAS */
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-lg overflow-hidden">
            {/* HEADER HERO */}
            <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-teal-950 px-6 sm:px-8 py-6 text-white border-b border-slate-800">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-teal-500/20 border border-teal-500/40 text-teal-400 flex items-center justify-center shadow-inner">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h1 className="text-lg sm:text-2xl font-black tracking-tight text-white">
                        Thiết Lập Hợp Đồng Gửi Giữ Xe Ô Tô
                      </h1>
                      <span className="text-[10px] uppercase font-extrabold tracking-wider px-2.5 py-1 rounded-md bg-teal-500/20 text-teal-300 border border-teal-500/30">
                        Hợp đồng dịch vụ điện tử
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-300 mt-1">
                      Cơ sở bãi xe:{' '}
                      <strong className="text-teal-300">{reservation.facility?.name}</strong> • Khách
                      thuê:{' '}
                      <strong className="text-white">{reservation.customer?.full_name}</strong>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* FORM BODY */}
            <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-8 bg-slate-50/40 text-xs sm:text-sm">
              {formError && (
                <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-3 shadow-xs">
                  <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
                  <div>{formError}</div>
                </div>
              )}

              {/* SECTION I: THÔNG TIN CÁC BÊN GIAO DỊCH */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
                <div className="text-xs font-bold text-slate-900 uppercase tracking-wider pb-3 border-b border-slate-100 flex items-center justify-between">
                  <span className="flex items-center gap-2 text-teal-900">
                    <Building2 className="w-4 h-4 text-teal-600" /> I. Thông Tin Các Bên Giao Dịch
                  </span>
                  <span className="text-[11px] text-slate-400 font-normal">
                    Tự động trích xuất từ tài khoản
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
                  {/* BÊN A (OWNER) */}
                  <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/80 space-y-2">
                    <div className="flex items-center justify-between border-b border-slate-200/70 pb-2">
                      <span className="text-[11px] font-extrabold uppercase text-slate-600">
                        Bên A (Chủ Bãi Đỗ Xe)
                      </span>
                      <span className="text-[10px] bg-teal-100 text-teal-800 font-bold px-2 py-0.5 rounded">
                        Bên Cho Thuê
                      </span>
                    </div>
                    <p className="font-extrabold text-sm text-slate-900 pt-1">
                      {reservation.facility?.name}
                    </p>
                    <p className="text-slate-600 flex items-start gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      {reservation.facility?.address}
                    </p>
                    <p className="text-slate-600 pt-1 border-t border-slate-200/50">
                      Đại diện:{' '}
                      <strong className="text-slate-800">
                        {reservation.facility?.provider?.full_name || user?.full_name || 'Chủ cơ sở'}
                      </strong>
                    </p>
                    <p className="text-slate-600 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400" /> SĐT:{' '}
                      <span className="font-semibold text-slate-800">
                        {reservation.facility?.provider?.phone_number || user?.phone_number || 'Chưa cập nhật'}
                      </span>
                    </p>
                    {(reservation.facility?.provider?.email || user?.email) && (
                      <p className="text-slate-600 flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-slate-400" /> Email:{' '}
                        <span className="font-semibold text-slate-800">
                          {reservation.facility?.provider?.email || user?.email}
                        </span>
                      </p>
                    )}
                  </div>

                  {/* BÊN B (CUSTOMER) */}
                  <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/80 space-y-2">
                    <div className="flex items-center justify-between border-b border-slate-200/70 pb-2">
                      <span className="text-[11px] font-extrabold uppercase text-slate-600">
                        Bên B (Khách Hàng Thuê)
                      </span>
                      <span className="text-[10px] bg-sky-100 text-sky-800 font-bold px-2 py-0.5 rounded">
                        Bên Thuê
                      </span>
                    </div>
                    <p className="font-extrabold text-sm text-slate-900 pt-1">
                      {reservation.customer?.full_name}
                    </p>
                    <p className="text-slate-600 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-slate-400" /> Mã khách hàng:{' '}
                      <span className="font-mono font-semibold text-slate-800">
                        #{reservation.customer?.id}
                      </span>
                    </p>
                    <p className="text-slate-600 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400" /> Số điện thoại:{' '}
                      <span className="font-semibold text-slate-800">
                        {reservation.customer?.phone_number || 'Chưa cập nhật'}
                      </span>
                    </p>
                    <p className="text-slate-600 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-slate-400" /> Email trực tuyến:{' '}
                      <span className="font-semibold text-slate-800">
                        {reservation.customer?.email}
                      </span>
                    </p>

                    <div className="pt-2.5 border-t border-slate-200/80 space-y-2.5">
                      <div>
                        <label className="block text-xs font-bold text-slate-800 mb-1">
                          Số CMND / Thẻ Căn cước công dân (CCCD) Bên B <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="customer_id_card"
                          value={formData.customer_id_card}
                          readOnly
                          placeholder="Chưa có thông tin CCCD"
                          required
                          className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 font-mono cursor-not-allowed select-none focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-800 mb-1">
                          Địa chỉ thường trú / liên hệ Bên B <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="customer_address"
                          value={formData.customer_address}
                          readOnly
                          placeholder="Chưa có thông tin địa chỉ"
                          required
                          className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 cursor-not-allowed select-none focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ĐIỀU 1: ĐỐI TƯỢNG GỬI, GIỮ */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-5">
                <div className="text-xs font-bold text-slate-900 uppercase tracking-wider pb-3 border-b border-slate-100 flex items-center justify-between flex-wrap gap-2">
                  <span className="flex items-center gap-2 text-teal-900">
                    <Car className="w-4 h-4 text-teal-600" /> Điều 1: Đối Tượng Gửi, Giữ
                  </span>
                  <span className="text-[11px] text-teal-800 font-bold bg-teal-50 px-2.5 py-0.5 rounded border border-teal-200">
                    Phương tiện đăng ký
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1.5">
                      Loại phương tiện / Hãng xe <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="vehicle_type"
                      value={formData.vehicle_type}
                      readOnly
                      placeholder="VD: Ô tô (4-7 chỗ)"
                      required
                      className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 cursor-not-allowed select-none focus:outline-none"
                    />
                    <p className="text-[11px] text-slate-500 mt-1">
                      Chủng loại xe khách hàng đã đăng ký khi gửi yêu cầu thuê chỗ.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1.5">
                      Biển kiểm soát / Biển số xe đăng ký <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="license_plate"
                      value={formData.license_plate}
                      readOnly
                      placeholder="VD: 65A-563.94"
                      required
                      className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 font-mono cursor-not-allowed select-none focus:outline-none"
                    />
                    <p className="text-[11px] text-slate-500 mt-1">
                      Biển số kiểm soát xe gửi giữ tại bãi theo đăng ký của khách hàng.
                    </p>
                  </div>
                </div>
              </div>

              {/* ĐIỀU 2: GIÁ CẢ VÀ PHƯƠNG THỨC VÀ THỜI HẠN THANH TOÁN */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-5">
                <div className="text-xs font-bold text-slate-900 uppercase tracking-wider pb-3 border-b border-slate-100 flex items-center justify-between flex-wrap gap-2">
                  <span className="flex items-center gap-2 text-teal-900">
                    <Calendar className="w-4 h-4 text-teal-600" /> Điều 2: Giá Cả Và Phương Thức Và Thời Hạn Thanh Toán
                  </span>
                  {getDurationMonths() && (
                    <span className="text-xs text-teal-800 font-extrabold bg-teal-50 px-3 py-1 rounded-lg border border-teal-200">
                      Thời hạn: {getDurationMonths()}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1.5">
                      Giá dịch vụ trông giữ xe thỏa thuận (VNĐ) <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        name="agreed_price"
                        value={formData.agreed_price}
                        onChange={handleChange}
                        placeholder="VD: 850000"
                        required
                        className="w-full px-3.5 py-2.5 pr-24 bg-white border border-slate-300 rounded-xl text-sm font-extrabold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-teal-600 transition"
                      />
                      <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">
                        VNĐ / tháng
                      </span>
                    </div>
                    {parseCleanNumber(formData.agreed_price) > 0 && (
                      <p className="text-xs text-teal-700 font-bold mt-1.5">
                        Bằng chữ: {formattedPricePreview} VNĐ / tháng
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1.5">
                      Hạn thanh toán hàng tháng (Ngày 1 - 31)
                    </label>
                    <input
                      type="number"
                      name="payment_deadline_day"
                      min="1"
                      max="31"
                      value={formData.payment_deadline_day}
                      onChange={handleChange}
                      placeholder="Mặc định trước ngày 5 hoặc 10 hàng tháng"
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-extrabold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-teal-600 transition"
                    />
                    <p className="text-[11px] text-slate-500 mt-1.5">
                      Định kỳ thanh toán từ ngày 01 đến ngày {formData.payment_deadline_day || 5} mỗi tháng.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1.5">
                      Thời gian gửi: Ngày bắt đầu hiệu lực <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      name="start_date"
                      value={formData.start_date}
                      onChange={handleChange}
                      required
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-teal-600 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1.5">
                      Thời gian gửi: Ngày kết thúc hợp đồng <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      name="end_date"
                      value={formData.end_date}
                      onChange={handleChange}
                      required
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-teal-600 transition"
                    />
                  </div>

                  <div className="sm:col-span-2 lg:col-span-4">
                    <label className="block text-xs font-bold text-slate-800 mb-1.5">
                      Vị trí gửi / Ô đỗ phân công trong bãi
                    </label>
                    <input
                      type="text"
                      name="parking_spot"
                      value={formData.parking_spot}
                      onChange={handleChange}
                      placeholder="VD: Bãi xe Trung tâm hoặc Slot #A-12"
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-teal-600 transition"
                    />
                    <p className="text-[11px] text-slate-500 mt-1">
                      Vị trí ô đỗ cụ thể được phân công cho Bên B tại khuôn viên bãi xe của Bên A.
                    </p>
                  </div>
                </div>

                {/* Ghi chú phương thức thanh toán chuẩn hợp đồng */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1">
                  <p className="font-bold text-slate-800">Phương thức thanh toán áp dụng trong hợp đồng:</p>
                  <p>• <strong>Chuyển khoản</strong> vào tài khoản Bên A: Nội dung chuyển khoản ghi rõ <em>Họ tên, Biển số xe, Tháng đóng tiền</em>.</p>
                  <p>• <strong>Tiền mặt</strong>: Nộp trực tiếp tại bộ phận Văn thư - Thủ quỹ / Ban Quản lý bãi xe.</p>
                </div>
              </div>

              {/* ĐIỀU 3 ĐẾN ĐIỀU 6: BẢN THẢO CÁC ĐIỀU KHOẢN PHÁP LÝ */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
                <div className="text-xs font-bold text-slate-900 uppercase tracking-wider pb-3 border-b border-slate-100 flex items-center justify-between flex-wrap gap-2">
                  <span className="flex items-center gap-2 text-teal-900">
                    <ShieldCheck className="w-4 h-4 text-teal-600" /> Các Điều Khoản Thỏa Thuận (Điều 3 - Điều 6)
                  </span>
                  
                </div>

                <div className="p-3 bg-teal-50/60 rounded-xl border border-teal-200/60 text-xs text-teal-900 flex items-center gap-2">
                  <Info className="w-4 h-4 text-teal-600 shrink-0" />
                  <span>
                    <strong>Điều 1</strong> (Đối tượng xe gửi) và <strong>Điều 2</strong> (Giá cả, phương thức & thời hạn thanh toán) đã được thiết lập ở 2 mục phía trên. Dưới đây là nội dung chi tiết của <strong>Điều 3, 4, 5 và 6</strong>:
                  </span>
                </div>

                <div className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50/50">
                  {/* TAB NAVIGATION */}
                  <div className="flex border-b border-slate-200 bg-slate-100/90 overflow-x-auto text-xs font-bold">
                    <button
                      type="button"
                      onClick={() => setActiveTermsTab('owner')}
                      className={`px-5 py-3 border-b-2 whitespace-nowrap transition ${
                        activeTermsTab === 'owner'
                          ? 'border-teal-700 text-teal-900 bg-white shadow-xs font-black'
                          : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                      }`}
                    >
                      Điều 3. Nghĩa vụ Bên A (Chủ Bãi)
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTermsTab('customer')}
                      className={`px-5 py-3 border-b-2 whitespace-nowrap transition ${
                        activeTermsTab === 'customer'
                          ? 'border-teal-700 text-teal-900 bg-white shadow-xs font-black'
                          : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                      }`}
                    >
                      Điều 4. Nghĩa vụ Bên B (Khách Thuê)
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTermsTab('dispute')}
                      className={`px-5 py-3 border-b-2 whitespace-nowrap transition ${
                        activeTermsTab === 'dispute'
                          ? 'border-teal-700 text-teal-900 bg-white shadow-xs font-black'
                          : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                      }`}
                    >
                      Điều 5. Giải Quyết Tranh Chấp
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTermsTab('termination')}
                      className={`px-5 py-3 border-b-2 whitespace-nowrap transition ${
                        activeTermsTab === 'termination'
                          ? 'border-teal-700 text-teal-900 bg-white shadow-xs font-black'
                          : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                      }`}
                    >
                      Điều 6. Hiệu Lực Của Hợp Đồng
                    </button>
                  </div>

                  {/* TAB PANEL */}
                  <div className="p-4 sm:p-5 bg-white">
                    {activeTermsTab === 'owner' && (
                      <div className="space-y-2">
                        <label className="block text-xs font-bold text-slate-700">
                          Điều 3: Quyền và nghĩa vụ của Bên A (Bên giữ xe ô tô):
                        </label>
                        <textarea
                          name="owner_obligations"
                          rows="7"
                          value={formData.owner_obligations}
                          onChange={handleChange}
                          className="w-full p-3.5 border border-slate-300 rounded-xl text-xs font-normal text-slate-800 leading-relaxed focus:outline-none focus:ring-2 focus:ring-teal-600 transition"
                        />
                      </div>
                    )}

                    {activeTermsTab === 'customer' && (
                      <div className="space-y-2">
                        <label className="block text-xs font-bold text-slate-700">
                          Điều 4: Quyền và nghĩa vụ của Bên B (Bên gửi xe ô tô):
                        </label>
                        <textarea
                          name="customer_obligations"
                          rows="7"
                          value={formData.customer_obligations}
                          onChange={handleChange}
                          className="w-full p-3.5 border border-slate-300 rounded-xl text-xs font-normal text-slate-800 leading-relaxed focus:outline-none focus:ring-2 focus:ring-teal-600 transition"
                        />
                      </div>
                    )}

                    {activeTermsTab === 'dispute' && (
                      <div className="space-y-2">
                        <label className="block text-xs font-bold text-slate-700">
                          Điều 5: Cơ chế giải quyết tranh chấp:
                        </label>
                        <textarea
                          name="dispute_resolution"
                          rows="5"
                          value={formData.dispute_resolution}
                          onChange={handleChange}
                          className="w-full p-3.5 border border-slate-300 rounded-xl text-xs font-normal text-slate-800 leading-relaxed focus:outline-none focus:ring-2 focus:ring-teal-600 transition"
                        />
                      </div>
                    )}

                    {activeTermsTab === 'termination' && (
                      <div className="space-y-2">
                        <label className="block text-xs font-bold text-slate-700">
                          Điều 6: Hiệu lực và điều kiện chấm dứt hợp đồng:
                        </label>
                        <textarea
                          name="termination_conditions"
                          rows="5"
                          value={formData.termination_conditions}
                          onChange={handleChange}
                          className="w-full p-3.5 border border-slate-300 rounded-xl text-xs font-normal text-slate-800 leading-relaxed focus:outline-none focus:ring-2 focus:ring-teal-600 transition"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* NOTICE BOX */}
              <div className="p-4 bg-teal-50/80 rounded-2xl border border-teal-200/80 flex items-start gap-3 text-teal-950 text-xs font-medium leading-relaxed">
                <Info className="w-5 h-5 text-teal-700 shrink-0 mt-0.5" />
                <div>
                  Hợp đồng sau khi tạo sẽ được lưu trữ với trạng thái{' '}
                  <strong className="text-teal-900">CHỜ KÝ (PENDING_SIGNATURE)</strong>. Khách
                  hàng thuê sẽ nhận được thông báo để kiểm tra toàn bộ điều khoản và ký xác nhận
                  điện tử trước khi hợp đồng chính thức có hiệu lực thi hành.
                </div>
              </div>

              {/* ACTIONS */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-end gap-3.5">
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="w-full sm:w-auto px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm rounded-xl transition text-center"
                >
                  Hủy Bỏ / Quay Lại
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full sm:w-auto px-7 py-3 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Đang Khởi Tạo Hợp Đồng...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" /> Tạo & Gửi Hợp Đồng Điện Tử
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProviderCreateContractPage;
