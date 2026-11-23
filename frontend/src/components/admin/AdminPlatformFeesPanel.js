import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DollarSign, Plus, Edit2, CheckCircle2, XCircle, RefreshCw,
  Layers, Power
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import platformFeeService from '../../services/platformFeeService';
import { translatePlatformFeeName, translatePlatformFeeDescription } from '../../utils/translations';
import Toast from '../common/Toast';
import ConfirmModal from '../modals/ConfirmModal';


const AdminPlatformFeesPanel = ({ isReadOnly = false }) => {
  const { t, i18n } = useTranslation('provider');
  const tp = (viText, key, opts) => (isReadOnly ? t(key, opts) : viText);
  const feeLanguage = isReadOnly ? i18n.language : 'vi';
  const navigate = useNavigate();
  const [fees, setFees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  
  const [confirmToggleState, setConfirmToggleState] = useState({
    isOpen: false,
    fee: null,
    loading: false
  });

  
  const fetchFees = useCallback(async () => {
    try {
      setLoading(true);
      const res = await platformFeeService.getPlatformFees();
      const feeList = res?.data || res || [];
      setFees(Array.isArray(feeList) ? feeList : []);
    } catch (err) {
      setToast({
        message: err.message || '__LOAD_ERROR__',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFees();
  }, [fetchFees]);

  
  const handleOpenToggleConfirm = (fee) => {
    setConfirmToggleState({
      isOpen: true,
      fee,
      loading: false
    });
  };

  const handleConfirmToggle = async () => {
    const fee = confirmToggleState.fee;
    if (!fee) return;

    try {
      setConfirmToggleState((prev) => ({ ...prev, loading: true }));
      await platformFeeService.togglePlatformFeeStatus(fee.id);
      setConfirmToggleState({ isOpen: false, fee: null, loading: false });
      setToast({
        message: `Đã ${fee.is_active ? 'vô hiệu hóa' : 'kích hoạt'} gói "${fee.name}" thành công!`,
        type: 'success'
      });
      fetchFees();
    } catch (err) {
      setConfirmToggleState((prev) => ({ ...prev, loading: false }));
      setToast({
        message: err.message || 'Không thể thay đổi trạng thái gói phí',
        type: 'error'
      });
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-md p-6 space-y-6">
      {}
      {toast && (
        <Toast
          message={toast.message === '__LOAD_ERROR__' ? tp('Không thể tải danh sách biểu phí nền tảng', 'platformFees.loadError') : toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-200 pb-5">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-neighbor-600" />
            {isReadOnly ? t('platformFees.title') : 'Quản Lý Gói Biểu Phí Nền Tảng'}
          </h2>
          <p className="text-gray-500 text-xs mt-1">
            {isReadOnly
              ? t('platformFees.subtitle')
              : 'Cấu hình các gói phí nền tảng thu 1 lần theo quy mô bãi đỗ sau khi khảo sát thực địa'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchFees}
            disabled={loading}
            className="p-2.5 text-gray-600 hover:text-neighbor-600 hover:bg-gray-50 border border-gray-200 rounded-xl transition flex items-center gap-1.5 text-xs font-semibold"
            title={tp('Làm mới danh sách', 'platformFees.refreshTitle')}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-neighbor-600' : ''}`} />
            {tp('Làm mới', 'platformFees.refresh')}
          </button>

          {!isReadOnly && (
            <button
              onClick={() => navigate('/admin/platform-fees/create')}
              className="px-4 py-2.5 bg-neighbor-600 hover:bg-neighbor-700 text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center gap-2"
              title="Tạo gói biểu phí mới"
            >
              <Plus className="w-4 h-4" /> Thêm Gói Biểu Phí Mới
            </button>
          )}
        </div>
      </div>

      {}
      <div className="p-3.5 bg-neighbor-50/70 border border-neighbor-100 rounded-xl flex flex-wrap items-center justify-between gap-2 text-xs">
        <span className="text-neighbor-700 font-medium">{tp('Thu 1 lần khi duyệt đưa cơ sở lên sàn', 'platformFees.bannerNote')}</span>
      </div>

      {}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50/75 border-y border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-wider">
              <th className="py-3.5 px-4">{tp('Tên Gói & Mô Tả', 'platformFees.columns.nameAndDesc')}</th>
              <th className="py-3.5 px-4 text-center">{tp('Khung Quy Mô Slot', 'platformFees.columns.slotTier')}</th>
              <th className="py-3.5 px-4 text-right">{tp('Mức Phí Thu 1 Lần', 'platformFees.columns.oneTimeFee')}</th>
              <th className="py-3.5 px-4 text-center">{tp('Trạng Thái', 'platformFees.columns.status')}</th>
              {!isReadOnly && <th className="py-3.5 px-4 text-center">Thao Tác</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
            {loading && fees.length === 0 ? (
              <tr>
                <td colSpan={isReadOnly ? 4 : 5} className="py-12 text-center text-gray-400">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-neighbor-600" />
                  {tp('Đang tải danh sách biểu phí nền tảng...', 'platformFees.loading')}
                </td>
              </tr>
            ) : fees.length === 0 ? (
              <tr>
                <td colSpan={isReadOnly ? 4 : 5} className="py-12 text-center text-gray-400">
                  <Layers className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  {tp('Chưa có gói biểu phí nào được tạo trên hệ thống.', 'platformFees.empty')}
                </td>
              </tr>
            ) : (
              fees.map((fee) => (
                <tr key={fee.id} className="hover:bg-gray-50/60 transition">
                  <td className="py-4 px-4">
                    <div className="font-bold text-gray-900">{translatePlatformFeeName(fee.name, feeLanguage)}</div>
                    {fee.description && (
                      <div className="text-xs text-gray-500 mt-0.5 line-clamp-1">{translatePlatformFeeDescription(fee.description, feeLanguage)}</div>
                    )}
                  </td>

                  <td className="py-4 px-4 text-center whitespace-nowrap">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-100 text-gray-700 font-bold text-xs border border-gray-200">
                      {fee.max_slots && fee.max_slots < 900
                        ? tp(`${fee.min_slots} - ${fee.max_slots} chỗ`, 'platformFees.slotRange', { min: fee.min_slots, max: fee.max_slots })
                        : tp(`Từ ${fee.min_slots} chỗ trở lên`, 'platformFees.slotFrom', { min: fee.min_slots })}
                    </span>
                  </td>

                  <td className="py-4 px-4 text-right whitespace-nowrap">
                    <span className="text-base font-extrabold text-neighbor-800">
                      {Number(fee.fee_amount).toLocaleString('vi-VN')}
                    </span>
                    <span className="text-xs font-semibold text-gray-500 ml-1">{tp('VNĐ', 'platformFees.currency')}</span>
                  </td>

                  <td className="py-4 px-4 text-center whitespace-nowrap">
                    {fee.is_active ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5" /> {tp('Đang áp dụng', 'platformFees.active')}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-500 border border-gray-200">
                        <XCircle className="w-3.5 h-3.5" /> {tp('Tạm ngưng', 'platformFees.inactive')}
                      </span>
                    )}
                  </td>

                  {!isReadOnly && (
                    <td className="py-4 px-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-2">
                        {}
                        <button
                          onClick={() => navigate(`/admin/platform-fees/${fee.id}`)}
                          className="p-2 text-gray-600 hover:text-neighbor-600 hover:bg-neighbor-50 rounded-lg transition"
                          title="Chỉnh sửa trên trang riêng"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        {}
                        <button
                          onClick={() => handleOpenToggleConfirm(fee)}
                          className={`p-2 rounded-lg transition ${fee.is_active
                            ? 'text-amber-600 hover:bg-amber-50 hover:text-amber-700'
                            : 'text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700'
                            }`}
                          title={fee.is_active ? 'Ngừng áp dụng gói phí' : 'Kích hoạt gói phí'}
                        >
                          <Power className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {}
      <ConfirmModal
        isOpen={confirmToggleState.isOpen}
        onClose={() => setConfirmToggleState({ isOpen: false, fee: null, loading: false })}
        onConfirm={handleConfirmToggle}
        loading={confirmToggleState.loading}
        type={confirmToggleState.fee?.is_active ? 'warning' : 'success'}
        title={confirmToggleState.fee?.is_active ? 'Ngừng Áp Dụng Biểu Phí' : 'Kích Hoạt Biểu Phí'}
        message={
          confirmToggleState.fee
            ? `Bạn có chắc chắn muốn ${confirmToggleState.fee.is_active ? 'ngừng áp dụng (vô hiệu hóa)' : 'kích hoạt áp dụng'} gói biểu phí "${confirmToggleState.fee.name}" không?`
            : ''
        }
        confirmText={confirmToggleState.fee?.is_active ? 'Ngừng Áp Dụng' : 'Kích Hoạt Ngay'}
        cancelText="Hủy Bỏ"
      />
    </div>
  );
};

export default AdminPlatformFeesPanel;
