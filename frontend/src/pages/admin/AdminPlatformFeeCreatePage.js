import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Plus,
  Loader2, Calculator, CheckCircle2,
  Power
} from 'lucide-react';
import platformFeeService from '../../services/platformFeeService';
import Toast from '../../components/common/Toast';

const AdminPlatformFeeCreatePage = () => {
  const navigate = useNavigate();

  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);
  const [existingFees, setExistingFees] = useState([]);

  const [formData, setFormData] = useState({
    name: '',
    min_slots: '',
    max_slots: '',
    fee_amount: '',
    description: '',
    is_active: true
  });

  // Tải danh sách các gói biểu phí hiện có để kiểm tra trùng khung slot ngay trên giao diện
  useEffect(() => {
    const fetchExistingFees = async () => {
      try {
        const res = await platformFeeService.getPlatformFees();
        const fees = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
        setExistingFees(fees);
      } catch (err) {
        console.error('Không thể tải danh sách biểu phí hiện có:', err);
      }
    };
    fetchExistingFees();
  }, []);

  // Xử lý thay đổi trường dữ liệu
  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  // Submit tạo mới gói biểu phí nền tảng theo quy mô Min - Max
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      setToast({ message: 'Vui lòng nhập tên gói biểu phí.', type: 'error' });
      return;
    }

    const minSlots = parseInt(formData.min_slots, 10);
    if (isNaN(minSlots) || minSlots < 1) {
      setToast({ message: 'Số lượng slot tối thiểu (Min) phải là số nguyên lớn hơn hoặc bằng 1.', type: 'error' });
      return;
    }

    if (minSlots > 15) {
      setToast({ message: 'Mô hình hộ gia đình chỉ hỗ trợ tối đa 15 chỗ đỗ.', type: 'error' });
      return;
    }

    if (!formData.max_slots) {
      setToast({ message: 'Vui lòng nhập số lượng slot tối đa (Max).', type: 'error' });
      return;
    }

    const maxSlots = parseInt(formData.max_slots, 10);
    if (isNaN(maxSlots) || maxSlots < minSlots) {
      setToast({ message: `Số lượng slot tối đa (Max) phải lớn hơn hoặc bằng slot tối thiểu (${minSlots}).`, type: 'error' });
      return;
    }

    if (maxSlots > 15) {
      setToast({ message: 'Mô hình hộ gia đình chỉ hỗ trợ tối đa 15 chỗ đỗ.', type: 'error' });
      return;
    }

    // Kiểm tra trùng lặp (chồng lấn) với các gói đã có trong hệ thống
    for (const fee of existingFees) {
      const existingMin = fee.min_slots;
      const existingMax = fee.max_slots !== null ? fee.max_slots : 15;

      // Công thức kiểm tra giao thoa: minA <= maxB && maxA >= minB
      if (minSlots <= existingMax && maxSlots >= existingMin) {
        setToast({
          message: `Khung quy mô (${minSlots} - ${maxSlots} chỗ) bị trùng với gói "${fee.name}" (${existingMin} - ${existingMax} chỗ). Vui lòng điều chỉnh lại!`,
          type: 'error'
        });
        return;
      }
    }

    const amount = parseFloat(formData.fee_amount);
    if (isNaN(amount) || amount < 0) {
      setToast({ message: 'Mức phí nền tảng phải là số dương hợp lệ.', type: 'error' });
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        name: formData.name.trim(),
        min_slots: minSlots,
        max_slots: maxSlots,
        fee_amount: amount,
        description: formData.description ? formData.description.trim() : null,
        is_active: formData.is_active
      };

      await platformFeeService.createPlatformFee(payload);

      // Chuyển hướng về tab biểu phí của admin dashboard kèm thông báo thành công
      navigate('/dashboard', {
        replace: true,
        state: {
          adminTab: 'platform-fees',
          message: `Thêm mới gói biểu phí "${payload.name}" thành công!`,
          type: 'success'
        }
      });
    } catch (err) {
      setToast({ message: err.message || 'Lỗi khi tạo mới gói biểu phí', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const parsedAmount = parseFloat(formData.fee_amount) || 0;
  const parsedMin = parseInt(formData.min_slots, 10);
  const parsedMax = parseInt(formData.max_slots, 10);

  return (
    <div className="py-6 px-4 sm:px-6 lg:px-8 bg-slate-50 w-full min-h-[calc(100vh-70px)] flex flex-col justify-between">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
          duration={2500}
        />
      )}

      <div className="w-full max-w-6xl mx-auto flex-1 flex flex-col space-y-3">
        {/* Nút quay lại */}
        <button
          type="button"
          onClick={() => navigate('/dashboard', { state: { adminTab: 'platform-fees' } })}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-teal-700 transition w-fit"
        >
          <ArrowLeft className="w-4 h-4" /> Quay lại Quản lý Biểu Phí
        </button>

        {/* Khung Form Duy Nhất Trải Rộng Toàn Màn Hình */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-md overflow-hidden w-full flex-1 flex flex-col">
          {/* Header Card Banner */}
          <div className="px-6 sm:px-8 py-5 border-b border-slate-200 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-teal-50 text-teal-600 border border-teal-100 flex items-center justify-center font-black shadow-sm shrink-0">
                <Plus className="w-6 h-6 text-teal-600" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                  Tạo Mới Gói Biểu Phí Nền Tảng
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                  Cấu hình mức phí nền tảng thu 1 lần theo quy mô chỗ đỗ hộ gia đình (Tối đa 15 chỗ)
                </p>
              </div>
            </div>
          </div>

          {/* Nội dung form bên trong khung */}
          <form onSubmit={handleSubmit} className="p-6 sm:p-8 flex-1 flex flex-col justify-between space-y-6">
            <div className="space-y-6">
              {/* Hàng 1: Tên Gói & Mức Phí Nền Tảng */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">
                    Tên Gói Biểu Phí <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    placeholder="Ví dụ: Gói Bãi Xe Nhỏ (1 - 3 chỗ)"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-800 text-sm font-semibold transition bg-slate-50/40 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">
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
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-800 text-sm font-extrabold transition pr-16 bg-slate-50/40 focus:bg-white"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400">
                      VNĐ
                    </span>
                  </div>
                </div>
              </div>

              {/* Hàng 2: Slot Min & Slot Max (Giới hạn tối đa 15 chỗ) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold text-slate-700">
                      Slot Tối Thiểu (Min) <span className="text-red-500">*</span>
                    </label>
                    <span className="text-[11px] font-semibold text-slate-400">Từ 1 đến 15 chỗ</span>
                  </div>
                  <input
                    type="number"
                    min="1"
                    max="15"
                    required
                    value={formData.min_slots}
                    onChange={(e) => handleChange('min_slots', e.target.value)}
                    placeholder="Ví dụ: 1"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-800 text-sm font-bold transition bg-slate-50/40 focus:bg-white"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold text-slate-700">
                      Slot Tối Đa (Max) <span className="text-red-500">*</span>
                    </label>
                    <span className="text-[11px] font-semibold text-teal-600 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-100">
                      Tối đa 15 chỗ
                    </span>
                  </div>
                  <input
                    type="number"
                    min={!isNaN(parsedMin) && parsedMin >= 1 ? parsedMin : 1}
                    max="15"
                    required
                    value={formData.max_slots}
                    onChange={(e) => handleChange('max_slots', e.target.value)}
                    placeholder="Ví dụ: 3 (tối đa 15)"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-800 text-sm font-bold transition bg-slate-50/40 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              {/* Hàng 3: Trạng Thái Áp Dụng */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  Trạng Thái Áp Dụng <span className="text-slate-400 font-normal">(Thiết lập hiệu lực áp dụng của gói biểu phí)</span>
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Card Kích hoạt */}
                  <button
                    type="button"
                    onClick={() => handleChange('is_active', true)}
                    className={`p-4 rounded-2xl border-2 transition-all flex items-center justify-between text-left ${formData.is_active
                      ? 'border-emerald-500 bg-emerald-50/70 shadow-sm ring-1 ring-emerald-500/20'
                      : 'border-slate-200 hover:border-slate-300 bg-slate-50/30 text-slate-600'
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${formData.is_active ? 'bg-emerald-500 text-white shadow-xs' : 'bg-slate-200 text-slate-400'
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
                    className={`p-4 rounded-2xl border-2 transition-all flex items-center justify-between text-left ${!formData.is_active
                      ? 'border-amber-500 bg-amber-50/70 shadow-sm ring-1 ring-amber-500/20'
                      : 'border-slate-200 hover:border-slate-300 bg-slate-50/30 text-slate-600'
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${!formData.is_active ? 'bg-amber-500 text-white shadow-xs' : 'bg-slate-200 text-slate-400'
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
                <div className="p-4 bg-teal-50/80 border border-teal-200/90 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs sm:text-sm">
                  <div className="flex items-center gap-2.5 text-teal-950 font-medium">
                    <Calculator className="w-5 h-5 text-teal-600 shrink-0" />
                    <span>
                      Quy tắc áp dụng: Áp dụng mức phí cố định{' '}
                      <strong className="text-teal-900 font-extrabold">{parsedAmount.toLocaleString('vi-VN')} VNĐ</strong> cho bãi xe{' '}
                      <strong className="text-teal-900 font-extrabold">
                        {!isNaN(parsedMax) && parsedMin === parsedMax
                          ? `đúng ${parsedMin} chỗ`
                          : `từ ${parsedMin} – ${!isNaN(parsedMax) ? parsedMax : '...'} chỗ`}
                      </strong>.
                    </span>
                  </div>
                  <span className="font-extrabold text-teal-800 bg-white px-3.5 py-1.5 rounded-xl border border-teal-200 shadow-2xs shrink-0 self-start sm:self-auto text-xs">
                    {parsedAmount.toLocaleString('vi-VN')} VNĐ / bãi
                  </span>
                </div>
              )}

              {/* Mô Tả Gói Phí */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  Mô Tả Chi Tiết <span className="text-slate-400 font-normal">(Tùy chọn)</span>
                </label>
                <textarea
                  rows="3"
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  placeholder="Nhập ghi chú hoặc mô tả về gói biểu phí này..."
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-800 font-medium text-sm transition resize-none bg-slate-50/40 focus:bg-white"
                />
              </div>
            </div>

            {/* Nút Hành Động */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3 mt-4">
              <button
                type="button"
                disabled={submitting}
                onClick={() => navigate('/dashboard', { state: { adminTab: 'platform-fees' } })}
                className="px-6 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-bold text-sm transition"
              >
                Hủy Bỏ
              </button>

              <button
                type="submit"
                disabled={submitting}
                className="px-8 py-2.5 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white rounded-xl font-bold text-sm shadow-md shadow-teal-600/20 transition flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Đang Tạo Gói Phí...</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span>Tạo Gói Biểu Phí</span>
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

export default AdminPlatformFeeCreatePage;
