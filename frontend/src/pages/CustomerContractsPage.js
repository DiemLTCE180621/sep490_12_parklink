import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getMyConfirmationRecords } from '../services/confirmationRecordService';
import timelineSettingService from '../services/timelineSettingService';
import { translateDurationText } from '../utils/translations';
import Toast from '../components/common/Toast';
import {
  FileText,
  Calendar,
  MapPin,
  Search,
  AlertCircle,
  RefreshCw,
  Loader2,
  Eye,
  PenTool,
  Clock
} from 'lucide-react';

const CustomerContractsPage = () => {
  const { t, i18n } = useTranslation('customer');
  const tRef = useRef(t);
  tRef.current = t;
  const navigate = useNavigate();
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [toastInfo, setToastInfo] = useState({ message: '', type: 'success' });
  const [timelineSettings, setTimelineSettings] = useState(null);

  useEffect(() => {
    timelineSettingService.getSettings()
      .then((res) => {
        if (res?.data?.calculated) {
          setTimelineSettings(res.data.calculated);
        }
      })
      .catch(() => {});
  }, []);

  const fetchContracts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getMyConfirmationRecords();
      const list = res.data?.confirmation_records || res.confirmation_records || [];
      setContracts(list);
    } catch (err) {
      setError(err.message || tRef.current('contracts.loadError'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchContracts();
  }, [fetchContracts]);

  const handleOpenDetail = (id) => {
    navigate(`/my-contracts/${id}`);
  };

  const handleOpenComplaint = (reservationId, e) => {
    e.stopPropagation();
    if (reservationId) {
      navigate(`/submit-complaint/${reservationId}`);
    }
  };

  const handleOpenExtension = (contractItem, e) => {
    if (e) e.stopPropagation();
    navigate(`/contracts/${contractItem.id}/extend`);
  };

  const filteredContracts = contracts.filter((item) => {
    let matchesTab = true;
    if (activeTab === 'PENDING_SIGNATURE') matchesTab = item.status === 'PENDING_SIGNATURE';
    else if (activeTab === 'ACTIVE') matchesTab = item.status === 'ACTIVE';
    else if (activeTab === 'TERMINATED') matchesTab = item.status === 'TERMINATED' || item.status === 'CANCELLED';

    const query = searchTerm.trim().toLowerCase();
    let matchesSearch = true;
    if (query) {
      const code = item.contract_code?.toLowerCase() || '';
      const facilityName = item.reservation?.facility?.name?.toLowerCase() || '';
      const vehicleInfo = item.reservation?.vehicle_info?.toLowerCase() || '';
      matchesSearch = code.includes(query) || facilityName.includes(query) || vehicleInfo.includes(query);
    }

    return matchesTab && matchesSearch;
  });

  const totalCount = contracts.length;
  const pendingCount = contracts.filter((c) => c.status === 'PENDING_SIGNATURE').length;
  const activeCount = contracts.filter((c) => c.status === 'ACTIVE').length;
  const terminatedCount = contracts.filter((c) => c.status === 'TERMINATED' || c.status === 'CANCELLED').length;
  const dateLocale = i18n.language?.startsWith('en') ? 'en-GB' : 'vi-VN';
  const numberLocale = i18n.language?.startsWith('en') ? 'en-US' : 'vi-VN';

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8 w-full">
      <Toast message={toastInfo.message} type={toastInfo.type} onClose={() => setToastInfo({ message: '', type: 'success' })} />

      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
              {t('contracts.title')}
            </h1>
            <p className="text-sm sm:text-base text-gray-500 mt-1">
              {t('contracts.subtitle')}
            </p>
          </div>

          <button
            onClick={fetchContracts}
            disabled={loading}
            className="px-3.5 py-2 bg-white hover:bg-gray-50 text-gray-700 text-xs font-medium rounded-lg border border-gray-300 transition-colors flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-gray-500 ${loading ? 'animate-spin' : ''}`} />
            {t('contracts.refresh')}
          </button>
        </div>

        <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-xs flex flex-col xl:flex-row xl:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setActiveTab('ALL')}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold whitespace-nowrap transition-colors cursor-pointer ${activeTab === 'ALL'
                ? 'bg-gray-900 text-white'
                : 'text-gray-600 hover:bg-gray-100'
                }`}
            >
              {t('contracts.tabs.all', { count: totalCount })}
            </button>
            <button
              onClick={() => setActiveTab('PENDING_SIGNATURE')}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold whitespace-nowrap transition-colors cursor-pointer ${activeTab === 'PENDING_SIGNATURE'
                ? 'bg-gray-900 text-white'
                : 'text-gray-600 hover:bg-gray-100'
                }`}
            >
              {t('contracts.tabs.pending', { count: pendingCount })}
            </button>
            <button
              onClick={() => setActiveTab('ACTIVE')}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold whitespace-nowrap transition-colors cursor-pointer ${activeTab === 'ACTIVE'
                ? 'bg-gray-900 text-white'
                : 'text-gray-600 hover:bg-gray-100'
                }`}
            >
              {t('contracts.tabs.active', { count: activeCount })}
            </button>
            <button
              onClick={() => setActiveTab('TERMINATED')}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold whitespace-nowrap transition-colors cursor-pointer ${activeTab === 'TERMINATED'
                ? 'bg-gray-900 text-white'
                : 'text-gray-600 hover:bg-gray-100'
                }`}
            >
              {t('contracts.tabs.terminated', { count: terminatedCount })}
            </button>
          </div>

          <div className="relative w-full xl:w-64 shrink-0">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder={t('contracts.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-hidden focus:bg-white focus:ring-2 focus:ring-neighbor-500 focus:border-neighbor-500 transition-colors"
            />
          </div>
        </div>


        {loading ? (
          <div className="bg-white rounded-xl p-16 text-center border border-gray-200 shadow-xs">
            <Loader2 className="w-7 h-7 animate-spin text-neighbor-600 mx-auto mb-2.5" />
            <p className="text-gray-500 text-sm">
              {t('contracts.loading')}
            </p>
          </div>
        ) : error ? (
          <div className="bg-white rounded-xl p-8 border border-gray-200 shadow-xs text-center space-y-3">
            <AlertCircle className="w-10 h-10 text-red-500 mx-auto" />
            <h3 className="text-base font-bold text-gray-900">{t('contracts.errorTitle')}</h3>
            <p className="text-sm text-gray-600">{error}</p>
            <button
              onClick={fetchContracts}
              className="px-4 py-2 bg-neighbor-600 text-white font-medium text-xs rounded-lg hover:bg-neighbor-700 transition"
            >
              {t('contracts.retry')}
            </button>
          </div>
        ) : filteredContracts.length === 0 ? (
          <div className="bg-white rounded-xl py-14 px-6 text-center border border-gray-200 shadow-xs space-y-2.5">
            <FileText className="w-10 h-10 text-gray-300 mx-auto" />
            <h3 className="text-base font-semibold text-gray-800">{t('contracts.emptyTitle')}</h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              {searchTerm
                ? t('contracts.emptySearch')
                : t('contracts.emptyDefault')}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 shadow-xs divide-y divide-gray-100 overflow-hidden">
            {filteredContracts.map((item) => (
              <div
                key={item.id}
                onClick={() => handleOpenDetail(item.id)}
                className="p-5 hover:bg-gray-50/80 transition cursor-pointer flex flex-col lg:flex-row lg:items-center justify-between gap-4"
              >
                <div className="space-y-2 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2.5 text-xs text-gray-500">
                    <span className="font-mono font-semibold text-gray-700 bg-gray-100 px-2 py-0.5 rounded">
                      {item.contract_code}
                    </span>
                    <span>•</span>
                    <span>{t('contracts.card.createdDate')} {new Date(item.created_at).toLocaleDateString(dateLocale)}</span>
                    <span>•</span>
                    {item.status === 'ACTIVE' ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        {t('contracts.card.statusActive')}
                      </span>
                    ) : item.status === 'TERMINATED' ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                        {t('contracts.card.statusTerminated')}
                      </span>
                    ) : item.status === 'CANCELLED' ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                        {t('contracts.card.statusCancelledSlot')}
                      </span>
                    ) : item.status === 'PENDING_SIGNATURE' ? (
                      <div className="flex items-center gap-1.5">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                          {t('contracts.card.statusPendingSignature')}
                        </span>
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100/80 text-amber-900 border border-amber-300">
                          <Clock className="w-3 h-3 text-amber-700" /> {t('contracts.card.signingDeadline', { duration: timelineSettings?.contractSigningText ? translateDurationText(timelineSettings.contractSigningText, i18n.language) : t('contracts.card.defaultSigningDuration') })}
                        </span>
                      </div>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                        {t('contracts.card.statusPending')}
                      </span>
                    )}

                    {item.contract_snapshot?.extension_request?.status === 'PENDING' && (
                      <>
                        <span>•</span>
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-300">
                          <Clock className="w-3 h-3 text-amber-600 animate-pulse" />
                          {t('contracts.card.extensionPending', { months: item.contract_snapshot.extension_request.extension_months })}
                        </span>
                      </>
                    )}

                    {item.contract_snapshot?.termination_request?.status === 'PENDING' && (
                      <>
                        <span>•</span>
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-800 border border-rose-300">
                          <AlertCircle className="w-3 h-3 text-rose-600 animate-pulse" />
                          {item.contract_snapshot.termination_request.requested_by === 'PROVIDER'
                            ? t('contracts.card.terminationByProvider')
                            : t('contracts.card.terminationByCustomer')}
                        </span>
                      </>
                    )}
                  </div>

                  <div>
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900 truncate">
                      {item.reservation?.facility?.name || t('contracts.card.facilityFallback')}
                    </h3>
                    <p className="text-sm text-gray-500 flex items-center gap-1.5 mt-1 truncate">
                      <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      <span className="truncate">{item.reservation?.facility?.address}</span>
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-6 gap-y-1 pt-1 text-xs text-gray-600">
                    <span className="inline-flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      <span>
                        {t('contracts.card.termLabel')}{' '}
                        <strong className="font-medium text-gray-800">
                          {new Date(item.start_date).toLocaleDateString(dateLocale)} – {new Date(item.end_date).toLocaleDateString(dateLocale)}
                        </strong>
                      </span>
                    </span>
                  </div>
                </div>


                <div className="flex sm:flex-row lg:flex-row items-center justify-between lg:justify-end gap-4 pt-3 lg:pt-0 border-t lg:border-t-0 border-gray-100 shrink-0">
                  <div className="text-left lg:text-right lg:mr-2">
                    <span className="text-[11px] text-gray-400 block">{t('contracts.card.priceLabel')}</span>
                    <span className="text-lg sm:text-xl font-extrabold text-neighbor-700">
                      {Number(item.agreed_price || 0).toLocaleString(numberLocale)}{' '}
                      <span className="text-xs font-normal text-gray-500">{t('contracts.card.priceUnit')}</span>
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {item.status === 'PENDING_SIGNATURE' ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenDetail(item.id);
                        }}
                        className="px-3.5 py-2 bg-neighbor-600 hover:bg-neighbor-700 text-white font-medium text-xs rounded-lg transition inline-flex items-center gap-1.5"
                      >
                        <PenTool className="w-3.5 h-3.5" />
                        {t('contracts.card.viewAndConfirm')}
                      </button>
                    ) : item.status === 'ACTIVE' ? (
                      <>
                        {item.contract_snapshot?.extension_request?.status === 'PENDING' ? (
                          <button
                            type="button"
                            onClick={(e) => handleOpenExtension(item, e)}
                            className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-semibold rounded-lg border border-amber-300 transition inline-flex items-center gap-1.5"
                          >
                            <Clock className="w-3.5 h-3.5 text-amber-600" />
                            {t('contracts.card.viewExtension')}
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => handleOpenExtension(item, e)}
                            className="px-3 py-1.5 bg-neighbor-50 hover:bg-neighbor-100 text-neighbor-700 text-xs font-medium rounded-lg border border-neighbor-200 transition inline-flex items-center gap-1.5"
                          >
                            <Clock className="w-3.5 h-3.5 text-neighbor-600" />
                            {t('contracts.card.extend')}
                          </button>
                        )}

                        {item.contract_snapshot?.termination_request?.status === 'PENDING' ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/contracts/${item.id}/terminate`);
                            }}
                            className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-800 text-xs font-semibold rounded-lg border border-rose-300 transition inline-flex items-center gap-1.5"
                          >
                            <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                            {item.contract_snapshot?.termination_request?.requested_by === 'PROVIDER'
                              ? t('contracts.card.viewTerminationProvider')
                              : t('contracts.card.viewTerminationCustomer')}
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/contracts/${item.id}/terminate`);
                            }}
                            className="px-3 py-1.5 bg-white hover:bg-rose-50 text-rose-700 text-xs font-medium rounded-lg border border-rose-200 transition"
                          >
                            {t('contracts.card.terminate')}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={(e) => handleOpenComplaint(item.reservation?.id, e)}
                          className="px-3 py-1.5 bg-white hover:bg-red-50 text-red-600 text-xs font-medium rounded-lg border border-red-200 transition"
                        >
                          {t('contracts.card.complaint')}
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenDetail(item.id);
                          }}
                          className="px-3.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium rounded-lg transition inline-flex items-center gap-1.5"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          {t('contracts.card.details')}
                        </button>
                      </>
                    ) : (
                      <>
                        {['ACTIVE', 'COMPLETED'].includes(item.status) && (
                          <button
                            type="button"
                            onClick={(e) => handleOpenComplaint(item.reservation_id, e)}
                            className="px-3 py-1.5 bg-white hover:bg-red-50 text-red-600 text-xs font-medium rounded-lg border border-red-200 transition"
                          >
                            {t('contracts.card.complaint')}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenDetail(item.id);
                          }}
                          className="px-3.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium rounded-lg transition inline-flex items-center gap-1.5"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          {t('contracts.card.details')}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerContractsPage;
