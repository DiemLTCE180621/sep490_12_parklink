import React, { useState, useEffect } from 'react';
import {
  X, Layers, Loader2, ShieldCheck, Camera, Umbrella,
  UserCheck, Sun, Flame, Zap, Wifi, Car, Coffee,
  Lock, Clock, BatteryCharging, MapPin, Wrench, HelpCircle
} from 'lucide-react';
import amenityService from '../../services/amenityService';

const ICON_OPTIONS = [
  { value: 'shield-check', label: 'Bảo vệ / An toàn', icon: ShieldCheck },
  { value: 'camera', label: 'Camera an ninh', icon: Camera },
  { value: 'umbrella', label: 'Mái che mưa nắng', icon: Umbrella },
  { value: 'user-check', label: 'Bảo vệ trực trực tiếp', icon: UserCheck },
  { value: 'sun', label: 'Hệ thống chiếu sáng', icon: Sun },
  { value: 'flame', label: 'PCCC đạt chuẩn', icon: Flame },
  { value: 'battery-charging', label: 'Trạm sạc xe điện', icon: BatteryCharging },
  { value: 'zap', label: 'Nguồn điện sạc', icon: Zap },
  { value: 'wifi', label: 'Wifi miễn phí', icon: Wifi },
  { value: 'car', label: 'Chỗ đỗ cố định', icon: Car },
  { value: 'coffee', label: 'Phòng chờ / Nghỉ ngơi', icon: Coffee },
  { value: 'lock', label: 'Khóa an ninh', icon: Lock },
  { value: 'clock', label: 'Hoạt động 24/7', icon: Clock },
  { value: 'map-pin', label: 'Vị trí thuận tiện', icon: MapPin },
  { value: 'wrench', label: 'Hỗ trợ cứu hộ / Bảo dưỡng', icon: Wrench },
  { value: 'default', label: 'Tiện ích chung', icon: HelpCircle }
];

const TYPE_OPTIONS = [
  { value: 'SECURITY', label: 'An ninh & An toàn (SECURITY)' },
  { value: 'SERVICE', label: 'Dịch vụ tiện ích (SERVICE)' },
  { value: 'INFRASTRUCTURE', label: 'Cơ sở hạ tầng (INFRASTRUCTURE)' },
  { value: 'CONVENIENCE', label: 'Tiện nghi bổ sung (CONVENIENCE)' }
];

const AmenityModal = ({ isOpen, onClose, onSuccess, amenity = null }) => {
  const isEdit = Boolean(amenity && amenity.id);

  const [formData, setFormData] = useState({
    name: '',
    icon: 'shield-check',
    type: 'SERVICE',
    is_active: true
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setError('');
      if (amenity) {
        setFormData({
          name: amenity.name || '',
          icon: amenity.icon || 'shield-check',
          type: amenity.type || 'SERVICE',
          is_active: amenity.is_active !== undefined ? Boolean(amenity.is_active) : true
        });
      } else {
        setFormData({
          name: '',
          icon: 'shield-check',
          type: 'SERVICE',
          is_active: true
        });
      }
    }
  }, [isOpen, amenity]);

  if (!isOpen) return null;

  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const cleanName = formData.name.trim();

    if (!cleanName) {
      setError('Vui lòng nhập tên tiện ích.');
      return;
    }

    if (cleanName.length < 2 || cleanName.length > 100) {
      setError('Tên tiện ích phải từ 2 đến 100 ký tự.');
      return;
    }

    const payload = {
      name: cleanName,
      icon: formData.icon ? formData.icon.trim() : null,
      type: formData.type ? formData.type.trim() : null,
      is_active: formData.is_active
    };

    try {
      setSubmitting(true);
      if (isEdit) {
        const res = await amenityService.updateAmenity(amenity.id, payload);
        onSuccess(res?.message || 'Cập nhật tiện ích thành công!');
      } else {
        const res = await amenityService.createAmenity(payload);
        onSuccess(res?.message || 'Tạo mới tiện ích thành công!');
      }
      onClose();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Thao tác không thành công!';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const SelectedIconComp = (ICON_OPTIONS.find((i) => i.value === formData.icon) || ICON_OPTIONS[0]).icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50">
      <div
        className="bg-white rounded-2xl max-w-md w-full shadow-lg border border-slate-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-teal-600" />
            <h3 className="text-base font-bold text-slate-900">
              {isEdit ? 'Chỉnh Sửa Tiện Ích' : 'Thêm Tiện Ích Mới'}
            </h3>
          </div>
          <button
            onClick={onClose}
            disabled={submitting}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Tên tiện ích <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="VD: Mái che mưa nắng, Camera an ninh..."
              className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nhóm danh mục
            </label>
            <select
              value={formData.type}
              onChange={(e) => handleChange('type', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500 bg-white"
            >
              {TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Biểu tượng hiển thị
            </label>
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg bg-slate-100 text-teal-700 border border-slate-200 flex items-center justify-center shrink-0">
                <SelectedIconComp className="w-4 h-4" />
              </div>
              <select
                value={formData.icon}
                onChange={(e) => handleChange('icon', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500 bg-white"
              >
                {ICON_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="pt-2">
            <label className="inline-flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => handleChange('is_active', e.target.checked)}
                className="w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500"
              />
              <span className="text-xs font-medium text-slate-700">
                Kích hoạt hiển thị cho các cơ sở bãi xe lựa chọn
              </span>
            </label>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-xs font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-sm transition flex items-center gap-1.5"
            >
              {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {isEdit ? 'Lưu thay đổi' : 'Tạo tiện ích'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AmenityModal;
