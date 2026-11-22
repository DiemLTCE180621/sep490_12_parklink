import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { getMyReservations, cancelReservationRequest } from '../../services/reservationService';
import timelineSettingService from '../../services/timelineSettingService';
import { translateDurationText, translateVehicleInfoText } from '../../utils/translations';
import ConfirmModal from '../../components/modals/ConfirmModal';
import Toast from '../../components/common/Toast';
import { Link, useNavigate } from 'react-router-dom';
import {
  Car,
  Calendar,
  MapPin,
  Search,
  AlertCircle,
  RefreshCw,
  Plus,
  Loader2,
  ChevronRight,
  FileText,
  Clock
} from 'lucide-react';

const CustomerReservationsPage = () => {
  const { t, i18n } = useTranslation('customer');
  const tRef = useRef(t);
  tRef.current = t;
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [cancellingId, setCancellingId] = useState(null);

  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [targetCancelId, setTargetCancelId] = useState(null);
  const [toastInfo, setToastInfo] = useState({ message: '', type: 'success' });
  const [timelineSettings, setTimelineSettings] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    timelineSettingService.getSettings()
      .then((res) => {
        if (res?.data?.calculated) {
          setTimelineSettings(res.data.calculated);
        }
      })
      .catch(() => {});
  }, []);

  const fetchMyReservations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getMyReservations();
      const list = res.data?.reservations || res.reservations || [];
      setReservations(list);
    } catch (err) {
      setError(err.message || tRef.current('reservations.loadError'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMyReservations();
  }, [fetchMyReservations]);

  const handleOpenDetail = (id) => {
    navigate(`/my-reservations/${id}`);
  };

  const handleRequestCancelConfirm = (id, e) => {
    e.stopPropagation();
    setTargetCancelId(id);
    setConfirmModalOpen(true);
  };

  const executeCancelRequest = async () => {
    if (!targetCancelId) return;

    try {
      setCancellingId(targetCancelId);
      await cancelReservationRequest(targetCancelId);
      setToastInfo({ message: t('reservations.cancelSuccess'), type: 'success' });
      setConfirmModalOpen(false);
      setTargetCancelId(null);
      fetchMyReservations();
    } catch (err) {
      setToastInfo({ message: err.message || t('reservations.cancelError'), type: 'error' });
    } finally {
      setCancellingId(null);
    }
  };

  const cleanVehicleDisplay = (rawVehicle = '') => {
    const cleaned = rawVehicle.replace(/\s*\[CCCD:[^\]]+\]/i, '').trim();
    if (!cleaned) return t('reservations.notUpdated');
    return translateVehicleInfoText(cleaned, i18n.language);
  };

  const filteredReservations = reservations.filter((item) => {
    let matchesTab = true;
    if (activeTab === 'PENDING') matchesTab = item.status === 'PENDING';
    else if (activeTab === 'APPROVED') matchesTab = item.status === 'APPROVED';
    else if (activeTab === 'CANCELLED') matchesTab = item.status === 'CANCELLED' || item.status === 'REJECTED';

    const query = searchTerm.trim().toLowerCase();
    let matchesSearch = true;
    if (query) {
      const facilityName = item.facility?.name?.toLowerCase() || '';
      const facilityAddress = item.facility?.address?.toLowerCase() || '';
      const vehicle = cleanVehicleDisplay(item.vehicle_info).toLowerCase();
      matchesSearch =
        facilityName.includes(query) ||
        facilityAddress.includes(query) ||
        vehicle.includes(query) ||
        String(item.id).includes(query);
    }

    return matchesTab && matchesSearch;
  });

  const totalCount = reservations.length;
  const pendingCount = reservations.filter((r) => r.status === 'PENDING').length;
  const approvedCount = reservations.filter((r) => r.status === 'APPROVED').length;
  const otherCount = reservations.filter((r) => r.status === 'CANCELLED' || r.status === 'REJECTED').length;

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            {t('reservations.badges.pending')}
          </span>
        );
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-neighbor-50 text-neighbor-700 border border-neighbor-200">
            <span className="w-1.5 h-1.5 rounded-full bg-neighbor-500" />
            {t('reservations.badges.approved')}
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
            {t('reservations.badges.rejected')}
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
            <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
            {t('reservations.badges.cancelled')}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8 w-full">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">{t('reservations.title')}</h1>
            <p className="text-sm sm:text-base text-gray-500 mt-1">
              {t('reservations.subtitle')}
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-auto">
            <button
              onClick={fetchMyReservations}
              disabled={loading}
              className="px-3 py-2 bg-white hover:bg-gray-50 text-gray-700 text-xs font-medium rounded-lg border border-gray-300 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-gray-500 ${loading ? 'animate-spin' : ''}`} />
              {t('reservations.refresh')}
            </button>

            <Link
              to="/search"
              className="px-3.5 py-2 bg-neighbor-600 hover:bg-neighbor-700 active:bg-neighbor-800 text-white font-medium text-xs rounded-lg transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              {t('reservations.findNew')}
            </Link>
          </div>
        </div>

        <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-xs flex flex-col xl:flex-row xl:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setActiveTab('ALL')}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                activeTab === 'ALL'
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {t('reservations.tabs.all', { count: totalCount })}
            </button>
            <button
              onClick={() => setActiveTab('PENDING')}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                activeTab === 'PENDING'
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {t('reservations.tabs.pending', { count: pendingCount })}
            </button>
            <button
              onClick={() => setActiveTab('APPROVED')}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                activeTab === 'APPROVED'
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {t('reservations.tabs.approved', { count: approvedCount })}
            </button>
            <button
              onClick={() => setActiveTab('CANCELLED')}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                activeTab === 'CANCELLED'
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {t('reservations.tabs.cancelledRejected', { count: otherCount })}
            </button>
          </div>

          <div className="relative w-full xl:w-64 shrink-0">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t('reservations.searchPlaceholder')}
              className="w-full pl-9 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-hidden focus:bg-white focus:ring-2 focus:ring-neighbor-500 focus:border-neighbor-500 transition-colors"
            />
          </div>
        </div>

        {loading ? (
          <div className="py-16 text-center bg-white rounded-xl border border-gray-200 shadow-xs">
            <Loader2 className="w-7 h-7 text-neighbor-600 animate-spin mx-auto mb-2.5" />
            <p className="text-xs sm:text-sm text-gray-500">{t('reservations.loading')}</p>
          </div>
        ) : error ? (
          <div className="p-4 bg-red-50 rounded-xl border border-red-200 text-red-700 flex items-center gap-3 text-xs sm:text-sm">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
        ) : filteredReservations.length === 0 ? (
          <div className="py-14 px-6 text-center bg-white rounded-xl border border-gray-200 shadow-xs space-y-3">
            <Car className="w-10 h-10 text-gray-300 mx-auto" />
            <h3 className="text-base font-bold text-gray-900">{t('reservations.emptyTitle')}</h3>
            <p className="text-gray-500 text-xs max-w-sm mx-auto">
              {searchTerm
                ? t('reservations.emptySearch')
                : t('reservations.emptyDefault')}
            </p>
            {!searchTerm && (
              <div className="pt-1">
                <Link
                  to="/search"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-neighbor-600 hover:bg-neighbor-700 text-white text-xs font-medium rounded-lg shadow-xs transition-colors"
                >
                  {t('reservations.findButton')}
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredReservations.map((item) => {
              const displayVehicle = cleanVehicleDisplay(item.vehicle_info);

              return (
                <div
                  key={item.id}
                  onClick={() => handleOpenDetail(item.id)}
                  className="bg-white rounded-xl p-5 border border-gray-200 shadow-xs hover:border-neighbor-300 hover:shadow-sm transition-all cursor-pointer"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-gray-100">
                    <div className="flex items-center gap-2.5 text-xs text-gray-500">
                      <span className="font-mono font-semibold text-gray-700 bg-gray-100 px-2 py-0.5 rounded">
                        #{item.id}
                      </span>
                      <span>•</span>
                      <span>{t('reservations.card.submittedDate')} {new Date(item.created_at).toLocaleDateString(i18n.language?.startsWith('en') ? 'en-GB' : 'vi-VN')}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {item.status === 'PENDING' && (
                        <span className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 font-medium">
                          <Clock className="w-3 h-3 text-amber-600" /> {t('reservations.card.responseDeadline', { duration: timelineSettings?.reservationResponseText ? translateDurationText(timelineSettings.reservationResponseText, i18n.language) : t('reservations.card.responseDefaultDuration') })}
                        </span>
                      )}
                      {item.status === 'APPROVED' && item.confirmation_record && item.confirmation_record.status === 'PENDING_SIGNATURE' && (
                        <span className="text-[11px] text-neighbor-800 bg-neighbor-50 border border-neighbor-200 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 font-medium">
                          <Clock className="w-3 h-3 text-neighbor-600" /> {t('reservations.card.signingDeadline', { duration: timelineSettings?.contractSigningText ? translateDurationText(timelineSettings.contractSigningText, i18n.language) : t('reservations.card.signingDefaultDuration') })}
                        </span>
                      )}
                      {getStatusBadge(item.status)}
                    </div>
                  </div>

                  <div className="pt-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1.5 min-w-0 flex-1">
                      <h3 className="text-lg sm:text-xl font-bold text-gray-900 truncate">
                        {item.facility?.name || t('reservations.card.facilityFallback')}
                      </h3>
                      <p className="text-xs text-gray-500 flex items-center gap-1.5 truncate">
                        <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <span className="truncate">{item.facility?.address}</span>
                      </p>

                      <div className="flex flex-wrap items-center gap-x-5 gap-y-1 pt-1 text-xs text-gray-600">
                        <span className="inline-flex items-center gap-1.5">
                          <Car className="w-3.5 h-3.5 text-neighbor-600 shrink-0" />
                          <span className="font-medium text-gray-800">{displayVehicle}</span>
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          <span>
                            {t('reservations.card.startDateLabel')} <strong className="text-gray-900">{new Date(item.desired_start_date).toLocaleDateString(i18n.language?.startsWith('en') ? 'en-GB' : 'vi-VN')}</strong>
                          </span>
                        </span>
                      </div>
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end justify-between gap-3 pt-3 sm:pt-0 border-t sm:border-t-0 border-gray-100 shrink-0">
                      <div className="text-left sm:text-right">
                        <span className="text-[11px] text-gray-400 block">{t('reservations.card.priceLabel')}</span>
                        <span className="text-sm font-bold text-neighbor-700">
                          {Number(item.facility?.price_per_month || 0).toLocaleString(i18n.language?.startsWith('en') ? 'en-US' : 'vi-VN')} {t('reservations.card.priceUnit')}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {item.confirmation_record?.id && (
                          <Link
                            to={`/my-contracts/${item.confirmation_record.id}`}
                            onClick={(e) => e.stopPropagation()}
                            className="px-3 py-1.5 bg-neighbor-50 hover:bg-neighbor-100 text-neighbor-700 font-medium text-xs rounded-lg border border-neighbor-200 transition-colors inline-flex items-center gap-1"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            {t('reservations.card.contractButton')}
                          </Link>
                        )}

                        {(item.status === 'PENDING' || (item.status === 'APPROVED' && (!item.confirmation_record || item.confirmation_record.status !== 'ACTIVE'))) && (
                          <button
                            onClick={(e) => handleRequestCancelConfirm(item.id, e)}
                            disabled={cancellingId === item.id}
                            className="px-3 py-1.5 bg-white hover:bg-red-50 text-red-600 font-medium text-xs rounded-lg border border-gray-200 hover:border-red-200 transition-colors"
                          >
                            {cancellingId === item.id ? t('reservations.card.cancelling') : t('reservations.card.cancelButton')}
                          </button>
                        )}

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenDetail(item.id);
                          }}
                          className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium text-xs rounded-lg transition-colors inline-flex items-center gap-1"
                        >
                          {t('reservations.card.detailsButton')}
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={confirmModalOpen}
        onClose={() => {
          setConfirmModalOpen(false);
          setTargetCancelId(null);
        }}
        onConfirm={executeCancelRequest}
        title={t('reservations.cancelConfirm.title')}
        message={t('reservations.cancelConfirm.message')}
        confirmText={t('reservations.cancelConfirm.confirmText')}
        cancelText={t('reservations.cancelConfirm.cancelText')}
        type="danger"
        loading={!!cancellingId}
      />

      <Toast
        message={toastInfo.message}
        type={toastInfo.type}
        onClose={() => setToastInfo({ message: '', type: 'success' })}
      />
    </div>
  );
};

export default CustomerReservationsPage;
