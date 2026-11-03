import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Car, Plus, Edit2, CheckCircle2, XCircle, RefreshCw,
  Search, Power, Building2
} from 'lucide-react';
import vehicleTypeService from '../../services/vehicleTypeService';
import VehicleTypeModal from '../modals/VehicleTypeModal';
import ConfirmModal from '../modals/ConfirmModal';
import Toast from '../common/Toast';

/**
 * Panel Quản Lý Loại Phương Tiện Dành Cho Admin
 * Thực hiện đầy đủ 4 Use Cases:
 * - M2-UC98: Create Vehicle Type
 * - M2-UC99: View Vehicle Types
 * - M2-UC100: Update Vehicle Type
 * - M2-UC101: Deactivate Vehicle Type
 */
const AdminVehicleTypesPanel = () => {
  const [vehicleTypes, setVehicleTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  // Bộ lọc và tìm kiếm
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'ACTIVE' | 'INACTIVE'

  // Trạng thái modal tạo mới / chỉnh sửa
  const [modalState, setModalState] = useState({
    isOpen: false,
    vehicleType: null
  });

  // Trạng thái modal xác nhận vô hiệu hóa / kích hoạt
  const [confirmToggleState, setConfirmToggleState] = useState({
    isOpen: false,
    vehicleType: null,
    loading: false
  });

  // M2-UC99: Tải danh sách loại phương tiện từ backend
  const fetchVehicleTypes = useCallback(async () => {
    try {
      setLoading(true);
      const res = await vehicleTypeService.getVehicleTypes();
      const list = res?.data || res || [];
      setVehicleTypes(Array.isArray(list) ? list : []);
    } catch (err) {
      setToast({
        message: err.message || 'Không thể tải danh mục loại phương tiện',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVehicleTypes();
  }, [fetchVehicleTypes]);

  // Lọc dữ liệu theo từ khóa tìm kiếm và tab trạng thái
  const filteredVehicleTypes = useMemo(() => {
    return vehicleTypes.filter((vt) => {
      // 1. Lọc theo trạng thái
      if (statusFilter === 'ACTIVE' && !vt.is_active) return false;
      if (statusFilter === 'INACTIVE' && vt.is_active) return false;

      // 2. Lọc theo từ khóa tìm kiếm
      if (searchTerm.trim()) {
        const term = searchTerm.trim().toLowerCase();
        const matchCode = vt.type_code?.toLowerCase().includes(term);
        const matchName = vt.name?.toLowerCase().includes(term);
        const matchDesc = vt.description?.toLowerCase().includes(term);
        return matchCode || matchName || matchDesc;
      }

      return true;
    });
  }, [vehicleTypes, searchTerm, statusFilter]);

  // Thống kê nhanh
  const stats = useMemo(() => {
    const total = vehicleTypes.length;
    const active = vehicleTypes.filter((v) => v.is_active).length;
    const inactive = total - active;
    return { total, active, inactive };
  }, [vehicleTypes]);

  // Mở modal tạo mới (M2-UC98)
  const handleOpenCreateModal = () => {
    setModalState({
      isOpen: true,
      vehicleType: null
    });
  };

  // Mở modal chỉnh sửa (M2-UC100)
  const handleOpenEditModal = (vt) => {
    setModalState({
      isOpen: true,
      vehicleType: vt
    });
  };

  // Mở modal xác nhận vô hiệu hóa / kích hoạt lại (M2-UC101)
  const handleOpenConfirmToggle = (vt) => {
    setConfirmToggleState({
      isOpen: true,
      vehicleType: vt,
      loading: false
    });
  };

  // Thực hiện đổi trạng thái vô hiệu hóa / kích hoạt
  const handleConfirmToggle = async () => {
    const vt = confirmToggleState.vehicleType;
    if (!vt) return;

    try {
      setConfirmToggleState((prev) => ({ ...prev, loading: true }));
      const res = await vehicleTypeService.toggleVehicleTypeStatus(vt.id);
      setConfirmToggleState({ isOpen: false, vehicleType: null, loading: false });
      setToast({
        message: res?.message || `Đã ${vt.is_active ? 'vô hiệu hóa' : 'kích hoạt'} loại phương tiện "${vt.name}" thành công!`,
        type: 'success'
      });
      fetchVehicleTypes();
    } catch (err) {
      setConfirmToggleState((prev) => ({ ...prev, loading: false }));
      setToast({
        message: err.message || 'Không thể thay đổi trạng thái loại phương tiện',
        type: 'error'
      });
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-md p-6 space-y-6">
      {/* Toast thông báo */}
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
            <Car className="w-6 h-6 text-teal-600" />
            Quản Lý Danh Mục Loại Phương Tiện
          </h2>
          <p className="text-slate-500 text-xs mt-1">
            Quản trị các loại phương tiện (M2-UC98 đến M2-UC101) mà hệ thống hỗ trợ kết nối và tính toán vị trí đỗ xe.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchVehicleTypes}
            disabled={loading}
            className="p-2.5 text-slate-600 hover:text-teal-600 hover:bg-slate-50 border border-slate-200 rounded-xl transition flex items-center gap-1.5 text-xs font-semibold"
            title="Làm mới danh sách"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-teal-600' : ''}`} />
            Làm mới
          </button>

          {/* M2-UC98: Nút Thêm mới */}
          <button
            onClick={handleOpenCreateModal}
            className="px-4 py-2.5 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Thêm Loại Phương Tiện Mới
          </button>
        </div>
      </div>

      {/* Thẻ Thống Kê Nhanh */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Tổng Số Loại Phương Tiện</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{stats.total}</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-teal-100/60 text-teal-700 flex items-center justify-center font-bold">
            <Car className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-emerald-700">Đang Hoạt Động (Active)</p>
            <p className="text-2xl font-bold text-emerald-800 mt-1">{stats.active}</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-amber-50/60 border border-amber-200/80 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-amber-700">Đã Vô Hiệu Hóa (Inactive)</p>
            <p className="text-2xl font-bold text-amber-800 mt-1">{stats.inactive}</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
            <XCircle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Thanh Tìm Kiếm & Bộ Lọc Trạng Thái */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Input Tìm kiếm */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo tên, mã (type_code)..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition"
          />
        </div>

        {/* Tab Lọc Trạng Thái */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl w-full sm:w-auto self-stretch sm:self-auto">
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
              statusFilter === 'ALL'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Tất Cả ({stats.total})
          </button>
          <button
            onClick={() => setStatusFilter('ACTIVE')}
            className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
              statusFilter === 'ACTIVE'
                ? 'bg-white text-emerald-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Hoạt Động ({stats.active})
          </button>
          <button
            onClick={() => setStatusFilter('INACTIVE')}
            className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
              statusFilter === 'INACTIVE'
                ? 'bg-white text-amber-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Đã Vô Hiệu Hóa ({stats.inactive})
          </button>
        </div>
      </div>

      {/* M2-UC99: Bảng Danh Sách Loại Phương Tiện */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
              <th className="py-3.5 px-4">Mã Loại (Code)</th>
              <th className="py-3.5 px-4">Tên Loại Phương Tiện</th>
              <th className="py-3.5 px-4">Mô Tả Chi Tiết</th>
              <th className="py-3.5 px-4 text-center">Bãi Xe Áp Dụng</th>
              <th className="py-3.5 px-4 text-center">Trạng Thái</th>
              <th className="py-3.5 px-4 text-center">Thao Tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {loading && vehicleTypes.length === 0 ? (
              <tr>
                <td colSpan="6" className="py-12 text-center text-slate-400">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-teal-600" />
                  <span>Đang tải danh mục loại phương tiện...</span>
                </td>
              </tr>
            ) : filteredVehicleTypes.length === 0 ? (
              <tr>
                <td colSpan="6" className="py-12 text-center text-slate-400">
                  <Car className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                  <p className="font-medium text-slate-600">Không tìm thấy loại phương tiện nào</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Thử thay đổi từ khóa tìm kiếm hoặc bấm &quot;Thêm Loại Phương Tiện Mới&quot;
                  </p>
                </td>
              </tr>
            ) : (
              filteredVehicleTypes.map((vt) => (
                <tr key={vt.id} className="hover:bg-slate-50/70 transition">
                  {/* Mã định danh (type_code) */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 border border-slate-200 text-slate-800 rounded-lg text-xs font-mono font-bold">
                      {vt.type_code}
                    </span>
                  </td>

                  {/* Tên loại xe */}
                  <td className="py-3.5 px-4 font-semibold text-slate-900">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
                        <Car className="w-4 h-4" />
                      </div>
                      <span>{vt.name}</span>
                    </div>
                  </td>

                  {/* Mô tả */}
                  <td className="py-3.5 px-4 text-xs text-slate-600 max-w-xs">
                    {vt.description ? (
                      <p className="line-clamp-2">{vt.description}</p>
                    ) : (
                      <span className="text-slate-400 italic">Chưa có mô tả</span>
                    )}
                  </td>

                  {/* Số lượng bãi xe liên kết */}
                  <td className="py-3.5 px-4 text-center whitespace-nowrap">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200">
                      <Building2 className="w-3 h-3" />
                      {vt._count?.facility_vehicle_types || 0} bãi xe
                    </span>
                  </td>

                  {/* Trạng thái hoạt động */}
                  <td className="py-3.5 px-4 text-center whitespace-nowrap">
                    {vt.is_active ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-bold">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                        Đang Hoạt Động
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-xs font-bold">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span>
                        Đã Vô Hiệu Hóa
                      </span>
                    )}
                  </td>

                  {/* Thao tác (M2-UC100 & M2-UC101) */}
                  <td className="py-3.5 px-4 text-center whitespace-nowrap">
                    <div className="flex items-center justify-center gap-2">
                      {/* M2-UC100: Cập nhật */}
                      <button
                        onClick={() => handleOpenEditModal(vt)}
                        className="p-1.5 text-slate-600 hover:text-teal-600 hover:bg-slate-100 rounded-lg transition"
                        title="Chỉnh sửa thông tin loại phương tiện"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      {/* M2-UC101: Vô hiệu hóa / Kích hoạt lại */}
                      <button
                        onClick={() => handleOpenConfirmToggle(vt)}
                        className={`p-1.5 rounded-lg transition ${
                          vt.is_active
                            ? 'text-amber-600 hover:text-amber-700 hover:bg-amber-50'
                            : 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50'
                        }`}
                        title={vt.is_active ? 'Vô hiệu hóa loại xe này' : 'Kích hoạt lại loại xe này'}
                      >
                        <Power className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Tạo Mới (M2-UC98) & Chỉnh Sửa (M2-UC100) */}
      <VehicleTypeModal
        isOpen={modalState.isOpen}
        onClose={() => setModalState({ isOpen: false, vehicleType: null })}
        vehicleType={modalState.vehicleType}
        onSuccess={(msg) => {
          setToast({ message: msg, type: 'success' });
          fetchVehicleTypes();
        }}
      />

      {/* Modal Xác Nhận Vô Hiệu Hóa / Kích Hoạt (M2-UC101) */}
      <ConfirmModal
        isOpen={confirmToggleState.isOpen}
        loading={confirmToggleState.loading}
        onClose={() => setConfirmToggleState({ isOpen: false, vehicleType: null, loading: false })}
        onConfirm={handleConfirmToggle}
        type={confirmToggleState.vehicleType?.is_active ? 'warning' : 'info'}
        title={
          confirmToggleState.vehicleType?.is_active
            ? 'Xác Nhận Vô Hiệu Hóa Loại Phương Tiện'
            : 'Xác Nhận Kích Hoạt Lại Loại Phương Tiện'
        }
        message={
          confirmToggleState.vehicleType?.is_active
            ? `Bạn có chắc chắn muốn vô hiệu hóa loại phương tiện "${confirmToggleState.vehicleType?.name}"? Các bãi xe mới sẽ không thể lựa chọn loại phương tiện này khi đăng ký.`
            : `Bạn có muốn kích hoạt lại loại phương tiện "${confirmToggleState.vehicleType?.name}" để các bãi xe có thể đăng ký dịch vụ?`
        }
        confirmText={
          confirmToggleState.vehicleType?.is_active ? 'Vô Hiệu Hóa' : 'Kích Hoạt Lại'
        }
        cancelText="Bỏ Qua"
      />
    </div>
  );
};

export default AdminVehicleTypesPanel;
