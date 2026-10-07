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
    customer_obligations:
      '1. Thanh toán đầy đủ tiền thuê bãi đỗ xe theo đúng hạn thỏa thuận hàng tháng.\n2. Đỗ xe đúng vị trí được phân công, tuân thủ nghiêm ngặt nội quy bãi xe và quy định về Phòng cháy chữa cháy (PCCC).\n3. Thông báo rõ cho chủ bãi về tình trạng hoặc đặc tính nguy hiểm của phương tiện (nếu có).\n4. Tự bảo quản các vật dụng tài sản cá nhân có giá trị rời để bên trong xe.',
    owner_obligations:
      '1. Bố trí chỗ đỗ xe an toàn, duy trì hạ tầng, vệ sinh và hệ thống giám sát an ninh 24/7.\n2. Bảo quản phương tiện đỗ tại bãi theo quy định của Bộ luật Dân sự 2015; chịu trách nhiệm bồi thường thiệt hại theo quy định pháp luật nếu phương tiện bị mất mát hoặc hư hỏng do lỗi trực tiếp của bãi đỗ xe.\n3. Không được tự ý di chuyển hoặc giao phương tiện cho người thứ ba sử dụng khi chưa có sự đồng ý của khách thuê.',
    termination_conditions:
      '1. Hợp đồng đương nhiên hết hiệu lực khi hết thời hạn thỏa thuận mà hai bên không gia hạn.\n2. Mỗi bên có quyền đơn phương chấm dứt hợp đồng trước hạn nếu bên kia vi phạm nghiêm trọng nghĩa vụ hợp đồng và phải thông báo bằng thông điệp dữ liệu điện tử/văn bản trước ít nhất 15 ngày.',
    dispute_resolution:
      '1. Hợp đồng điện tử này được lập và có giá trị pháp lý tuân thủ theo Luật Giao dịch điện tử và Bộ luật Dân sự 2015 nước CHXHCN Việt Nam.\n2. Mọi tranh chấp phát sinh sẽ được ưu tiên thương lượng, hòa giải trên nền tảng ParkLink. Trường hợp không thể tự thỏa thuận, tranh chấp sẽ do Tòa án nhân dân có thẩm quyền giải quyết.'
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

          {/* SECTION II: THỜI HẠN & GIÁ THUỂ */}
          <div className="bg-white p-4.5 rounded-xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="text-[11px] font-bold text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-teal-800">
                <Calendar className="w-4 h-4 text-teal-600" /> II. Thời Hạn Hợp Đồng & Phí Thuê
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
                  Giá thuê thỏa thuận hàng tháng (VNĐ) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    name="agreed_price"
                    value={formData.agreed_price}
                    onChange={handleChange}
                    placeholder="VD: 1500000"
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
                  Định kỳ thanh toán trước ngày {formData.payment_deadline_day || 5} mỗi tháng.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1">
                  Ngày bắt đầu hiệu lực <span className="text-red-500">*</span>
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
                  Ngày hết hạn hợp đồng <span className="text-red-500">*</span>
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
            </div>
          </div>

          {/* SECTION III: VỊ TRÍ ĐỖ XE & PHƯƠNG TIỆN */}
          <div className="bg-white p-4.5 rounded-xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="text-[11px] font-bold text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center gap-1.5 text-teal-800">
              <Car className="w-4 h-4 text-teal-600" /> III. Vị Trí Đỗ Xe & Phương Tiện
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1">
                  Vị trí / Ô đỗ phân công cụ thể
                </label>
                <input
                  type="text"
                  name="parking_spot"
                  value={formData.parking_spot}
                  onChange={handleChange}
                  placeholder="VD: Slot #A-12 hoặc Chỗ đỗ tự do"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-teal-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1">
                  Biển số xe / Loại xe đăng ký
                </label>
                <input
                  type="text"
                  name="license_plate"
                  value={formData.license_plate}
                  onChange={handleChange}
                  placeholder="VD: 65A-123.45"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-teal-600"
                />
              </div>
            </div>
          </div>

          {/* SECTION IV: ĐIỀU KHOẢN PHÁP LÝ HỢP ĐỒNG */}
          <div className="bg-white p-4.5 rounded-xl border border-slate-200/80 shadow-xs space-y-3">
            <div className="text-[11px] font-bold text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-teal-800">
                <ShieldCheck className="w-4 h-4 text-teal-600" /> IV. Bản Thảo Điều Khoản Hợp Đồng
              </span>
              <span className="text-[10px] text-slate-400 font-normal">Chuẩn Bộ luật Dân sự 2015 & Luật GDĐT</span>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50/50">
              {/* TAB NAVIGATION */}
              <div className="flex border-b border-slate-200 bg-slate-100/80 overflow-x-auto text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setActiveTermsTab('customer')}
                  className={`px-4 py-2.5 border-b-2 whitespace-nowrap transition ${
                    activeTermsTab === 'customer'
                      ? 'border-teal-700 text-teal-800 bg-white font-bold'
                      : 'border-transparent text-slate-600 hover:text-slate-900'
                  }`}
                >
                  1. Nghĩa vụ Khách Thuê
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTermsTab('owner')}
                  className={`px-4 py-2.5 border-b-2 whitespace-nowrap transition ${
                    activeTermsTab === 'owner'
                      ? 'border-teal-700 text-teal-800 bg-white font-bold'
                      : 'border-transparent text-slate-600 hover:text-slate-900'
                  }`}
                >
                  2. Nghĩa vụ Chủ Bãi
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTermsTab('termination')}
                  className={`px-4 py-2.5 border-b-2 whitespace-nowrap transition ${
                    activeTermsTab === 'termination'
                      ? 'border-teal-700 text-teal-800 bg-white font-bold'
                      : 'border-transparent text-slate-600 hover:text-slate-900'
                  }`}
                >
                  3. Chấm Dứt Hợp Đồng
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTermsTab('dispute')}
                  className={`px-4 py-2.5 border-b-2 whitespace-nowrap transition ${
                    activeTermsTab === 'dispute'
                      ? 'border-teal-700 text-teal-800 bg-white font-bold'
                      : 'border-transparent text-slate-600 hover:text-slate-900'
                  }`}
                >
                  4. Tranh Chấp
                </button>
              </div>

              {/* TAB PANEL */}
              <div className="p-3 bg-white">
                {activeTermsTab === 'customer' && (
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                      Nghĩa vụ và trách nhiệm của Bên B (Khách thuê):
                    </label>
                    <textarea
                      name="customer_obligations"
                      rows="4"
                      value={formData.customer_obligations}
                      onChange={handleChange}
                      className="w-full p-3 border border-slate-300 rounded-lg text-xs font-normal text-slate-800 leading-relaxed focus:outline-none focus:ring-2 focus:ring-teal-600"
                    />
                  </div>
                )}

                {activeTermsTab === 'owner' && (
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                      Nghĩa vụ và trách nhiệm trông giữ của Bên A (Chủ bãi):
                    </label>
                    <textarea
                      name="owner_obligations"
                      rows="4"
                      value={formData.owner_obligations}
                      onChange={handleChange}
                      className="w-full p-3 border border-slate-300 rounded-lg text-xs font-normal text-slate-800 leading-relaxed focus:outline-none focus:ring-2 focus:ring-teal-600"
                    />
                  </div>
                )}

                {activeTermsTab === 'termination' && (
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                      Các căn cứ và điều kiện chấm dứt hợp đồng:
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

                {activeTermsTab === 'dispute' && (
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                      Cơ quan có thẩm quyền giải quyết tranh chấp:
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
