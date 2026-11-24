import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Plus, Edit, UserCheck, RefreshCw, RotateCcw, ChevronLeft, ChevronRight, CheckCircle2, AlertTriangle, Mail, Phone, User, X, MapPin, Lock, Unlock, KeyRound } from 'lucide-react';
import fieldInspectorService from '../../services/fieldInspectorService';
import userService from '../../services/userService';
import addressService from '../../services/addressService';
import AddressSelector from '../common/AddressSelector';

const AdminFieldInspectorsPanel = () => {
  const { t } = useTranslation('admin');
  const [inspectors, setInspectors] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    limit: 10
  });

  const [search, setSearch] = useState('');
  const [addressFilter, setAddressFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const [provinces, setProvinces] = useState([]);
  const [wards, setWards] = useState([]);
  const [selectedProvinceCode, setSelectedProvinceCode] = useState('');
  const [selectedWardCode, setSelectedWardCode] = useState('');
  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [loadingWards, setLoadingWards] = useState(false);

  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, type: '', inspector: null });
  const [actionLoading, setActionLoading] = useState(false);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState({ email: '', full_name: '', phone_number: '', address: '' });
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState('');

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingInspector, setEditingInspector] = useState(null);
  const [editForm, setEditForm] = useState({ full_name: '', phone_number: '', address: '', status: 'ACTIVE' });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');

  
  useEffect(() => {
    let isMounted = true;
    const fetchProvinces = async () => {
      try {
        setLoadingProvinces(true);
        const list = await addressService.getProvinces();
        if (isMounted) setProvinces(list);
      } catch (err) {
        console.error('Lỗi tải danh sách Tỉnh/Thành:', err);
      } finally {
        if (isMounted) setLoadingProvinces(false);
      }
    };
    fetchProvinces();
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    if (!selectedProvinceCode) {
      setWards([]);
      setSelectedWardCode('');
      return;
    }

    let isMounted = true;
    const fetchWards = async () => {
      try {
        setLoadingWards(true);
        const wList = await addressService.getWardsByProvince(selectedProvinceCode);
        if (isMounted) setWards(wList);
      } catch (err) {
        console.error('Lỗi tải Phường/Xã:', err);
      } finally {
        if (isMounted) setLoadingWards(false);
      }
    };
    fetchWards();
    return () => { isMounted = false; };
  }, [selectedProvinceCode]);

  const handleProvinceSelect = (e) => {
    const code = e.target.value;
    setSelectedProvinceCode(code);
    setSelectedWardCode('');
    if (!code) {
      setAddressFilter('');
    } else {
      const p = provinces.find((item) => Number(item.code) === Number(code));
      setAddressFilter(p ? p.name : '');
    }
  };

  const handleWardSelect = (e) => {
    const code = e.target.value;
    setSelectedWardCode(code);
    const p = provinces.find((item) => Number(item.code) === Number(selectedProvinceCode));
    if (!code) {
      setAddressFilter(p ? p.name : '');
    } else {
      const w = wards.find((item) => Number(item.code) === Number(code));
      setAddressFilter(w ? `${w.name}, ${p?.name || ''}` : p?.name || '');
    }
  };

  const handleResetFilters = () => {
    setSearch('');
    setSelectedProvinceCode('');
    setSelectedWardCode('');
    setAddressFilter('');
    setWards([]);
  };

  const fetchInspectors = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      setError('');
      const res = await fieldInspectorService.getFieldInspectors({
        search: search.trim(),
        address: addressFilter.trim(),
        page,
        limit: 10
      });

      const payload = res?.data || res;
      if (payload && payload.users) {
        setInspectors(payload.users || []);
        setPagination(payload.pagination || { currentPage: 1, totalPages: 1, totalItems: 0, limit: 10 });
      }
    } catch (err) {
      setError(t('inspectors.errors.load'));
    } finally {
      setLoading(false);
    }
  }, [search, addressFilter, t]);

  useEffect(() => {
    fetchInspectors(1);
  }, [fetchInspectors]);

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setCreateError('');

    if (!createForm.email || !createForm.full_name || !createForm.phone_number) {
      setCreateError(t('inspectors.errors.requiredFields'));
      return;
    }

    try {
      setCreateLoading(true);
      await fieldInspectorService.createFieldInspector(createForm);
      setSuccessMessage(t('inspectors.messages.createSuccess'));
      setIsCreateModalOpen(false);
      setCreateForm({ email: '', full_name: '', phone_number: '', address: '' });
      fetchInspectors(1);
    } catch (err) {
      setCreateError(t('inspectors.errors.create'));
    } finally {
      setCreateLoading(false);
    }
  };

  const handleOpenEditModal = (inspector) => {
    setEditingInspector(inspector);
    setEditForm({
      full_name: inspector.full_name || '',
      phone_number: inspector.phone_number || '',
      address: inspector.address || '',
      status: inspector.status || 'ACTIVE'
    });
    setEditError('');
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditError('');

    if (!editForm.full_name || !editForm.phone_number) {
      setEditError(t('inspectors.errors.nameAndPhoneRequired'));
      return;
    }

    try {
      setEditLoading(true);
      await fieldInspectorService.updateFieldInspector(editingInspector.id, editForm);
      setSuccessMessage(t('inspectors.messages.editSuccess'));
      setIsEditModalOpen(false);
      setEditingInspector(null);
      fetchInspectors(pagination.currentPage);
    } catch (err) {
      setEditError(t('inspectors.errors.edit'));
    } finally {
      setEditLoading(false);
    }
  };

  const handleOpenResetPassword = (inspector) => {
    setConfirmDialog({
      isOpen: true,
      type: 'RESET_PASSWORD',
      inspector
    });
  };

  const handleOpenToggleStatus = (inspector) => {
    const isBlocked = (inspector.status || '').toUpperCase() === 'BLOCKED';
    setConfirmDialog({
      isOpen: true,
      type: isBlocked ? 'UNLOCK' : 'LOCK',
      inspector
    });
  };

  const handleConfirmAction = async () => {
    const { type, inspector } = confirmDialog;
    if (!inspector) return;

    try {
      setActionLoading(true);
      setError('');

      if (type === 'LOCK' || type === 'UNLOCK') {
        await userService.toggleUserStatus(inspector.id);
        setSuccessMessage(t(type === 'LOCK' ? 'inspectors.messages.lockSuccess' : 'inspectors.messages.unlockSuccess'));
        setInspectors((prev) =>
          prev.map((i) => (i.id === inspector.id ? { ...i, status: type === 'LOCK' ? 'BLOCKED' : 'ACTIVE' } : i))
        );
      } else if (type === 'RESET_PASSWORD') {
        await userService.forceResetPassword(inspector.id);
        setSuccessMessage(t('inspectors.messages.resetPasswordSuccess'));
      }

      setConfirmDialog({ isOpen: false, type: '', inspector: null });
    } catch (err) {
      setError(t('inspectors.errors.action'));
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (statusStr) => {
    const s = (statusStr || '').toUpperCase();
    switch (s) {
      case 'ACTIVE':
        return <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> {t('statuses.active')}</span>;
      case 'BLOCKED':
        return <span className="bg-rose-100 text-rose-800 text-xs font-bold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> {t('statuses.blocked')}</span>;
      default:
        return <span className="bg-gray-100 text-gray-700 text-xs font-bold px-2.5 py-0.5 rounded-full">{s}</span>;
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-md p-6 space-y-6">
      {}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-200 pb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <UserCheck className="w-6 h-6 text-neighbor-600" /> {t('inspectors.title')}
          </h2>
          <p className="text-gray-500 text-xs mt-1">
            {t('inspectors.subtitle')}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="text-xs font-semibold bg-gray-100 px-3 py-1.5 rounded-xl text-gray-700">
            {t('inspectors.totalCount', { count: pagination.totalItems })}
          </div>

          <button
            onClick={() => {
              setCreateError('');
              setIsCreateModalOpen(true);
            }}
            className="px-4 py-2.5 bg-neighbor-600 hover:bg-neighbor-700 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> {t('inspectors.actions.add')}
          </button>
        </div>
      </div>

      {}
      {successMessage && (
        <div className="p-4 bg-emerald-50 text-emerald-800 text-xs font-medium rounded-xl border border-emerald-200 flex justify-between items-center">
          <span>{successMessage}</span>
          <button onClick={() => setSuccessMessage('')} className="text-emerald-600 hover:text-emerald-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {}
      <div className="space-y-3 bg-gray-50/70 p-4 rounded-xl border border-gray-200">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('inspectors.filters.searchPlaceholder')}
              className="w-full pl-9 pr-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neighbor-500 bg-white font-medium"
            />
          </div>

          <div className="relative">
            <select
              value={selectedProvinceCode}
              onChange={handleProvinceSelect}
              disabled={loadingProvinces}
              className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neighbor-500 bg-white font-medium text-gray-700 disabled:bg-gray-100 cursor-pointer"
            >
              <option value="">{t('inspectors.filters.allProvinces')}</option>
              {provinces.map((p) => (
                <option key={p.code} value={p.code}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="relative">
            <select
              value={selectedWardCode}
              onChange={handleWardSelect}
              disabled={!selectedProvinceCode || loadingWards}
              className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neighbor-500 bg-white font-medium text-gray-700 disabled:bg-gray-100 disabled:text-gray-400 cursor-pointer"
            >
              <option value="">{t('inspectors.filters.allWards')}</option>
              {wards.map((w) => (
                <option key={w.code} value={w.code}>
                  {w.name}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={handleResetFilters}
            title={t('inspectors.filters.refreshTitle')}
            className="px-3.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 border border-gray-200"
          >
            <RotateCcw className="w-3.5 h-3.5 text-gray-600" /> {t('common.refresh')}
          </button>
        </div>

        {(search || addressFilter) && (
          <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 pt-1 border-t border-gray-200/60">
            <span className="font-semibold">{t('inspectors.filters.activeFilters')}</span>
            {search && (
              <span className="bg-neighbor-50 text-neighbor-700 px-2.5 py-0.5 rounded-lg border border-neighbor-200 font-medium flex items-center gap-1">
                {t('inspectors.filters.keyword')}: "{search}"
                <button onClick={() => setSearch('')} className="hover:text-neighbor-900 ml-1">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {addressFilter && (
              <span className="bg-neighbor-50 text-neighbor-700 px-2.5 py-0.5 rounded-lg border border-neighbor-200 font-medium flex items-center gap-1">
                <MapPin className="w-3 h-3 text-neighbor-600" />
                {t('inspectors.table.address')}: "{addressFilter}"
                <button
                  onClick={() => {
                    setSelectedProvinceCode('');
                    setSelectedWardCode('');
                    setAddressFilter('');
                    setWards([]);
                  }}
                  className="hover:text-neighbor-900 ml-1"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            <button
              onClick={handleResetFilters}
              className="text-xs text-rose-600 hover:text-rose-800 underline ml-2 font-semibold"
            >
              {t('inspectors.filters.clearAll')}
            </button>
          </div>
        )}
      </div>

      {}
      {error && (
        <div className="p-4 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200">
          {error}
        </div>
      )}

      {loading ? (
        <div className="py-16 text-center text-gray-500 text-sm flex flex-col items-center justify-center gap-3">
          <RefreshCw className="w-8 h-8 animate-spin text-neighbor-600" />
          <span>{t('inspectors.messages.loading')}</span>
        </div>
      ) : inspectors.length === 0 ? (
        <div className="py-16 text-center text-gray-400">
          <UserCheck className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="font-semibold text-sm">
            {search || addressFilter
              ? t('inspectors.empty.filtered')
              : t('inspectors.empty.default')}
          </p>
          {search || addressFilter ? (
            <button
              onClick={handleResetFilters}
              className="text-xs text-neighbor-600 hover:text-neighbor-700 font-bold mt-2 underline"
            >
              {t('inspectors.filters.clearSearch')}
            </button>
          ) : (
            <p className="text-xs text-gray-400 mt-1">{t('inspectors.empty.hint')}</p>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-600 font-bold border-b border-gray-200">
                <th className="py-3 px-4">ID</th>
                <th className="py-3 px-4">{t('inspectors.table.fullName')}</th>
                <th className="py-3 px-4">{t('inspectors.table.email')}</th>
                <th className="py-3 px-4">{t('inspectors.table.phone')}</th>
                <th className="py-3 px-4">{t('inspectors.table.address')}</th>
                <th className="py-3 px-4">{t('inspectors.table.status')}</th>
                <th className="py-3 px-4 text-center">{t('inspectors.table.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700">
              {inspectors.map((inspector) => (
                <tr key={inspector.id} className="hover:bg-gray-50/80 transition">
                  <td className="py-3 px-4 font-mono font-bold text-gray-400">#{inspector.id}</td>
                  <td className="py-3 px-4 font-semibold text-gray-900">{inspector.full_name}</td>
                  <td className="py-3 px-4 text-gray-600">{inspector.email}</td>
                  <td className="py-3 px-4 font-mono text-gray-700">{inspector.phone_number || '—'}</td>
                  <td className="py-3 px-4 text-gray-700" title={inspector.address || ''}>
                    {inspector.address ? (
                      inspector.address.split(',').map((p) => p.trim()).filter(Boolean).pop() || inspector.address
                    ) : (
                    <span className="text-gray-400 italic text-xs">{t('inspectors.table.notUpdated')}</span>
                    )}
                  </td>
                  <td className="py-3 px-4">{getStatusBadge(inspector.status)}</td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleOpenEditModal(inspector)}
                        title={t('inspectors.actions.edit')}
                        className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg border border-blue-200 transition"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleOpenResetPassword(inspector)}
                        title={t('inspectors.actions.resetPassword')}
                        className="p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg border border-amber-200 transition"
                      >
                        <KeyRound className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleOpenToggleStatus(inspector)}
                        title={t((inspector.status || '').toUpperCase() === 'BLOCKED' ? 'inspectors.actions.unlock' : 'inspectors.actions.lock')}
                        className={`p-1.5 rounded-lg border transition ${
                          (inspector.status || '').toUpperCase() === 'BLOCKED'
                            ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                            : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200'
                        }`}
                      >
                        {(inspector.status || '').toUpperCase() === 'BLOCKED' ? (
                          <Unlock className="w-3.5 h-3.5" />
                        ) : (
                          <Lock className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-gray-200 pt-4 text-xs text-gray-600">
          <div>
            {t('inspectors.pagination.summary', { current: pagination.currentPage, total: pagination.totalPages, count: pagination.totalItems })}
          </div>
          <div className="flex gap-2">
            <button
              disabled={pagination.currentPage <= 1 || loading}
              onClick={() => fetchInspectors(pagination.currentPage - 1)}
              className="px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition disabled:opacity-40 flex items-center gap-1 font-semibold"
            >
              <ChevronLeft className="w-4 h-4" /> {t('inspectors.pagination.previous')}
            </button>
            <button
              disabled={pagination.currentPage >= pagination.totalPages || loading}
              onClick={() => fetchInspectors(pagination.currentPage + 1)}
              className="px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition disabled:opacity-40 flex items-center gap-1 font-semibold"
            >
              {t('inspectors.pagination.next')} <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl max-w-xl w-full p-8 shadow-2xl space-y-6 animate-in fade-in zoom-in duration-150 border border-gray-200">
            <div className="flex justify-between items-center border-b border-gray-200 pb-4">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <UserCheck className="w-6 h-6 text-neighbor-600" /> {t('inspectors.create.title')}
              </h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-xl hover:bg-gray-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {createError && (
              <div className="p-4 bg-red-50 text-red-700 text-sm rounded-xl border border-red-200">
                {createError}
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-5 text-sm">
              <div>
                <label className="block font-bold text-gray-700 mb-1.5 flex items-center gap-1.5">
                  <User className="w-4 h-4 text-neighbor-600" /> {t('inspectors.create.fullName')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder={t('inspectors.form.namePlaceholder')}
                  value={createForm.full_name}
                  onChange={(e) => setCreateForm({ ...createForm, full_name: e.target.value })}
                  className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neighbor-500 transition"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1.5 flex items-center gap-1.5">
                  <Mail className="w-4 h-4 text-neighbor-600" /> {t('inspectors.table.email')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder={t('inspectors.form.emailPlaceholder')}
                  value={createForm.email}
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                  className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neighbor-500 transition"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1.5 flex items-center gap-1.5">
                  <Phone className="w-4 h-4 text-neighbor-600" /> {t('inspectors.table.phone')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder={t('inspectors.form.phonePlaceholder')}
                  value={createForm.phone_number}
                  onChange={(e) => setCreateForm({ ...createForm, phone_number: e.target.value })}
                  className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neighbor-500 transition"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1.5 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-neighbor-600" /> {t('inspectors.table.address')}
                </label>
                <AddressSelector
                  value={createForm.address}
                  onChange={(fullAddress) => setCreateForm((prev) => ({ ...prev, address: fullAddress }))}
                />
              </div>

              <div className="p-4 bg-neighbor-50/80 rounded-xl border border-neighbor-100 text-neighbor-800 text-xs leading-relaxed">
                {t('inspectors.create.passwordNote')}
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-5 py-2.5 border border-gray-200 text-gray-600 font-bold text-xs rounded-xl hover:bg-gray-50 transition"
                >
                  {t('common:actions.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="px-6 py-2.5 bg-neighbor-600 hover:bg-neighbor-700 text-white font-bold text-xs rounded-xl shadow-md transition disabled:opacity-50 flex items-center gap-2"
                >
                  {createLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : t('inspectors.create.submit')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isEditModalOpen && editingInspector && (
        <div className="fixed inset-0 z-50 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl max-w-xl w-full p-8 shadow-2xl space-y-6 animate-in fade-in zoom-in duration-150 border border-gray-200">
            <div className="flex justify-between items-center border-b border-gray-200 pb-4">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Edit className="w-6 h-6 text-neighbor-600" /> {t('inspectors.edit.title', { id: editingInspector.id })}
              </h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-xl hover:bg-gray-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {editError && (
              <div className="p-4 bg-red-50 text-red-700 text-sm rounded-xl border border-red-200">
                {editError}
              </div>
            )}

            <form onSubmit={handleEditSubmit} className="space-y-5 text-sm">
              <div>
                <label className="block font-bold text-gray-500 mb-1.5">{t('inspectors.edit.emailReadOnly')}</label>
                <input
                  type="text"
                  disabled
                  value={editingInspector.email}
                  className="w-full px-4 py-3 bg-gray-100 text-gray-500 border border-gray-200 rounded-xl cursor-not-allowed font-medium text-sm"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1.5">{t('inspectors.table.fullName')}</label>
                <input
                  type="text"
                  required
                  placeholder={t('inspectors.form.namePlaceholder')}
                  value={editForm.full_name}
                  onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neighbor-500 text-sm transition"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1.5">{t('inspectors.table.phone')}</label>
                <input
                  type="text"
                  required
                  placeholder={t('inspectors.form.phonePlaceholder')}
                  value={editForm.phone_number}
                  onChange={(e) => setEditForm({ ...editForm, phone_number: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neighbor-500 text-sm transition"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1.5 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-neighbor-600" /> {t('inspectors.table.address')}
                </label>
                <AddressSelector
                  value={editForm.address}
                  onChange={(fullAddress) => setEditForm((prev) => ({ ...prev, address: fullAddress }))}
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1.5">{t('inspectors.edit.accountStatus')}</label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neighbor-500 bg-white font-bold text-sm transition"
                >
                  <option value="ACTIVE">{t('statuses.active')}</option>
                  <option value="BLOCKED">{t('statuses.blocked')}</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-5 py-2.5 border border-gray-200 text-gray-600 font-bold text-xs rounded-xl hover:bg-gray-50 transition"
                >
                  {t('common:actions.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="px-6 py-2.5 bg-neighbor-600 hover:bg-neighbor-700 text-white font-bold text-xs rounded-xl shadow-md transition disabled:opacity-50 flex items-center gap-2"
                >
                  {editLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : t('inspectors.edit.submit')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {}
      {confirmDialog.isOpen && confirmDialog.inspector && (
        <div className="fixed inset-0 z-50 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-xl w-full p-8 shadow-2xl space-y-6 animate-in fade-in zoom-in duration-150 border border-gray-200">
            <div className="flex items-center gap-4">
              <div
                className={`w-14 h-14 rounded-xl flex items-center justify-center shrink-0 ${
                  confirmDialog.type === 'LOCK'
                    ? 'bg-rose-100 text-rose-600'
                    : confirmDialog.type === 'UNLOCK'
                    ? 'bg-emerald-100 text-emerald-600'
                    : 'bg-amber-100 text-amber-600'
                }`}
              >
                {confirmDialog.type === 'LOCK' ? (
                  <Lock className="w-7 h-7" />
                ) : confirmDialog.type === 'UNLOCK' ? (
                  <Unlock className="w-7 h-7" />
                ) : (
                  <KeyRound className="w-7 h-7" />
                )}
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  {confirmDialog.type === 'LOCK'
                     ? t('inspectors.confirm.lockTitle')
                    : confirmDialog.type === 'UNLOCK'
                     ? t('inspectors.confirm.unlockTitle')
                     : t('inspectors.confirm.resetTitle')}
                </h3>
                <p className="text-sm text-gray-500 mt-0.5">#{confirmDialog.inspector.id} — {confirmDialog.inspector.email}</p>
              </div>
            </div>

            <div className="text-base text-gray-700 leading-relaxed bg-gray-50 p-5 rounded-xl border border-gray-200">
              {confirmDialog.type === 'LOCK' && (
                <div>
                  <p>
                     {t('inspectors.confirm.lockMessage', { name: confirmDialog.inspector.full_name })}
                  </p>
                  <p className="text-amber-700 font-semibold text-sm mt-2">
                     {t('inspectors.confirm.lockWarning')}
                  </p>
                </div>
              )}
              {confirmDialog.type === 'UNLOCK' && (
                <p>
                   {t('inspectors.confirm.unlockMessage', { name: confirmDialog.inspector.full_name })}
                </p>
              )}
              {confirmDialog.type === 'RESET_PASSWORD' && (
                <p>
                   {t('inspectors.confirm.resetMessage', { email: confirmDialog.inspector.email })}
                </p>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmDialog({ isOpen: false, type: '', inspector: null })}
                disabled={actionLoading}
                className="px-6 py-2.5 border border-gray-200 text-gray-700 font-semibold text-base rounded-xl hover:bg-gray-50 transition"
              >
                 {t('common:actions.cancel')}
              </button>
              <button
                type="button"
                onClick={handleConfirmAction}
                disabled={actionLoading}
                className={`px-6 py-2.5 text-white font-bold text-base rounded-xl shadow-md transition disabled:opacity-50 flex items-center gap-2 ${
                  confirmDialog.type === 'LOCK'
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : confirmDialog.type === 'UNLOCK'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-amber-600 hover:bg-amber-700'
                }`}
              >
                {actionLoading && <RefreshCw className="w-4 h-4 animate-spin" />}
                {confirmDialog.type === 'LOCK'
                   ? t('inspectors.actions.lock')
                  : confirmDialog.type === 'UNLOCK'
                   ? t('inspectors.actions.unlock')
                   : t('inspectors.actions.resetPassword')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminFieldInspectorsPanel;
