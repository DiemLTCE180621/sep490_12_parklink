import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DollarSign, Plus, Edit2, CheckCircle2, XCircle, RefreshCw,
  Layers, Power
} from 'lucide-react';
import platformFeeService from '../../services/platformFeeService';
import Toast from '../common/Toast';
import ConfirmModal from '../modals/ConfirmModal';

/**
 * Panel Quản lý Biểu Phí Nền Tảng
 * Hỗ trợ chế độ Admin (đầy đủ quyền) và chế độ Xem cho Provider (isReadOnly)
 */
const AdminPlatformFeesPanel = ({ isReadOnly = false }) => {
  const navigate = useNavigate();
  const [fees, setFees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  // Trạng thái modal xác nhận bật/tắt kích hoạt hiện đại (thay thế window.confirm)
  const [confirmToggleState, setConfirmToggleState] = useState({
    isOpen: false,
    fee: null,
    loading: false
  });

  // 1. View Platform Fee: Tải danh sách biểu phí từ Backend
  const fetchFees = useCallback(async () => {
    try {
      setLoading(true);
      const res = await platformFeeService.getPlatformFees();
      const feeList = res?.data || res || [];
      setFees(Array.isArray(feeList) ? feeList : []);
    } catch (err) {
      setToast({
        message: err.message || 'Không thể tải danh sách biểu phí nền tảng',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFees();
  }, [fetchFees]);

  // 4. Activate/Deactivate Platform Fee với ConfirmModal hiện đại
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
    <div className="bg-white rounded-3xl border border-slate-100 shadow-md p-6 space-y-6">
      {/* Toast thông báo hiện đại */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-5">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-teal-600" />
            {isReadOnly ? 'Biểu Phí Nền Tảng Áp Dụng' : 'Quản Lý Gói Biểu Phí Nền Tảng'}
          </h2>
          <p className="text-slate-500 text-xs mt-1">
            {isReadOnly
              ? 'Phí nền tảng thu 1 lần dựa trên quy mô bãi đỗ (Khung Min – Max) sau khi khảo sát thực địa'
              : 'Cấu hình các gói phí nền tảng thu 1 lần theo quy mô bãi đỗ (Khung Min – Max) sau khi khảo sát thực địa'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchFees}
            disabled={loading}
            className="p-2.5 text-slate-600 hover:text-teal-600 hover:bg-slate-50 border border-slate-200 rounded-xl transition flex items-center gap-1.5 text-xs font-semibold"
            title="Làm mới danh sách"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-teal-600' : ''}`} />
            Làm mới
          </button>

          {!isReadOnly && (
            <button
              onClick={() => navigate('/admin/platform-fees/create')}
              className="px-4 py-2.5 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center gap-2"
              title="Tạo gói biểu phí mới"
            >
              <Plus className="w-4 h-4" /> Thêm Gói Biểu Phí Mới
            </button>
          )}
        </div>
      </div>

      {/* Thông tin tóm tắt quy định thu phí đề tài */}
      <div className="p-3.5 bg-teal-50/70 border border-teal-100 rounded-2xl flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 text-teal-900 font-semibold">
          <Layers className="w-4 h-4 text-teal-600 shrink-0" />
          <span>Biểu phí thí điểm: 1 – 3 chỗ (2.000.000 VNĐ) • 4 – 7 chỗ (4.000.000 VNĐ) • Từ 8 chỗ (6.000.000 VNĐ)</span>
        </div>
        <span className="text-teal-700 font-medium">Thu 1 lần khi duyệt đưa cơ sở lên sàn</span>
      </div>

      {/* Bảng danh sách biểu phí (View Platform Fee - Theo khung Min - Max) */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/75 border-y border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
              <th className="py-3.5 px-4">Tên Gói & Mô Tả</th>
              <th className="py-3.5 px-4 text-center">Khung Quy Mô Slot</th>
              <th className="py-3.5 px-4 text-right">Mức Phí Thu 1 Lần</th>
              <th className="py-3.5 px-4 text-center">Trạng Thái</th>
              {!isReadOnly && <th className="py-3.5 px-4 text-center">Thao Tác</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {loading && fees.length === 0 ? (
              <tr>
                <td colSpan={isReadOnly ? 4 : 5} className="py-12 text-center text-slate-400">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-teal-600" />
                  Đang tải danh sách biểu phí nền tảng...
                </td>
              </tr>
            ) : fees.length === 0 ? (
              <tr>
                <td colSpan={isReadOnly ? 4 : 5} className="py-12 text-center text-slate-400">
                  <Layers className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                  Chưa có gói biểu phí nào được tạo trên hệ thống.
                </td>
              </tr>
            ) : (
              fees.map((fee) => (
                <tr key={fee.id} className="hover:bg-slate-50/60 transition">
                  <td className="py-4 px-4">
                    <div className="font-bold text-slate-900">{fee.name}</div>
                    {fee.description && (
                      <div className="text-xs text-slate-500 mt-0.5 line-clamp-1">{fee.description}</div>
                    )}
                  </td>

                  <td className="py-4 px-4 text-center whitespace-nowrap">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 font-bold text-xs border border-slate-200">
                      {fee.max_slots && fee.max_slots < 900
                        ? `${fee.min_slots} - ${fee.max_slots} chỗ`
                        : `Từ ${fee.min_slots} chỗ trở lên`}
                    </span>
                  </td>

                  <td className="py-4 px-4 text-right whitespace-nowrap">
                    <span className="text-base font-extrabold text-teal-800">
                      {Number(fee.fee_amount).toLocaleString('vi-VN')}
                    </span>
                    <span className="text-xs font-semibold text-slate-500 ml-1">VNĐ</span>
                  </td>

                  <td className="py-4 px-4 text-center whitespace-nowrap">
                    {fee.is_active ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Đang áp dụng
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-500 border border-slate-200">
                        <XCircle className="w-3.5 h-3.5" /> Tạm ngưng
                      </span>
                    )}
                  </td>

                  {!isReadOnly && (
                    <td className="py-4 px-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-2">
                        {/* Chuyển sang Trang Edit riêng thay vì mở popup */}
                        <button
                          onClick={() => navigate(`/admin/platform-fees/${fee.id}`)}
                          className="p-2 text-slate-600 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition"
                          title="Chỉnh sửa trên trang riêng"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        {/* Bật / Tắt trạng thái áp dụng với Modal xác nhận hiện đại */}
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

      {/* MODAL XÁC NHẬN BẬT / TẮT KÍCH HOẠT HIỆN ĐẠI (THAY THẾ WINDOW.CONFIRM) */}
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
