import React, { useState, useEffect } from 'react';
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

const AdminTimelineSettingsPanel = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toastInfo, setToastInfo] = useState(null);

  const [formData, setFormData] = useState({
    reservation_response_value: 12,
    reservation_response_unit: 'HOURS',
    contract_creation_value: 24,
    contract_creation_unit: 'HOURS',
    contract_signing_value: 24,
    contract_signing_unit: 'HOURS',
    termination_notice_value: 15,
    termination_notice_unit: 'DAYS'
  });

  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await timelineSettingService.getSettings();
      const settings = res?.data?.settings || res?.data?.data?.settings || res?.settings;
      if (settings) {
        setFormData({
          reservation_response_value: settings.reservation_response_value ?? 12,
          reservation_response_unit: settings.reservation_response_unit || 'HOURS',
          contract_creation_value: settings.contract_creation_value ?? 24,
          contract_creation_unit: settings.contract_creation_unit || 'HOURS',
          contract_signing_value: settings.contract_signing_value ?? 24,
          contract_signing_unit: settings.contract_signing_unit || 'HOURS',
          termination_notice_value: settings.termination_notice_value ?? 15,
          termination_notice_unit: settings.termination_notice_unit || 'DAYS'
        });
        setLastUpdated({
          updated_at: settings.updated_at,
          admin_name: settings.admin?.full_name || settings.admin?.email || 'Hệ thống'
        });
      }
    } catch (err) {
      setToastInfo({
        message: err?.response?.data?.message || 'Không thể tải cấu hình thời hạn hệ thống!',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleResetDefaults = () => {
    setFormData({
      reservation_response_value: 12,
      reservation_response_unit: 'HOURS',
      contract_creation_value: 24,
      contract_creation_unit: 'HOURS',
      contract_signing_value: 24,
      contract_signing_unit: 'HOURS',
      termination_notice_value: 15,
      termination_notice_unit: 'DAYS'
    });
    setToastInfo({
      message: 'Đã đặt lại các giá trị mặc định. Nhấn "Lưu Cấu Hình" để xác nhận.',
      type: 'info'
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      formData.reservation_response_value <= 0 ||
      formData.contract_creation_value <= 0 ||
      formData.contract_signing_value <= 0 ||
      formData.termination_notice_value <= 0
    ) {
      setToastInfo({
        message: 'Các giá trị thời hạn phải là số dương lớn hơn 0!',
        type: 'error'
      });
      return;
    }

    try {
      setSaving(true);
      const res = await timelineSettingService.updateSettings(formData);
      setToastInfo({
        message: 'Cập nhật cấu hình thời hạn hệ thống thành công!',
        type: 'success'
      });
      const settings = res?.data?.settings || res?.data?.data?.settings || res?.settings;
      if (settings) {
        setLastUpdated({
          updated_at: settings.updated_at,
          admin_name: settings.admin?.full_name || settings.admin?.email || 'Bạn'
        });
      }
    } catch (err) {
      setToastInfo({
        message: err?.response?.data?.message || 'Lỗi khi lưu cấu hình thời hạn!',
        type: 'error'
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {toastInfo && (
        <Toast
          message={toastInfo.message}
          type={toastInfo.type}
          onClose={() => setToastInfo(null)}
        />
      )}

      <div className="bg-white p-6 sm:p-8 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="p-2 rounded-xl bg-neighbor-50 text-neighbor-600">
              <Clock className="w-5 h-5" />
            </span>
            <span className="text-xs font-bold text-neighbor-600 uppercase tracking-wider">
              Quản Trị Hệ Thống
            </span>
          </div>
          <h2 className="text-2xl font-black text-gray-800 tracking-tight">
            Cấu Hình Thời Hạn Quy Trình Thuê Bãi Xe
          </h2>
          <p className="text-gray-500 text-xs sm:text-sm mt-1 max-w-2xl">
            Thiết lập thời hạn tự động xử lý cho chu trình thuê bãi xe: thời gian phản hồi yêu cầu đặt chỗ, lập hợp đồng điện tử, ký hợp đồng và thời hạn báo trước khi hủy.
          </p>
        </div>

        {lastUpdated && (
          <div className="text-right text-xs text-gray-400 bg-gray-50 px-4 py-2.5 rounded-xl border border-gray-200 shrink-0">
            <div>Cập nhật gần nhất:</div>
            <strong className="text-gray-700">
              {new Date(lastUpdated.updated_at).toLocaleString('vi-VN')}
            </strong>
            <div className="text-[11px] text-neighbor-600">bởi {lastUpdated.admin_name}</div>
          </div>
        )}
      </div>

      {loading ? (
        <div className="py-20 bg-white rounded-xl border border-gray-200 text-center space-y-3">
          <Loader2 className="w-8 h-8 text-neighbor-600 animate-spin mx-auto" />
          <p className="text-sm font-medium text-gray-500">Đang tải cấu hình thời hạn...</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="bg-white p-6 rounded-xl border border-gray-200/70 shadow-sm space-y-4 hover:border-neighbor-300 transition">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-neighbor-50 text-neighbor-700 flex items-center justify-center font-bold">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">
                    Thời hạn phản hồi yêu cầu đặt chỗ
                  </h3>
                  <p className="text-[11px] text-gray-400 font-medium">Áp dụng cho chủ bãi xe</p>
                </div>
              </div>

              <p className="text-xs text-gray-500 leading-relaxed min-h-[36px]">
                Thời gian tối đa để chủ bãi phản hồi (Chấp nhận hoặc Từ chối) yêu cầu thuê của khách. Nếu quá thời gian này, hệ thống sẽ tự động hủy yêu cầu.
              </p>

              <div className="pt-2 flex items-center gap-3">
                <div className="flex-1">
                  <label className="text-[11px] font-bold text-gray-600 block mb-1">
                    Thời lượng:
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0.1"
                    value={formData.reservation_response_value}
                    onChange={(e) => handleChange('reservation_response_value', e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-800 focus:outline-none focus:bg-white focus:border-neighbor-500 transition"
                    required
                  />
                </div>

                <div className="w-32">
                  <label className="text-[11px] font-bold text-gray-600 block mb-1">
                    Đơn vị:
                  </label>
                  <select
                    value={formData.reservation_response_unit}
                    onChange={(e) => handleChange('reservation_response_unit', e.target.value)}
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 focus:outline-none focus:bg-white focus:border-neighbor-500 transition"
                  >
                    <option value="MINUTES">Phút</option>
                    <option value="HOURS">Giờ</option>
                    <option value="DAYS">Ngày</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200/70 shadow-sm space-y-4 hover:border-neighbor-300 transition">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-neighbor-50 text-neighbor-700 flex items-center justify-center font-bold">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">
                    Thời hạn lập hợp đồng sau khi duyệt
                  </h3>
                  <p className="text-[11px] text-gray-400 font-medium">Áp dụng cho chủ bãi xe</p>
                </div>
              </div>

              <p className="text-xs text-gray-500 leading-relaxed min-h-[36px]">
                Thời gian để chủ bãi khởi tạo hợp đồng điện tử sau khi đã chấp nhận yêu cầu. Nếu quá hạn này, yêu cầu thuê sẽ tự động hủy.
              </p>

              <div className="pt-2 flex items-center gap-3">
                <div className="flex-1">
                  <label className="text-[11px] font-bold text-gray-600 block mb-1">
                    Thời lượng:
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0.1"
                    value={formData.contract_creation_value}
                    onChange={(e) => handleChange('contract_creation_value', e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-800 focus:outline-none focus:bg-white focus:border-neighbor-500 transition"
                    required
                  />
                </div>

                <div className="w-32">
                  <label className="text-[11px] font-bold text-gray-600 block mb-1">
                    Đơn vị:
                  </label>
                  <select
                    value={formData.contract_creation_unit}
                    onChange={(e) => handleChange('contract_creation_unit', e.target.value)}
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 focus:outline-none focus:bg-white focus:border-neighbor-500 transition"
                  >
                    <option value="MINUTES">Phút</option>
                    <option value="HOURS">Giờ</option>
                    <option value="DAYS">Ngày</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200/70 shadow-sm space-y-4 hover:border-neighbor-300 transition">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-neighbor-50 text-neighbor-700 flex items-center justify-center font-bold">
                  <CheckCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">
                    Thời hạn khách hàng ký hợp đồng
                  </h3>
                  <p className="text-[11px] text-gray-400 font-medium">Áp dụng cho khách thuê</p>
                </div>
              </div>

              <p className="text-xs text-gray-500 leading-relaxed min-h-[36px]">
                Thời gian để khách hàng kiểm tra và ký xác nhận hợp đồng điện tử. Quá hạn này mà khách chưa ký, hợp đồng và yêu cầu thuê sẽ tự động hủy.
              </p>

              <div className="pt-2 flex items-center gap-3">
                <div className="flex-1">
                  <label className="text-[11px] font-bold text-gray-600 block mb-1">
                    Thời lượng:
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0.1"
                    value={formData.contract_signing_value}
                    onChange={(e) => handleChange('contract_signing_value', e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-800 focus:outline-none focus:bg-white focus:border-neighbor-500 transition"
                    required
                  />
                </div>

                <div className="w-32">
                  <label className="text-[11px] font-bold text-gray-600 block mb-1">
                    Đơn vị:
                  </label>
                  <select
                    value={formData.contract_signing_unit}
                    onChange={(e) => handleChange('contract_signing_unit', e.target.value)}
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 focus:outline-none focus:bg-white focus:border-neighbor-500 transition"
                  >
                    <option value="MINUTES">Phút</option>
                    <option value="HOURS">Giờ</option>
                    <option value="DAYS">Ngày</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200/70 shadow-sm space-y-4 hover:border-neighbor-300 transition">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-neighbor-50 text-neighbor-700 flex items-center justify-center font-bold">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">
                    Thời hạn báo trước khi chấm dứt hợp đồng
                  </h3>
                  <p className="text-[11px] text-gray-400 font-medium">Áp dụng cho cả hai bên</p>
                </div>
              </div>

              <p className="text-xs text-gray-500 leading-relaxed min-h-[36px]">
                Khoảng thời gian tối thiểu một bên cần gửi thông báo trước khi muốn chấm dứt hợp đồng thuê trước thời hạn thỏa thuận.
              </p>

              <div className="pt-2 flex items-center gap-3">
                <div className="flex-1">
                  <label className="text-[11px] font-bold text-gray-600 block mb-1">
                    Thời lượng:
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0.1"
                    value={formData.termination_notice_value}
                    onChange={(e) => handleChange('termination_notice_value', e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-800 focus:outline-none focus:bg-white focus:border-neighbor-500 transition"
                    required
                  />
                </div>

                <div className="w-32">
                  <label className="text-[11px] font-bold text-gray-600 block mb-1">
                    Đơn vị:
                  </label>
                  <select
                    value={formData.termination_notice_unit}
                    onChange={(e) => handleChange('termination_notice_unit', e.target.value)}
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 focus:outline-none focus:bg-white focus:border-neighbor-500 transition"
                  >
                    <option value="MINUTES">Phút</option>
                    <option value="HOURS">Giờ</option>
                    <option value="DAYS">Ngày</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={handleResetDefaults}
              disabled={saving}
              className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-bold text-xs hover:bg-gray-100 transition flex items-center gap-1.5"
            >
              <RotateCcw className="w-4 h-4" />
              Khôi phục mặc định
            </button>

            <button
              type="submit"
              disabled={saving}
              className="px-7 py-2.5 rounded-xl bg-neighbor-600 hover:bg-neighbor-700 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-neighbor-700/20 transition flex items-center gap-2"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Đang lưu cấu hình...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Lưu Cấu Hình Thời Hạn
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
