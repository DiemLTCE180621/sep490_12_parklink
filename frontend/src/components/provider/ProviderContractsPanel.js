import StatusBadge from '../common/StatusBadge';
import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getProviderConfirmationRecords } from '../../services/confirmationRecordService';
import Toast from '../common/Toast';
import {
  FileText,
  Calendar,
  MapPin,
  Search,
  AlertCircle,
  RefreshCw,
  Loader2,
  User,
  Phone,
  Mail,
  Car,
  Eye,
  Users,
  Clock
} from 'lucide-react';

const ProviderContractsPanel = ({ onNavigateToActiveCustomers }) => {
  const { t, i18n } = useTranslation('provider');
  const isEnglish = i18n.language?.startsWith('en');
  const navigate = useNavigate();
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('ALL'); 
  const [searchTerm, setSearchTerm] = useState('');

  const [toastInfo, setToastInfo] = useState({ message: '', type: 'success' });

  const fetchContracts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getProviderConfirmationRecords();
      const list = res.data?.confirmation_records || res.confirmation_records || [];
      setContracts(list);
    } catch (err) {
      setError(err.message || '__LOAD_ERROR__');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchContracts();
  }, [fetchContracts]);

  const handleOpenDetail = (id) => {
    navigate(`/contracts/${id}`);
  };

  const cleanVehicleDisplay = (rawVehicle = '') => {
    return rawVehicle.replace(/\s*\[CCCD:[^\]]+\]/i, '').trim() || t('contracts.card.notUpdated');
  };

  const getSnapshot = (contract) => {
    if (!contract?.contract_snapshot) return {};
    if (typeof contract.contract_snapshot === 'string') {
      try {
        return JSON.parse(contract.contract_snapshot);
      } catch {
        return {};
      }
    }
    return contract.contract_snapshot;
  };

  const filteredContracts = contracts.filter((item) => {
    const snap = getSnapshot(item);
    const hasPendingExt = snap?.extension_request?.status === 'PENDING';
    const hasPendingTerm = snap?.termination_request?.status === 'PENDING';

    let matchesTab = true;
    if (activeTab === 'PENDING_SIGNATURE') matchesTab = item.status === 'PENDING_SIGNATURE';
    else if (activeTab === 'ACTIVE') matchesTab = item.status === 'ACTIVE';
    else if (activeTab === 'EXTENSION_PENDING') matchesTab = hasPendingExt;
    else if (activeTab === 'TERMINATION_PENDING') matchesTab = hasPendingTerm;
    else if (activeTab === 'TERMINATED') matchesTab = item.status === 'TERMINATED' || item.status === 'CANCELLED';

    const query = searchTerm.trim().toLowerCase();
    let matchesSearch = true;
    if (query) {
      const code = item.contract_code?.toLowerCase() || '';
      const customerName = item.reservation?.customer?.full_name?.toLowerCase() || '';
      const customerPhone = item.reservation?.customer?.phone_number?.toLowerCase() || '';
      const vehicleInfo = item.reservation?.vehicle_info?.toLowerCase() || '';
      const facilityName = item.reservation?.facility?.name?.toLowerCase() || '';

      matchesSearch =
        code.includes(query) ||
        customerName.includes(query) ||
        customerPhone.includes(query) ||
        vehicleInfo.includes(query) ||
        facilityName.includes(query);
    }

    return matchesTab && matchesSearch;
  });

  const totalCount = contracts.length;
  const pendingCount = contracts.filter((c) => c.status === 'PENDING_SIGNATURE').length;
  const activeCount = contracts.filter((c) => c.status === 'ACTIVE').length;
  const extensionPendingCount = contracts.filter((c) => {
    const snap = getSnapshot(c);
    return snap?.extension_request?.status === 'PENDING';
  }).length;
  const terminationPendingCount = contracts.filter((c) => {
    const snap = getSnapshot(c);
    return snap?.termination_request?.status === 'PENDING';
  }).length;
  const terminatedCount = contracts.filter((c) => c.status === 'TERMINATED' || c.status === 'CANCELLED').length;

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PENDING_SIGNATURE':
        return <StatusBadge status="PENDING" label={t('contracts.statuses.PENDING_SIGNATURE')} size="sm" />;
      case 'ACTIVE':
        return <StatusBadge status="ACTIVE" label={t('contracts.statuses.ACTIVE')} size="sm" />;
      case 'TERMINATED':
        return <StatusBadge status="TERMINATED" label={t('contracts.statuses.TERMINATED')} size="sm" />;
      case 'CANCELLED':
        return <StatusBadge status="CANCELLED" label={t('contracts.statuses.CANCELLED')} size="sm" />;
      default:
        return <StatusBadge status={status} size="sm" />;
    }
  };

  return (
    <div className="space-y-4">
      <Toast message={toastInfo.message} type={toastInfo.type} onClose={() => setToastInfo({ message: '', type: 'success' })} />

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden divide-y divide-gray-200">
        
        <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {t('contracts.title')}
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              {t('contracts.subtitle')}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto shrink-0">
            <button
              onClick={
                onNavigateToActiveCustomers
                  ? onNavigateToActiveCustomers
                  : () => navigate('/provider/active-customers')
              }
              className="px-3.5 py-2 bg-neighbor-50 hover:bg-neighbor-100 text-neighbor-700 text-xs font-medium rounded-lg border border-neighbor-200 transition flex items-center gap-1.5"
            >
              <Users className="w-3.5 h-3.5 text-neighbor-600" />
              {t('contracts.activeCustomersBtn')}
            </button>

            <button
              onClick={fetchContracts}
              disabled={loading}
              className="px-3.5 py-2 bg-white hover:bg-gray-50 text-gray-700 text-xs font-medium rounded-lg border border-gray-300 transition flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-gray-500 ${loading ? 'animate-spin' : ''}`} />
              {t('contracts.refresh')}
            </button>
          </div>
        </div>

        
        <div className="px-6 py-2.5 bg-gray-50/70 border-b border-gray-100">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            <button
              onClick={() => setActiveTab('ALL')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                activeTab === 'ALL'
                  ? 'bg-gray-900 text-white shadow-xs'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/70'
              }`}
            >
              {t('contracts.tabs.all', { count: totalCount })}
            </button>

            <button
              onClick={() => setActiveTab('PENDING_SIGNATURE')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                activeTab === 'PENDING_SIGNATURE'
                  ? 'bg-gray-900 text-white shadow-xs'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/70'
              }`}
            >
              {t('contracts.tabs.pending', { count: pendingCount })}
            </button>

            <button
              onClick={() => setActiveTab('ACTIVE')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                activeTab === 'ACTIVE'
                  ? 'bg-gray-900 text-white shadow-xs'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/70'
              }`}
            >
              {t('contracts.tabs.active', { count: activeCount })}
            </button>

            <button
              onClick={() => setActiveTab('EXTENSION_PENDING')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'EXTENSION_PENDING'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : extensionPendingCount > 0
                  ? 'text-amber-800 bg-amber-50 hover:bg-amber-100/80 border border-amber-200'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/70'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              {t('contracts.tabs.extensionPending', { count: extensionPendingCount })}
            </button>

            <button
              onClick={() => setActiveTab('TERMINATION_PENDING')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'TERMINATION_PENDING'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : terminationPendingCount > 0
                  ? 'text-rose-800 bg-rose-50 hover:bg-rose-100/80 border border-rose-200'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/70'
              }`}
            >
              <AlertCircle className="w-3.5 h-3.5" />
              {t('contracts.tabs.terminationPending', { count: terminationPendingCount })}
            </button>

            <button
              onClick={() => setActiveTab('TERMINATED')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                activeTab === 'TERMINATED'
                  ? 'bg-gray-900 text-white shadow-xs'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/70'
              }`}
            >
              {t('contracts.tabs.terminated', { count: terminatedCount })}
            </button>
          </div>
        </div>

        <div className="px-6 py-3 bg-white flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-gray-100">
          <div className="relative w-full sm:max-w-md">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder={t('contracts.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3.5 py-1.5 bg-gray-50/70 border border-gray-200 rounded-lg text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-neighbor-600 transition"
            />
          </div>
        </div>

        
        {loading ? (
          <div className="p-16 text-center">
            <Loader2 className="w-7 h-7 animate-spin text-neighbor-600 mx-auto mb-2.5" />
            <p className="text-gray-500 text-sm">{t('contracts.loading')}</p>
          </div>
        ) : error ? (
          <div className="p-10 text-center space-y-3">
            <AlertCircle className="w-10 h-10 text-red-500 mx-auto" />
            <h3 className="text-base font-bold text-gray-900">{t('contracts.errorTitle')}</h3>
            <p className="text-sm text-gray-600">{error === '__LOAD_ERROR__' ? t('contracts.loadError') : error}</p>
            <button
              onClick={fetchContracts}
              className="px-4 py-2 bg-neighbor-600 text-white font-medium text-xs rounded-lg hover:bg-neighbor-700 transition"
            >
              {t('contracts.retry')}
            </button>
          </div>
        ) : filteredContracts.length === 0 ? (
          <div className="py-14 px-6 text-center space-y-2">
            <FileText className="w-10 h-10 text-gray-300 mx-auto" />
            <h3 className="text-base font-semibold text-gray-800">{t('contracts.empty.title')}</h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              {searchTerm
                ? t('contracts.empty.searchEmpty')
                : t('contracts.empty.defaultEmpty')}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredContracts.map((item) => {
              const customer = item.reservation?.customer;
              const facility = item.reservation?.facility;
              const displayVehicle = cleanVehicleDisplay(item.reservation?.vehicle_info);
              const snap = getSnapshot(item);
              const pendingExt = snap?.extension_request?.status === 'PENDING' ? snap.extension_request : null;
              const pendingTerm = snap?.termination_request?.status === 'PENDING' ? snap.termination_request : null;

              return (
                <div
                  key={item.id}
                  onClick={() => handleOpenDetail(item.id)}
                  className="p-6 hover:bg-gray-50/70 transition cursor-pointer flex flex-col lg:flex-row lg:items-center justify-between gap-5"
                >
                  <div className="space-y-3 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2.5 text-xs text-gray-500">
                      <span className="font-mono font-semibold text-gray-700 bg-gray-100 px-2 py-0.5 rounded">
                        {item.contract_code}
                      </span>
                      <span>•</span>
                      <span>{t('contracts.card.createdAt', { date: new Date(item.created_at).toLocaleDateString(isEnglish ? 'en-GB' : 'vi-VN') })}</span>
                      <span>•</span>
                      {getStatusBadge(item.status)}

                      {pendingExt && (
                        <>
                          <span>•</span>
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-300">
                            <Clock className="w-3 h-3 text-amber-600 animate-pulse" />
                            {t('contracts.card.extensionBadge', { months: pendingExt.extension_months })}
                          </span>
                        </>
                      )}

                      {pendingTerm && (
                        <>
                          <span>•</span>
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-800 border border-rose-300">
                            <AlertCircle className="w-3 h-3 text-rose-600 animate-pulse" />
                            {t('contracts.card.terminationBadge', { date: pendingTerm.requested_termination_date ? new Date(pendingTerm.requested_termination_date).toLocaleDateString(isEnglish ? 'en-GB' : 'vi-VN') : '' })}
                          </span>
                        </>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm pt-1">
                      
                      <div className="space-y-1">
                        <span className="text-xs text-gray-500 block">{t('contracts.card.customerSection')}</span>
                        <p className="font-semibold text-gray-900 flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          <span>{customer?.full_name || t('contracts.card.defaultCustomer')}</span>
                        </p>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-gray-500">
                          <span className="inline-flex items-center gap-1">
                            <Phone className="w-3 h-3 text-gray-400" />
                            {customer?.phone_number || t('contracts.card.notUpdated')}
                          </span>
                          {customer?.email && (
                            <span className="inline-flex items-center gap-1 truncate">
                              <Mail className="w-3 h-3 text-gray-400" />
                              {customer.email}
                            </span>
                          )}
                        </div>
                      </div>

                      
                      <div className="space-y-1">
                        <span className="text-xs text-gray-500 block">{t('contracts.card.costSection')}</span>
                        <p className="font-bold text-neighbor-700">
                          {Number(item.agreed_price).toLocaleString('vi-VN')}{' '}
                          <span className="text-xs font-normal text-gray-500">{t('contracts.card.priceUnit')}</span>
                        </p>
                        <p className="text-xs text-gray-600 flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          <span>
                            {new Date(item.start_date).toLocaleDateString(isEnglish ? 'en-GB' : 'vi-VN')} – {new Date(item.end_date).toLocaleDateString(isEnglish ? 'en-GB' : 'vi-VN')}
                          </span>
                        </p>
                        <p className="text-xs text-gray-500">
                          {t('contracts.card.paymentDeadline', { day: item.payment_deadline_day || 5 })}
                        </p>
                      </div>

                      
                      <div className="space-y-1">
                        <span className="text-xs text-gray-500 block">{t('contracts.card.facilitySection')}</span>
                        <p className="font-semibold text-gray-900 truncate">
                          {facility?.name}
                        </p>
                        <p className="text-xs text-gray-600 flex items-center gap-1.5 truncate">
                          <Car className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          <span className="truncate">{displayVehicle}</span>
                        </p>
                        <p className="text-xs text-gray-500 flex items-start gap-1 truncate">
                          <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" />
                          <span className="truncate">{facility?.address}</span>
                        </p>
                      </div>
                    </div>
                  </div>

                  
                  <div className="flex items-center justify-end shrink-0 pt-3 lg:pt-0 border-t lg:border-t-0 border-gray-200 gap-2">
                    {pendingTerm && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenDetail(item.id);
                        }}
                        className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg shadow-sm transition inline-flex items-center gap-1.5"
                      >
                        <AlertCircle className="w-3.5 h-3.5" />
                        {t('contracts.actions.confirmTermination')}
                      </button>
                    )}

                    {pendingExt && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenDetail(item.id);
                        }}
                        className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg shadow-sm transition inline-flex items-center gap-1.5"
                      >
                        <Clock className="w-3.5 h-3.5" />
                        {t('contracts.actions.approveExtension', { months: pendingExt.extension_months })}
                      </button>
                    )}

                    {item.status === 'ACTIVE' && !pendingTerm && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/contracts/${item.id}/terminate`);
                        }}
                        className="px-3 py-1.5 bg-white hover:bg-rose-50 text-rose-700 text-xs font-medium rounded-lg border border-rose-200 transition"
                      >
                        {t('contracts.actions.terminate')}
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenDetail(item.id);
                      }}
                      className="px-3.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium rounded-lg transition inline-flex items-center gap-1.5"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      {t('contracts.actions.viewContract')}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProviderContractsPanel;
