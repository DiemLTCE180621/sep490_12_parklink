import React, { useState, useEffect, useMemo } from 'react';
import { createConfirmationRecord } from '../services/confirmationRecordService';
import {
  X,
  FileText,
  Calendar,
  Building2,
  Car,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Info
} from 'lucide-react';

const CreateConfirmationRecordModal = ({ isOpen, onClose, reservation, onSuccess }) => {
  const defaultTerms = useMemo(() => ({
    owner_obligations:
      '- Yêu cầu bên gửi trả tiền dịch vụ trông giữ xe theo thỏa thuận.\n- Được chấm dứt hợp đồng trước thời hạn, nhưng phải báo trước cho bên B ít nhất 15 ngày.\n- Bảo quản xe ô tô theo đúng thỏa thuận, trả lại xe ô tô cho bên gửi theo đúng tình trạng như khi nhận giữ.\n- Chỉ được thay đổi cách bảo quản xe ô tô nếu việc thay đổi là cần thiết nhằm bảo quản tốt hơn xe ô tô đó, nhưng phải báo ngay cho bên gửi biết về việc thay đổi.\n- Thông báo kịp thời cho bên gửi biết về nguy cơ hư hỏng, tiêu hủy xe ô tô do tính chất của xe ô tô đó và yêu cầu bên gửi cho biết cách giải quyết trong một thời hạn; nếu hết thời hạn đó mà bên gửi không trả lời thì bên giữ có quyền thực hiện các biện pháp cần thiết để bảo quản và yêu cầu bên gửi thanh toán chi phí.\n- Quá thời gian thanh toán, bên A có quyền thu hồi vị trí gửi xe và yêu cầu bên B trả phí giữ xe.\n- Phải bồi thường thiệt hại, nếu làm mất, hư hỏng xe ô tô gửi giữ, trừ trường hợp bất khả kháng.\n- Bảo quản cẩn thận xe gửi giữ, không được sử dụng xe trong thời gian bảo quản.',
    customer_obligations:
      '- Được chấm dứt hợp đồng trước thời hạn, nhưng phải báo trước cho bên A ít nhất 15 ngày.\n- Yêu cầu bồi thường thiệt hại, nếu bên giữ làm mất, hư hỏng xe ô tô gửi giữ, trừ trường hợp bất khả kháng.\n- Phải trả đủ tiền dịch vụ trông giữ xe đúng thời hạn và đúng phương thức đã thỏa thuận. Trường hợp đóng tiền trễ so với thời gian quy định hợp đồng quá 3 lần/năm thì mặc định thanh lý hợp đồng trước thời hạn và khách hàng phải nộp tiền nợ (nếu có).\n- Trả phí giữ xe khi hết hạn hợp đồng mà không kịp thời nhận lại xe đã gửi.\n- Bên B tự bảo quản chìa khoá xe, thẻ xe, tài sản, tư trang trong xe ô tô.\n- Thực hiện theo đúng nội quy của bãi đậu xe.',
    termination_conditions:
      '- Hợp đồng này có hiệu lực từ ngày bắt đầu đến ngày kết thúc thỏa thuận. Hợp đồng đương nhiên được thanh lý khi hai bên hoàn thành toàn bộ các nghĩa vụ theo nội dung Hợp đồng và hai bên không có nhu cầu thỏa thuận gia hạn hợp đồng.\n- Mỗi bên có quyền chấm dứt hợp đồng trước thời hạn nhưng phải báo trước cho bên kia ít nhất 15 ngày.\n- Hợp đồng này được lập dưới dạng hợp đồng điện tử có giá trị pháp lý theo quy định của Luật Giao dịch điện tử và Bộ luật Dân sự 2015 nước CHXHCN Việt Nam; mỗi bên lưu giữ một bản có giá trị như nhau để thực hiện.',
    dispute_resolution:
      '- Hai bên cần chủ động thông báo cho nhau biết tình hình thực hiện hợp đồng, nếu có gì bất lợi phát sinh, các bên phải kịp thời thông báo cho nhau biết và tích cực giải quyết trên cơ sở thương lượng, bình đẳng, có lợi (có lập biên bản).\n- Trường hợp các bên không tự giải quyết được mới đưa việc tranh chấp ra Tòa án giải quyết.'
  }), []);

  const [formData, setFormData] = useState({
    agreed_price: '',
    payment_deadline_day: 5,
    start_date: '',
    end_date: '',
    parking_spot: '',
    vehicle_type: 'Ô tô (4-7 chỗ)',
    license_plate: '',
    ...defaultTerms
  });

  const [activeTermsTab, setActiveTermsTab] = useState('customer'); // customer | owner | termination | dispute
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Helper safety parsers
  const parseCleanNumber = (val) => {
    if (val === null || val === undefined) return 0;
    const cleanStr = String(val).replace(/[^0-9.]/g, '');
    return parseFloat(cleanStr) || 0;
  };

  useEffect(() => {
    if (reservation && isOpen) {
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

      setFormData({
        agreed_price: initialPrice,
        payment_deadline_day: 5,
        start_date: startDateVal,
        end_date: endDateVal,
        parking_spot: 'Chỗ đỗ tự do trong bãi',
        vehicle_type: 'Ô tô (4-7 chỗ)',
        license_plate: reservation.vehicle_info || '',
        ...defaultTerms
      });
      setError(null);
    }
  }, [reservation, isOpen, defaultTerms]);

  if (!isOpen || !reservation) return null;

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
    setError(null);

    const priceNum = parseCleanNumber(formData.agreed_price);
    if (priceNum <= 0) {
      setError('Vui lòng nhập giá thuê thỏa thuận hợp lệ (lớn hơn 0 VNĐ)!');
      return;
    }

    if (!formData.start_date || !formData.end_date) {
      setError('Vui lòng chọn ngày bắt đầu và ngày kết thúc hợp đồng!');
      return;
    }

    if (new Date(formData.end_date) <= new Date(formData.start_date)) {
      setError('Ngày kết thúc hợp đồng phải diễn ra sau ngày bắt đầu!');
      return;
    }

    try {
      setLoading(true);
      const payload = {
        reservation_id: reservation.id,
        agreed_price: priceNum,
        payment_deadline_day: parseCleanNumber(formData.payment_deadline_day) || 5,
        start_date: formData.start_date,
        end_date: formData.end_date,
        parking_spot: formData.parking_spot ? formData.parking_spot.trim() : 'Chỗ đỗ tự do',
        vehicle_type: formData.vehicle_type ? formData.vehicle_type.trim() : 'Phương tiện đỗ',
        license_plate: formData.license_plate ? formData.license_plate.trim() : reservation.vehicle_info,
        terms: {
          customer_obligations: formData.customer_obligations,
          owner_obligations: formData.owner_obligations,
          termination_conditions: formData.termination_conditions,
          dispute_resolution: formData.dispute_resolution
        }
      };

      await createConfirmationRecord(payload);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || 'Không thể tạo hợp đồng điện tử. Vui lòng thử lại!');
    } finally {
      setLoading(false);
    }
  };

  const formattedPricePreview = parseCleanNumber(formData.agreed_price).toLocaleString('vi-VN');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/65 backdrop-blur-sm animate-fadeIn">
      <div
        className="bg-white rounded-2xl shadow-2xl border border-slate-200/90 w-full max-w-4xl overflow-hidden transform transition-all duration-200 max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* DOCUMENT TOP BAR */}
        <div className="bg-slate-900 px-6 py-4 text-white shrink-0 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-500/20 border border-teal-500/40 text-teal-400 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">
                  Thiết Lập Hợp Đồng Cho Thuê Bãi Xe
                </h2>
                <span className="text-[10px] uppercase font-bold tracking-wide px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 border border-teal-500/30">
                  Dự thảo điện tử
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Cơ sở bãi xe: <strong className="text-slate-200">{reservation.facility?.name}</strong> • Khách thuê: <strong className="text-slate-200">{reservation.customer?.full_name}</strong>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 flex items-center justify-center transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* FORM CONTENT CANVAS */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-grow bg-slate-50/50 text-xs sm:text-sm">
          {error && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-center gap-2.5 shadow-xs">
              <AlertCircle className="w-4.5 h-4.5 text-red-600 shrink-0" />
              <div>{error}</div>
            </div>
          )}

          {/* SECTION I: THÔNG TIN CÁC BÊN GIAO DỊCH */}
          <div className="bg-white p-4.5 rounded-xl border border-slate-200/80 shadow-xs space-y-3">
            <div className="text-[11px] font-bold text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-teal-800">
                <Building2 className="w-4 h-4 text-teal-600" /> I. Thông Tin Các Bên Giao Dịch
              </span>
              <span className="text-[10px] text-slate-400 font-normal">Tự động trích xuất từ tài khoản</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              {/* BÊN A (OWNER) */}
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/70 space-y-1">
                <span className="text-[10px] font-bold uppercase text-slate-500 block border-b border-slate-200/60 pb-1">
                  Bên A (Chủ Bãi Đỗ Xe)
                </span>
                <p className="font-bold text-slate-900 pt-0.5">{reservation.facility?.name}</p>
                <p className="text-slate-600 text-[11px]">{reservation.facility?.address}</p>
                <p className="text-slate-500 text-[11px] pt-1">
                  Đại diện: <strong>{reservation.facility?.provider?.full_name || 'Chủ cơ sở'}</strong> • SĐT: {reservation.facility?.provider?.phone_number || 'N/A'}
                </p>
              </div>

              {/* BÊN B (CUSTOMER) */}
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/70 space-y-1">
                <span className="text-[10px] font-bold uppercase text-slate-500 block border-b border-slate-200/60 pb-1">
                  Bên B (Khách Hàng Thuê)
                </span>
                <p className="font-bold text-slate-900 pt-0.5">{reservation.customer?.full_name}</p>
                <p className="text-slate-600 text-[11px]">SĐT: {reservation.customer?.phone_number || 'Chưa cập nhật'}</p>
                <p className="text-slate-500 text-[11px]">Email: {reservation.customer?.email}</p>
              </div>
            </div>
          </div>

          {/* ĐIỀU 1: ĐỐI TƯỢNG GỬI, GIỮ */}
          <div className="bg-white p-4.5 rounded-xl border border-slate-200/80 shadow-xs space-y-3">
            <div className="text-[11px] font-bold text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-teal-800">
                <Car className="w-4 h-4 text-teal-600" /> Điều 1: Đối Tượng Gửi, Giữ
              </span>
              <span className="text-[10px] text-teal-700 font-bold bg-teal-50 px-2 py-0.5 rounded border border-teal-100">
                Phương tiện đăng ký
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1">
                  Loại phương tiện / Hãng xe <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="vehicle_type"
                  value={formData.vehicle_type}
                  onChange={handleChange}
                  placeholder="VD: Ô tô (4-7 chỗ) hoặc Mitsubishi Xforce"
                  required
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-teal-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1">
                  Biển kiểm soát / Biển số xe đăng ký <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="license_plate"
                  value={formData.license_plate}
                  onChange={handleChange}
                  placeholder="VD: 65A-563.94"
                  required
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-teal-600"
                />
              </div>
            </div>
          </div>

          {/* ĐIỀU 2: GIÁ CẢ VÀ PHƯƠNG THỨC VÀ THỜI HẠN THANH TOÁN */}
          <div className="bg-white p-4.5 rounded-xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="text-[11px] font-bold text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-teal-800">
                <Calendar className="w-4 h-4 text-teal-600" /> Điều 2: Giá Cả Và Phương Thức Và Thời Hạn Thanh Toán
              </span>
              {getDurationMonths() && (
                <span className="text-[11px] text-teal-700 font-bold bg-teal-50 px-2 py-0.5 rounded border border-teal-100">
                  Thời hạn: {getDurationMonths()}
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1">
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
                    className="w-full px-3 py-2 pr-12 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-teal-600"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">
                    VNĐ/tháng
                  </span>
                </div>
                {parseCleanNumber(formData.agreed_price) > 0 && (
                  <p className="text-[11px] text-teal-700 font-semibold mt-1">
                    Bằng chữ: {formattedPricePreview} VNĐ / tháng
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1">
                  Hạn thanh toán hàng tháng (Ngày 1 - 31)
                </label>
                <input
                  type="number"
                  name="payment_deadline_day"
                  min="1"
                  max="31"
                  value={formData.payment_deadline_day}
                  onChange={handleChange}
                  placeholder="Mặc định ngày 5 hàng tháng"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-teal-600"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Định kỳ thanh toán từ ngày 01 đến ngày {formData.payment_deadline_day || 5} mỗi tháng.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1">
                  Thời gian gửi: Ngày bắt đầu hiệu lực <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="start_date"
                  value={formData.start_date}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-teal-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1">
                  Thời gian gửi: Ngày hết hạn hợp đồng <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="end_date"
                  value={formData.end_date}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-teal-600"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-800 mb-1">
                  Vị trí gửi / Ô đỗ phân công trong bãi
                </label>
                <input
                  type="text"
                  name="parking_spot"
                  value={formData.parking_spot}
                  onChange={handleChange}
                  placeholder="VD: Bãi xe Trung tâm hoặc Slot #A-12"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-teal-600"
                />
              </div>
            </div>
          </div>

          {/* CÁC ĐIỀU KHOẢN THỎA THUẬN (ĐIỀU 3 - ĐIỀU 6) */}
          <div className="bg-white p-4.5 rounded-xl border border-slate-200/80 shadow-xs space-y-3">
            <div className="text-[11px] font-bold text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-teal-800">
                <ShieldCheck className="w-4 h-4 text-teal-600" /> Các Điều Khoản Thỏa Thuận (Điều 3 - Điều 6)
              </span>
              <span className="text-[10px] text-slate-400 font-normal">Chuẩn Bộ luật Dân sự 2015</span>
            </div>

            <div className="p-2.5 bg-teal-50/70 rounded-lg border border-teal-200/70 text-[11px] text-teal-900 flex items-center gap-2">
              <Info className="w-4 h-4 text-teal-600 shrink-0" />
              <span>
                <strong>Điều 1</strong> (Đối tượng xe gửi) và <strong>Điều 2</strong> (Giá cả & thanh toán) đã ở phía trên. Dưới đây là <strong>Điều 3, 4, 5, 6</strong>:
              </span>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50/50">
              {/* TAB NAVIGATION */}
              <div className="flex border-b border-slate-200 bg-slate-100/80 overflow-x-auto text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setActiveTermsTab('owner')}
                  className={`px-4 py-2.5 border-b-2 whitespace-nowrap transition ${activeTermsTab === 'owner'
                      ? 'border-teal-700 text-teal-800 bg-white font-bold'
                      : 'border-transparent text-slate-600 hover:text-slate-900'
                    }`}
                >
                  Điều 3: Nghĩa vụ Bên A (Chủ bãi)
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTermsTab('customer')}
                  className={`px-4 py-2.5 border-b-2 whitespace-nowrap transition ${activeTermsTab === 'customer'
                      ? 'border-teal-700 text-teal-800 bg-white font-bold'
                      : 'border-transparent text-slate-600 hover:text-slate-900'
                    }`}
                >
                  Điều 4: Nghĩa vụ Bên B (Khách thuê)
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTermsTab('dispute')}
                  className={`px-4 py-2.5 border-b-2 whitespace-nowrap transition ${activeTermsTab === 'dispute'
                      ? 'border-teal-700 text-teal-800 bg-white font-bold'
                      : 'border-transparent text-slate-600 hover:text-slate-900'
                    }`}
                >
                  Điều 5: Tranh Chấp
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTermsTab('termination')}
                  className={`px-4 py-2.5 border-b-2 whitespace-nowrap transition ${activeTermsTab === 'termination'
                      ? 'border-teal-700 text-teal-800 bg-white font-bold'
                      : 'border-transparent text-slate-600 hover:text-slate-900'
                    }`}
                >
                  Điều 6: Hiệu Lực HĐ
                </button>
              </div>

              {/* TAB PANEL */}
              <div className="p-3 bg-white">
                {activeTermsTab === 'owner' && (
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Điều 3: Quyền và nghĩa vụ của Bên A (Bên giữ xe):
                    </label>
                    <textarea
                      name="owner_obligations"
                      rows="5"
                      value={formData.owner_obligations}
                      onChange={handleChange}
                      className="w-full p-3 border border-slate-300 rounded-lg text-xs font-normal text-slate-800 leading-relaxed focus:outline-none focus:ring-2 focus:ring-teal-600"
                    />
                  </div>
                )}

                {activeTermsTab === 'customer' && (
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Điều 4: Quyền và nghĩa vụ của Bên B (Bên gửi xe):
                    </label>
                    <textarea
                      name="customer_obligations"
                      rows="5"
                      value={formData.customer_obligations}
                      onChange={handleChange}
                      className="w-full p-3 border border-slate-300 rounded-lg text-xs font-normal text-slate-800 leading-relaxed focus:outline-none focus:ring-2 focus:ring-teal-600"
                    />
                  </div>
                )}

                {activeTermsTab === 'dispute' && (
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Điều 5: Cơ quan có thẩm quyền giải quyết tranh chấp:
                    </label>
                    <textarea
                      name="dispute_resolution"
                      rows="4"
                      value={formData.dispute_resolution}
                      onChange={handleChange}
                      className="w-full p-3 border border-slate-300 rounded-lg text-xs font-normal text-slate-800 leading-relaxed focus:outline-none focus:ring-2 focus:ring-teal-600"
                    />
                  </div>
                )}

                {activeTermsTab === 'termination' && (
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Điều 6: Các căn cứ và điều kiện chấm dứt hợp đồng:
                    </label>
                    <textarea
                      name="termination_conditions"
                      rows="4"
                      value={formData.termination_conditions}
                      onChange={handleChange}
                      className="w-full p-3 border border-slate-300 rounded-lg text-xs font-normal text-slate-800 leading-relaxed focus:outline-none focus:ring-2 focus:ring-teal-600"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

      <div className="p-3.5 bg-teal-50/70 rounded-xl border border-teal-200/80 flex items-center gap-2.5 text-teal-900 text-xs font-medium">
        <Info className="w-4 h-4 text-teal-700 shrink-0" />
        <div>
          Hợp đồng sau khi gửi sẽ ở trạng thái <strong>CHỜ KÝ (PENDING_SIGNATURE)</strong>. Khách hàng sẽ nhận được thông báo để xem xét và ký xác nhận điện tử.
        </div>
      </div>

      {/* ACTIONS */}
      <div className="pt-2 flex items-center justify-end gap-3 shrink-0">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition"
        >
          Hủy Bỏ
        </button>

        <button
          type="submit"
          disabled={loading}
          className="px-5 py-2.5 bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-2 disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Đang Khởi Tạo...
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4" /> Gửi Hợp Đồng Điện Tử
            </>
          )}
        </button>
      </div>
        </form>
      </div>
    </div>
  );
};

export default CreateConfirmationRecordModal;
