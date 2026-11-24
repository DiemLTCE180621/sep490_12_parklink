import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Car, Plus, Edit2, CheckCircle2, XCircle, RefreshCw,
  Search, Power, Building2
} from 'lucide-react';
import vehicleTypeService from '../../services/vehicleTypeService';
import VehicleTypeModal from '../modals/VehicleTypeModal';
import ConfirmModal from '../modals/ConfirmModal';
import Toast from '../common/Toast';


const AdminVehicleTypesPanel = () => {
  const { t } = useTranslation('admin');
  const [vehicleTypes, setVehicleTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  
  const [modalState, setModalState] = useState({
    isOpen: false,
    vehicleType: null
  });

  
  const [confirmToggleState, setConfirmToggleState] = useState({
    isOpen: false,
    vehicleType: null,
    loading: false
  });

  
  const fetchVehicleTypes = useCallback(async () => {
    try {
      setLoading(true);
      const res = await vehicleTypeService.getVehicleTypes();
      const list = res?.data || res || [];
      setVehicleTypes(Array.isArray(list) ? list : []);
    } catch (err) {
      setToast({
        message: t('vehicleTypes.messages.loadError'),
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchVehicleTypes();
  }, [fetchVehicleTypes]);

  
  const filteredVehicleTypes = useMemo(() => {
    return vehicleTypes.filter((vt) => {
      
      if (statusFilter === 'ACTIVE' && !vt.is_active) return false;
      if (statusFilter === 'INACTIVE' && vt.is_active) return false;

      
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

  
  const stats = useMemo(() => {
    const total = vehicleTypes.length;
    const active = vehicleTypes.filter((v) => v.is_active).length;
    const inactive = total - active;
    return { total, active, inactive };
  }, [vehicleTypes]);

  
  const handleOpenCreateModal = () => {
    setModalState({
      isOpen: true,
      vehicleType: null
    });
  };

  
  const handleOpenEditModal = (vt) => {
    setModalState({
      isOpen: true,
      vehicleType: vt
    });
  };

  
  const handleOpenConfirmToggle = (vt) => {
    setConfirmToggleState({
      isOpen: true,
      vehicleType: vt,
      loading: false
    });
  };

  
  const handleConfirmToggle = async () => {
    const vt = confirmToggleState.vehicleType;
    if (!vt) return;

    try {
      setConfirmToggleState((prev) => ({ ...prev, loading: true }));
      await vehicleTypeService.toggleVehicleTypeStatus(vt.id);
      setConfirmToggleState({ isOpen: false, vehicleType: null, loading: false });
      setToast({
        message: t(vt.is_active ? 'vehicleTypes.messages.deactivateSuccess' : 'vehicleTypes.messages.activateSuccess', { name: vt.name }),
        type: 'success'
      });
      fetchVehicleTypes();
    } catch (err) {
      setConfirmToggleState((prev) => ({ ...prev, loading: false }));
      setToast({
        message: t('vehicleTypes.messages.toggleError'),
        type: 'error'
      });
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-md p-6 space-y-6">
      {}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-200 pb-5">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Car className="w-6 h-6 text-neighbor-600" />
            {t('vehicleTypes.title')}
          </h2>
          <p className="text-gray-500 text-xs mt-1">
            {t('vehicleTypes.subtitle')}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchVehicleTypes}
            disabled={loading}
            className="p-2.5 text-gray-600 hover:text-neighbor-600 hover:bg-gray-50 border border-gray-200 rounded-xl transition flex items-center gap-1.5 text-xs font-semibold"
            title={t('vehicleTypes.refreshTitle')}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-neighbor-600' : ''}`} />
            {t('common.refresh')}
          </button>

          {}
          <button
            onClick={handleOpenCreateModal}
            className="px-4 py-2.5 bg-neighbor-600 hover:bg-neighbor-700 text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> {t('vehicleTypes.addNew')}
          </button>
        </div>
      </div>

      {}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gray-50 border border-gray-200/80 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-500">{t('vehicleTypes.stats.total')}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-neighbor-100/60 text-neighbor-700 flex items-center justify-center font-bold">
            <Car className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-emerald-700">{t('vehicleTypes.stats.active')}</p>
            <p className="text-2xl font-bold text-emerald-800 mt-1">{stats.active}</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-amber-50/60 border border-amber-200/80 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-amber-700">{t('vehicleTypes.stats.inactive')}</p>
            <p className="text-2xl font-bold text-amber-800 mt-1">{stats.inactive}</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
            <XCircle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t('vehicleTypes.searchPlaceholder')}
            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-neighbor-500 focus:bg-white transition"
          />
        </div>

        {}
        <div className="flex items-center gap-1.5 p-1 bg-gray-100 rounded-xl w-full sm:w-auto self-stretch sm:self-auto">
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${statusFilter === 'ALL'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
              }`}
          >
            {t('vehicleTypes.filters.all')} ({stats.total})
          </button>
          <button
            onClick={() => setStatusFilter('ACTIVE')}
            className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${statusFilter === 'ACTIVE'
              ? 'bg-white text-emerald-700 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
              }`}
          >
            {t('vehicleTypes.filters.active')} ({stats.active})
          </button>
          <button
            onClick={() => setStatusFilter('INACTIVE')}
            className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${statusFilter === 'INACTIVE'
              ? 'bg-white text-amber-700 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
              }`}
          >
            {t('vehicleTypes.filters.inactive')} ({stats.inactive})
          </button>
        </div>
      </div>

      {}
      <div className="overflow-x-auto rounded-xl border border-gray-200">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-wider">
              <th className="py-3.5 px-4">{t('vehicleTypes.table.code')}</th>
              <th className="py-3.5 px-4">{t('vehicleTypes.table.name')}</th>
              <th className="py-3.5 px-4">{t('vehicleTypes.table.description')}</th>
              <th className="py-3.5 px-4 text-center">{t('vehicleTypes.table.facilities')}</th>
              <th className="py-3.5 px-4 text-center">{t('vehicleTypes.table.status')}</th>
              <th className="py-3.5 px-4 text-center">{t('vehicleTypes.table.actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
            {loading && vehicleTypes.length === 0 ? (
              <tr>
                <td colSpan="6" className="py-12 text-center text-gray-400">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-neighbor-600" />
                  <span>{t('vehicleTypes.messages.loading')}</span>
                </td>
              </tr>
            ) : filteredVehicleTypes.length === 0 ? (
              <tr>
                <td colSpan="6" className="py-12 text-center text-gray-400">
                  <Car className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <p className="font-medium text-gray-600">{t('vehicleTypes.messages.empty')}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {t('vehicleTypes.messages.emptyHint')}
                  </p>
                </td>
              </tr>
            ) : (
              filteredVehicleTypes.map((vt) => (
                <tr key={vt.id} className="hover:bg-gray-50/70 transition">
                  {}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 border border-gray-200 text-gray-800 rounded-lg text-xs font-mono font-bold">
                      {vt.type_code}
                    </span>
                  </td>

                  {}
                  <td className="py-3.5 px-4 font-semibold text-gray-900">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-neighbor-50 text-neighbor-600 flex items-center justify-center shrink-0">
                        <Car className="w-4 h-4" />
                      </div>
                      <span>{vt.name}</span>
                    </div>
                  </td>

                  {}
                  <td className="py-3.5 px-4 text-xs text-gray-600 max-w-xs">
                    {vt.description ? (
                      <p className="line-clamp-2">{vt.description}</p>
                    ) : (
                      <span className="text-gray-400 italic">{t('vehicleTypes.table.noDescription')}</span>
                    )}
                  </td>

                  {}
                  <td className="py-3.5 px-4 text-center whitespace-nowrap">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-neighbor-50 text-neighbor-700 border border-neighbor-200">
                      <Building2 className="w-3 h-3" />
                      {t('vehicleTypes.table.facilityCount', { count: vt._count?.facility_vehicle_types || 0 })}
                    </span>
                  </td>

                  {}
                  <td className="py-3.5 px-4 text-center whitespace-nowrap">
                    {vt.is_active ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-bold">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                        {t('vehicleTypes.filters.active')}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-xs font-bold">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span>
                        {t('vehicleTypes.filters.inactive')}
                      </span>
                    )}
                  </td>

                  <td className="py-3.5 px-4 text-center whitespace-nowrap">
                    <div className="flex items-center justify-center gap-2">
                      {}
                      <button
                        onClick={() => handleOpenEditModal(vt)}
                        className="p-1.5 text-gray-600 hover:text-neighbor-600 hover:bg-gray-100 rounded-lg transition"
                        title={t('vehicleTypes.actions.editTitle')}
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      {}
                      <button
                        onClick={() => handleOpenConfirmToggle(vt)}
                        className={`p-1.5 rounded-lg transition ${vt.is_active
                          ? 'text-amber-600 hover:text-amber-700 hover:bg-amber-50'
                          : 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50'
                          }`}
                        title={t(vt.is_active ? 'vehicleTypes.actions.deactivateTitle' : 'vehicleTypes.actions.activateTitle')}
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

      {}
      <VehicleTypeModal
        isOpen={modalState.isOpen}
        onClose={() => setModalState({ isOpen: false, vehicleType: null })}
        vehicleType={modalState.vehicleType}
        onSuccess={(msg) => {
          setToast({ message: msg, type: 'success' });
          fetchVehicleTypes();
        }}
      />

      {}
      <ConfirmModal
        isOpen={confirmToggleState.isOpen}
        loading={confirmToggleState.loading}
        onClose={() => setConfirmToggleState({ isOpen: false, vehicleType: null, loading: false })}
        onConfirm={handleConfirmToggle}
        type={confirmToggleState.vehicleType?.is_active ? 'warning' : 'info'}
        title={
          confirmToggleState.vehicleType?.is_active
            ? t('vehicleTypes.confirm.deactivateTitle')
            : t('vehicleTypes.confirm.activateTitle')
        }
        message={
          confirmToggleState.vehicleType?.is_active
            ? t('vehicleTypes.confirm.deactivateMessage', { name: confirmToggleState.vehicleType?.name })
            : t('vehicleTypes.confirm.activateMessage', { name: confirmToggleState.vehicleType?.name })
        }
        confirmText={
          t(confirmToggleState.vehicleType?.is_active ? 'vehicleTypes.confirm.deactivate' : 'vehicleTypes.confirm.activate')
        }
        cancelText={t('vehicleTypes.confirm.cancel')}
      />
    </div>
  );
};

export default AdminVehicleTypesPanel;
