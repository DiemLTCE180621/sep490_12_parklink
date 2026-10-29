import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, DollarSign, Save, AlertCircle, CheckCircle2,
  Loader2, Calculator, Sparkles, Power
} from 'lucide-react';
import platformFeeService from '../../services/platformFeeService';

const AdminPlatformFeeEditPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    min_slots: '1',
    max_slots: '3',
    is_unlimited_max: false,
    fee_amount: '',
    description: '',
    is_active: true
  });

  // Tải thông tin gói biểu phí cần sửa
  useEffect(() => {
    const loadFeeData = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await platformFeeService.getPlatformFeeById(id);
        const fee = res?.data || res;

        if (!fee) {
          setError('Không tìm thấy thông tin gói biểu phí yêu cầu.');
          return;
        }

        const isUnlimited = fee.max_slots === null || fee.max_slots === undefined || fee.max_slots >= 900;

        setFormData({
          name: fee.name || '',
          min_slots: fee.min_slots !== undefined && fee.min_slots !== null ? String(fee.min_slots) : '1',
          max_slots: isUnlimited ? '' : String(fee.max_slots || ''),
          is_unlimited_max: isUnlimited,
          fee_amount: fee.fee_amount !== undefined && fee.fee_amount !== null ? String(fee.fee_amount) : '',
          description: fee.description || '',
          is_active: fee.is_active ?? true
        });
      } catch (err) {
        setError(err.message || 'Không thể tải chi tiết gói phí nền tảng');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadFeeData();
    }
  }, [id]);

  // Xử lý thay đổi trường dữ liệu
  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  // Submit cập nhật gói biểu phí nền tảng (Khung Min - Max)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim()) {
      setError('Vui lòng nhập tên gói biểu phí.');
      return;
    }

    const minSlots = parseInt(formData.min_slots, 10);
    if (isNaN(minSlots) || minSlots < 1) {
      setError('Số lượng slot tối thiểu (Min) phải là số nguyên lớn hơn hoặc bằng 1.');
      return;
    }

    let maxSlots = null;
    if (!formData.is_unlimited_max) {
      maxSlots = parseInt(formData.max_slots, 10);
      if (isNaN(maxSlots) || maxSlots < minSlots) {
        setError(`Số lượng slot tối đa (Max) phải lớn hơn hoặc bằng slot tối thiểu (${minSlots}).`);
        return;
      }
    }

    const amount = parseFloat(formData.fee_amount);
    if (isNaN(amount) || amount < 0) {
      setError('Mức phí nền tảng phải là số dương hợp lệ.');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        name: formData.name.trim(),
        min_slots: minSlots,
        max_slots: maxSlots,
        fee_amount: amount,
        description: formData.description ? formData.description.trim() : null,
        is_active: formData.is_active
      };

      await platformFeeService.updatePlatformFee(id, payload);

      // Chuyển hướng về tab biểu phí của admin dashboard kèm thông báo thành công
      navigate('/dashboard', {
        replace: true,
        state: {
          adminTab: 'platform-fees',
          message: `Cập nhật gói biểu phí "${payload.name}" thành công!`,
          type: 'success'
        }
      });
    } catch (err) {
      setError(err.message || 'Lỗi khi cập nhật gói biểu phí');
    } finally {
      setSaving(false);
    }
  };

  const parsedAmount = parseFloat(formData.fee_amount) || 0;
  const parsedMin = parseInt(formData.min_slots, 10) || 1;
  const parsedMax = formData.is_unlimited_max ? null : (parseInt(formData.max_slots, 10) || parsedMin);

  if (loading) {
    return (
      <div className="py-20 bg-slate-50 flex flex-col items-center justify-center p-6 text-slate-500">
        <Loader2 className="w-9 h-9 animate-spin text-teal-600 mb-3" />
        <p className="font-semibold text-sm">Đang tải thông tin gói biểu phí...</p>
      </div>
    );
  }

  // Nhãn quy mô slot mô phỏng trên thẻ
  const slotBadgeText = formData.is_unlimited_max
    ? `Từ ${parsedMin} chỗ trở lên`
    : (parsedMin === parsedMax ? `${parsedMin} chỗ` : `${parsedMin} – ${parsedMax} chỗ`);

  return (
    <div className="py-6 sm:py-8 px-4 sm:px-6 lg:px-8 bg-slate-50 w-full">
      <div className="w-full max-w-6xl mx-auto space-y-4">
        {/* Nút quay lại */}
        <button
          type="button"
          onClick={() => navigate('/dashboard', { state: { adminTab: 'platform-fees' } })}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-teal-700 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Quay lại Quản lý Biểu Phí
        </button>

        {/* Khung Form Duy Nhất Trải Rộng Toàn Màn Hình */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-md overflow-hidden w-full">
          {/* Header Card Banner */}
          <div className="px-6 sm:px-8 py-5 border-b border-slate-100 bg-gradient-to-r from-slate-900 via-slate-800 to-teal-950 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-teal-500 text-slate-900 flex items-center justify-center font-black shadow-md">
                <DollarSign className="w-6 h-6 text-slate-950" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                  <span>Chỉnh Sửa Gói Biểu Phí</span>
                  <span className="text-xs font-mono font-bold text-teal-300 bg-white/10 px-2 py-0.5 rounded-md border border-white/10">
                    #{id}
                  </span>
                </h1>
                <p className="text-xs sm:text-sm text-teal-300/90 mt-0.5">
                  Cấu hình mức phí nền tảng thu 1 lần theo khung quy mô chỗ đỗ (Khung Min – Max)
                </p>
              </div>
            </div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-white/10 backdrop-blur-md rounded-xl text-xs font-bold text-teal-200 border border-white/10 self-start sm:self-auto">
              <Sparkles className="w-4 h-4 text-teal-400" />
              <span>Ninh Kiều, Cần Thơ</span>
            </div>
          </div>

          {/* Nội dung form bên trong khung */}
          <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-5">
            {/* Banner Lỗi nếu có */}
            {error && (
              <div className="p-3.5 bg-red-50 text-red-700 rounded-xl border border-red-200 flex items-start gap-2.5 text-xs font-medium">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold">Không thể lưu thông tin</h4>
                  <p className="mt-0.5">{error}</p>
                </div>
              </div>
            )}

            {/* Hàng 1: Tên Gói & Mức Phí Nền Tảng */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Tên Gói Biểu Phí <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="Ví dụ: Gói Bãi Xe Nhỏ (1 - 3 chỗ)"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-800 text-sm font-semibold transition bg-slate-50/40 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Mức Phí Nền Tảng (Thu 1 lần) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="50000"
                    min="0"
                    required
                    value={formData.fee_amount}
                    onChange={(e) => handleChange('fee_amount', e.target.value)}
                    placeholder="Ví dụ: 2000000"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-800 text-sm font-extrabold transition pr-16 bg-slate-50/40 focus:bg-white"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400">
                    VNĐ
                  </span>
                </div>
              </div>
            </div>

            {/* Hàng 2: Slot Min & Slot Max (Cân đối 2 cột như Hàng 1) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Slot Tối Thiểu (Min) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={formData.min_slots}
                  onChange={(e) => handleChange('min_slots', e.target.value)}
                  placeholder="1"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-800 text-sm font-bold transition bg-slate-50/40 focus:bg-white"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    Slot Tối Đa (Max) {!formData.is_unlimited_max && <span className="text-red-500">*</span>}
                  </label>
                  <label className="flex items-center gap-1.5 text-xs text-teal-700 font-bold cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={formData.is_unlimited_max}
                      onChange={(e) => handleChange('is_unlimited_max', e.target.checked)}
                      className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 w-3.5 h-3.5"
                    />
                    <span>Không giới hạn</span>
                  </label>
                </div>
                <input
                  type="number"
                  min={parsedMin}
                  disabled={formData.is_unlimited_max}
                  required={!formData.is_unlimited_max}
                  value={formData.is_unlimited_max ? '' : formData.max_slots}
                  onChange={(e) => handleChange('max_slots', e.target.value)}
                  placeholder={formData.is_unlimited_max ? 'Không giới hạn (∞)' : '3'}
                  className={`w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-800 text-sm font-bold transition ${formData.is_unlimited_max ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-slate-50/40 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500'}`}
                />
              </div>
            </div>

            {/* Hàng 3: Trạng Thái Hoạt Động (Xuống hàng riêng, 2 card cân đối rộng rãi và trực quan) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">
                Trạng Thái Hoạt Động <span className="text-slate-400 font-normal">(Thiết lập hiệu lực áp dụng của gói biểu phí)</span>
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Card Kích hoạt */}
                <button
                  type="button"
                  onClick={() => handleChange('is_active', true)}
                  className={`p-3.5 rounded-2xl border-2 transition-all flex items-center justify-between text-left ${formData.is_active
                    ? 'border-emerald-500 bg-emerald-50/70 shadow-sm ring-1 ring-emerald-500/20'
                    : 'border-slate-200 hover:border-slate-300 bg-slate-50/30 text-slate-600'
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${formData.is_active ? 'bg-emerald-500 text-white shadow-xs' : 'bg-slate-200 text-slate-400'
                      }`}>
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div>
                      <div className={`text-sm font-bold ${formData.is_active ? 'text-emerald-950 font-extrabold' : 'text-slate-800'}`}>
                        Kích Hoạt Ngay
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        Gói biểu phí sẵn sàng áp dụng cho đối tác đăng ký bãi xe
                      </div>
                    </div>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ml-2 ${formData.is_active ? 'border-emerald-600 bg-emerald-600' : 'border-slate-300 bg-white'
                    }`}>
                    {formData.is_active && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                </button>

                {/* Card Tạm ngưng */}
                <button
                  type="button"
                  onClick={() => handleChange('is_active', false)}
                  className={`p-3.5 rounded-2xl border-2 transition-all flex items-center justify-between text-left ${!formData.is_active
                    ? 'border-amber-500 bg-amber-50/70 shadow-sm ring-1 ring-amber-500/20'
                    : 'border-slate-200 hover:border-slate-300 bg-slate-50/30 text-slate-600'
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${!formData.is_active ? 'bg-amber-500 text-white shadow-xs' : 'bg-slate-200 text-slate-400'
                      }`}>
                      <Power className="w-5 h-5" />
                    </div>
                    <div>
                      <div className={`text-sm font-bold ${!formData.is_active ? 'text-amber-950 font-extrabold' : 'text-slate-800'}`}>
                        Tạm Ngưng Áp Dụng
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        Lưu dạng tạm hoãn, chưa đưa vào tính toán phí trên hệ thống
                      </div>
                    </div>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ml-2 ${!formData.is_active ? 'border-amber-600 bg-amber-600' : 'border-slate-300 bg-white'
                    }`}>
                    {!formData.is_active && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                </button>
              </div>
            </div>

            {/* Thanh Tóm Tắt Quy Tắc Áp Dụng */}
            {parsedAmount > 0 && !isNaN(parsedMin) && (
              <div className="p-3.5 bg-teal-50/80 border border-teal-200/90 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs sm:text-sm">
                <div className="flex items-center gap-2.5 text-teal-950 font-medium">
                  <Calculator className="w-4 h-4 text-teal-600 shrink-0" />
                  <span>
                    Quy tắc áp dụng: Áp dụng mức phí cố định{' '}
                    <strong className="text-teal-900 font-extrabold">{parsedAmount.toLocaleString('vi-VN')} VNĐ</strong> cho bãi xe{' '}
                    <strong className="text-teal-900 font-extrabold">
                      {formData.is_unlimited_max
                        ? `từ ${parsedMin} chỗ trở lên`
                        : (!isNaN(parsedMax) && parsedMin === parsedMax
                            ? `đúng ${parsedMin} chỗ`
                            : `từ ${parsedMin} – ${!isNaN(parsedMax) ? parsedMax : '...'} chỗ`)}
                    </strong>.
                  </span>
                </div>
                <span className="font-extrabold text-teal-800 bg-white px-3 py-1 rounded-xl border border-teal-200 shadow-2xs shrink-0 self-start sm:self-auto text-xs">
                  {parsedAmount.toLocaleString('vi-VN')} VNĐ / bãi
                </span>
              </div>
            )}

            {/* Mô Tả Gói Phí */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Mô Tả Chi Tiết <span className="text-slate-400 font-normal">(Tùy chọn)</span>
              </label>
              <textarea
                rows="2"
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="Nhập ghi chú hoặc mô tả về gói biểu phí này..."
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-800 font-medium text-sm transition resize-none bg-slate-50/40 focus:bg-white"
              />
            </div>

            {/* Nút Hành Động */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                disabled={saving}
                onClick={() => navigate('/dashboard', { state: { adminTab: 'platform-fees' } })}
                className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-bold text-xs sm:text-sm transition"
              >
                Hủy Bỏ
              </button>

              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white rounded-xl font-bold text-xs sm:text-sm shadow-md shadow-teal-600/20 transition flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Đang Lưu...</span>
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
  );
};

export default AdminPlatformFeeEditPage;
