import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Layers, Plus, Edit2, RefreshCw, Search, Eye, EyeOff,
  Building2, ShieldCheck, Camera, Umbrella, UserCheck,
  Sun, Flame, BatteryCharging, Zap, Wifi, Car, Coffee,
  Lock, Clock, MapPin, Wrench, HelpCircle
} from 'lucide-react';
import amenityService from '../../services/amenityService';
import AmenityModal from '../modals/AmenityModal';
import ConfirmModal from '../modals/ConfirmModal';
import Toast from '../common/Toast';

const ICON_MAP = {
  'shield-check': ShieldCheck,
  'camera': Camera,
  'umbrella': Umbrella,
  'user-check': UserCheck,
  'sun': Sun,
  'flame': Flame,
  'battery-charging': BatteryCharging,
  'zap': Zap,
  'wifi': Wifi,
  'car': Car,
  'coffee': Coffee,
  'lock': Lock,
  'clock': Clock,
  'map-pin': MapPin,
  'wrench': Wrench
};

const renderIcon = (iconName) => {
  const IconComp = ICON_MAP[iconName] || HelpCircle;
  return <IconComp className="w-4 h-4 text-slate-600" />;
};

const AdminAmenitiesPanel = () => {
  const [amenities, setAmenities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');

  const [modalState, setModalState] = useState({
    isOpen: false,
    amenity: null
  });

  const [confirmState, setConfirmState] = useState({
    isOpen: false,
    amenity: null,
    loading: false
  });

  const fetchAmenities = useCallback(async () => {
    try {
      setLoading(true);
      const res = await amenityService.getAmenities();
      const list = res?.data || res || [];
      setAmenities(Array.isArray(list) ? list : []);
    } catch (err) {
      setToast({
        message: err.message || 'Không thể tải danh sách tiện ích',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAmenities();
  }, [fetchAmenities]);

  const filteredAmenities = useMemo(() => {
    return amenities.filter((item) => {
      if (statusFilter === 'ACTIVE' && !item.is_active) return false;
      if (statusFilter === 'INACTIVE' && item.is_active) return false;

      if (typeFilter !== 'ALL' && item.type !== typeFilter) return false;

      if (search.trim()) {
        const term = search.trim().toLowerCase();
        const matchName = item.name?.toLowerCase().includes(term);
        const matchType = item.type?.toLowerCase().includes(term);
        return matchName || matchType;
      }

      return true;
    });
  }, [amenities, search, statusFilter, typeFilter]);

  const handleOpenCreate = () => {
    setModalState({
      isOpen: true,
      amenity: null
    });
  };

  const handleOpenEdit = (item) => {
    setModalState({
      isOpen: true,
      amenity: item
    });
  };

  const handleOpenToggle = (item) => {
    setConfirmState({
      isOpen: true,
      amenity: item,
      loading: false
    });
  };

  const handleConfirmToggle = async () => {
    const item = confirmState.amenity;
    if (!item) return;

    try {
      setConfirmState((prev) => ({ ...prev, loading: true }));
      const res = await amenityService.toggleAmenityStatus(item.id);
      setConfirmState({ isOpen: false, amenity: null, loading: false });
      setToast({
        message: res?.message || `Đã cập nhật trạng thái tiện ích "${item.name}"!`,
        type: 'success'
      });
      fetchAmenities();
    } catch (err) {
      setConfirmState((prev) => ({ ...prev, loading: false }));
      setToast({
        message: err.message || 'Lỗi khi thay đổi trạng thái tiện ích',
        type: 'error'
      });
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-md p-6 space-y-5">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Layers className="w-6 h-6 text-teal-600" />
            Quản Lý Tiện Ích Bãi Xe
          </h2>
          <p className="text-slate-500 text-xs mt-1">
            Danh mục các tiện ích cho phép cơ sở bãi đỗ xe lựa chọn khi đăng ký trong hệ thống ParkLink.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          <span className="text-xs font-semibold bg-slate-100 px-3 py-1.5 rounded-xl text-slate-700">
            Tổng cộng: <strong className="text-teal-700 font-extrabold">{filteredAmenities.length}</strong> tiện ích
          </span>

          <button
            onClick={handleOpenCreate}
            className="px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold shadow-sm transition flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Thêm tiện ích
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tên tiện ích, nhóm phân loại..."
            className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-teal-500 transition"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-teal-500 bg-white font-medium text-slate-700"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="ACTIVE">Đang hiển thị</option>
            <option value="INACTIVE">Đang ẩn</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-teal-500 bg-white font-medium text-slate-700"
          >
            <option value="ALL">Tất cả nhóm</option>
            <option value="SECURITY">An ninh</option>
            <option value="SERVICE">Dịch vụ</option>
            <option value="INFRASTRUCTURE">Cơ sở hạ tầng</option>
            <option value="CONVENIENCE">Tiện nghi</option>
          </select>

          <button
            onClick={fetchAmenities}
            disabled={loading}
            className="p-2 text-slate-600 hover:text-teal-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition"
            title="Tải lại dữ liệu"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-teal-600' : ''}`} />
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-600 uppercase tracking-wider">
              <th className="py-3 px-4 w-16">ID</th>
              <th className="py-3 px-4">Tên tiện ích</th>
              <th className="py-3 px-4">Nhóm danh mục</th>
              <th className="py-3 px-4 text-center">Bãi xe áp dụng</th>
              <th className="py-3 px-4 text-center">Trạng thái</th>
              <th className="py-3 px-4 text-center w-28">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-800">
            {loading && amenities.length === 0 ? (
              <tr>
                <td colSpan="6" className="py-12 text-center text-slate-400">
                  <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-teal-600" />
                  <span>Đang tải danh sách tiện ích...</span>
                </td>
              </tr>
            ) : filteredAmenities.length === 0 ? (
              <tr>
                <td colSpan="6" className="py-10 text-center text-slate-400">
                  <p className="font-medium text-slate-600">Không tìm thấy tiện ích nào phù hợp</p>
                </td>
              </tr>
            ) : (
              filteredAmenities.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-3 px-4 font-mono font-medium text-slate-500">
                    #{item.id}
                  </td>

                  <td className="py-3 px-4 font-medium text-slate-900">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
                        {renderIcon(item.icon)}
                      </div>
                      <span>{item.name}</span>
                    </div>
                  </td>

                  <td className="py-3 px-4 whitespace-nowrap">
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px] font-medium border border-slate-200">
                      {item.type || 'CHUNG'}
                    </span>
                  </td>

                  <td className="py-3 px-4 text-center whitespace-nowrap">
                    <span className="inline-flex items-center gap-1 text-slate-600 font-medium">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      {item._count?.facility_amenities || 0}
                    </span>
                  </td>

                  <td className="py-3 px-4 text-center whitespace-nowrap">
                    {item.is_active ? (
                      <span className="bg-teal-100 text-teal-800 font-semibold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 text-[11px]">
                        <Eye className="w-3 h-3" /> Hiển thị
                      </span>
                    ) : (
                      <span className="bg-rose-100 text-rose-800 font-semibold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 text-[11px]">
                        <EyeOff className="w-3 h-3" /> Đang ẩn
                      </span>
                    )}
                  </td>

                  <td className="py-3 px-4 text-center whitespace-nowrap">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => handleOpenEdit(item)}
                        className="p-1.5 text-slate-500 hover:text-teal-600 hover:bg-slate-100 rounded transition"
                        title="Chỉnh sửa thông tin"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleOpenToggle(item)}
                        className={`p-1.5 rounded transition ${
                          item.is_active
                            ? 'text-rose-500 hover:text-rose-700 hover:bg-rose-50'
                            : 'text-teal-600 hover:text-teal-700 hover:bg-teal-50'
                        }`}
                        title={item.is_active ? 'Ẩn tiện ích này' : 'Hiện lại tiện ích này'}
                      >
                        {item.is_active ? (
                          <EyeOff className="w-3.5 h-3.5" />
                        ) : (
                          <Eye className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <AmenityModal
        isOpen={modalState.isOpen}
        onClose={() => setModalState({ isOpen: false, amenity: null })}
        amenity={modalState.amenity}
        onSuccess={(msg) => {
          setToast({ message: msg, type: 'success' });
          fetchAmenities();
        }}
      />

      <ConfirmModal
        isOpen={confirmState.isOpen}
        loading={confirmState.loading}
        onClose={() => setConfirmState({ isOpen: false, amenity: null, loading: false })}
        onConfirm={handleConfirmToggle}
        type={confirmState.amenity?.is_active ? 'warning' : 'info'}
        title={confirmState.amenity?.is_active ? 'Xác nhận ẩn tiện ích' : 'Xác nhận kích hoạt tiện ích'}
        message={
          confirmState.amenity?.is_active
            ? `Bạn có chắc muốn ẩn tiện ích "${confirmState.amenity?.name}"? Tiện ích này sẽ không xuất hiện để bãi xe mới lựa chọn.`
            : `Kích hoạt lại tiện ích "${confirmState.amenity?.name}" để các cơ sở bãi xe có thể chọn?`
        }
        confirmText={confirmState.amenity?.is_active ? 'Ẩn tiện ích' : 'Kích hoạt'}
        cancelText="Bỏ qua"
      />
    </div>
  );
};

export default AdminAmenitiesPanel;
