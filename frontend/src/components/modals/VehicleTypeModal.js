import React, { useState, useEffect } from 'react';
import { X, Car, Loader2, AlertCircle } from 'lucide-react';
import vehicleTypeService from '../../services/vehicleTypeService';


const VehicleTypeModal = ({
  isOpen,
  onClose,
  onSuccess,
  vehicleType = null 
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

  
  const handleCodeChange = (e) => {
    const rawVal = e.target.value;
    const formatted = rawVal.toUpperCase().replace(/\s+/g, '_');
    handleChange('type_code', formatted);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    
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
        
        await vehicleTypeService.updateVehicleType(vehicleType.id, payload);
        onSuccess(`Cập nhật loại phương tiện "${cleanName}" thành công!`);
      } else {
        
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-950/60 animate-fadeIn">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="vehicle-type-modal-title"
        className="flex max-h-[calc(100vh-2rem)] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-gray-200 px-6 py-5 sm:px-8">
          <div>
            <div className="mb-1 flex items-center gap-2 text-sm font-medium text-neighbor-700">
              <Car className="h-4 w-4" />
              Danh mục loại phương tiện
            </div>
            <h3 id="vehicle-type-modal-title" className="text-xl font-semibold text-gray-900 sm:text-2xl">
              {isEdit ? 'Chỉnh sửa loại phương tiện' : 'Thêm loại phương tiện'}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {isEdit ? 'Cập nhật thông tin hiển thị trong danh mục.' : 'Nhập thông tin cho loại phương tiện mới.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            aria-label="Đóng"
            className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-800 disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 space-y-6 overflow-y-auto px-6 py-6 sm:px-8">
          {error && (
            <div className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700" role="alert">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="vehicle-type-code" className="mb-2 block text-sm font-medium text-gray-700">
                Mã loại phương tiện <span className="text-red-600">*</span>
              </label>
              <input
                id="vehicle-type-code"
                type="text"
                value={formData.type_code}
                onChange={handleCodeChange}
                placeholder="Ví dụ: CAR_16_SEATER"
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 font-mono text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-neighbor-600 focus:ring-2 focus:ring-neighbor-100"
                required
              />
              <p className="mt-2 text-xs text-gray-500">Viết hoa, không dấu, dùng dấu gạch dưới để ngăn cách.</p>
            </div>

            <div>
              <label htmlFor="vehicle-type-name" className="mb-2 block text-sm font-medium text-gray-700">
                Tên loại phương tiện <span className="text-red-600">*</span>
              </label>
              <input
                id="vehicle-type-name"
                type="text"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="Ví dụ: Xe khách 16 chỗ"
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-neighbor-600 focus:ring-2 focus:ring-neighbor-100"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="vehicle-type-description" className="mb-2 block text-sm font-medium text-gray-700">
              Mô tả <span className="font-normal text-gray-500">(không bắt buộc)</span>
            </label>
            <textarea
              id="vehicle-type-description"
              rows="5"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Thông tin nhận biết hoặc các mẫu xe thuộc loại này"
              className="w-full resize-y rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-neighbor-600 focus:ring-2 focus:ring-neighbor-100"
              maxLength="500"
            />
            <div className="mt-1 text-right text-xs text-gray-500">
              {formData.description.length}/500 ký tự
            </div>
          </div>

          <div className="flex items-center justify-between gap-4 border-t border-gray-200 pt-5">
            <div>
              <span className="block text-sm font-medium text-gray-800">Đang hoạt động</span>
              <span className="text-xs text-gray-500">
                {formData.is_active
                  ? 'Chủ bãi xe có thể chọn loại phương tiện này.'
                  : 'Ẩn khỏi danh mục đăng ký mới.'}
              </span>
            </div>
            <label className="relative inline-flex shrink-0 cursor-pointer items-center">
              <input
                type="checkbox"
                aria-label="Đang hoạt động"
                checked={formData.is_active}
                onChange={(e) => handleChange('is_active', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-neighbor-600"></div>
            </label>
          </div>
          </div>

          <div className="flex shrink-0 items-center justify-end gap-3 border-t border-gray-200 bg-white px-6 py-4 sm:px-8">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-lg px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-100 disabled:opacity-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 rounded-lg bg-neighbor-700 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-neighbor-800 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Đang lưu...
                </>
              ) : (
                isEdit ? 'Lưu thay đổi' : 'Thêm loại phương tiện'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VehicleTypeModal;

