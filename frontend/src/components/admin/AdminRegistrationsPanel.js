import StatusBadge from '../common/StatusBadge';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import adminService from '../../services/adminService';
import {
  Building2,
  MapPin,
  User,
  Phone,
  Mail,
  Clock,
  CheckCircle2,
  XCircle,
  Wrench,
  Search,
  RotateCcw,
  Eye,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  UserCheck
} from 'lucide-react';
import AssignInspectorModal from './AssignInspectorModal';
import Toast from '../common/Toast';


const AdminRegistrationsPanel = () => {
  const { t } = useTranslation(['admin', 'common']);
  const navigate = useNavigate();

  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  
  const [actionModal, setActionModal] = useState(null); 
  const [rejectReason, setRejectReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (type, message) => {
    setToast({ type, message });
  };

  const handleOpenPrepareModal = (facilityId) => {
    setActionModal({ type: 'PREPARE', id: facilityId });
  };

  const handleOpenReassignModal = (facilityId) => {
    setActionModal({ type: 'REASSIGN', id: facilityId });
  };

  const fetchRegistrations = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await adminService.getPendingRegistrations();
      if (res && res.status === 'success') {
        setRegistrations(res.data || []);
      } else if (Array.isArray(res)) {
        setRegistrations(res);
      } else {
        setRegistrations(res?.data || []);
      }
    } catch (err) {
      console.error(err);
      setError(t('admin:registrations.messages.loadError'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchRegistrations();
  }, [fetchRegistrations]);

  const confirmAction = async () => {
    if (!actionModal || isSubmitting) return;
    try {
      setIsSubmitting(true);
      if (actionModal.type === 'FINALIZE') {
        await adminService.finalizeRegistration(actionModal.id);
        showToast(
          'success',
          t('admin:registrations.messages.finalizeSuccess')
        );
      } else if (actionModal.type === 'REJECT') {
        if (!rejectReason.trim()) {
          showToast('error', t('admin:registrations.messages.rejectReasonRequired'));
          setIsSubmitting(false);
          return;
        }
        await adminService.rejectRegistration(actionModal.id, rejectReason);
        showToast('success', t('admin:registrations.messages.rejectSuccess'));
      }
      setActionModal(null);
      setRejectReason('');
      await fetchRegistrations();
    } catch (err) {
      const backendMessage =
        err.response?.data?.message ||
        err.response?.data?.errors?.[0] ||
        err.message;
      showToast('error', t('admin:registrations.messages.actionFailed', { message: backendMessage }));
    } finally {
      setIsSubmitting(false);
    }
  };

  
  const pendingCount = useMemo(
    () => registrations.filter((f) => f.verification_status === 'PENDING_REVIEW').length,
    [registrations]
  );
  const preparingCount = useMemo(
    () => registrations.filter((f) => f.verification_status === 'PREPARING').length,
    [registrations]
  );
  const inspectedCount = useMemo(
    () => registrations.filter((f) => f.verification_status === 'INSPECTED').length,
    [registrations]
  );

  
  const filteredRegistrations = useMemo(() => {
    return registrations.filter((item) => {
      const matchSearch =
        (item.name || '').toLowerCase().includes(search.toLowerCase()) ||
        (item.address || '').toLowerCase().includes(search.toLowerCase()) ||
        (item.provider?.full_name || '').toLowerCase().includes(search.toLowerCase()) ||
        (item.provider?.email || '').toLowerCase().includes(search.toLowerCase()) ||
        (item.provider?.phone_number || '').toLowerCase().includes(search.toLowerCase());

      const matchStatus =
        statusFilter === 'ALL' || item.verification_status === statusFilter;

      return matchSearch && matchStatus;
    });
  }, [registrations, search, statusFilter]);

  
  const totalPages = Math.ceil(filteredRegistrations.length / itemsPerPage) || 1;
  const paginatedList = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredRegistrations.slice(start, start + itemsPerPage);
  }, [filteredRegistrations, currentPage]);

  const handleResetFilters = () => {
    setSearch('');
    setStatusFilter('ALL');
    setCurrentPage(1);
    fetchRegistrations();
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PENDING':
      case 'PENDING_REVIEW':
        return <StatusBadge status="PENDING" label={t('admin:registrations.tabs.pendingReview', 'Chờ duyệt sơ bộ')} size="sm" />;
      case 'PREPARING':
        return <StatusBadge status="IN_PROGRESS" label={t('admin:registrations.tabs.preparing', 'Đang khảo sát')} size="sm" />;
      case 'INSPECTED':
        return <StatusBadge status="VERIFIED" label={t('admin:registrations.tabs.inspected', 'Đã khảo sát (Chờ duyệt)')} size="sm" />;
      case 'APPROVED':
        return <StatusBadge status="ACTIVE" label={t('admin:registrations.tabs.approved', 'Đã duyệt')} size="sm" />;
      case 'REJECTED':
        return <StatusBadge status="REJECTED" label={t('admin:registrations.tabs.rejected', 'Từ chối')} size="sm" />;
      default:
        return <StatusBadge status={status} size="sm" />;
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-md p-6 space-y-6">
      {}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-200 pb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Building2 className="w-6 h-6 text-neighbor-600" /> {t('admin:registrations.title', 'Quản Lý Phê Duyệt Bãi Đỗ Xe')}
          </h2>
          <p className="text-gray-500 text-xs mt-1">
            {t('admin:registrations.subtitle', 'Theo dõi tiến trình khảo sát thực địa và phê duyệt hồ sơ đăng ký bãi đỗ xe mới từ Chủ bãi (Provider)')}
          </p>
        </div>
        <div className="text-xs font-semibold bg-gray-100 px-3 py-1.5 rounded-xl text-gray-700">
          {t('admin:registrations.totalCount', { count: registrations.length })}
        </div>
      </div>

      {}
      <div className="flex flex-wrap gap-2 text-xs font-semibold">
        <button
          onClick={() => {
            setStatusFilter('ALL');
            setCurrentPage(1);
          }}
          className={`px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 ${
            statusFilter === 'ALL'
              ? 'bg-neighbor-600 text-white shadow-sm'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          {t('admin:registrations.tabs.all', 'Tất cả')} ({registrations.length})
        </button>
        <button
          onClick={() => {
            setStatusFilter('PENDING_REVIEW');
            setCurrentPage(1);
          }}
          className={`px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 ${
            statusFilter === 'PENDING_REVIEW'
              ? 'bg-amber-500 text-white shadow-sm'
              : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
          }`}
        >
          <Clock className="w-3.5 h-3.5" /> {t('admin:registrations.tabs.pendingReview', 'Chờ duyệt sơ bộ')} ({pendingCount})
        </button>
        <button
          onClick={() => {
            setStatusFilter('PREPARING');
            setCurrentPage(1);
          }}
          className={`px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 ${
            statusFilter === 'PREPARING'
              ? 'bg-sky-600 text-white shadow-sm'
              : 'bg-sky-50 text-sky-800 border border-sky-200 hover:bg-sky-100'
          }`}
        >
          <Wrench className="w-3.5 h-3.5" /> {t('admin:registrations.tabs.preparing', 'Đang khảo sát')} ({preparingCount})
        </button>
        <button
          onClick={() => {
            setStatusFilter('INSPECTED');
            setCurrentPage(1);
          }}
          className={`px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 ${
            statusFilter === 'INSPECTED'
              ? 'bg-neighbor-700 text-white shadow-sm'
              : 'bg-neighbor-50 text-neighbor-800 border border-neighbor-200 hover:bg-neighbor-100'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" /> {t('admin:registrations.tabs.inspected', 'Đã khảo sát - Chờ duyệt')} ({inspectedCount})
        </button>
      </div>

      {}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
        {}
        <div className="sm:col-span-8 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            placeholder={t('admin:registrations.searchPlaceholder', 'Tìm theo tên bãi xe, địa chỉ hoặc chủ bãi...')}
            className="w-full pl-9 pr-3 py-2.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neighbor-500"
          />
        </div>

        {}
        <div className="sm:col-span-4 flex gap-2">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full py-2.5 px-3 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neighbor-500 bg-white"
          >
            <option value="ALL">{t('admin:registrations.filters.allStatuses')}</option>
            <option value="PENDING_REVIEW">{t('admin:registrations.tabs.pendingReview')}</option>
            <option value="PREPARING">{t('admin:registrations.tabs.preparing')}</option>
            <option value="INSPECTED">{t('admin:registrations.tabs.inspected')}</option>
          </select>

          <button
            type="button"
            onClick={handleResetFilters}
            className="px-3.5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 border border-gray-200"
            title={t('admin:registrations.filters.refreshTitle')}
          >
            <RotateCcw className="w-3.5 h-3.5 text-gray-600" /> {t('admin:common.refresh', 'Làm mới')}
          </button>
        </div>
      </div>

      {}
      {error && (
        <div className="p-4 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200 flex items-center gap-2">
          <XCircle className="w-4 h-4 shrink-0 text-red-600" />
          {error}
        </div>
      )}

      {}
      {loading ? (
        <div className="py-16 text-center text-gray-500 text-sm flex flex-col items-center justify-center gap-3">
          <RefreshCw className="w-8 h-8 animate-spin text-neighbor-600" />
          <span>{t('admin:registrations.messages.loading')}</span>
        </div>
      ) : filteredRegistrations.length === 0 ? (
        <div className="py-16 text-center text-gray-400">
          <Building2 className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="font-semibold text-sm">{t('admin:registrations.empty')}</p>
          <p className="text-xs text-gray-400 mt-1">{t('admin:registrations.messages.emptyHint')}</p>
        </div>
      ) : (
        
        <div className="w-full">
          <table className="block w-full text-left text-sm">
            <thead className="sr-only">
              <tr className="bg-gray-50 text-gray-600 font-bold border-b border-gray-200">
                <th className="w-[72px] py-3.5 px-4">ID</th>
                <th className="w-[500px] py-3.5 px-4">{t('admin:registrations.table.facilityName')}</th>
                <th className="w-[250px] py-3.5 px-4">{t('admin:registrations.table.provider')}</th>
                <th className="w-[175px] py-3.5 px-4">{t('admin:registrations.table.scaleAndFee')}</th>
                <th className="w-[205px] py-3.5 px-4">{t('admin:registrations.table.approvalProgress')}</th>
                <th className="w-[590px] py-3.5 px-4 text-right">{t('admin:registrations.table.actions')}</th>
              </tr>
            </thead>
            <tbody className="block space-y-5 text-gray-700">
              {paginatedList.map((facility) => {
                const isPending = facility.verification_status === 'PENDING_REVIEW';
                const isPreparing = facility.verification_status === 'PREPARING';
                const isInspected = facility.verification_status === 'INSPECTED';

                return (
                  <tr key={facility.id} className="grid grid-cols-1 gap-4 overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:border-neighbor-300 hover:shadow-md sm:gap-5 sm:p-7 lg:grid-cols-2">
                    {}
                    <td className="col-span-full p-0">
                      <span className="inline-flex rounded-full border border-gray-200 bg-gray-50 px-3 py-1 font-mono text-xs font-bold text-gray-500">
                        #{facility.id}
                      </span>
                    </td>

                    {}
                    <td className="min-w-0 rounded-xl border border-neighbor-100 bg-neighbor-50/40 p-4 sm:p-5">
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 rounded-xl bg-white border border-neighbor-100 flex items-center justify-center shrink-0 text-neighbor-700 shadow-sm">
                          {facility.images && facility.images.length > 0 ? (
                            <img
                              src={facility.images[0].image_url}
                              alt=""
                              className="w-12 h-12 object-cover rounded-xl"
                            />
                          ) : (
                            <Building2 className="w-6 h-6" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1 space-y-0.5 whitespace-nowrap">
                          <button
                            onClick={() => navigate(`/admin/registrations/${facility.id}`)}
                            className="block max-w-full truncate text-base font-bold text-gray-900 hover:text-neighbor-700 transition text-left sm:text-lg"
                            title={facility.name}
                          >
                            {facility.name}
                          </button>
                          <div className="flex items-center gap-1.5 whitespace-nowrap text-xs text-gray-500">
                            <MapPin className="w-3 h-3 text-gray-400 shrink-0" />
                            <span className="min-w-0 truncate" title={facility.address}>{facility.address}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {}
                    <td className="min-w-0 rounded-xl border border-gray-100 bg-gray-50/60 p-4 sm:p-5">
                      <p className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-400">{t('admin:registrations.table.provider')}</p>
                      <div className="space-y-0.5">
                        <div className="min-w-0 font-semibold text-gray-900 flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 shrink-0 text-gray-400" />
                          <span className="truncate">{facility.provider?.full_name || 'N/A'}</span>
                        </div>
                        <div className="min-w-0 text-gray-500 text-[11px] flex items-center gap-1.5">
                          <Mail className="w-3 h-3 shrink-0 text-gray-400" />
                          <span className="truncate">{facility.provider?.email || 'N/A'}</span>
                        </div>
                        {facility.provider?.phone_number && (
                          <div className="text-gray-500 text-[11px] flex items-center gap-1.5">
                            <Phone className="w-3 h-3 text-gray-400" />
                            {facility.provider?.phone_number}
                          </div>
                        )}
                      </div>
                    </td>

                    {}
                    <td className="min-w-0 rounded-xl border border-gray-100 bg-gray-50/60 p-4 sm:p-5">
                      <p className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-400">{t('admin:registrations.table.scaleAndFee')}</p>
                      <div className="space-y-0.5">
                        <div className="font-bold text-gray-800">
                          {t('admin:registrations.table.vehicleCount', { count: facility.capacity })}
                        </div>
                        <div className="text-neighbor-700 font-semibold text-[11px] flex items-center gap-0.5 whitespace-nowrap">
                          <DollarSign className="w-3 h-3 text-neighbor-600" />
                          {Number(facility.system_fee || 0).toLocaleString('vi-VN')} {t('admin:registrations.table.currency')}
                        </div>
                      </div>
                    </td>

                    {}
                    <td className="min-w-0 rounded-xl border border-gray-100 bg-gray-50/60 p-4 sm:p-5">
                      <p className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-400">{t('admin:registrations.table.approvalProgress')}</p>
                      <div>
                        {getStatusBadge(facility.verification_status)}
                        {facility.assigned_inspector ? (
                          <div className="text-[11px] text-neighbor-800 font-semibold flex items-center gap-1 mt-1">
                            <UserCheck className="w-3.5 h-3.5 text-neighbor-600 shrink-0" />
                            <span className="truncate max-w-[140px]" title={facility.assigned_inspector.full_name}>
                              {facility.assigned_inspector.full_name}
                            </span>
                          </div>
                        ) : isPreparing ? (
                          <div className="text-[11px] text-amber-600 font-medium italic mt-1">
                            {t('admin:registrations.table.unassignedInspector')}
                          </div>
                        ) : null}
                      </div>
                    </td>

                    {}
                    <td className="col-span-full -mx-5 -mb-5 border-t border-gray-100 bg-gray-50/70 px-5 py-4 sm:-mx-7 sm:-mb-7 sm:px-7">
                      <div className="flex flex-wrap items-center gap-2">
                        {}
                        <button
                          onClick={() => navigate(`/admin/registrations/${facility.id}`)}
                          className="inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-xl border border-neighbor-200 bg-white px-4 py-2.5 text-xs font-bold text-neighbor-800 shadow-sm transition hover:bg-neighbor-50"
                          title={t('admin:registrations.actions.viewDetailTitle')}
                        >
                          <Eye className="w-3.5 h-3.5" /> {t('admin:registrations.actions.viewDetail')}
                        </button>

                        {}
                        {isPending && (
                          <>
                            <button
                              onClick={() => handleOpenPrepareModal(facility.id)}
                              className="inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-xl bg-amber-500 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-amber-600"
                              title={t('admin:registrations.actions.preliminaryTitle')}
                            >
                              <UserCheck className="w-3.5 h-3.5" /> {t('admin:registrations.actions.preliminary')}
                            </button>
                            <button
                              onClick={() => setActionModal({ type: 'REJECT', id: facility.id })}
                              className="inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs font-bold text-rose-700 transition hover:bg-rose-100"
                              title={t('admin:registrations.actions.rejectTitle')}
                            >
                              <XCircle className="w-3.5 h-3.5" /> {t('admin:registrations.actions.reject')}
                            </button>
                          </>
                        )}

                        {}
                        {isInspected && (
                          <>
                            <button
                              onClick={() => setActionModal({ type: 'FINALIZE', id: facility.id })}
                              className="inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-xl bg-neighbor-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-neighbor-700"
                              title={t('admin:registrations.actions.finalizeTitle')}
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" /> {t('admin:registrations.actions.finalize')}
                            </button>
                            <button
                              onClick={() => setActionModal({ type: 'REJECT', id: facility.id })}
                              className="inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs font-bold text-rose-700 transition hover:bg-rose-100"
                              title={t('admin:registrations.actions.rejectTitle')}
                            >
                              <XCircle className="w-3.5 h-3.5" /> {t('admin:registrations.actions.reject')}
                            </button>
                          </>
                        )}

                        {}
                        {isPreparing && (
                          <button
                            onClick={() => handleOpenReassignModal(facility.id)}
                            className="inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-xs font-bold text-gray-700 transition hover:bg-gray-100"
                            title={t('admin:registrations.actions.reassignTitle')}
                          >
                            <UserCheck className="w-3.5 h-3.5 text-neighbor-600" /> {t('admin:registrations.actions.reassign')}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-gray-200 pt-4 text-xs text-gray-600">
          <div>
            {t('admin:registrations.pagination.summary', { current: currentPage, total: totalPages, count: filteredRegistrations.length })}
          </div>
          <div className="flex gap-2">
            <button
              disabled={currentPage <= 1 || loading}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition disabled:opacity-40 flex items-center gap-1 font-semibold"
            >
              <ChevronLeft className="w-4 h-4" /> {t('admin:registrations.pagination.previous')}
            </button>
            <button
              disabled={currentPage >= totalPages || loading}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition disabled:opacity-40 flex items-center gap-1 font-semibold"
            >
              {t('admin:registrations.pagination.next')} <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {}
      <AssignInspectorModal
        isOpen={actionModal?.type === 'PREPARE' || actionModal?.type === 'REASSIGN'}
        onClose={() => setActionModal(null)}
        facilityName={registrations.find((f) => f.id === actionModal?.id)?.name}
        facilityAddress={registrations.find((f) => f.id === actionModal?.id)?.address}
        currentInspectorId={registrations.find((f) => f.id === actionModal?.id)?.assigned_inspector_id}
        isSubmitting={isSubmitting}
        title={
          actionModal?.type === 'REASSIGN'
            ? t('admin:registrations.assign.reassignTitle')
            : t('admin:registrations.assign.assignTitle')
        }
        confirmText={
          actionModal?.type === 'REASSIGN'
            ? t('admin:registrations.assign.reassignConfirm')
            : t('admin:registrations.assign.assignConfirm')
        }
        onConfirm={async (inspectorId) => {
          try {
            setIsSubmitting(true);
            if (actionModal.type === 'PREPARE') {
              await adminService.approveRegistration(actionModal.id, inspectorId);
              showToast(
                'success',
                 t('admin:registrations.messages.preliminarySuccess')
              );
            } else {
              await adminService.assignInspector(actionModal.id, inspectorId);
              showToast(
                'success',
                 t('admin:registrations.messages.reassignSuccess')
              );
            }
            setActionModal(null);
            await fetchRegistrations();
          } catch (err) {
            const backendMessage =
              err.response?.data?.message ||
              err.response?.data?.errors?.[0] ||
              err.message;
             showToast('error', backendMessage || t('admin:registrations.messages.processError'));
          } finally {
            setIsSubmitting(false);
          }
        }}
      />

      {}
      {actionModal && (actionModal.type === 'FINALIZE' || actionModal.type === 'REJECT') && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-xl p-6 md:p-8 max-w-md w-full shadow-2xl my-auto transition-all">
            {actionModal.type === 'FINALIZE' && (
              <>
                <div className="w-16 h-16 bg-neighbor-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8 text-neighbor-600" />
                </div>
                <h3 className="text-xl font-bold text-center text-gray-900 mb-2">
                   {t('admin:registrations.confirm.finalizeTitle')}
                </h3>
                <p className="text-center text-gray-500 text-sm mb-6">
                   {t('admin:registrations.confirm.finalizeDescription')}
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setActionModal(null)}
                    className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition text-xs"
                  >
                     {t('admin:registrations.confirm.cancel')}
                  </button>
                  <button
                    disabled={isSubmitting}
                    onClick={confirmAction}
                    className="flex-1 py-3 bg-neighbor-600 hover:bg-neighbor-700 text-white font-bold rounded-xl shadow-lg transition disabled:opacity-50 text-xs"
                  >
                     {isSubmitting ? t('admin:registrations.confirm.processing') : t('admin:registrations.confirm.finalizeSubmit')}
                  </button>
                </div>
              </>
            )}

            {actionModal.type === 'REJECT' && (
              <>
                <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <XCircle className="w-8 h-8 text-rose-600" />
                </div>
                <h3 className="text-xl font-bold text-center text-gray-900 mb-2">
                   {t('admin:registrations.confirm.rejectTitle')}
                </h3>
                <p className="text-center text-gray-500 text-sm mb-4">
                   {t('admin:registrations.confirm.rejectDescription')}
                </p>
                <div className="flex flex-wrap gap-2 mb-3 justify-center">
                  <button
                    type="button"
                    onClick={() =>
                       setRejectReason(t('admin:registrations.confirm.reasons.missingInformation'))
                    }
                    className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-medium rounded-full transition"
                  >
                     {t('admin:registrations.confirm.reasonLabels.missingInformation')}
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                       setRejectReason(t('admin:registrations.confirm.reasons.locationOrPrice'))
                    }
                    className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-medium rounded-full transition"
                  >
                     {t('admin:registrations.confirm.reasonLabels.locationOrPrice')}
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                       setRejectReason(t('admin:registrations.confirm.reasons.safetyStandards'))
                    }
                    className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-medium rounded-full transition"
                  >
                     {t('admin:registrations.confirm.reasonLabels.safetyStandards')}
                  </button>
                </div>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                   placeholder={t('admin:registrations.confirm.reasonPlaceholder')}
                  className="w-full p-3 border border-gray-200 rounded-xl mb-6 focus:outline-none focus:ring-2 focus:ring-rose-500 resize-none h-24 text-xs"
                />
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setActionModal(null);
                      setRejectReason('');
                    }}
                    className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition text-xs"
                  >
                     {t('admin:registrations.confirm.cancel')}
                  </button>
                  <button
                    disabled={isSubmitting}
                    onClick={confirmAction}
                    className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-lg transition disabled:opacity-50 text-xs"
                  >
                     {isSubmitting ? t('admin:registrations.confirm.rejecting') : t('admin:registrations.confirm.rejectSubmit')}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};

export default AdminRegistrationsPanel;
