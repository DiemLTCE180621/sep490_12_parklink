import React, { useState, useEffect } from 'react';
import { X, Car, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import vehicleTypeService from '../../services/vehicleTypeService';

/**
 * Modal Tạo Mới (M2-UC98) & Cập Nhật (M2-UC100) Loại Phương Tiện
 */
const VehicleTypeModal = ({
  isOpen,
  onClose,
  onSuccess,
  vehicleType = null // null: Chế độ Tạo mới, có object: Chế độ Chỉnh sửa
}) => {
  const isEdit = Boolean(vehicleType && vehicleType.id);

  const [formData, setFormData] = useState({
    type_code: '',
    name: '',
    description: '',
    is_active: true
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Cập nhật formData khi mở modal
  useEffect(() => {
    if (isOpen) {
      setError('');
      if (vehicleType) {
        setFormData({
          type_code: vehicleType.type_code || '',
          name: vehicleType.name || '',
          description: vehicleType.description || '',
          is_active: vehicleType.is_active !== undefined ? Boolean(vehicleType.is_active) : true
        });
      } else {
        setFormData({
          type_code: '',
          name: '',
          description: '',
          is_active: true
        });
      }
    }
  }, [isOpen, vehicleType]);

  if (!isOpen) return null;

  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }));
    if (error) setError('');
  };

  // Tự động chuẩn hóa mã phương tiện (viết hoa và thay khoảng trắng bằng dấu gạch dưới)
  const handleCodeChange = (e) => {
    const rawVal = e.target.value;
    const formatted = rawVal.toUpperCase().replace(/\s+/g, '_');
    handleChange('type_code', formatted);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Kiểm tra dữ liệu đầu vào phía Client
    const cleanCode = formData.type_code.trim();
    const cleanName = formData.name.trim();

    if (!cleanCode) {
      setError('Vui lòng nhập mã loại phương tiện (VD: CAR_16_SEATER).');
      return;
    }

    if (!/^[A-Z0-9_]{2,50}$/.test(cleanCode)) {
      setError('Mã loại phương tiện chỉ được chứa chữ cái, số, gạch dưới (_) và từ 2-50 ký tự.');
      return;
    }

    if (!cleanName) {
      setError('Vui lòng nhập tên loại phương tiện.');
      return;
    }

    if (cleanName.length < 2 || cleanName.length > 100) {
      setError('Tên loại phương tiện phải có độ dài từ 2 đến 100 ký tự.');
      return;
    }

    if (formData.description && formData.description.length > 500) {
      setError('Mô tả không được vượt quá 500 ký tự.');
      return;
    }

    const payload = {
      type_code: cleanCode,
      name: cleanName,
      description: formData.description ? formData.description.trim() : null,
      is_active: Boolean(formData.is_active)
    };

    try {
      setSubmitting(true);
      if (isEdit) {
        // M2-UC100: Cập nhật
        await vehicleTypeService.updateVehicleType(vehicleType.id, payload);
        onSuccess(`Cập nhật loại phương tiện "${cleanName}" thành công!`);
      } else {
        // M2-UC98: Tạo mới
        await vehicleTypeService.createVehicleType(payload);
        onSuccess(`Tạo mới loại phương tiện "${cleanName}" thành công!`);
      }
      onClose();
    } catch (err) {
      setError(err.message || 'Đã xảy ra lỗi khi lưu thông tin loại phương tiện.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn">
      <div
        className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-lg overflow-hidden transform transition-all duration-300 scale-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center border border-teal-100 shadow-sm">
              <Car className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                {isEdit ? 'Cập Nhật Loại Phương Tiện' : 'Thêm Loại Phương Tiện Mới'}
              </h3>
              <p className="text-xs text-slate-500">
                {isEdit ? 'Chỉnh sửa thông tin danh mục xe trên hệ thống' : 'Khai báo loại xe mới cho các bãi đỗ xe áp dụng'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={submitting}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-xs text-red-600">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Type Code */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Mã Loại Phương Tiện (Type Code) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.type_code}
              onChange={handleCodeChange}
              placeholder="VD: CAR_16_SEATER, MOTORBIKE..."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition"
              required
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Mã duy nhất, viết hoa, không dấu, ngăn cách bằng gạch dưới.
            </p>
          </div>

          {/* Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Tên Loại Phương Tiện <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="VD: Xe khách 16 chỗ (Ford Transit, Solati)"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Mô Tả Chi Tiết (Tùy chọn)
            </label>
            <textarea
              rows="3"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Mô tả thông số hoặc các mẫu xe tiêu biểu thuộc nhóm này..."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition resize-none"
              maxLength="500"
            />
            <div className="text-right text-[11px] text-slate-400 mt-0.5">
              {formData.description.length}/500 ký tự
            </div>
          </div>

          {/* Is Active Toggle */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-800 block">Kích hoạt hoạt động</span>
              <span className="text-[11px] text-slate-500">
                {formData.is_active
                  ? 'Loại xe này sẽ sẵn sàng để chủ bãi xe lựa chọn khi đăng ký.'
                  : 'Tạm ngưng, không hiển thị trong danh mục đăng ký mới.'}
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => handleChange('is_active', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
            </label>
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
            >
              Hủy Bỏ
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center gap-2 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Đang lưu...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  {isEdit ? 'Cập Nhật' : 'Thêm Mới'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VehicleTypeModal;

