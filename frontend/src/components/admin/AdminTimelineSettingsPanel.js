import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Clock,
  Save,
  RotateCcw,
  CheckCircle,
  Loader2,
  Calendar,
  FileText,
  UserCheck,
} from 'lucide-react';
import timelineSettingService from '../../services/timelineSettingService';
import Toast from '../common/Toast';

const DEFAULT_FORM_DATA = {
  reservation_response_value: 12,
  reservation_response_unit: 'HOURS',
  contract_creation_value: 24,
  contract_creation_unit: 'HOURS',
  contract_signing_value: 24,
  contract_signing_unit: 'HOURS',
  termination_notice_value: 15,
  termination_notice_unit: 'DAYS',
};

const UNIT_OPTIONS = ['MINUTES', 'HOURS', 'DAYS'];

const TIMELINE_CONFIGS = [
  {
    key: 'reservation_response',
    valueField: 'reservation_response_value',
    unitField: 'reservation_response_unit',
    icon: UserCheck,
    titleKey: 'fields.reservationResponse.title',
    targetKey: 'targets.provider',
    descKey: 'fields.reservationResponse.description',
  },
  {
    key: 'contract_creation',
    valueField: 'contract_creation_value',
    unitField: 'contract_creation_unit',
    icon: FileText,
    titleKey: 'fields.contractCreation.title',
    targetKey: 'targets.provider',
    descKey: 'fields.contractCreation.description',
  },
  {
    key: 'contract_signing',
    valueField: 'contract_signing_value',
    unitField: 'contract_signing_unit',
    icon: CheckCircle,
    titleKey: 'fields.contractSigning.title',
    targetKey: 'targets.customer',
    descKey: 'fields.contractSigning.description',
  },
  {
    key: 'termination_notice',
    valueField: 'termination_notice_value',
    unitField: 'termination_notice_unit',
    icon: Calendar,
    titleKey: 'fields.terminationNotice.title',
    targetKey: 'targets.both',
    descKey: 'fields.terminationNotice.description',
  },
];

const AdminTimelineSettingsPanel = () => {
  const { t, i18n } = useTranslation('admin');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toastInfo, setToastInfo] = useState(null);
  const [formData, setFormData] = useState(DEFAULT_FORM_DATA);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      const res = await timelineSettingService.getSettings();
      const settings = res?.data?.settings || res?.data?.data?.settings || res?.settings;
      if (settings) {
        setFormData({
          reservation_response_value: settings.reservation_response_value ?? DEFAULT_FORM_DATA.reservation_response_value,
          reservation_response_unit: settings.reservation_response_unit || DEFAULT_FORM_DATA.reservation_response_unit,
          contract_creation_value: settings.contract_creation_value ?? DEFAULT_FORM_DATA.contract_creation_value,
          contract_creation_unit: settings.contract_creation_unit || DEFAULT_FORM_DATA.contract_creation_unit,
          contract_signing_value: settings.contract_signing_value ?? DEFAULT_FORM_DATA.contract_signing_value,
          contract_signing_unit: settings.contract_signing_unit || DEFAULT_FORM_DATA.contract_signing_unit,
          termination_notice_value: settings.termination_notice_value ?? DEFAULT_FORM_DATA.termination_notice_value,
          termination_notice_unit: settings.termination_notice_unit || DEFAULT_FORM_DATA.termination_notice_unit,
        });
        setLastUpdated({
          updated_at: settings.updated_at,
          admin_name: settings.admin?.full_name || settings.admin?.email || t('timelineSettings.system', 'Hệ thống'),
        });
      }
    } catch (err) {
      setToastInfo({
        message: err?.response?.data?.message || t('timelineSettings.messages.loadError', 'Không thể tải cấu hình thời hạn hệ thống!'),
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleResetDefaults = () => {
    setFormData(DEFAULT_FORM_DATA);
    setToastInfo({
      message: t('timelineSettings.messages.resetSuccess', 'Đã đặt lại các giá trị mặc định. Nhấn "Lưu Cấu Hình Thời Hạn" để xác nhận.'),
      type: 'info',
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const hasInvalid = [
      formData.reservation_response_value,
      formData.contract_creation_value,
      formData.contract_signing_value,
      formData.termination_notice_value,
    ].some((val) => Number(val) <= 0 || isNaN(Number(val)));

    if (hasInvalid) {
      setToastInfo({
        message: t('timelineSettings.messages.validationError', 'Các giá trị thời hạn phải là số dương lớn hơn 0!'),
        type: 'error',
      });
      return;
    }

    try {
      setSaving(true);
      const res = await timelineSettingService.updateSettings(formData);
      setToastInfo({
        message: t('timelineSettings.messages.updateSuccess', 'Cập nhật cấu hình thời hạn hệ thống thành công!'),
        type: 'success',
      });
      const settings = res?.data?.settings || res?.data?.data?.settings || res?.settings;
      if (settings) {
        setLastUpdated({
          updated_at: settings.updated_at,
          admin_name: settings.admin?.full_name || settings.admin?.email || t('timelineSettings.you', 'Bạn'),
        });
      }
    } catch (err) {
      setToastInfo({
        message: err?.response?.data?.message || t('timelineSettings.messages.updateError', 'Lỗi khi lưu cấu hình thời hạn!'),
        type: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  const dateLocale = i18n.language?.startsWith('en') ? 'en-US' : 'vi-VN';

  return (
    <div className="space-y-6 animate-fadeIn">
      {toastInfo && (
        <Toast
          message={toastInfo.message}
          type={toastInfo.type}
          onClose={() => setToastInfo(null)}
        />
      )}

      {/* Header section */}
      <div className="bg-white p-6 sm:p-8 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="p-2 rounded-xl bg-neighbor-50 text-neighbor-600">
              <Clock className="w-5 h-5" />
            </span>
            <span className="text-xs font-bold text-neighbor-600 uppercase tracking-wider">
              {t('timelineSettings.badge', 'Quản Trị Hệ Thống')}
            </span>
          </div>
          <h2 className="text-2xl font-black text-gray-800 tracking-tight">
            {t('timelineSettings.title', 'Cấu Hình Thời Hạn Quy Trình Thuê Bãi Xe')}
          </h2>
          <p className="text-gray-500 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
            {t('timelineSettings.subtitle', 'Thiết lập thời hạn tự động xử lý cho chu trình thuê bãi xe: thời gian phản hồi yêu cầu đặt chỗ, lập hợp đồng điện tử, ký hợp đồng và thời hạn báo trước khi hủy.')}
          </p>
        </div>

        {lastUpdated && (
          <div className="text-right text-xs text-gray-400 bg-gray-50 px-4 py-2.5 rounded-xl border border-gray-200 shrink-0">
            <div>{t('timelineSettings.lastUpdated', 'Cập nhật gần nhất:')}</div>
            <strong className="text-gray-700">
              {new Date(lastUpdated.updated_at).toLocaleString(dateLocale)}
            </strong>
            <div className="text-[11px] text-neighbor-600">
              {t('timelineSettings.by', { name: lastUpdated.admin_name, defaultValue: `bởi ${lastUpdated.admin_name}` })}
            </div>
          </div>
        )}
      </div>

      {loading ? (
        <div className="py-20 bg-white rounded-xl border border-gray-200 text-center space-y-3">
          <Loader2 className="w-8 h-8 text-neighbor-600 animate-spin mx-auto" />
          <p className="text-sm font-medium text-gray-500">
            {t('timelineSettings.loading', 'Đang tải cấu hình thời hạn...')}
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {TIMELINE_CONFIGS.map((config) => {
              const Icon = config.icon;
              return (
                <div
                  key={config.key}
                  className="bg-white p-6 rounded-xl border border-gray-200/70 shadow-sm space-y-4 hover:border-neighbor-300 transition"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-neighbor-50 text-neighbor-700 flex items-center justify-center font-bold">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-gray-900">
                        {t(`timelineSettings.${config.titleKey}`)}
                      </h3>
                      <p className="text-[11px] text-gray-400 font-medium">
                        {t(`timelineSettings.${config.targetKey}`)}
                      </p>
                    </div>
                  </div>

                  <p className="text-xs text-gray-500 leading-relaxed min-h-[36px]">
                    {t(`timelineSettings.${config.descKey}`)}
                  </p>

                  <div className="pt-2 flex items-center gap-3">
                    <div className="flex-1">
                      <label className="text-[11px] font-bold text-gray-600 block mb-1">
                        {t('timelineSettings.duration', 'Thời lượng:')}
                      </label>
                      <input
                        type="number"
                        step="any"
                        min="0.1"
                        value={formData[config.valueField]}
                        onChange={(e) => handleChange(config.valueField, e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-800 focus:outline-none focus:bg-white focus:border-neighbor-500 transition"
                        required
                      />
                    </div>

                    <div className="w-32">
                      <label className="text-[11px] font-bold text-gray-600 block mb-1">
                        {t('timelineSettings.unit', 'Đơn vị:')}
                      </label>
                      <select
                        value={formData[config.unitField]}
                        onChange={(e) => handleChange(config.unitField, e.target.value)}
                        className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 focus:outline-none focus:bg-white focus:border-neighbor-500 transition"
                      >
                        {UNIT_OPTIONS.map((unit) => (
                          <option key={unit} value={unit}>
                            {t(`timelineSettings.units.${unit}`, unit)}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={handleResetDefaults}
              disabled={saving}
              className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-bold text-xs hover:bg-gray-100 transition flex items-center gap-1.5"
            >
              <RotateCcw className="w-4 h-4" />
              {t('timelineSettings.buttons.resetDefaults', 'Khôi phục mặc định')}
            </button>

            <button
              type="submit"
              disabled={saving}
              className="px-7 py-2.5 rounded-xl bg-neighbor-600 hover:bg-neighbor-700 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-neighbor-700/20 transition flex items-center gap-2"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {t('timelineSettings.buttons.saving', 'Đang lưu cấu hình...')}
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  {t('timelineSettings.buttons.save', 'Lưu Cấu Hình Thời Hạn')}
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default AdminTimelineSettingsPanel;
