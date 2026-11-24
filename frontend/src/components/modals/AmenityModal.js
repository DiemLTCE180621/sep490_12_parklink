import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  X, Layers, Loader2, ShieldCheck, Camera, Umbrella,
  UserCheck, Sun, Flame, Zap, Wifi, Car, Coffee,
  Lock, Clock, BatteryCharging, MapPin, Wrench, HelpCircle
} from 'lucide-react';
import amenityService from '../../services/amenityService';

const ICON_OPTIONS = [
  { value: 'shield-check', key: 'shieldCheck', defaultLabel: 'Bảo vệ / An toàn', icon: ShieldCheck },
  { value: 'camera', key: 'camera', defaultLabel: 'Camera an ninh', icon: Camera },
  { value: 'umbrella', key: 'umbrella', defaultLabel: 'Mái che mưa nắng', icon: Umbrella },
  { value: 'user-check', key: 'userCheck', defaultLabel: 'Bảo vệ trực trực tiếp', icon: UserCheck },
  { value: 'sun', key: 'sun', defaultLabel: 'Hệ thống chiếu sáng', icon: Sun },
  { value: 'flame', key: 'flame', defaultLabel: 'PCCC đạt chuẩn', icon: Flame },
  { value: 'battery-charging', key: 'batteryCharging', defaultLabel: 'Trạm sạc xe điện', icon: BatteryCharging },
  { value: 'zap', key: 'zap', defaultLabel: 'Nguồn điện sạc', icon: Zap },
  { value: 'wifi', key: 'wifi', defaultLabel: 'Wifi miễn phí', icon: Wifi },
  { value: 'car', key: 'car', defaultLabel: 'Chỗ đỗ cố định', icon: Car },
  { value: 'coffee', key: 'coffee', defaultLabel: 'Phòng chờ / Nghỉ ngơi', icon: Coffee },
  { value: 'lock', key: 'lock', defaultLabel: 'Khóa an ninh', icon: Lock },
  { value: 'clock', key: 'clock', defaultLabel: 'Hoạt động 24/7', icon: Clock },
  { value: 'map-pin', key: 'mapPin', defaultLabel: 'Vị trí thuận tiện', icon: MapPin },
  { value: 'wrench', key: 'wrench', defaultLabel: 'Hỗ trợ cứu hộ / Bảo dưỡng', icon: Wrench },
  { value: 'default', key: 'default', defaultLabel: 'Tiện ích chung', icon: HelpCircle }
];

const TYPE_OPTIONS = [
  { value: 'SECURITY', key: 'SECURITY', defaultLabel: 'An ninh & An toàn (SECURITY)' },
  { value: 'SERVICE', key: 'SERVICE', defaultLabel: 'Dịch vụ tiện ích (SERVICE)' },
  { value: 'INFRASTRUCTURE', key: 'INFRASTRUCTURE', defaultLabel: 'Cơ sở hạ tầng (INFRASTRUCTURE)' },
  { value: 'CONVENIENCE', key: 'CONVENIENCE', defaultLabel: 'Tiện nghi bổ sung (CONVENIENCE)' }
];

const AmenityModal = ({ isOpen, onClose, onSuccess, amenity = null }) => {
  const { t } = useTranslation('admin');
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
      setError(t('amenitySettings.messages.nameRequired', 'Vui lòng nhập tên tiện ích.'));
      return;
    }

    if (cleanName.length < 2 || cleanName.length > 100) {
      setError(t('amenitySettings.messages.nameLength', 'Tên tiện ích phải từ 2 đến 100 ký tự.'));
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
        onSuccess(res?.message || t('amenitySettings.messages.updateSuccess', 'Cập nhật tiện ích thành công!'));
      } else {
        const res = await amenityService.createAmenity(payload);
        onSuccess(res?.message || t('amenitySettings.messages.createSuccess', 'Tạo mới tiện ích thành công!'));
      }
      onClose();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || t('amenitySettings.messages.actionFailed', 'Thao tác không thành công!');
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const SelectedIconComp = (ICON_OPTIONS.find((i) => i.value === formData.icon) || ICON_OPTIONS[0]).icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div
        className="bg-white rounded-2xl sm:rounded-3xl max-w-xl w-full shadow-2xl border border-gray-200 overflow-hidden transform transition-all duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 sm:px-8 py-5 border-b border-gray-100 bg-white">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-neighbor-50 text-neighbor-600 border border-neighbor-100 flex items-center justify-center shrink-0">
              <Layers className="w-5 h-5 text-neighbor-600" />
            </div>
            <div>
              <span className="text-xs font-semibold text-neighbor-700 uppercase tracking-wider block">
                {t('amenitySettings.modal.categoryBadge', 'Danh mục tiện ích')}
              </span>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 tracking-tight">
                {isEdit
                  ? t('amenitySettings.modal.editTitle', 'Chỉnh Sửa Tiện Ích')
                  : t('amenitySettings.modal.createTitle', 'Thêm Tiện Ích Mới')}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={submitting}
            className="w-9 h-9 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 flex items-center justify-center transition cursor-pointer"
            aria-label={t('amenitySettings.modal.close', 'Đóng')}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-5 bg-white">
          {error && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-center gap-2">
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              {t('amenitySettings.modal.nameLabel', 'Tên tiện ích')} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder={t('amenitySettings.modal.namePlaceholder', 'VD: Mái che mưa nắng, Camera an ninh...')}
              className="w-full px-4 py-2.5 sm:py-3 border border-gray-300 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-neighbor-500/20 focus:border-neighbor-600 transition"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              {t('amenitySettings.modal.categoryLabel', 'Nhóm danh mục')}
            </label>
            <select
              value={formData.type}
              onChange={(e) => handleChange('type', e.target.value)}
              className="w-full px-4 py-2.5 sm:py-3 border border-gray-300 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-neighbor-500/20 focus:border-neighbor-600 bg-white transition"
            >
              {TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {t(`amenitySettings.types.${opt.key}`, opt.defaultLabel)} ({opt.value})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              {t('amenitySettings.modal.iconLabel', 'Biểu tượng hiển thị')}
            </label>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-neighbor-50 text-neighbor-700 border border-neighbor-200 flex items-center justify-center shrink-0 shadow-2xs">
                <SelectedIconComp className="w-6 h-6 text-neighbor-700" />
              </div>
              <select
                value={formData.icon}
                onChange={(e) => handleChange('icon', e.target.value)}
                className="flex-1 px-4 py-2.5 sm:py-3 border border-gray-300 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-neighbor-500/20 focus:border-neighbor-600 bg-white transition"
              >
                {ICON_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {t(`amenitySettings.icons.${opt.key}`, opt.defaultLabel)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="pt-1">
            <label className="flex items-center gap-3.5 p-3.5 rounded-xl border border-gray-200 bg-gray-50/70 hover:bg-gray-50 cursor-pointer transition select-none">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => handleChange('is_active', e.target.checked)}
                className="w-4 h-4 text-neighbor-600 rounded border-gray-300 focus:ring-neighbor-600 cursor-pointer"
              />
              <div>
                <span className="text-sm font-semibold text-gray-800 block">
                  {t('amenitySettings.modal.activeCheckbox', 'Kích hoạt hiển thị cho các cơ sở bãi xe lựa chọn')}
                </span>
                <span className="text-xs text-gray-500 block mt-0.5">
                  {t('amenitySettings.modal.activeCheckboxDesc', 'Cho phép chủ bãi xe lựa chọn tiện ích này khi thiết lập tiện nghi cơ sở.')}
                </span>
              </div>
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-5 py-2.5 text-sm font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition cursor-pointer"
            >
              {t('amenitySettings.modal.cancelBtn', 'Hủy')}
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 text-sm font-bold text-white bg-neighbor-600 hover:bg-neighbor-700 rounded-xl shadow-xs transition flex items-center gap-2 cursor-pointer active:scale-95"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>
                {isEdit
                  ? t('amenitySettings.modal.saveBtn', 'Lưu thay đổi')
                  : t('amenitySettings.modal.createBtn', 'Tạo tiện ích')}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AmenityModal;
